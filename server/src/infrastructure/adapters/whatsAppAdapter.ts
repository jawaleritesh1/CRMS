import crypto from 'crypto';
import { normalizer } from '../../lib/normalize.js';

export interface WhatsAppTemplateSendRequest {
  recipientPhone: string;
  templateName: string;
  languageCode: string;
  parameters: string[];
}

export interface WhatsAppStatusCallbackPayload {
  providerMessageId: string;
  recipientPhone: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  timestamp: Date;
  errorCode?: string;
  errorMessage?: string;
}

export interface WhatsAppInboundMessagePayload {
  providerMessageId: string;
  senderPhone: string;
  content: string;
  timestamp: Date;
}

export class WhatsAppCloudAdapter {
  /**
   * Verifies the SHA256 HMAC signature sent in X-Hub-Signature-256 header.
   */
  static verifyWebhookSignature(
    payload: string | Buffer,
    signatureHeader: string | undefined,
    appSecret: string
  ): boolean {
    if (!signatureHeader || !appSecret) return false;

    const parts = signatureHeader.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256' || !parts[1]) {
      return false;
    }

    const expectedHash = parts[1];
    const computedHash = crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(
        Buffer.from(computedHash, 'utf8'),
        Buffer.from(expectedHash, 'utf8')
      );
    } catch {
      return false;
    }
  }

  /**
   * Builds the normalized payload for WhatsApp Cloud API message send.
   */
  static buildTemplatePayload(request: WhatsAppTemplateSendRequest) {
    const normalized = normalizer.normalizePhone(request.recipientPhone);
    const cleanPhone = normalized.replace(/^\+/, '');

    return {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'template',
      template: {
        name: request.templateName,
        language: {
          code: request.languageCode || 'en_US',
        },
        components: [
          {
            type: 'body',
            parameters: request.parameters.map((param) => ({
              type: 'text',
              text: param,
            })),
          },
        ],
      },
    };
  }

  /**
   * Normalizes inbound webhook status update.
   */
  static parseStatusCallback(body: any): WhatsAppStatusCallbackPayload | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const statusData = change?.value?.statuses?.[0];

      if (!statusData) return null;

      const rawStatus = (statusData.status || '').toLowerCase();
      let status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' = 'SENT';

      if (rawStatus === 'delivered') status = 'DELIVERED';
      else if (rawStatus === 'read') status = 'READ';
      else if (rawStatus === 'failed') status = 'FAILED';

      const phone = statusData.recipient_id ? `+${statusData.recipient_id}` : '';
      const errorCode = statusData.errors?.[0]?.code ? String(statusData.errors[0].code) : undefined;
      const errorMessage = statusData.errors?.[0]?.title;

      return {
        providerMessageId: statusData.id,
        recipientPhone: phone,
        status,
        timestamp: new Date(Number(statusData.timestamp) * 1000 || Date.now()),
        errorCode,
        errorMessage,
      };
    } catch {
      return null;
    }
  }

  /**
   * Normalizes inbound user message.
   */
  static parseInboundMessage(body: any): WhatsAppInboundMessagePayload | null {
    try {
      const entry = body?.entry?.[0];
      const change = entry?.changes?.[0];
      const messageData = change?.value?.messages?.[0];

      if (!messageData) return null;

      const senderPhone = messageData.from ? `+${messageData.from}` : '';
      const content = messageData.text?.body || messageData.button?.text || '';

      return {
        providerMessageId: messageData.id,
        senderPhone,
        content,
        timestamp: new Date(Number(messageData.timestamp) * 1000 || Date.now()),
      };
    } catch {
      return null;
    }
  }
}
