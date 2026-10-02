import { LeadSLAState, DomainEventType, ChangeSource } from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';

export interface SLAEvaluationResult {
  leadId: string;
  previousState: LeadSLAState;
  newState: LeadSLAState;
  stateChanged: boolean;
  breached: boolean;
}

export const slaEngine = {
  /**
   * Evaluates the current SLA state for a single lead against the current time (§11.5).
   */
  computeSLAState(now: Date, slaDueAt?: Date | null, currentState: LeadSLAState = LeadSLAState.WITHIN_SLA): LeadSLAState {
    if (!slaDueAt || currentState === LeadSLAState.RESOLVED) {
      return currentState;
    }

    const dueTime = slaDueAt.getTime();
    const currentTime = now.getTime();

    if (currentTime >= dueTime) {
      return LeadSLAState.BREACHED;
    }

    // Due soon window: within 30 seconds of breach
    if (dueTime - currentTime <= 30 * 1000) {
      return LeadSLAState.DUE_SOON;
    }

    return LeadSLAState.WITHIN_SLA;
  },

  /**
   * Sweeps and evaluates all open leads approaching or exceeding their SLA due time (§11.7).
   */
  async sweepSLATimers(actor: ActorContext, client = defaultPrisma): Promise<SLAEvaluationResult[]> {
    const now = new Date();

    const pendingLeads = await client.lead.findMany({
      where: {
        organizationId: actor.organizationId,
        slaState: { in: [LeadSLAState.WITHIN_SLA, LeadSLAState.DUE_SOON] },
        slaDueAt: { not: null },
        deletedAt: null,
      },
      select: {
        id: true,
        slaState: true,
        slaDueAt: true,
        slaBreachedAt: true,
      },
      take: 100,
    });

    const results: SLAEvaluationResult[] = [];

    for (const lead of pendingLeads) {
      const newState = this.computeSLAState(now, lead.slaDueAt, lead.slaState);

      if (newState !== lead.slaState) {
        const isBreach = newState === LeadSLAState.BREACHED;

        await client.$transaction(async (tx) => {
          const updateData: Record<string, any> = {
            slaState: newState,
            version: { increment: 1 },
          };

          // Record breach timestamp if transitioning to BREACHED for the first time (§11.5)
          if (isBreach && !lead.slaBreachedAt) {
            updateData.slaBreachedAt = now;
          }

          await tx.lead.update({
            where: { id: lead.id },
            data: updateData,
          });

          // Outbox event
          await tx.outboxEvent.create({
            data: {
              organizationId: actor.organizationId,
              eventType: isBreach ? DomainEventType.LeadSLABreached : DomainEventType.LeadStatusChanged,
              aggregateType: 'Lead',
              aggregateId: lead.id,
              correlationId: actor.correlationId,
              payload: {
                leadId: lead.id,
                organizationId: actor.organizationId,
                previousState: lead.slaState,
                newState,
                evaluatedAt: now,
              },
            },
          });

          // Audit log for breaches
          if (isBreach) {
            await tx.auditLog.create({
              data: {
                organizationId: actor.organizationId,
                actorId: actor.userId,
                actorType: 'SYSTEM',
                correlationId: actor.correlationId,
                action: 'lead.sla_breached',
                entityType: 'Lead',
                entityId: lead.id,
                source: ChangeSource.SLA_WORKER,
              },
            });
          }
        });

        results.push({
          leadId: lead.id,
          previousState: lead.slaState,
          newState,
          stateChanged: true,
          breached: isBreach,
        });
      }
    }

    return results;
  },
};
