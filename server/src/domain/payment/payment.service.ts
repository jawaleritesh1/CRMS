import {
  PaymentStatus,
  PaymentType,
  DomainEventType,
  ChangeSource,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { ResourceNotFoundError, ConflictError, ValidationError } from '../../core/errors/appError.js';

export interface RecordPaymentIntentInput {
  bookingId: string;
  milestoneId?: string;
  amount: number;
  paymentMode?: string;
  idempotencyKey: string;
}

export interface RefundPaymentInput {
  originalPaymentId: string;
  refundAmount: number;
  reason: string;
  idempotencyKey?: string;
}

export const paymentService = {
  /**
   * Records initial payment intention locally before calling gateway (Intent-first ordering, §17.6).
   */
  async recordPaymentIntent(actor: ActorContext, input: RecordPaymentIntentInput) {
    return defaultPrisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
      });

      if (!booking || booking.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Booking not found', 'bookingId');
      }

      if (input.amount <= 0) {
        throw new ValidationError('Payment amount must be greater than zero', 'amount');
      }

      // Check idempotencyKey reservation
      const existing = await tx.payment.findUnique({
        where: {
          organizationId_idempotencyKey: {
            organizationId: actor.organizationId,
            idempotencyKey: input.idempotencyKey,
          },
        },
      });

      if (existing) {
        return existing;
      }

      const payment = await tx.payment.create({
        data: {
          organizationId: actor.organizationId,
          bookingId: booking.id,
          milestoneId: input.milestoneId ?? null,
          type: PaymentType.MILESTONE,
          amount: input.amount,
          paymentMode: input.paymentMode ?? 'BANK_TRANSFER',
          status: PaymentStatus.PENDING,
          idempotencyKey: input.idempotencyKey,
          recordedById: actor.userId,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'payment.created',
          entityType: 'Payment',
          entityId: payment.id,
          newValue: { amount: payment.amount, status: payment.status },
          source: ChangeSource.MANUAL,
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.PaymentCreated,
          aggregateType: 'Payment',
          aggregateId: payment.id,
          correlationId: actor.correlationId,
          payload: {
            paymentId: payment.id,
            bookingId: booking.id,
            amount: Number(payment.amount),
          },
        },
      });

      return payment;
    });
  },

  /**
   * Settles a payment following gateway confirmation (§17.2, §35.1).
   */
  async settlePayment(
    actor: ActorContext,
    params: {
      paymentId: string;
      providerTransactionRef: string;
      provider: string;
    }
  ) {
    return defaultPrisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: params.paymentId },
      });

      if (!payment || payment.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Payment not found', 'paymentId');
      }

      if (payment.status === PaymentStatus.SUCCEEDED) {
        return payment;
      }

      const now = new Date();
      const updated = await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCEEDED,
          settledAt: now,
          provider: params.provider,
          providerTransactionRef: params.providerTransactionRef,
        },
      });

      // Update milestone amount paid if linked
      if (payment.milestoneId) {
        await tx.paymentMilestone.update({
          where: { id: payment.milestoneId },
          data: {
            amountPaid: { increment: payment.amount },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'payment.received',
          entityType: 'Payment',
          entityId: payment.id,
          newValue: { status: PaymentStatus.SUCCEEDED, settledAt: now },
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.PaymentReceived,
          aggregateType: 'Payment',
          aggregateId: payment.id,
          correlationId: actor.correlationId,
          payload: {
            paymentId: payment.id,
            bookingId: payment.bookingId,
            amount: Number(payment.amount),
          },
        },
      });

      return updated;
    });
  },

  /**
   * Authorizes an Append-Only Compensating Refund (§17.3, §17.4, Decision B, INV-PAY-001, INV-PAY-002, INV-PAY-003).
   * Settled payments are immutable. A refund creates a NEW compensating Payment row referencing reversalOfPaymentId.
   */
  async refundPayment(actor: ActorContext, input: RefundPaymentInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Fetch original payment with row lock
      const payments = await tx.$queryRaw<Array<{ id: string; organizationId: string; bookingId: string; milestoneId: string | null; amount: any; status: PaymentStatus }>>`
        SELECT "id", "organizationId", "bookingId", "milestoneId", "amount", "status"
        FROM "Payment"
        WHERE "id" = ${input.originalPaymentId} AND "organizationId" = ${actor.organizationId}
        FOR UPDATE;
      `;

      const originalPayment = payments[0];
      if (!originalPayment) {
        throw new ResourceNotFoundError('Original payment not found', 'originalPaymentId');
      }

      // Invariant INV-PAY-001: Settled payments can only be refunded if SUCCEEDED
      if (originalPayment.status !== PaymentStatus.SUCCEEDED && originalPayment.status !== PaymentStatus.REFUND_PENDING) {
        throw new ConflictError(
          `Cannot refund payment in ${originalPayment.status} status. Only settled payments can be refunded.`,
          'originalPaymentId'
        );
      }

      const originalAmount = Number(originalPayment.amount);

      // Invariant INV-PAY-003: Over-refund prevention
      // Calculate total existing refunds for this payment
      const existingRefunds = await tx.payment.findMany({
        where: {
          reversalOfPaymentId: originalPayment.id,
          status: { not: PaymentStatus.FAILED },
        },
        select: { amount: true },
      });

      const totalRefundedSoFar = existingRefunds.reduce((sum, r) => sum + Number(r.amount), 0);
      const remainingUnrefunded = originalAmount - totalRefundedSoFar;

      if (input.refundAmount <= 0) {
        throw new ValidationError('Refund amount must be positive', 'refundAmount');
      }

      if (input.refundAmount > remainingUnrefunded) {
        throw new ValidationError(
          `Refund amount (${input.refundAmount}) exceeds unrefunded settled balance of ${remainingUnrefunded.toFixed(2)}`,
          'refundAmount'
        );
      }

      // 2. Mark original payment status as REFUND_PENDING
      await tx.payment.update({
        where: { id: originalPayment.id },
        data: { status: PaymentStatus.REFUND_PENDING },
      });

      // 3. Invariant INV-PAY-002: Create NEW compensating Payment record
      // Amount is positive per CHECK (amount > 0) constraint (§17.3, §47.1). Direction is expressed by type = REFUND
      const now = new Date();
      const refundRecord = await tx.payment.create({
        data: {
          organizationId: actor.organizationId,
          bookingId: originalPayment.bookingId,
          milestoneId: originalPayment.milestoneId,
          type: PaymentType.REFUND,
          amount: input.refundAmount,
          paymentMode: 'BANK_REVERSAL',
          status: PaymentStatus.PENDING,
          reversalOfPaymentId: originalPayment.id,
          recordedById: actor.userId,
          paidAt: now,
        },
      });

      // 4. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'payment.refunded',
          entityType: 'Payment',
          entityId: originalPayment.id,
          newValue: {
            refundRecordId: refundRecord.id,
            refundAmount: input.refundAmount,
            reason: input.reason,
          },
          reason: input.reason,
          source: ChangeSource.MANUAL,
        },
      });

      // 5. Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.PaymentRefunded,
          aggregateType: 'Payment',
          aggregateId: originalPayment.id,
          correlationId: actor.correlationId,
          payload: {
            originalPaymentId: originalPayment.id,
            refundPaymentId: refundRecord.id,
            refundAmount: input.refundAmount,
            reason: input.reason,
          },
        },
      });

      return refundRecord;
    });
  },
};
