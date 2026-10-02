import { describe, it, expect } from 'vitest';
import { LeadLifecycleStage, LeadStatus } from '@prisma/client';
import { leadLifecycle } from '../../src/domain/lead/leadLifecycle.js';
import { ConflictError } from '../../src/core/errors/appError.js';

describe('INV-LIF: Lead Lifecycle State Machine Invariant Suite (§10.3, §10.4, Decision A)', () => {
  describe('INV-LIF-001: Forbidden WON → LOST Transition', () => {
    it('should strictly reject transition from WON to LOST', () => {
      expect(() => {
        leadLifecycle.validateTransition(
          LeadLifecycleStage.WON,
          LeadLifecycleStage.LOST,
          1
        );
      }).toThrowError(ConflictError);

      try {
        leadLifecycle.validateTransition(
          LeadLifecycleStage.WON,
          LeadLifecycleStage.LOST,
          1
        );
      } catch (err: any) {
        expect(err.message).toContain('WON leads cannot transition to LOST');
      }
    });

    it('should allow WON to transition to CANCELLED via booking cancellation', () => {
      const result = leadLifecycle.validateTransition(
        LeadLifecycleStage.WON,
        LeadLifecycleStage.CANCELLED,
        1
      );
      expect(result.toStage).toBe(LeadLifecycleStage.CANCELLED);
      expect(result.newStatus).toBe(LeadStatus.CLOSED);
    });
  });

  describe('INV-LIF-002: Terminal CANCELLED Stage Invariant', () => {
    it('should strictly reject any forward or backward transition from CANCELLED', () => {
      const targets = [
        LeadLifecycleStage.NEW,
        LeadLifecycleStage.CONTACTED,
        LeadLifecycleStage.QUALIFIED,
        LeadLifecycleStage.SITE_VISIT,
        LeadLifecycleStage.NEGOTIATION,
        LeadLifecycleStage.BOOKING,
        LeadLifecycleStage.WON,
        LeadLifecycleStage.LOST,
      ];

      for (const target of targets) {
        expect(() => {
          leadLifecycle.validateTransition(
            LeadLifecycleStage.CANCELLED,
            target,
            1
          );
        }).toThrowError(ConflictError);
      }
    });

    it('should reject CANCELLED as a target from any stage other than WON', () => {
      const nonWonStages = [
        LeadLifecycleStage.NEW,
        LeadLifecycleStage.CONTACTED,
        LeadLifecycleStage.QUALIFIED,
        LeadLifecycleStage.SITE_VISIT,
        LeadLifecycleStage.NEGOTIATION,
        LeadLifecycleStage.BOOKING,
        LeadLifecycleStage.LOST,
      ];

      for (const stage of nonWonStages) {
        expect(() => {
          leadLifecycle.validateTransition(stage, LeadLifecycleStage.CANCELLED, 1);
        }).toThrowError(ConflictError);
      }
    });
  });

  describe('INV-LIF-003: Allowed LOST → NEW Re-Engagement Cycle', () => {
    it('should allow re-engagement from LOST to NEW and increment lifecycleCycle', () => {
      const result = leadLifecycle.validateTransition(
        LeadLifecycleStage.LOST,
        LeadLifecycleStage.NEW,
        1
      );

      expect(result.toStage).toBe(LeadLifecycleStage.NEW);
      expect(result.isReengagement).toBe(true);
      expect(result.newCycle).toBe(2);
      expect(result.newStatus).toBe(LeadStatus.ACTIVE);
    });

    it('should increment cycle from N to N+1 on subsequent re-engagements', () => {
      const result = leadLifecycle.validateTransition(
        LeadLifecycleStage.LOST,
        LeadLifecycleStage.NEW,
        4
      );

      expect(result.newCycle).toBe(5);
      expect(result.isReengagement).toBe(true);
    });

    it('should reject direct transition from LOST to any stage other than NEW', () => {
      const forbiddenTargets = [
        LeadLifecycleStage.CONTACTED,
        LeadLifecycleStage.QUALIFIED,
        LeadLifecycleStage.SITE_VISIT,
        LeadLifecycleStage.NEGOTIATION,
        LeadLifecycleStage.BOOKING,
        LeadLifecycleStage.WON,
        LeadLifecycleStage.CANCELLED,
      ];

      for (const target of forbiddenTargets) {
        expect(() => {
          leadLifecycle.validateTransition(LeadLifecycleStage.LOST, target, 1);
        }).toThrowError(ConflictError);
      }
    });
  });

  describe('Cross-Dimension Invariants (§10.2)', () => {
    it('should automatically set status to CLOSED when transitioning to LOST or WON', () => {
      const lostResult = leadLifecycle.validateTransition(
        LeadLifecycleStage.QUALIFIED,
        LeadLifecycleStage.LOST,
        1
      );
      expect(lostResult.newStatus).toBe(LeadStatus.CLOSED);

      const wonResult = leadLifecycle.validateTransition(
        LeadLifecycleStage.BOOKING,
        LeadLifecycleStage.WON,
        1
      );
      expect(wonResult.newStatus).toBe(LeadStatus.CLOSED);
    });
  });
});
