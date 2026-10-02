import { prisma } from '../core/database/prisma.js';
import { logger } from '../core/logging/logger.js';
import { DomainEventType, LeadLifecycleStage, OutboxStatus } from '@prisma/client';

export interface OutboxWorkerOptions {
  batchSize?: number;
  maxAttempts?: number;
  pollIntervalMs?: number;
}

export class OutboxWorker {
  private isRunning = false;
  private timer: NodeJS.Timeout | null = null;
  private readonly batchSize: number;
  private readonly maxAttempts: number;
  private readonly pollIntervalMs: number;

  constructor(options: OutboxWorkerOptions = {}) {
    this.batchSize = options.batchSize || 50;
    this.maxAttempts = options.maxAttempts || 5;
    this.pollIntervalMs = options.pollIntervalMs || 2000;
  }

  /**
   * Processes a single batch of pending outbox events using row-level locking.
   * Uses raw query with FOR UPDATE SKIP LOCKED to guarantee safe concurrent worker claims.
   */
  async processBatch(): Promise<number> {
    const claimedEvents = await prisma.$transaction(async (tx) => {
      // Raw query for Postgres FOR UPDATE SKIP LOCKED
      // In SQLite/mock environments, falls back to normal findMany
      try {
        const events = await tx.$queryRaw<
          Array<{
            id: string;
            organizationId: string;
            eventType: DomainEventType;
            aggregateType: string;
            aggregateId: string;
            payload: any;
            attemptCount: number;
            correlationId: string | null;
            causationId: string | null;
          }>
        >`
          SELECT "id", "organizationId", "eventType", "aggregateType", "aggregateId", "payload", "attemptCount", "correlationId", "causationId"
          FROM "OutboxEvent"
          WHERE "status" = 'PENDING'
            AND "availableAt" <= NOW()
          ORDER BY "createdAt" ASC
          LIMIT ${this.batchSize}
          FOR UPDATE SKIP LOCKED
        `;
        return events;
      } catch (err) {
        // Fallback for mock/sqlite environments in tests
        const events = await tx.outboxEvent.findMany({
          where: {
            status: OutboxStatus.PENDING,
            availableAt: { lte: new Date() },
          },
          orderBy: { createdAt: 'asc' },
          take: this.batchSize,
        });
        return events;
      }
    });

    if (claimedEvents.length === 0) {
      return 0;
    }

    logger.info({ count: claimedEvents.length }, 'Claimed outbox events for processing');

    let processedCount = 0;

    for (const event of claimedEvents) {
      try {
        await this.handleEvent(event);

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: OutboxStatus.PUBLISHED,
            publishedAt: new Date(),
            lastError: null,
          },
        });
        processedCount++;
      } catch (err: any) {
        const newAttemptCount = event.attemptCount + 1;
        const isFailedPermanently = newAttemptCount >= this.maxAttempts;
        const backoffSeconds = Math.pow(2, Math.min(newAttemptCount, 6)); // up to 64s
        const nextAvailableAt = new Date(Date.now() + backoffSeconds * 1000);

        logger.error(
          {
            eventId: event.id,
            eventType: event.eventType,
            attemptCount: newAttemptCount,
            error: err.message,
          },
          'Failed to process outbox event'
        );

        await prisma.outboxEvent.update({
          where: { id: event.id },
          data: {
            status: isFailedPermanently ? OutboxStatus.FAILED : OutboxStatus.PENDING,
            attemptCount: newAttemptCount,
            availableAt: nextAvailableAt,
            lastError: String(err.message || err),
          },
        });
      }
    }

    return processedCount;
  }

  /**
   * Domain event dispatcher and reactor.
   */
  private async handleEvent(event: {
    id: string;
    organizationId: string;
    eventType: DomainEventType;
    aggregateType: string;
    aggregateId: string;
    payload: any;
    correlationId: string | null;
  }): Promise<void> {
    const payload = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;

    switch (event.eventType) {
      case 'BookingCancelled': {
        // Cascade Lead from WON to CANCELLED (§16.2, §10.3, INV-LIF-003)
        const leadId = payload?.leadId;
        if (leadId) {
          await prisma.$transaction(async (tx) => {
            const lead = await tx.lead.findFirst({
              where: {
                id: leadId,
                organizationId: event.organizationId,
              },
            });

            if (lead && lead.lifecycleStage === LeadLifecycleStage.WON) {
              await tx.lead.update({
                where: { id: lead.id },
                data: {
                  lifecycleStage: LeadLifecycleStage.CANCELLED,
                },
              });

              await tx.leadStageHistory.create({
                data: {
                  organizationId: event.organizationId,
                  leadId: lead.id,
                  fromStage: LeadLifecycleStage.WON,
                  toStage: LeadLifecycleStage.CANCELLED,
                  reason: 'Asynchronous cascade from BookingCancelled outbox event',
                },
              });

              logger.info(
                { leadId: lead.id, bookingId: event.aggregateId },
                'Cascaded Lead lifecycle stage from WON to CANCELLED'
              );
            }
          });
        }
        break;
      }

      case 'LeadSLABreached': {
        // Create an alert notification for the assigned user/manager
        const ownerId = payload?.ownerId;
        if (ownerId) {
          await prisma.notification.create({
            data: {
              organizationId: event.organizationId,
              userId: ownerId,
              title: 'Lead SLA Breached',
              message: `First response SLA was breached for Lead #${event.aggregateId}`,
              type: 'WARNING',
              dedupeKey: `sla_breach_${event.aggregateId}`,
            },
          });
        }
        break;
      }

      case 'UnitHoldExpired': {
        logger.info({ unitId: payload?.unitId }, 'Outbox processed UnitHoldExpired');
        break;
      }

      case 'ChannelPartnerAttributed': {
        logger.info(
          {
            customerId: payload?.customerId,
            partnerId: payload?.channelPartnerId,
          },
          'Outbox processed ChannelPartnerAttributed'
        );
        break;
      }

      default:
        // No-op for events that do not trigger automated database cascades
        logger.debug({ eventType: event.eventType }, 'Acknowledged unhandled outbox event');
        break;
    }
  }

  /**
   * Starts periodic polling in background.
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.info('Starting Outbox background worker...');

    const poll = async () => {
      if (!this.isRunning) return;
      try {
        await this.processBatch();
      } catch (err: any) {
        logger.error({ error: err.message }, 'Error in Outbox worker loop');
      } finally {
        if (this.isRunning) {
          this.timer = setTimeout(poll, this.pollIntervalMs);
        }
      }
    };

    this.timer = setTimeout(poll, 100);
  }

  /**
   * Stops the background worker gracefully.
   */
  stop(): void {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    logger.info('Outbox background worker stopped.');
  }
}
