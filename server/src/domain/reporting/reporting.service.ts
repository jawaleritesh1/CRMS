import { LeadLifecycleStage, PaymentStatus, PaymentType } from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';

export interface FunnelReportParams {
  projectId?: string;
  startDate?: Date;
  endDate?: Date;
  cycle?: number;
}

export interface AuditSearchParams {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  take?: number;
  skip?: number;
}

export const reportingService = {
  /**
   * Generates historical conversion funnel querying point-in-time LeadStageHistory records (§33.3).
   * Distinguishes Gross Conversions (WON) from Net Conversions (WON - CANCELLED).
   */
  async getConversionFunnel(actor: ActorContext, params: FunnelReportParams = {}, client = defaultPrisma) {
    const whereClause: Record<string, any> = {
      organizationId: actor.organizationId,
    };

    if (params.cycle) {
      whereClause.cycle = params.cycle;
    }
    if (params.startDate || params.endDate) {
      whereClause.createdAt = {};
      if (params.startDate) whereClause.createdAt.gte = params.startDate;
      if (params.endDate) whereClause.createdAt.lte = params.endDate;
    }

    // Query historical transitions
    const historyEntries = await client.leadStageHistory.findMany({
      where: whereClause,
      select: {
        toStage: true,
        cycle: true,
        leadId: true,
      },
    });

    const uniqueLeadsPerStage = new Map<LeadLifecycleStage, Set<string>>();
    for (const stage of Object.values(LeadLifecycleStage)) {
      uniqueLeadsPerStage.set(stage, new Set<string>());
    }

    for (const entry of historyEntries) {
      uniqueLeadsPerStage.get(entry.toStage)?.add(entry.leadId);
    }

    const stageCounts: Record<string, number> = {};
    for (const [stage, leadSet] of uniqueLeadsPerStage.entries()) {
      stageCounts[stage] = leadSet.size;
    }

    const grossConversions = stageCounts[LeadLifecycleStage.WON] ?? 0;
    const cancellations = stageCounts[LeadLifecycleStage.CANCELLED] ?? 0;
    const netConversions = Math.max(0, grossConversions - cancellations);

    return {
      cycle: params.cycle ?? 'all',
      stageCounts,
      grossConversions,
      cancellations,
      netConversions,
      conversionRateGross: stageCounts[LeadLifecycleStage.NEW]
        ? ((grossConversions / stageCounts[LeadLifecycleStage.NEW]!) * 100).toFixed(2) + '%'
        : '0%',
      conversionRateNet: stageCounts[LeadLifecycleStage.NEW]
        ? ((netConversions / stageCounts[LeadLifecycleStage.NEW]!) * 100).toFixed(2) + '%'
        : '0%',
    };
  },

  /**
   * Generates financial collections summary querying immutable Payment records (§17.2, §33.4).
   */
  async getFinancialSummary(actor: ActorContext, client = defaultPrisma) {
    const payments = await client.payment.findMany({
      where: {
        organizationId: actor.organizationId,
        status: PaymentStatus.SUCCEEDED,
      },
      select: {
        type: true,
        amount: true,
      },
    });

    let grossCollections = 0;
    let totalRefunds = 0;

    for (const p of payments) {
      const amt = Number(p.amount);
      if (p.type === PaymentType.REFUND) {
        totalRefunds += amt;
      } else {
        grossCollections += amt;
      }
    }

    const netCollections = grossCollections - totalRefunds;

    return {
      grossCollections,
      totalRefunds,
      netCollections,
      transactionCount: payments.length,
    };
  },

  /**
   * Searches the immutable AuditLog (§32.4) within the actor's tenant boundary.
   */
  async searchAuditTrail(actor: ActorContext, params: AuditSearchParams, client = defaultPrisma) {
    const where: Record<string, any> = {
      organizationId: actor.organizationId,
    };

    if (params.entityType) where.entityType = params.entityType;
    if (params.entityId) where.entityId = params.entityId;
    if (params.actorId) where.actorId = params.actorId;
    if (params.action) where.action = params.action;

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = params.startDate;
      if (params.endDate) where.createdAt.lte = params.endDate;
    }

    const take = params.take ?? 50;
    const skip = params.skip ?? 0;

    const [logs, total] = await Promise.all([
      client.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      client.auditLog.count({ where }),
    ]);

    return {
      total,
      take,
      skip,
      data: logs,
    };
  },
};
