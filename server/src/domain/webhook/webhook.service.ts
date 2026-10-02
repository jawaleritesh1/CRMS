import { WebhookProvider, WebhookStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { logger } from '../../core/logging/logger.js';

export interface IngestWebhookInput {
  provider: WebhookProvider;
  providerEventId: string;
  eventType: string;
  payload: Record<string, any>;
  correlationId?: string;
  organizationId?: string;
}

export const webhookService = {
  /**
   * Ingests external webhook idempotently based on (provider, providerEventId) (§21.1, §39).
   * Guarantees Invariant INV-WHK-001: duplicate delivery is acknowledged with no duplicate effect.
   */
  async ingestWebhook(input: IngestWebhookInput, client = defaultPrisma) {
    // 1. Check if identical webhook was already received
    const existing = await client.webhookEvent.findUnique({
      where: {
        provider_providerEventId: {
          provider: input.provider,
          providerEventId: input.providerEventId,
        },
      },
    });

    if (existing) {
      logger.info({
        msg: 'Duplicate webhook delivery detected. Acknowledging idempotently.',
        provider: input.provider,
        providerEventId: input.providerEventId,
        status: existing.status,
      });

      return {
        event: existing,
        isDuplicate: true,
      };
    }

    // 2. Insert new WebhookEvent record
    const event = await client.webhookEvent.create({
      data: {
        organizationId: input.organizationId ?? null,
        provider: input.provider,
        providerEventId: input.providerEventId,
        eventType: input.eventType,
        status: WebhookStatus.RECEIVED,
        payloadReference: JSON.stringify(input.payload), // in dev/test, payload stored inline
        correlationId: input.correlationId,
      },
    });

    logger.info({
      msg: 'New webhook event ingested successfully',
      provider: input.provider,
      providerEventId: input.providerEventId,
      webhookEventId: event.id,
    });

    return {
      event,
      isDuplicate: false,
    };
  },
};
