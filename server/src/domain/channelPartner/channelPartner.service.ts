import { prisma } from '../../core/database/prisma.js';
import {
  ValidationError,
  ConflictError,
  ResourceNotFoundError,
} from '../../core/errors/appError.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { normalizer } from '../../lib/normalize.js';
import { AttributionStatus, BookingStatus, PayoutStatus, Prisma } from '@prisma/client';

export interface CreateChannelPartnerInput {
  firmName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  reraNumber?: string;
  tier?: 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface AttributeCustomerInput {
  customerId: string;
  leadId?: string;
  channelPartnerId: string;
  source?: string;
  windowDays?: number; // default 60
}

export interface ComputeCommissionInput {
  bookingId: string;
  channelPartnerId: string;
  commissionRuleVersion?: number;
}

export class ChannelPartnerService {
  /**
   * Registers a new Channel Partner within the organization.
   */
  static async createChannelPartner(
    actor: ActorContext,
    input: CreateChannelPartnerInput
  ) {
    if (!actor.organizationId) {
      throw new ValidationError('Tenant organization context required');
    }

    const normalizedPhone = normalizer.normalizePhone(input.phone);

    const existing = await prisma.channelPartner.findUnique({
      where: {
        organizationId_normalizedPhone: {
          organizationId: actor.organizationId,
          normalizedPhone,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Channel partner with this phone number already exists');
    }

    return await prisma.channelPartner.create({
      data: {
        organizationId: actor.organizationId,
        firmName: input.firmName.trim(),
        contactPerson: input.contactPerson.trim(),
        phone: input.phone.trim(),
        normalizedPhone,
        email: input.email?.trim().toLowerCase() || null,
        reraNumber: input.reraNumber?.trim() || null,
        tier: input.tier || 'SILVER',
        isActive: true,
      },
    });
  }

  /**
   * Attributes a customer to a Channel Partner enforcing the non-poaching window (§18.1).
   */
  static async attributeCustomer(
    actor: ActorContext,
    input: AttributeCustomerInput
  ) {
    if (!actor.organizationId) {
      throw new ValidationError('Tenant organization context required');
    }

    const windowDays = input.windowDays || 60;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
      // 1. Verify channel partner exists and is active
      const cp = await tx.channelPartner.findFirst({
        where: {
          id: input.channelPartnerId,
          organizationId: actor.organizationId!,
          isActive: true,
        },
      });

      if (!cp) {
        throw new ResourceNotFoundError('Active channel partner not found');
      }

      // 2. Verify customer belongs to tenant
      const customer = await tx.customer.findFirst({
        where: {
          id: input.customerId,
          organizationId: actor.organizationId!,
        },
      });

      if (!customer) {
        throw new ResourceNotFoundError('Customer not found in organization');
      }

      // 3. Check for existing active attribution
      const activeAttribution = await tx.leadAttribution.findFirst({
        where: {
          organizationId: actor.organizationId!,
          customerId: input.customerId,
          status: AttributionStatus.ACTIVE,
        },
      });

      if (activeAttribution) {
        // If expired by clock, expire it
        if (activeAttribution.expiresAt <= now) {
          await tx.leadAttribution.update({
            where: { id: activeAttribution.id },
            data: {
              status: AttributionStatus.EXPIRED,
              endedAt: now,
            },
          });

          await tx.attributionHistory.create({
            data: {
              organizationId: actor.organizationId!,
              attributionId: activeAttribution.id,
              fromStatus: AttributionStatus.ACTIVE,
              toStatus: AttributionStatus.EXPIRED,
              actorId: actor.userId,
              reason: 'Attribution window elapsed',
            },
          });
        } else {
          // Still active within non-poaching window
          if (activeAttribution.channelPartnerId === input.channelPartnerId) {
            // Already attributed to this partner
            return activeAttribution;
          }
          throw new ConflictError(
            'Customer is actively attributed to another partner within the non-poaching window'
          );
        }
      }

      // 4. Create new active attribution
      const attribution = await tx.leadAttribution.create({
        data: {
          organizationId: actor.organizationId!,
          customerId: input.customerId,
          leadId: input.leadId || null,
          channelPartnerId: input.channelPartnerId,
          status: AttributionStatus.ACTIVE,
          source: input.source || 'CP_REGISTRATION',
          attributedAt: now,
          expiresAt,
        },
      });

      // 5. Append history
      await tx.attributionHistory.create({
        data: {
          organizationId: actor.organizationId!,
          attributionId: attribution.id,
          toStatus: AttributionStatus.ACTIVE,
          toPartnerId: input.channelPartnerId,
          actorId: actor.userId,
          reason: `Initial attribution (${windowDays}-day window)`,
        },
      });

      // 6. Transactional outbox event
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId!,
          eventType: 'ChannelPartnerAttributed',
          aggregateType: 'LeadAttribution',
          aggregateId: attribution.id,
          payload: {
            customerId: input.customerId,
            channelPartnerId: input.channelPartnerId,
            leadId: input.leadId,
            expiresAt: expiresAt.toISOString(),
          },
          correlationId: actor.correlationId,
        },
      });

      return attribution;
    });
  }

  /**
   * Sweeps and expires all out-of-window attributions.
   */
  static async sweepExpiredAttributions() {
    const now = new Date();

    const expiredAttributions = await prisma.leadAttribution.findMany({
      where: {
        status: AttributionStatus.ACTIVE,
        expiresAt: { lte: now },
      },
      take: 100,
    });

    let expiredCount = 0;

    for (const attr of expiredAttributions) {
      await prisma.$transaction(async (tx) => {
        await tx.leadAttribution.update({
          where: { id: attr.id },
          data: {
            status: AttributionStatus.EXPIRED,
            endedAt: now,
          },
        });

        await tx.attributionHistory.create({
          data: {
            organizationId: attr.organizationId,
            attributionId: attr.id,
            fromStatus: AttributionStatus.ACTIVE,
            toStatus: AttributionStatus.EXPIRED,
            reason: 'Automated window expiration sweeper',
          },
        });

        await tx.outboxEvent.create({
          data: {
            organizationId: attr.organizationId,
            eventType: 'AttributionExpired',
            aggregateType: 'LeadAttribution',
            aggregateId: attr.id,
            payload: {
              customerId: attr.customerId,
              channelPartnerId: attr.channelPartnerId,
            },
          },
        });
      });

      expiredCount++;
    }

    return { expiredCount };
  }

  /**
   * Computes commission payout for a confirmed booking using versioned CommissionRule (§18.2).
   */
  static async computeCommission(
    actor: ActorContext,
    input: ComputeCommissionInput
  ) {
    if (!actor.organizationId) {
      throw new ValidationError('Tenant organization context required');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Fetch booking with cost sheet snapshot
      const booking = await tx.booking.findFirst({
        where: {
          id: input.bookingId,
          organizationId: actor.organizationId!,
        },
      });

      if (!booking) {
        throw new ResourceNotFoundError('Booking not found');
      }

      // 2. Fetch channel partner
      const cp = await tx.channelPartner.findFirst({
        where: {
          id: input.channelPartnerId,
          organizationId: actor.organizationId!,
          isActive: true,
        },
      });

      if (!cp) {
        throw new ResourceNotFoundError('Active channel partner not found');
      }

      // 3. Resolve commission rule (effective active rule or requested version)
      let rule = null;
      if (input.commissionRuleVersion) {
        rule = await tx.commissionRule.findUnique({
          where: {
            organizationId_version: {
              organizationId: actor.organizationId!,
              version: input.commissionRuleVersion,
            },
          },
        });
      } else {
        rule = await tx.commissionRule.findFirst({
          where: {
            organizationId: actor.organizationId!,
            effectiveFrom: { lte: booking.createdAt },
            OR: [
              { effectiveTo: null },
              { effectiveTo: { gte: booking.createdAt } },
            ],
          },
          orderBy: { version: 'desc' },
        });
      }

      if (!rule) {
        throw new ValidationError('No effective commission rule found for this booking date');
      }

      // 4. Calculate total base amount from booking totalAgreementValue
      const baseValue = Number(booking.totalAgreementValue);
      let effectiveRate = Number(rule.baseRatePercent);

      // Apply tier modifier
      const tierMods = rule.tierModifiers as Record<string, number> | null;
      if (tierMods && typeof tierMods[cp.tier] === 'number') {
        effectiveRate += tierMods[cp.tier]!;
      }

      // Count previous closed bookings for accelerator
      const previousBookingsCount = await tx.booking.count({
        where: {
          organizationId: actor.organizationId!,
          status: BookingStatus.CONFIRMED,
          commissionPayouts: {
            some: {
              channelPartnerId: cp.id,
            },
          },
        },
      });

      const accelerators = rule.acceleratorRules as Array<{ minDeals: number; bonusPercent: number }> | null;
      if (Array.isArray(accelerators)) {
        for (const acc of accelerators) {
          if (previousBookingsCount >= acc.minDeals) {
            effectiveRate += acc.bonusPercent;
          }
        }
      }

      const payoutAmount = (baseValue * effectiveRate) / 100;

      // 5. Create or find CommissionPayout
      const payout = await tx.commissionPayout.upsert({
        where: {
          organizationId_bookingId_channelPartnerId: {
            organizationId: actor.organizationId!,
            bookingId: booking.id,
            channelPartnerId: cp.id,
          },
        },
        create: {
          organizationId: actor.organizationId!,
          channelPartnerId: cp.id,
          bookingId: booking.id,
          commissionRuleId: rule.id,
          amount: new Prisma.Decimal(payoutAmount.toFixed(2)),
          status: PayoutStatus.PENDING,
        },
        update: {
          amount: new Prisma.Decimal(payoutAmount.toFixed(2)),
          commissionRuleId: rule.id,
        },
      });

      // 6. Outbox event
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId!,
          eventType: 'CommissionGenerated',
          aggregateType: 'CommissionPayout',
          aggregateId: payout.id,
          payload: {
            bookingId: booking.id,
            channelPartnerId: cp.id,
            amount: payout.amount.toString(),
            effectiveRate,
          },
          correlationId: actor.correlationId,
        },
      });

      return payout;
    });
  }

  /**
   * Approves a pending commission payout (requires COMMISSION_APPROVE capability).
   */
  static async approveCommission(
    actor: ActorContext,
    payoutId: string
  ) {
    if (!actor.organizationId) {
      throw new ValidationError('Tenant organization context required');
    }

    return await prisma.commissionPayout.update({
      where: {
        id: payoutId,
        organizationId: actor.organizationId,
        status: PayoutStatus.PENDING,
      },
      data: {
        status: PayoutStatus.APPROVED,
        approvedById: actor.userId,
        approvedAt: new Date(),
      },
    });
  }
}
