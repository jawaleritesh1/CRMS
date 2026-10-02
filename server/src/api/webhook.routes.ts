import { Router, Request, Response, NextFunction } from 'express';
import { WebhookProvider } from '@prisma/client';
import { webhookService } from '../domain/webhook/webhook.service.js';
import { asyncContext } from '../core/context/asyncContext.js';

export const webhookRouter = Router();

// GET /api/webhooks/meta - Meta Webhook Subscription Verification Handshake (§21.2)
webhookRouter.get('/meta', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_VERIFY_TOKEN || 'ralix_meta_verify_token_2026';

  if (mode === 'subscribe' && token === expectedToken) {
    return res.status(200).send(challenge);
  }
  return res.status(403).send('Forbidden: Invalid Meta verification token');
});

// POST /api/webhooks/meta - Meta Lead Ads Ingestion (§21.1, §21.4)
webhookRouter.post('/meta', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const leadgenId =
      payload?.entry?.[0]?.changes?.[0]?.value?.leadgen_id ||
      payload?.providerEventId ||
      `meta_evt_${Date.now()}`;

    // 1. Ingest Webhook event idempotently (§21.1)
    const result = await webhookService.ingestWebhook({
      provider: WebhookProvider.META_LEAD_ADS,
      providerEventId: String(leadgenId),
      eventType: 'leadgen',
      payload,
      correlationId: asyncContext.getCorrelationId(),
    });

    // 2. If new event, fetch lead field details from Meta Graph API (§21.4)
    let leadData = null;
    if (!result.isDuplicate) {
      const { metaAdapter } = await import('../infrastructure/adapters/metaAdapter.js');
      const leadDetails = await metaAdapter.fetchLeadDetailsFromMeta(String(leadgenId));
      leadData = { leadgenId, customer: leadDetails };
    }

    // Immediate 200 OK receipt acknowledgement (< 1500ms §21.2)
    res.status(200).json({
      success: true,
      acknowledged: true,
      isDuplicate: result.isDuplicate,
      eventId: result.event.id,
      data: leadData,
    });
  } catch (err) {
    next(err);
  }
});


// POST /api/webhooks/payment - Payment Gateway Settlement Ingestion (§21.1)
webhookRouter.post('/payment', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const providerEventId = payload?.id || payload?.providerTransactionRef || `pay_evt_${Date.now()}`;

    const result = await webhookService.ingestWebhook({
      provider: WebhookProvider.PAYMENT_GATEWAY,
      providerEventId,
      eventType: 'payment.settled',
      payload,
      correlationId: asyncContext.getCorrelationId(),
    });

    res.status(200).json({
      success: true,
      acknowledged: true,
      isDuplicate: result.isDuplicate,
      eventId: result.event.id,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/webhooks/knowlarity - Knowlarity SuperReceptionist Call Detail Record (CDR) (§19.1, §21.1)
webhookRouter.post('/knowlarity', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const providerEventId =
      payload?.call_id ||
      payload?.callid ||
      payload?.uuid ||
      payload?.id ||
      `knowlarity_cdr_${Date.now()}`;

    // 1. Ingest Webhook event idempotently
    const result = await webhookService.ingestWebhook({
      provider: WebhookProvider.KNOWLARITY,
      providerEventId: String(providerEventId),
      eventType: 'call.cdr',
      payload,
      correlationId: asyncContext.getCorrelationId(),
    });

    // 2. Process CDR asynchronously/immediately to update CallAttempt & CallRecord
    let updatedData = null;
    if (!result.isDuplicate) {
      const { telephonyService } = await import('../domain/telephony/telephony.service.js');
      updatedData = await telephonyService.handleCdrWebhook(payload);
    }

    res.status(200).json({
      success: true,
      acknowledged: true,
      isDuplicate: result.isDuplicate,
      eventId: result.event.id,
      data: updatedData,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/webhooks/telephony - Provider-neutral Telephony CDR Webhook Ingestion (§19.1)
webhookRouter.post('/telephony', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const providerEventId =
      payload?.providerCallId ||
      payload?.call_id ||
      payload?.id ||
      `telephony_cdr_${Date.now()}`;

    // 1. Ingest Webhook event idempotently
    const result = await webhookService.ingestWebhook({
      provider: WebhookProvider.KNOWLARITY,
      providerEventId: String(providerEventId),
      eventType: 'call.cdr',
      payload,
      correlationId: asyncContext.getCorrelationId(),
    });

    // 2. Process CDR
    let updatedData = null;
    if (!result.isDuplicate) {
      const { telephonyService } = await import('../domain/telephony/telephony.service.js');
      updatedData = await telephonyService.handleCdrWebhook(payload);
    }

    res.status(200).json({
      success: true,
      acknowledged: true,
      isDuplicate: result.isDuplicate,
      eventId: result.event.id,
      data: updatedData,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/webhooks/mock - Development/Testing Mock Webhook Ingestion (§19.1)
webhookRouter.post('/mock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload = req.body;
    const { MockTelephonyProvider } = await import('../infrastructure/telephony/mockTelephonyProvider.js');
    const mockProvider = MockTelephonyProvider.getInstance();
    const cdr = mockProvider.normalizeCdr(payload);

    const { telephonyService } = await import('../domain/telephony/telephony.service.js');
    const result = await telephonyService.processCdrEvent(cdr);

    res.status(200).json({
      success: true,
      acknowledged: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});
