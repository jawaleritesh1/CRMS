import { CallAttemptStatus } from '@prisma/client';
import { normalizer } from '../../lib/normalize.js';

export interface ExotelConnectRequest {
  fromAgentPhone: string;
  toCustomerPhone: string;
  callerId: string; // Exotel virtual number
  customField?: string; // e.g. Lead ID
}

export interface ExotelCallCallbackPayload {
  providerCallId: string;
  status: CallAttemptStatus;
  durationSeconds: number;
  recordingUrl?: string;
  fromPhone: string;
  toPhone: string;
}

export class ExotelTelephonyAdapter {
  /**
   * Prepares the payload for Exotel Click-to-Call duplex connection.
   */
  static buildConnectRequest(request: ExotelConnectRequest) {
    const from = normalizer.normalizePhone(request.fromAgentPhone);
    const to = normalizer.normalizePhone(request.toCustomerPhone);

    return {
      From: from.replace(/^\+/, ''),
      To: to.replace(/^\+/, ''),
      CallerId: request.callerId.replace(/^\+/, ''),
      CallType: 'trans',
      CustomField: request.customField || '',
    };
  }

  /**
   * Maps Exotel callback status string to domain CallAttemptStatus.
   */
  static mapCallStatus(statusStr: string): CallAttemptStatus {
    const s = (statusStr || '').toLowerCase();
    switch (s) {
      case 'in-progress':
        return CallAttemptStatus.CONNECTED;
      case 'completed':
        return CallAttemptStatus.COMPLETED;
      case 'no-answer':
        return CallAttemptStatus.NO_ANSWER;
      case 'busy':
        return CallAttemptStatus.BUSY;
      case 'canceled':
      case 'cancelled':
        return CallAttemptStatus.CANCELLED;
      case 'failed':
        return CallAttemptStatus.FAILED;
      case 'ringing':
        return CallAttemptStatus.RINGING;
      default:
        return CallAttemptStatus.INITIATED;
    }
  }

  /**
   * Normalizes Exotel status callback payload.
   */
  static parseCallback(body: any): ExotelCallCallbackPayload | null {
    const providerCallId = body?.CallSid || body?.Sid || body?.CallId;
    if (!providerCallId) return null;

    const rawStatus = body?.Status || body?.CallStatus || '';
    const duration = parseInt(body?.Duration || body?.CallDuration || '0', 10);
    const recordingUrl = body?.RecordingUrl || undefined;

    return {
      providerCallId: String(providerCallId),
      status: this.mapCallStatus(rawStatus),
      durationSeconds: isNaN(duration) ? 0 : duration,
      recordingUrl,
      fromPhone: body?.From ? `+${body.From}` : '',
      toPhone: body?.To ? `+${body.To}` : '',
    };
  }
}
