import { LeadLifecycleStage, LeadStatus } from '@prisma/client';
import { ConflictError } from '../../core/errors/appError.js';

export interface StageTransitionResult {
  fromStage: LeadLifecycleStage;
  toStage: LeadLifecycleStage;
  isReengagement: boolean;
  newCycle: number;
  newStatus?: LeadStatus;
}

/**
 * Authoritative Lead Lifecycle State Machine (§10.3, §10.4, Decision A).
 * Guarantees Invariants INV-LIF-001, INV-LIF-002, INV-LIF-003.
 */
export const leadLifecycle = {
  /**
   * Evaluates the legality of a stage transition.
   */
  validateTransition(
    currentStage: LeadLifecycleStage,
    targetStage: LeadLifecycleStage,
    currentCycle: number
  ): StageTransitionResult {
    if (currentStage === targetStage) {
      throw new ConflictError(`Lead is already in ${currentStage} stage`);
    }

    // Invariant INV-LIF-002: CANCELLED is a terminal post-conversion stage
    if (currentStage === LeadLifecycleStage.CANCELLED) {
      throw new ConflictError(
        'CANCELLED is a terminal post-conversion stage. No further transitions are permitted.'
      );
    }

    // Invariant INV-LIF-001: Forbidden WON -> LOST transition
    if (currentStage === LeadLifecycleStage.WON && targetStage === LeadLifecycleStage.LOST) {
      throw new ConflictError(
        'WON leads cannot transition to LOST. Converted leads that cancel must transition to CANCELLED via booking cancellation.'
      );
    }

    // CANCELLED is reachable ONLY from WON (Decision A)
    if (targetStage === LeadLifecycleStage.CANCELLED && currentStage !== LeadLifecycleStage.WON) {
      throw new ConflictError(
        'CANCELLED stage is reachable ONLY from WON, driven by booking cancellation.'
      );
    }

    // Invariant INV-LIF-003: Re-engagement cycle from LOST -> NEW
    if (currentStage === LeadLifecycleStage.LOST) {
      if (targetStage === LeadLifecycleStage.NEW) {
        return {
          fromStage: currentStage,
          toStage: targetStage,
          isReengagement: true,
          newCycle: currentCycle + 1,
          newStatus: LeadStatus.ACTIVE,
        };
      } else {
        throw new ConflictError(
          `LOST leads can only transition to NEW via re-engagement. Direct transition to ${targetStage} is forbidden.`
        );
      }
    }

    // Standard Forward & Drop Transitions
    const allowedTransitions: Record<LeadLifecycleStage, LeadLifecycleStage[]> = {
      NEW: [LeadLifecycleStage.CONTACTED, LeadLifecycleStage.QUALIFIED, LeadLifecycleStage.LOST],
      CONTACTED: [LeadLifecycleStage.QUALIFIED, LeadLifecycleStage.SITE_VISIT, LeadLifecycleStage.LOST],
      QUALIFIED: [LeadLifecycleStage.SITE_VISIT, LeadLifecycleStage.NEGOTIATION, LeadLifecycleStage.LOST],
      SITE_VISIT: [LeadLifecycleStage.NEGOTIATION, LeadLifecycleStage.BOOKING, LeadLifecycleStage.LOST],
      NEGOTIATION: [LeadLifecycleStage.BOOKING, LeadLifecycleStage.LOST],
      BOOKING: [LeadLifecycleStage.WON, LeadLifecycleStage.LOST],
      WON: [LeadLifecycleStage.CANCELLED],
      CANCELLED: [],
      LOST: [LeadLifecycleStage.NEW],
    };

    const legalTargets = allowedTransitions[currentStage] || [];
    if (!legalTargets.includes(targetStage)) {
      throw new ConflictError(
        `Illegal lifecycle transition: cannot move from ${currentStage} to ${targetStage}`
      );
    }

    // Cross-dimension update rule (§10.2): Terminal stages set status to CLOSED
    let newStatus: LeadStatus | undefined;
    if (
      targetStage === LeadLifecycleStage.WON ||
      targetStage === LeadLifecycleStage.LOST ||
      targetStage === LeadLifecycleStage.CANCELLED
    ) {
      newStatus = LeadStatus.CLOSED;
    }

    return {
      fromStage: currentStage,
      toStage: targetStage,
      isReengagement: false,
      newCycle: currentCycle,
      newStatus,
    };
  },
};
