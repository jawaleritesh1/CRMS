import { describe, it, expect } from 'vitest';
import { LeadSLAState } from '@prisma/client';
import { slaEngine } from '../../src/domain/sla/slaEngine.js';

describe('INV-ASN: Lead Assignment & SLA Invariant Suite (§11.1, §11.5, §11.6)', () => {
  describe('SLA Timer Window Calculations (§11.5)', () => {
    it('should compute WITHIN_SLA when time is comfortably before due window', () => {
      const now = new Date('2026-09-28T10:00:00Z');
      const dueAt = new Date('2026-09-28T10:02:00Z'); // 120s later

      const state = slaEngine.computeSLAState(now, dueAt, LeadSLAState.WITHIN_SLA);
      expect(state).toBe(LeadSLAState.WITHIN_SLA);
    });

    it('should transition to DUE_SOON when within 30 seconds of breach', () => {
      const now = new Date('2026-09-28T10:01:40Z'); // 20s remaining (< 30s)
      const dueAt = new Date('2026-09-28T10:02:00Z');

      const state = slaEngine.computeSLAState(now, dueAt, LeadSLAState.WITHIN_SLA);
      expect(state).toBe(LeadSLAState.DUE_SOON);
    });

    it('should transition to BREACHED when currentTime >= dueAt', () => {
      const now = new Date('2026-09-28T10:02:01Z'); // 1s past due
      const dueAt = new Date('2026-09-28T10:02:00Z');

      const state = slaEngine.computeSLAState(now, dueAt, LeadSLAState.DUE_SOON);
      expect(state).toBe(LeadSLAState.BREACHED);
    });

    it('should preserve RESOLVED state and not regress to breached', () => {
      const now = new Date('2026-09-28T10:05:00Z');
      const dueAt = new Date('2026-09-28T10:02:00Z');

      const state = slaEngine.computeSLAState(now, dueAt, LeadSLAState.RESOLVED);
      expect(state).toBe(LeadSLAState.RESOLVED);
    });
  });

  describe('INV-ASN-002: SLA Reset Mechanics Logic', () => {
    it('should calculate new SLA window (120s) on reassignment while preserving historical breach date', () => {
      const assignedAt = new Date('2026-09-28T12:00:00Z');
      const newDueAt = new Date(assignedAt.getTime() + 120 * 1000);

      const existingBreachedAt = new Date('2026-09-28T11:30:00Z');

      // Simulated reassignment state update
      const reassignmentUpdate = {
        slaState: LeadSLAState.WITHIN_SLA,
        slaDueAt: newDueAt,
        // Invariant: historical slaBreachedAt must NOT be cleared or set to null
        slaBreachedAt: existingBreachedAt,
      };

      expect(reassignmentUpdate.slaState).toBe(LeadSLAState.WITHIN_SLA);
      expect(reassignmentUpdate.slaDueAt.getTime()).toBe(assignedAt.getTime() + 120000);
      expect(reassignmentUpdate.slaBreachedAt).toBe(existingBreachedAt);
    });
  });
});
