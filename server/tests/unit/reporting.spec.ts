import { describe, it, expect } from 'vitest';
import { reportingService } from '../../src/domain/reporting/reporting.service.js';
import { LeadLifecycleStage, PaymentStatus, PaymentType, ScopeType } from '@prisma/client';
import { ActorContext } from '../../src/security/context/actorContext.js';

describe('Reporting & Funnel Analytics Suite (§33.3, §33.4)', () => {
  const actor: ActorContext = {
    userId: 'usr_mgr',
    organizationId: 'org_acme',
    membershipId: 'mem_mgr',
    roleId: 'role_mgr',
    roleSlug: 'sales_manager',
    capabilities: new Set(['REPORT_VIEW']),
    scope: ScopeType.ORGANIZATION,
    teamIds: [],
    projectIds: [],
    isSystemActor: false,
    authorizationVersion: 1,
    correlationId: 'corr_rep',
  };

  describe('Historical Funnel Analytics', () => {
    it('separates gross conversions (WON) from net conversions (accounting for CANCELLED leads)', async () => {
      // Mock history entries: 10 leads at NEW, 5 reach WON, 2 later CANCELLED
      const mockHistory = [
        ...Array.from({ length: 10 }, (_, i) => ({ toStage: LeadLifecycleStage.NEW, cycle: 1, leadId: `lead_${i}` })),
        ...Array.from({ length: 5 }, (_, i) => ({ toStage: LeadLifecycleStage.WON, cycle: 1, leadId: `lead_${i}` })),
        { toStage: LeadLifecycleStage.CANCELLED, cycle: 1, leadId: 'lead_0' },
        { toStage: LeadLifecycleStage.CANCELLED, cycle: 1, leadId: 'lead_1' },
      ];

      const mockClient: any = {
        leadStageHistory: {
          findMany: async () => mockHistory,
        },
      };

      const result = await reportingService.getConversionFunnel(actor, { cycle: 1 }, mockClient);

      expect(result.grossConversions).toBe(5);
      expect(result.cancellations).toBe(2);
      expect(result.netConversions).toBe(3); // 5 - 2 = 3
      expect(result.conversionRateGross).toBe('50.00%');
      expect(result.conversionRateNet).toBe('30.00%');
    });
  });

  describe('Financial Collections & Compensating Refunds Summary', () => {
    it('calculates gross collections, total refunds, and net collection accurately', async () => {
      const mockPayments = [
        { type: PaymentType.MILESTONE, amount: 500000 },
        { type: PaymentType.TOKEN, amount: 100000 },
        { type: PaymentType.REFUND, amount: 50000 }, // compensating refund
      ];

      const mockClient: any = {
        payment: {
          findMany: async () => mockPayments,
        },
      };

      const summary = await reportingService.getFinancialSummary(actor, mockClient);

      expect(summary.grossCollections).toBe(600000);
      expect(summary.totalRefunds).toBe(50000);
      expect(summary.netCollections).toBe(550000); // 600,000 - 50,000
      expect(summary.transactionCount).toBe(3);
    });
  });
});
