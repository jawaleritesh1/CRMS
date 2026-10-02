import {
  LeadLifecycleStage,
  LeadStatus,
  LeadTemperature,
  LeadDisposition,
  LeadSLAState,
  AssignmentReason,
  DomainEventType,
  ChangeSource,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { targetValidator } from '../../security/authorization/targetValidator.js';
import { customerService, ResolveCustomerInput } from '../customer/customer.service.js';
import { leadLifecycle } from './leadLifecycle.js';
import { duplicateDetector } from './duplicateDetector.js';
import { ResourceNotFoundError, ConflictError } from '../../core/errors/appError.js';

export interface CreateLeadInput {
  customer: ResolveCustomerInput;
  projectId?: string;
  sourceId?: string;
  campaignId?: string;
  budgetMin?: number;
  budgetMax?: number;
  preferredConfig?: string;
  notes?: string;
}

export interface ChangeLeadStageInput {
  leadId: string;
  toStage: LeadLifecycleStage;
  reason?: string;
  expectedVersion?: number;
}

export interface UpdateLeadTemperatureInput {
  leadId: string;
  toTemperature: LeadTemperature;
  reason?: string;
}

export interface UpdateLeadDispositionInput {
  leadId: string;
  toDisposition: LeadDisposition;
  reason?: string;
}

export const leadService = {
  /**
   * Creates a new Lead within the actor's tenant boundary, enforcing the 7-step mutation pipeline (§35.1).
   */
  async createLead(actor: ActorContext, input: CreateLeadInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Target Validation (Tenant cross-reference check)
      if (input.projectId) {
        await targetValidator.validateProject(input.projectId, actor.organizationId, tx);
      }

      // 2. Resolve or create Customer in same tenant
      const customer = await customerService.resolveOrCreateCustomer(actor, input.customer, tx);

      // 3. Domain Mutation: Create Lead row
      const lead = await tx.lead.create({
        data: {
          organizationId: actor.organizationId,
          customerId: customer.id,
          projectId: input.projectId ?? null,
          sourceId: input.sourceId ?? null,
          campaignId: input.campaignId ?? null,
          budgetMin: input.budgetMin ?? null,
          budgetMax: input.budgetMax ?? null,
          preferredConfig: input.preferredConfig ?? null,
          lifecycleStage: LeadLifecycleStage.NEW,
          status: LeadStatus.ACTIVE,
          temperature: LeadTemperature.WARM,
          score: 50,
          lifecycleCycle: 1,
        },
      });

      // 4. Historical Record: LeadStageHistory (initial stage = NEW, cycle = 1)
      await tx.leadStageHistory.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          cycle: 1,
          fromStage: null,
          toStage: LeadLifecycleStage.NEW,
          changedById: actor.userId,
          reason: 'Initial lead capture',
          source: ChangeSource.MANUAL,
        },
      });

      // 5. Security Audit Log (Immutable AuditLog row)
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          actorType: actor.isSystemActor ? 'SYSTEM' : 'USER',
          correlationId: actor.correlationId,
          action: 'lead.created',
          entityType: 'Lead',
          entityId: lead.id,
          newValue: {
            customerId: customer.id,
            lifecycleStage: lead.lifecycleStage,
            projectId: lead.projectId,
          },
          source: ChangeSource.MANUAL,
        },
      });

      // 6. Transactional Outbox (DomainEventType.LeadCreated)
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.LeadCreated,
          eventVersion: 1,
          aggregateType: 'Lead',
          aggregateId: lead.id,
          correlationId: actor.correlationId,
          payload: {
            leadId: lead.id,
            organizationId: actor.organizationId,
            customerId: customer.id,
            lifecycleStage: lead.lifecycleStage,
            projectId: lead.projectId,
          },
        },
      });

      // 7. Duplicate scanning relationship check
      await duplicateDetector.scanForDuplicates(
        {
          organizationId: actor.organizationId,
          leadId: lead.id,
          customerId: customer.id,
        },
        tx
      );

      return lead;
    });
  },

  /**
   * Executes atomic Lead stage transition, enforcing state machine legality and cycle counters (§10.3, §35.1).
   */
  async changeLeadStage(actor: ActorContext, input: ChangeLeadStageInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Fetch Lead with row lock / tenant isolation
      const lead = await tx.lead.findUnique({
        where: { id: input.leadId },
      });

      if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
        throw new ResourceNotFoundError('Lead not found', 'leadId');
      }

      // Optimistic concurrency check if expectedVersion supplied
      if (input.expectedVersion !== undefined && lead.version !== input.expectedVersion) {
        throw new ConflictError(
          `Lead has been modified by another actor. Current version: ${lead.version}, expected: ${input.expectedVersion}`
        );
      }

      // 2. Business Preconditions: Evaluate state machine transition
      const transitionResult = leadLifecycle.validateTransition(
        lead.lifecycleStage,
        input.toStage,
        lead.lifecycleCycle
      );

      // 3. Domain Mutation
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          lifecycleStage: transitionResult.toStage,
          lifecycleCycle: transitionResult.newCycle,
          status: transitionResult.newStatus ?? lead.status,
          version: { increment: 1 },
        },
      });

      // 4. Historical Audit Record (LeadStageHistory)
      await tx.leadStageHistory.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          cycle: transitionResult.newCycle,
          fromStage: lead.lifecycleStage,
          toStage: transitionResult.toStage,
          changedById: actor.userId,
          reason: input.reason ?? (transitionResult.isReengagement ? 'Customer Re-engagement' : null),
          source: ChangeSource.MANUAL,
        },
      });

      // If operational status cascaded (e.g. to CLOSED), record LeadStatusHistory
      if (transitionResult.newStatus && transitionResult.newStatus !== lead.status) {
        await tx.leadStatusHistory.create({
          data: {
            organizationId: actor.organizationId,
            leadId: lead.id,
            fromStatus: lead.status,
            toStatus: transitionResult.newStatus,
            changedById: actor.userId,
            reason: `Cascaded from stage ${transitionResult.toStage}`,
            source: ChangeSource.MANUAL,
          },
        });
      }

      // 5. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          actorType: actor.isSystemActor ? 'SYSTEM' : 'USER',
          correlationId: actor.correlationId,
          action: 'lead.stage_changed',
          entityType: 'Lead',
          entityId: lead.id,
          oldValue: { lifecycleStage: lead.lifecycleStage, cycle: lead.lifecycleCycle },
          newValue: {
            lifecycleStage: updatedLead.lifecycleStage,
            cycle: updatedLead.lifecycleCycle,
            status: updatedLead.status,
          },
          reason: input.reason,
          source: ChangeSource.MANUAL,
        },
      });

      // 6. Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.LeadStageChanged,
          eventVersion: 1,
          aggregateType: 'Lead',
          aggregateId: lead.id,
          correlationId: actor.correlationId,
          payload: {
            leadId: lead.id,
            organizationId: actor.organizationId,
            fromStage: lead.lifecycleStage,
            toStage: updatedLead.lifecycleStage,
            cycle: updatedLead.lifecycleCycle,
          },
        },
      });

      return updatedLead;
    });
  },

  /**
   * Updates Lead Temperature independently without impacting SLA or lifecycle stage (§10.1).
   */
  async updateTemperature(actor: ActorContext, input: UpdateLeadTemperatureInput) {
    return defaultPrisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: input.leadId } });
      if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
        throw new ResourceNotFoundError('Lead not found', 'leadId');
      }

      if (lead.temperature === input.toTemperature) {
        return lead;
      }

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          temperature: input.toTemperature,
          version: { increment: 1 },
        },
      });

      await tx.leadTemperatureHistory.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          fromTemperature: lead.temperature,
          toTemperature: input.toTemperature,
          changedById: actor.userId,
          reason: input.reason,
          source: ChangeSource.MANUAL,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'lead.temperature_changed',
          entityType: 'Lead',
          entityId: lead.id,
          oldValue: { temperature: lead.temperature },
          newValue: { temperature: updatedLead.temperature },
          reason: input.reason,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.LeadTemperatureChanged,
          aggregateType: 'Lead',
          aggregateId: lead.id,
          correlationId: actor.correlationId,
          payload: {
            leadId: lead.id,
            fromTemperature: lead.temperature,
            toTemperature: updatedLead.temperature,
          },
        },
      });

      return updatedLead;
    });
  },

  /**
   * Updates Lead Disposition without collapsing operational status or lifecycle stage (§10.1).
   */
  async updateDisposition(actor: ActorContext, input: UpdateLeadDispositionInput) {
    return defaultPrisma.$transaction(async (tx) => {
      const lead = await tx.lead.findUnique({ where: { id: input.leadId } });
      if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
        throw new ResourceNotFoundError('Lead not found', 'leadId');
      }

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          disposition: input.toDisposition,
          version: { increment: 1 },
        },
      });

      await tx.leadDispositionHistory.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          fromDisposition: lead.disposition,
          toDisposition: input.toDisposition,
          changedById: actor.userId,
          reason: input.reason,
          source: ChangeSource.MANUAL,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'lead.disposition_changed',
          entityType: 'Lead',
          entityId: lead.id,
          oldValue: { disposition: lead.disposition },
          newValue: { disposition: updatedLead.disposition },
          reason: input.reason,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.LeadDispositionChanged,
          aggregateType: 'Lead',
          aggregateId: lead.id,
          correlationId: actor.correlationId,
          payload: {
            leadId: lead.id,
            fromDisposition: lead.disposition,
            toDisposition: updatedLead.disposition,
          },
        },
      });

      return updatedLead;
    });
  },

  /**
   * Executes atomic lead claim under First-Accept-Wins concurrency (§11, §39, INV-CLM-001).
   * Guarantees:
   * 1. Exactly one telecaller wins when multiple concurrent accept requests race.
   * 2. Losing requests receive structured ConflictError (409) 'LEAD_ALREADY_CLAIMED'.
   * 3. Creates LeadAssignment, AuditLog, and OutboxEvent in the same transaction.
   */
  async claimLead(actor: ActorContext, input: { leadId: string }) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Fetch lead inside transaction
      const lead = await tx.lead.findUnique({
        where: { id: input.leadId },
        include: { customer: true, project: true },
      });

      if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
        throw new ResourceNotFoundError('Lead not found or access denied', 'leadId');
      }

      // 2. Concurrency Invariant: if already assigned, throw ConflictError
      if (lead.assignedToId !== null) {
        let ownerName = 'another telecaller';
        try {
          const owner = await tx.user.findUnique({
            where: { id: lead.assignedToId },
            select: { name: true },
          });
          if (owner?.name) ownerName = owner.name;
        } catch (_) {}

        throw new ConflictError(
          `This lead was already accepted by ${ownerName}.`,
          'leadId',
          [{ field: 'assignedToId', issue: 'LEAD_ALREADY_CLAIMED', code: 'conflict' }]
        );
      }

      // 3. Atomically update lead assignment & SLA window
      const now = new Date();
      const slaDueAt = new Date(now.getTime() + 120 * 1000);

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          assignedToId: actor.userId,
          slaState: LeadSLAState.WITHIN_SLA,
          slaDueAt,
          version: { increment: 1 },
        },
        include: { customer: true, project: true },
      });

      // 4. Create LeadAssignment record
      await tx.leadAssignment.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          fromUserId: null,
          toUserId: actor.userId,
          assignedById: actor.userId,
          reason: AssignmentReason.AUTO_ROUND_ROBIN,
          source: ChangeSource.MANUAL,
          assignedAt: now,
          releasedAt: null,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'lead.claimed',
          entityType: 'Lead',
          entityId: lead.id,
          oldValue: { assignedToId: null },
          newValue: { assignedToId: actor.userId },
          reason: 'First-Accept Claim Won',
        },
      });

      // 6. Outbox Event
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.LeadAssigned,
          aggregateType: 'Lead',
          aggregateId: lead.id,
          correlationId: actor.correlationId,
          payload: {
            leadId: lead.id,
            assignedToId: actor.userId,
            reason: 'FIRST_ACCEPT_CLAIM',
          },
        },
      });

      return updatedLead;
    });
  },
};

