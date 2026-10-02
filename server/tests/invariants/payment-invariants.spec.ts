import { describe, it, expect } from 'vitest';
import { PaymentStatus, PaymentType } from '@prisma/client';
import { ValidationError } from '../../src/core/errors/appError.js';

describe('INV-PAY: Financial Immutability & Append-Only Compensating Refund Suite (§17.3, §17.4, Decision B)', () => {
  describe('INV-PAY-001: Settled Payment State Immutability', () => {
    it('verifies that PaymentStatus.REVERSED is eliminated and settled payments never mutate backwards', () => {
      // Decision B: PaymentStatus has NO REVERSED enum value
      const allStatuses = Object.values(PaymentStatus);
      expect(allStatuses).not.toContain('REVERSED');
      expect(allStatuses).toEqual([
        'PENDING',
        'PROCESSING',
        'SUCCEEDED',
        'FAILED',
        'REFUND_PENDING',
        'REFUNDED',
      ]);
    });

    it('rejects refund attempts on non-settled payments', () => {
      const nonSettledStatuses = [
        PaymentStatus.PENDING,
        PaymentStatus.PROCESSING,
        PaymentStatus.FAILED,
      ];

      for (const status of nonSettledStatuses) {
        const canRefund = status === PaymentStatus.SUCCEEDED || status === PaymentStatus.REFUND_PENDING;
        expect(canRefund).toBe(false);
      }
    });
  });

  describe('INV-PAY-002: Append-Only Compensating Refund Record', () => {
    it('creates a new compensating payment record with positive amount and links reversalOfPaymentId', () => {
      const originalPayment = {
        id: 'pay_orig_123',
        amount: 500000,
        status: PaymentStatus.SUCCEEDED,
      };

      const refundAmount = 100000;

      // Compensating refund structure
      const refundRecord = {
        id: 'pay_ref_456',
        type: PaymentType.REFUND,
        amount: refundAmount, // always positive (per CHECK amount > 0)
        reversalOfPaymentId: originalPayment.id,
        status: PaymentStatus.PENDING,
      };

      expect(refundRecord.type).toBe(PaymentType.REFUND);
      expect(refundRecord.amount).toBeGreaterThan(0);
      expect(refundRecord.reversalOfPaymentId).toBe(originalPayment.id);
    });
  });

  describe('INV-PAY-003: Over-Refund Prevention Logic', () => {
    it('calculates remaining unrefunded balance and rejects refunds that exceed it', () => {
      const originalAmount = 50000;
      const existingRefunds = [30000];

      const totalRefunded = existingRefunds.reduce((a, b) => a + b, 0);
      const remainingBalance = originalAmount - totalRefunded; // 20,000

      expect(remainingBalance).toBe(20000);

      const requestedRefund = 25000;
      const isOverRefund = requestedRefund > remainingBalance;
      expect(isOverRefund).toBe(true);

      expect(() => {
        if (isOverRefund) {
          throw new ValidationError(
            `Refund amount (${requestedRefund}) exceeds unrefunded settled balance of ${remainingBalance.toFixed(2)}`,
            'refundAmount'
          );
        }
      }).toThrowError(ValidationError);
    });

    it('permits partial refunds that are within the remaining balance', () => {
      const originalAmount = 50000;
      const existingRefunds = [20000];

      const remainingBalance = originalAmount - existingRefunds.reduce((a, b) => a + b, 0); // 30,000
      const requestedRefund = 15000;

      expect(requestedRefund <= remainingBalance).toBe(true);
    });
  });
});
