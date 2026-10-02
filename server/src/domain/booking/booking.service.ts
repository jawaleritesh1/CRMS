import {
  BookingStatus,
  UnitAvailability,
  HoldStatus,
  MilestoneStatus,
  DomainEventType,
  ChangeSource,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { targetValidator } from '../../security/authorization/targetValidator.js';
import { ResourceNotFoundError, ConflictError } from '../../core/errors/appError.js';

export interface CreateBookingInput {
  leadId: string;
  customerId: string;
  unitId: string;
  costSheetId: string;
}

export interface CancelBookingInput {
  bookingId: string;
  reason: string;
}

export const bookingService = {
  /**
   * Executes the critical Booking Creation & Hold Consumption Transaction Boundary (§16.1, §35.1, TRANSACTION_MATRIX §3.3).
   */
  async createBooking(actor: ActorContext, input: CreateBookingInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Target Validation: Lead, Customer, Unit
      const lead = await targetValidator.validateLead(input.leadId, actor.organizationId, tx);
      const customer = await targetValidator.validateCustomer(input.customerId, actor.organizationId, tx);

      // Lock PropertyUnit FOR UPDATE (§36.2)
      const units = await tx.$queryRaw<Array<{ id: string; availability: UnitAvailability }>>`
        SELECT "id", "availability"
        FROM "PropertyUnit"
        WHERE "id" = ${input.unitId} AND "organizationId" = ${actor.organizationId}
        FOR UPDATE;
      `;
      const unit = units[0];
      if (!unit) {
        throw new ResourceNotFoundError('Property unit not found', 'unitId');
      }

      if (unit.availability !== UnitAvailability.ON_HOLD && unit.availability !== UnitAvailability.AVAILABLE) {
        throw new ConflictError(
          `Unit cannot be booked. Current availability: ${unit.availability}`,
          'unitId'
        );
      }

      // 2. Consume active hold if one exists (§14.5, Decision 5.1.0)
      const activeHold = await tx.inventoryHold.findFirst({
        where: {
          unitId: unit.id,
          status: HoldStatus.ACTIVE,
        },
      });

      if (activeHold) {
        await tx.inventoryHold.update({
          where: { id: activeHold.id },
          data: { status: HoldStatus.CONSUMED },
        });
      }

      // 3. Verify CostSheet
      const costSheet = await tx.costSheet.findUnique({
        where: { id: input.costSheetId },
      });

      if (!costSheet || costSheet.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Cost sheet not found', 'costSheetId');
      }

      if (costSheet.status === 'DRAFT') {
        throw new ConflictError('Cannot book against an unapproved draft cost sheet', 'costSheetId');
      }

      // 4. Update Unit Availability to BOOKING_IN_PROGRESS
      await tx.propertyUnit.update({
        where: { id: unit.id },
        data: {
          availability: UnitAvailability.BOOKING_IN_PROGRESS,
          version: { increment: 1 },
        },
      });

      // 5. Create Booking row with immutable point-in-time cost snapshot
      const costSnapshot = {
        basePrice: Number(costSheet.basePrice),
        agreementValue: Number(costSheet.agreementValue),
        gstAmount: Number(costSheet.gstAmount),
        stampDutyAmount: Number(costSheet.stampDutyAmount),
        totalAllInclusive: Number(costSheet.totalAllInclusive),
        costSheetId: costSheet.id,
        version: costSheet.version,
      };

      const booking = await tx.booking.create({
        data: {
          organizationId: actor.organizationId,
          leadId: lead.id,
          customerId: customer.id,
          unitId: unit.id,
          costSheetId: costSheet.id,
          costSheetVersion: costSheet.version,
          costSnapshot,
          totalAgreementValue: costSheet.totalAllInclusive,
          status: BookingStatus.DRAFT,
        },
      });

      // 6. Historical Record
      await tx.bookingStatusHistory.create({
        data: {
          organizationId: actor.organizationId,
          bookingId: booking.id,
          fromStatus: null,
          toStatus: BookingStatus.DRAFT,
          changedById: actor.userId,
          reason: 'Initial booking creation',
        },
      });

      // 7. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'booking.created',
          entityType: 'Booking',
          entityId: booking.id,
          newValue: {
            unitId: unit.id,
            totalAgreementValue: costSheet.totalAllInclusive,
            status: BookingStatus.DRAFT,
          },
          source: ChangeSource.MANUAL,
        },
      });

      // 8. Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.UnitBookingStarted,
          aggregateType: 'Booking',
          aggregateId: booking.id,
          correlationId: actor.correlationId,
          payload: {
            bookingId: booking.id,
            unitId: unit.id,
            leadId: lead.id,
            totalAgreementValue: Number(costSheet.totalAllInclusive),
          },
        },
      });

      return booking;
    });
  },

  /**
   * Confirms a verified booking, transitioning Unit to BOOKED (§16.1).
   */
  async confirmBooking(actor: ActorContext, bookingId: string) {
    return defaultPrisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking || booking.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Booking not found', 'bookingId');
      }

      if (booking.status !== BookingStatus.DRAFT) {
        throw new ConflictError(`Cannot confirm booking in ${booking.status} state`);
      }

      const now = new Date();
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CONFIRMED,
          confirmedAt: now,
          version: { increment: 1 },
        },
      });

      // Transition unit to BOOKED
      await tx.propertyUnit.update({
        where: { id: booking.unitId },
        data: {
          availability: UnitAvailability.BOOKED,
          version: { increment: 1 },
        },
      });

      // Historical record
      await tx.bookingStatusHistory.create({
        data: {
          organizationId: actor.organizationId,
          bookingId: booking.id,
          fromStatus: BookingStatus.DRAFT,
          toStatus: BookingStatus.CONFIRMED,
          changedById: actor.userId,
          reason: 'Booking confirmed and agreement signed',
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'booking.confirmed',
          entityType: 'Booking',
          entityId: booking.id,
          newValue: { status: BookingStatus.CONFIRMED, confirmedAt: now },
        },
      });

      // Outbox event
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.BookingConfirmed,
          aggregateType: 'Booking',
          aggregateId: booking.id,
          correlationId: actor.correlationId,
          payload: {
            bookingId: booking.id,
            unitId: booking.unitId,
          },
        },
      });

      return updatedBooking;
    });
  },

  /**
   * Cancels a booking, restoring Unit availability and voiding payment milestones (§16.2, §35.1).
   */
  async cancelBooking(actor: ActorContext, input: CancelBookingInput) {
    return defaultPrisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: input.bookingId },
      });

      if (!booking || booking.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Booking not found', 'bookingId');
      }

      if (booking.status === BookingStatus.CANCELLED) {
        throw new ConflictError('Booking is already cancelled');
      }

      const now = new Date();

      // 1. Update Booking status to CANCELLED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: now,
          cancellationReason: input.reason,
          version: { increment: 1 },
        },
      });

      // 2. Void all uncollected payment milestones (§16.2)
      await tx.paymentMilestone.updateMany({
        where: {
          bookingId: booking.id,
          status: { notIn: [MilestoneStatus.PAID_FULL] },
        },
        data: {
          status: MilestoneStatus.VOIDED,
        },
      });

      // 3. Restore unit availability to AVAILABLE
      await tx.propertyUnit.update({
        where: { id: booking.unitId },
        data: {
          availability: UnitAvailability.AVAILABLE,
          version: { increment: 1 },
        },
      });

      // 4. Record history
      await tx.bookingStatusHistory.create({
        data: {
          organizationId: actor.organizationId,
          bookingId: booking.id,
          fromStatus: booking.status,
          toStatus: BookingStatus.CANCELLED,
          changedById: actor.userId,
          reason: input.reason,
        },
      });

      // 5. Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'booking.cancelled',
          entityType: 'Booking',
          entityId: booking.id,
          oldValue: { status: booking.status },
          newValue: { status: BookingStatus.CANCELLED, cancellationReason: input.reason },
          reason: input.reason,
        },
      });

      // 6. Transactional Outbox: Emits BookingCancelled
      // Async worker will transition Lead to CANCELLED and claw back CP commission (§16.2)
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.BookingCancelled,
          aggregateType: 'Booking',
          aggregateId: booking.id,
          correlationId: actor.correlationId,
          payload: {
            bookingId: booking.id,
            leadId: booking.leadId,
            unitId: booking.unitId,
            reason: input.reason,
          },
        },
      });

      return updatedBooking;
    });
  },
};
