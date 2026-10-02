import {
  SiteVisitStatus,
  DomainEventType,
  ChangeSource,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { targetValidator } from '../../security/authorization/targetValidator.js';
import { ResourceNotFoundError, ConflictError, ValidationError } from '../../core/errors/appError.js';

export interface ScheduleVisitInput {
  leadId: string;
  projectId: string;
  scheduledAt: Date;
  assignedToId?: string;
  notes?: string;
}

export interface RescheduleVisitInput {
  visitId: string;
  newScheduledAt: Date;
  reason: string;
}

export interface CompleteVisitInput {
  visitId: string;
  feedback?: string;
  rating?: number;
  latitude?: number;
  longitude?: number;
  otpCode?: string;
}

export const siteVisitService = {
  /**
   * Schedules a new site visit within tenant boundary (§12.1, §35.1).
   */
  async scheduleVisit(actor: ActorContext, input: ScheduleVisitInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Target Validation: Lead & Project must belong to actor's organization
      const lead = await targetValidator.validateLead(input.leadId, actor.organizationId, tx);
      await targetValidator.validateProject(input.projectId, actor.organizationId, tx);

      const assignedToId = input.assignedToId ?? actor.membershipId;

      if (input.scheduledAt <= new Date()) {
        throw new ValidationError('Scheduled visit time must be in the future', 'scheduledAt');
      }

      // 2. Domain Mutation: Create SiteVisit row
      const visit = await tx.siteVisit.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          projectId: input.projectId,
          assignedToId,
          status: SiteVisitStatus.SCHEDULED,
          scheduledAt: input.scheduledAt,
          feedback: input.notes,
        },
      });

      // 3. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'site_visit.scheduled',
          entityType: 'SiteVisit',
          entityId: visit.id,
          newValue: {
            leadId: visit.leadId,
            projectId: visit.projectId,
            scheduledAt: visit.scheduledAt,
          },
          source: ChangeSource.MANUAL,
        },
      });

      // 4. Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.SiteVisitScheduled,
          aggregateType: 'SiteVisit',
          aggregateId: visit.id,
          correlationId: actor.correlationId,
          payload: {
            visitId: visit.id,
            leadId: visit.leadId,
            projectId: visit.projectId,
            scheduledAt: visit.scheduledAt,
          },
        },
      });

      return visit;
    });
  },

  /**
   * Reschedules an existing site visit, creating a new linked record and updating status (§12.1).
   */
  async rescheduleVisit(actor: ActorContext, input: RescheduleVisitInput) {
    return defaultPrisma.$transaction(async (tx) => {
      const visit = await tx.siteVisit.findUnique({
        where: { id: input.visitId },
      });

      if (!visit || visit.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Site visit not found', 'visitId');
      }

      if (
        visit.status === SiteVisitStatus.COMPLETED ||
        visit.status === SiteVisitStatus.CANCELLED ||
        visit.status === SiteVisitStatus.NO_SHOW
      ) {
        throw new ConflictError(
          `Cannot reschedule a visit in terminal state ${visit.status}`
        );
      }

      if (input.newScheduledAt <= new Date()) {
        throw new ValidationError('New scheduled visit time must be in the future', 'newScheduledAt');
      }

      // Mark original visit as RESCHEDULED
      await tx.siteVisit.update({
        where: { id: visit.id },
        data: {
          status: SiteVisitStatus.RESCHEDULED,
          version: { increment: 1 },
        },
      });

      // Create new scheduled visit referencing original
      const newVisit = await tx.siteVisit.create({
        data: {
          organizationId: actor.organizationId,
          leadId: visit.leadId,
          projectId: visit.projectId,
          assignedToId: visit.assignedToId,
          status: SiteVisitStatus.SCHEDULED,
          scheduledAt: input.newScheduledAt,
          rescheduledFromId: visit.id,
          feedback: `Rescheduled: ${input.reason}`,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'site_visit.rescheduled',
          entityType: 'SiteVisit',
          entityId: visit.id,
          oldValue: { scheduledAt: visit.scheduledAt },
          newValue: { newScheduledAt: input.newScheduledAt, newVisitId: newVisit.id },
          reason: input.reason,
          source: ChangeSource.MANUAL,
        },
      });

      return newVisit;
    });
  },

  /**
   * Completes a site visit with feedback and optional geofence verification (§12.2).
   */
  async completeVisit(actor: ActorContext, input: CompleteVisitInput) {
    return defaultPrisma.$transaction(async (tx) => {
      const visit = await tx.siteVisit.findUnique({
        where: { id: input.visitId },
      });

      if (!visit || visit.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Site visit not found', 'visitId');
      }

      if (visit.status !== SiteVisitStatus.SCHEDULED && visit.status !== SiteVisitStatus.CONFIRMED && visit.status !== SiteVisitStatus.RESCHEDULED) {
        throw new ConflictError(`Cannot complete visit in ${visit.status} state`);
      }

      const now = new Date();
      const updatedVisit = await tx.siteVisit.update({
        where: { id: visit.id },
        data: {
          status: SiteVisitStatus.COMPLETED,
          completedAt: now,
          feedback: input.feedback,
          rating: input.rating,
          version: { increment: 1 },
        },
      });

      // Mark hasCompletedSiteVisit = true on Lead convenience projection (§8.3)
      await tx.lead.update({
        where: { id: visit.leadId },
        data: { hasCompletedSiteVisit: true },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'site_visit.completed',
          entityType: 'SiteVisit',
          entityId: visit.id,
          newValue: { completedAt: now, rating: input.rating },
          source: ChangeSource.MANUAL,
        },
      });

      // Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.SiteVisitCompleted,
          aggregateType: 'SiteVisit',
          aggregateId: visit.id,
          correlationId: actor.correlationId,
          payload: {
            visitId: visit.id,
            leadId: visit.leadId,
            projectId: visit.projectId,
            completedAt: now,
          },
        },
      });

      return updatedVisit;
    });
  },
};
