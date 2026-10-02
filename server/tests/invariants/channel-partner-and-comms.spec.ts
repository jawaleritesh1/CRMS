import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChannelPartnerService } from '../../src/domain/channelPartner/channelPartner.service.js';
import { WhatsAppCloudAdapter } from '../../src/infrastructure/adapters/whatsAppAdapter.js';
import { ExotelTelephonyAdapter } from '../../src/infrastructure/adapters/exotelAdapter.js';
import { OutboxWorker } from '../../src/workers/outboxWorker.js';
import { InMemoryRateLimiter } from '../../src/security/middleware/rateLimiter.js';
import { prisma } from '../../src/core/database/prisma.js';
import { AttributionStatus, BookingStatus, CallAttemptStatus, LeadLifecycleStage } from '@prisma/client';
import crypto from 'crypto';

describe('Phase 10, 11 & 18: Channel Partner, Telephony, WhatsApp & Outbox Worker Invariants', () => {
  const actor = {
    userId: 'user_cp_manager',
    membershipId: 'mem_cp_manager',
    organizationId: 'org_acme',
    roles: ['MANAGER'],
    capabilities: ['ATTRIBUTION_MANAGE', 'COMMISSION_APPROVE'],
    effectiveScope: 'ORGANIZATION' as const,
    correlationId: 'corr_test_cp',
    isSuperAdmin: false,
  };

  describe('18.1 Non-Poaching Attribution Window Invariants', () => {
    it('INV-CP-001: Prevents a second Channel Partner from attributing a customer within the active window', async () => {
      const activeExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days left

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          channelPartner: {
            findFirst: vi.fn().mockResolvedValue({ id: 'cp_2', organizationId: 'org_acme', isActive: true }),
          },
          customer: {
            findFirst: vi.fn().mockResolvedValue({ id: 'cust_1', organizationId: 'org_acme' }),
          },
          leadAttribution: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'attr_1',
              organizationId: 'org_acme',
              customerId: 'cust_1',
              channelPartnerId: 'cp_1', // Partner 1 currently holds attribution
              status: AttributionStatus.ACTIVE,
              expiresAt: activeExpiresAt,
            }),
          },
        };
        return cb(txMock);
      });

      await expect(
        ChannelPartnerService.attributeCustomer(actor, {
          customerId: 'cust_1',
          channelPartnerId: 'cp_2', // Partner 2 tries to claim
        })
      ).rejects.toThrow('Customer is actively attributed to another partner within the non-poaching window');
    });

    it('INV-CP-002: Allows re-attribution if the previous attribution window has expired', async () => {
      const expiredAt = new Date(Date.now() - 1000); // Expired 1 second ago

      const updateMock = vi.fn().mockResolvedValue({});
      const createHistoryMock = vi.fn().mockResolvedValue({});
      const createAttrMock = vi.fn().mockResolvedValue({
        id: 'attr_new',
        organizationId: 'org_acme',
        customerId: 'cust_1',
        channelPartnerId: 'cp_2',
        status: AttributionStatus.ACTIVE,
      });
      const createOutboxMock = vi.fn().mockResolvedValue({});

      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          channelPartner: {
            findFirst: vi.fn().mockResolvedValue({ id: 'cp_2', organizationId: 'org_acme', isActive: true }),
          },
          customer: {
            findFirst: vi.fn().mockResolvedValue({ id: 'cust_1', organizationId: 'org_acme' }),
          },
          leadAttribution: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'attr_old',
              organizationId: 'org_acme',
              customerId: 'cust_1',
              channelPartnerId: 'cp_1',
              status: AttributionStatus.ACTIVE,
              expiresAt: expiredAt,
            }),
            update: updateMock,
            create: createAttrMock,
          },
          attributionHistory: {
            create: createHistoryMock,
          },
          outboxEvent: {
            create: createOutboxMock,
          },
        };
        return cb(txMock);
      });

      const res = await ChannelPartnerService.attributeCustomer(actor, {
        customerId: 'cust_1',
        channelPartnerId: 'cp_2',
      });

      expect(res.id).toBe('attr_new');
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'attr_old' },
          data: expect.objectContaining({ status: AttributionStatus.EXPIRED }),
        })
      );
      expect(createAttrMock).toHaveBeenCalled();
    });
  });

  describe('18.2 Versioned Commission Calculation Invariants', () => {
    it('INV-CP-003: Computes commission combining base rate, tier modifiers, and volume accelerators', async () => {
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          booking: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'book_1',
              organizationId: 'org_acme',
              totalAgreementValue: '10000000.00', // 1 Crore
              createdAt: new Date('2026-06-01'),
            }),
            count: vi.fn().mockResolvedValue(4), // 4 deals closed >= 3 deals threshold
          },
          channelPartner: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'cp_gold',
              organizationId: 'org_acme',
              tier: 'GOLD',
              isActive: true,
            }),
          },
          commissionRule: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'rule_v2',
              version: 2,
              baseRatePercent: '2.00', // 2%
              tierModifiers: { SILVER: 0, GOLD: 0.25, PLATINUM: 0.5 }, // +0.25%
              acceleratorRules: [{ minDeals: 3, bonusPercent: 0.5 }], // +0.5%
            }),
          },
          commissionPayout: {
            upsert: vi.fn().mockImplementation((args) => ({
              id: 'payout_1',
              ...args.create,
            })),
          },
          outboxEvent: {
            create: vi.fn().mockResolvedValue({}),
          },
        };
        return cb(txMock);
      });

      // Total expected rate = 2.0% + 0.25% (GOLD) + 0.5% (>=3 deals) = 2.75%
      // On 10,000,000 = 275,000.00
      const payout = await ChannelPartnerService.computeCommission(actor, {
        bookingId: 'book_1',
        channelPartnerId: 'cp_gold',
      });

      expect(Number(payout.amount)).toBe(275000);
      expect(payout.amount.toFixed(2)).toBe('275000.00');
    });
  });

  describe('19 Communication Adapters Invariants', () => {
    it('INV-COM-001: WhatsAppCloudAdapter correctly verifies HMAC SHA-256 signature and formats payload', () => {
      const appSecret = 'super_secret_meta_key';
      const rawPayload = JSON.stringify({ entry: [{ changes: [] }] });
      const signature = crypto.createHmac('sha256', appSecret).update(rawPayload).digest('hex');

      const isValid = WhatsAppCloudAdapter.verifyWebhookSignature(
        rawPayload,
        `sha256=${signature}`,
        appSecret
      );
      expect(isValid).toBe(true);

      const isInvalid = WhatsAppCloudAdapter.verifyWebhookSignature(
        rawPayload,
        `sha256=wrong_hash`,
        appSecret
      );
      expect(isInvalid).toBe(false);

      const templatePayload = WhatsAppCloudAdapter.buildTemplatePayload({
        recipientPhone: '+919876543210',
        templateName: 'welcome_lead',
        languageCode: 'en_US',
        parameters: ['Ritesh'],
      });

      expect(templatePayload.to).toBe('919876543210');
      expect(templatePayload.template.name).toBe('welcome_lead');
      expect(templatePayload.template.components[0].parameters[0].text).toBe('Ritesh');
    });

    it('INV-COM-002: ExotelTelephonyAdapter normalizes duplex call payload and maps provider call status', () => {
      const connectPayload = ExotelTelephonyAdapter.buildConnectRequest({
        fromAgentPhone: '9876543210',
        toCustomerPhone: '+919123456789',
        callerId: '02245678901',
        customField: 'lead_123',
      });

      expect(connectPayload.From).toBe('919876543210');
      expect(connectPayload.To).toBe('919123456789');
      expect(connectPayload.CustomField).toBe('lead_123');

      expect(ExotelTelephonyAdapter.mapCallStatus('in-progress')).toBe(CallAttemptStatus.CONNECTED);
      expect(ExotelTelephonyAdapter.mapCallStatus('completed')).toBe(CallAttemptStatus.COMPLETED);
      expect(ExotelTelephonyAdapter.mapCallStatus('busy')).toBe(CallAttemptStatus.BUSY);
      expect(ExotelTelephonyAdapter.mapCallStatus('no-answer')).toBe(CallAttemptStatus.NO_ANSWER);
    });
  });

  describe('23 Outbox Worker Invariant: BookingCancelled to Lead Cascade (INV-LIF-003)', () => {
    it('INV-OUT-001: Outbox worker cascades Lead lifecycle stage from WON to CANCELLED upon BookingCancelled event', async () => {
      const worker = new OutboxWorker({ batchSize: 10 });

      const updateLeadMock = vi.fn().mockResolvedValue({});
      const createStageHistoryMock = vi.fn().mockResolvedValue({});
      const updateOutboxMock = vi.fn().mockResolvedValue({});

      // Mock $queryRaw to claim the pending BookingCancelled event
      vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
        const txMock = {
          $queryRaw: vi.fn().mockResolvedValue([
            {
              id: 'outbox_evt_1',
              organizationId: 'org_acme',
              eventType: 'BookingCancelled',
              aggregateType: 'Booking',
              aggregateId: 'book_cancelled_1',
              payload: { leadId: 'lead_won_1', bookingId: 'book_cancelled_1' },
              attemptCount: 0,
              correlationId: 'corr_test',
              causationId: null,
            },
          ]),
          lead: {
            findFirst: vi.fn().mockResolvedValue({
              id: 'lead_won_1',
              organizationId: 'org_acme',
              lifecycleStage: LeadLifecycleStage.WON,
            }),
            update: updateLeadMock,
          },
          leadStageHistory: {
            create: createStageHistoryMock,
          },
        };
        return cb(txMock);
      });

      vi.spyOn(prisma.outboxEvent, 'update').mockImplementation(updateOutboxMock);

      const processed = await worker.processBatch();

      expect(processed).toBe(1);
      expect(updateLeadMock).toHaveBeenCalledWith({
        where: { id: 'lead_won_1' },
        data: { lifecycleStage: LeadLifecycleStage.CANCELLED },
      });
      expect(createStageHistoryMock).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fromStage: LeadLifecycleStage.WON,
            toStage: LeadLifecycleStage.CANCELLED,
          }),
        })
      );
      expect(updateOutboxMock).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'outbox_evt_1' },
          data: expect.objectContaining({ status: 'PUBLISHED' }),
        })
      );
    });
  });

  describe('15 Rate Limiter Invariants', () => {
    it('INV-SEC-004: Token bucket rate limiter allows requests within threshold and blocks with retryAfter when exceeded', () => {
      const limiter = new InMemoryRateLimiter();
      const key = 'test_ip_auth';
      const maxRequests = 3;
      const windowMs = 60000;

      // 3 requests allowed
      expect(limiter.isAllowed(key, maxRequests, windowMs).allowed).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs).allowed).toBe(true);
      expect(limiter.isAllowed(key, maxRequests, windowMs).allowed).toBe(true);

      // 4th request blocked
      const blocked = limiter.isAllowed(key, maxRequests, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

      // Reset allows again
      limiter.reset(key);
      expect(limiter.isAllowed(key, maxRequests, windowMs).allowed).toBe(true);
    });
  });
});
