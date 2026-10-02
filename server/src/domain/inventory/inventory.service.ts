import {
  UnitAvailability,
  HoldStatus,
  DomainEventType,
  ChangeSource,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { ResourceNotFoundError, ConflictError } from '../../core/errors/appError.js';

export interface HoldUnitInput {
  unitId: string;
  leadId?: string;
  holdDurationHours?: number;
  reason?: string;
}

export interface ReleaseUnitInput {
  unitId: string;
  reason?: string;
}

export const inventoryService = {
  /**
   * Places an exclusive hold on a PropertyUnit, backed by row locking and active hold partial unique index (§14.3, §35.1).
   */
  async holdUnit(actor: ActorContext, input: HoldUnitInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Pessimistic row locking on contended physical resource (§36.2)
      const units = await tx.$queryRaw<Array<{ id: string; organizationId: string; availability: UnitAvailability; version: number }>>`
        SELECT "id", "organizationId", "availability", "version"
        FROM "PropertyUnit"
        WHERE "id" = ${input.unitId} AND "organizationId" = ${actor.organizationId}
        FOR UPDATE;
      `;

      const unit = units[0];
      if (!unit) {
        throw new ResourceNotFoundError('Property unit not found', 'unitId');
      }

      // 2. Precondition assertion: unit must be AVAILABLE
      if (unit.availability !== UnitAvailability.AVAILABLE) {
        throw new ConflictError(
          `Unit is not available for hold. Current availability: ${unit.availability}`,
          'unitId'
        );
      }

      const holdDuration = input.holdDurationHours ?? 24;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + holdDuration * 60 * 60 * 1000);

      // 3. Update PropertyUnit availability to ON_HOLD
      await tx.propertyUnit.update({
        where: { id: unit.id },
        data: {
          availability: UnitAvailability.ON_HOLD,
          version: { increment: 1 },
        },
      });

      // 4. Insert InventoryHold (protected by raw SQL partial unique index inventory_hold_one_active_per_unit)
      const hold = await tx.inventoryHold.create({
        data: {
          organizationId: actor.organizationId,
          unitId: unit.id,
          leadId: input.leadId ?? null,
          heldByUserId: actor.userId,
          status: HoldStatus.ACTIVE,
          heldAt: now,
          expiresAt,
          reason: input.reason ?? 'Sales hold',
        },
      });

      // 5. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'inventory.unit_held',
          entityType: 'PropertyUnit',
          entityId: unit.id,
          oldValue: { availability: UnitAvailability.AVAILABLE },
          newValue: { availability: UnitAvailability.ON_HOLD, holdId: hold.id, expiresAt },
          source: ChangeSource.MANUAL,
        },
      });

      // 6. Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.UnitHeld,
          aggregateType: 'PropertyUnit',
          aggregateId: unit.id,
          correlationId: actor.correlationId,
          payload: {
            unitId: unit.id,
            holdId: hold.id,
            heldByUserId: actor.userId,
            expiresAt,
          },
        },
      });

      return { unitId: unit.id, holdId: hold.id, expiresAt, status: UnitAvailability.ON_HOLD };
    });
  },

  /**
   * Releases an active hold and resets unit availability to AVAILABLE (§14.5, §35.1).
   */
  async releaseUnit(actor: ActorContext, input: ReleaseUnitInput) {
    return defaultPrisma.$transaction(async (tx) => {
      // 1. Lock PropertyUnit FOR UPDATE
      const units = await tx.$queryRaw<Array<{ id: string; organizationId: string; availability: UnitAvailability }>>`
        SELECT "id", "organizationId", "availability"
        FROM "PropertyUnit"
        WHERE "id" = ${input.unitId} AND "organizationId" = ${actor.organizationId}
        FOR UPDATE;
      `;

      const unit = units[0];
      if (!unit) {
        throw new ResourceNotFoundError('Property unit not found', 'unitId');
      }

      // 2. Find active hold
      const activeHold = await tx.inventoryHold.findFirst({
        where: {
          unitId: unit.id,
          status: HoldStatus.ACTIVE,
        },
      });

      if (!activeHold) {
        throw new ConflictError('No active hold found for this property unit', 'unitId');
      }

      const now = new Date();

      // 3. Mark hold RELEASED
      await tx.inventoryHold.update({
        where: { id: activeHold.id },
        data: {
          status: HoldStatus.RELEASED,
          releasedAt: now,
        },
      });

      // 4. Reset unit availability to AVAILABLE
      await tx.propertyUnit.update({
        where: { id: unit.id },
        data: {
          availability: UnitAvailability.AVAILABLE,
          version: { increment: 1 },
        },
      });

      // 5. Security Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'inventory.unit_released',
          entityType: 'PropertyUnit',
          entityId: unit.id,
          oldValue: { availability: unit.availability, holdId: activeHold.id },
          newValue: { availability: UnitAvailability.AVAILABLE },
          reason: input.reason,
          source: ChangeSource.MANUAL,
        },
      });

      // 6. Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.UnitHoldReleased,
          aggregateType: 'PropertyUnit',
          aggregateId: unit.id,
          correlationId: actor.correlationId,
          payload: {
            unitId: unit.id,
            holdId: activeHold.id,
            releasedAt: now,
          },
        },
      });

      return { unitId: unit.id, status: UnitAvailability.AVAILABLE };
    });
  },

  /**
   * Sweeps and expires stale active holds where expiresAt <= NOW() (§14.6).
   */
  async expireStaleHolds(actor: ActorContext, client = defaultPrisma) {
    const now = new Date();

    const expiredHolds = await client.inventoryHold.findMany({
      where: {
        organizationId: actor.organizationId,
        status: HoldStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      select: { id: true, unitId: true },
      take: 50,
    });

    const results = [];
    for (const hold of expiredHolds) {
      await client.$transaction(async (tx) => {
        // Mark hold EXPIRED
        await tx.inventoryHold.update({
          where: { id: hold.id },
          data: { status: HoldStatus.EXPIRED, releasedAt: now },
        });

        // Reset unit availability
        await tx.propertyUnit.update({
          where: { id: hold.unitId },
          data: { availability: UnitAvailability.AVAILABLE, version: { increment: 1 } },
        });

        // Outbox event
        await tx.outboxEvent.create({
          data: {
            organizationId: actor.organizationId,
            eventType: DomainEventType.UnitHoldExpired,
            aggregateType: 'PropertyUnit',
            aggregateId: hold.unitId,
            correlationId: actor.correlationId,
            payload: { unitId: hold.unitId, holdId: hold.id, expiredAt: now },
          },
        });
      });
      results.push(hold.unitId);
    }

    return results;
  },
};
