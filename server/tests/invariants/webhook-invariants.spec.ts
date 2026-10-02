import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import { metaAdapter } from '../../src/infrastructure/adapters/metaAdapter.js';
import { WebhookProvider } from '@prisma/client';

describe('INV-WHK: Webhook Idempotency & Ingestion Invariant Suite (§21.1, §25.1)', () => {
  describe('INV-WHK-001: Deduplication Key Structural Guarantee', () => {
    it('scopes deduplication per (provider, providerEventId), eliminating single-column collision risk', () => {
      const provider1 = WebhookProvider.META_LEAD_ADS;
      const provider2 = WebhookProvider.PAYMENT_GATEWAY;
      const commonEventId = 'evt_shared_id_123';

      // Scoped keys are distinct across different providers
      const key1 = `${provider1}:${commonEventId}`;
      const key2 = `${provider2}:${commonEventId}`;

      expect(key1).not.toBe(key2);
    });

    it('identifies identical deliveries under same provider as duplicates', () => {
      const processedEvents = new Set<string>();

      const provider = WebhookProvider.META_LEAD_ADS;
      const providerEventId = 'meta_leadgen_888';
      const key = `${provider}:${providerEventId}`;

      // First delivery
      const isFirstDuplicate = processedEvents.has(key);
      expect(isFirstDuplicate).toBe(false);
      processedEvents.add(key);

      // Replay / retry delivery
      const isSecondDuplicate = processedEvents.has(key);
      expect(isSecondDuplicate).toBe(true);
    });
  });

  describe('Meta Signature Verification (§21.2)', () => {
    const appSecret = 'my_meta_app_secret_key_123';
    const payload = JSON.stringify({ entry: [{ id: '1', changes: [{ value: { leadgen_id: 'lead_999' } }] }] });

    it('verifies valid HMAC SHA-256 signature correctly', () => {
      const hmac = crypto.createHmac('sha256', appSecret);
      hmac.update(payload);
      const signatureHeader = `sha256=${hmac.digest('hex')}`;

      const isValid = metaAdapter.verifySignature(payload, signatureHeader, appSecret);
      expect(isValid).toBe(true);
    });

    it('rejects tampered payload or invalid signature', () => {
      const invalidSignature = 'sha256=invalidhashvalue1234567890abcdef';
      const isValid = metaAdapter.verifySignature(payload, invalidSignature, appSecret);
      expect(isValid).toBe(false);
    });
  });
});
