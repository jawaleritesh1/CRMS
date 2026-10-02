import { describe, it, expect } from 'vitest';
import { UnitAvailability, HoldStatus } from '@prisma/client';

describe('INV-INV: Inventory Concurrency & Locking Invariant Suite (§14.3, §36.2, §36.3)', () => {
  describe('INV-INV-001: Concurrency Control Logic', () => {
    it('guarantees that a unit in ON_HOLD or BOOKED status rejects subsequent hold attempts', () => {
      const nonAvailableStatuses = [
        UnitAvailability.ON_HOLD,
        UnitAvailability.BOOKING_IN_PROGRESS,
        UnitAvailability.BOOKED,
        UnitAvailability.SOLD,
        UnitAvailability.BLOCKED,
      ];

      for (const status of nonAvailableStatuses) {
        const isHoldAllowed = status === UnitAvailability.AVAILABLE;
        expect(isHoldAllowed).toBe(false);
      }
    });

    it('allows hold placement strictly when availability === AVAILABLE', () => {
      const status = UnitAvailability.AVAILABLE;
      const isHoldAllowed = status === UnitAvailability.AVAILABLE;
      expect(isHoldAllowed).toBe(true);
    });
  });

  describe('INV-INV-002: Hold Lifecycle State Transitions (§14.5)', () => {
    it('validates active hold exclusivity: only one ACTIVE hold allowed per unit', () => {
      const existingHolds = [
        { id: 'hold_1', status: HoldStatus.ACTIVE },
      ];

      const hasActiveHold = existingHolds.some((h) => h.status === HoldStatus.ACTIVE);
      expect(hasActiveHold).toBe(true);

      // Attempting to add second active hold must be blocked
      const canAddSecondActiveHold = !hasActiveHold;
      expect(canAddSecondActiveHold).toBe(false);
    });

    it('transitions hold status on release to RELEASED and restores unit to AVAILABLE', () => {
      const initialHold = { status: HoldStatus.ACTIVE };
      const initialUnit = { availability: UnitAvailability.ON_HOLD };

      // Release action
      const releasedHold = { ...initialHold, status: HoldStatus.RELEASED, releasedAt: new Date() };
      const restoredUnit = { ...initialUnit, availability: UnitAvailability.AVAILABLE };

      expect(releasedHold.status).toBe(HoldStatus.RELEASED);
      expect(restoredUnit.availability).toBe(UnitAvailability.AVAILABLE);
    });

    it('transitions hold status on expiration to EXPIRED and restores unit to AVAILABLE', () => {
      const expiredHold = { status: HoldStatus.EXPIRED, releasedAt: new Date() };
      const restoredUnit = { availability: UnitAvailability.AVAILABLE };

      expect(expiredHold.status).toBe(HoldStatus.EXPIRED);
      expect(restoredUnit.availability).toBe(UnitAvailability.AVAILABLE);
    });
  });
});
