import {
  AssignmentReason,
  LeadSLAState,
  DomainEventType,
  ChangeSource,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { targetValidator } from '../../security/authorization/targetValidator.js';
import { ResourceNotFoundError } from '../../core/errors/appError.js';

export interface AssignLeadInput {
  leadId: string;
  toUserIdOrMembershipId: string;
  reason?: AssignmentReason;
}

export const assignmentService = {
  /**
   * Executes atomic lead assignment / reassignment transaction (§11.1, §35.1, TRANSACTION_MATRIX §3.1).
   * Guarantees:
   * 1. Single open assignment invariant (INV-ASN-001).
   * 2. Atomic SLA window restart per assignment without wiping historical slaBreachedAt (INV-ASN-002).
   */
  async assignLead(actor: ActorContext, input: AssignLeadInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Fetch Lead within tenant boundary
      const lead = await tx.lead.findUnique({
        where: { id: input.leadId },
      });

      if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
        throw new ResourceNotFoundError('Lead not found', 'leadId');
      }

      // 2. Target Validation: assignee must belong to the SAME organization and be ACTIVE
      const targetMembership = await targetValidator.validateAssignee(
        input.toUserIdOrMembershipId,
        actor.organizationId,
        tx
      );

      // 3. Close currently active assignment if one exists
      const now = new Date();
      await tx.leadAssignment.updateMany({
        where: {
          leadId: lead.id,
          releasedAt: null,
        },
        data: {
          releasedAt: now,
        },
      });

      // 4. Insert new open assignment
      const newAssignment = await tx.leadAssignment.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          fromUserId: lead.assignedToId,
          toUserId: targetMembership.userId,
          assignedById: actor.userId,
          reason: input.reason ?? AssignmentReason.MANUAL,
          source: actor.isSystemActor ? ChangeSource.SYSTEM : ChangeSource.MANUAL,
          assignedAt: now,
          releasedAt: null, // open assignment
        },
      });

      // 5. Update Lead: reset SLA window to WITHIN_SLA (+120s) while preserving historical slaBreachedAt (INV-ASN-002)
      const slaDueAt = new Date(now.getTime() + 120 * 1000); // 120-second first-response window

      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          assignedToId: targetMembership.id,
          slaState: LeadSLAState.WITHIN_SLA,
          slaDueAt,
          // Note: slaBreachedAt is NEVER cleared to preserve compliance history (§11.5)
          version: { increment: 1 },
        },
      });

      // 6. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          actorType: actor.isSystemActor ? 'SYSTEM' : 'USER',
          correlationId: actor.correlationId,
          action: 'lead.assigned',
          entityType: 'Lead',
          entityId: lead.id,
          oldValue: { assignedToId: lead.assignedToId, slaState: lead.slaState },
          newValue: {
            assignedToId: targetMembership.id,
            slaState: updatedLead.slaState,
            slaDueAt: updatedLead.slaDueAt,
          },
          source: actor.isSystemActor ? ChangeSource.SYSTEM : ChangeSource.MANUAL,
        },
      });

      // 7. Transactional Outbox (DomainEventType.LeadAssigned)
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.LeadAssigned,
          eventVersion: 1,
          aggregateType: 'Lead',
          aggregateId: lead.id,
          correlationId: actor.correlationId,
          payload: {
            leadId: lead.id,
            organizationId: actor.organizationId,
            assignedToMembershipId: targetMembership.id,
            assignedToUserId: targetMembership.userId,
            assignmentId: newAssignment.id,
            slaDueAt,
          },
        },
      });

      return { lead: updatedLead, assignment: newAssignment };
    });
  },
};
