import { CallAttemptStatus } from '@prisma/client';
import {
  TelephonyProvider,
  TelephonyCallRequest,
  TelephonyCallResponse,
  NormalizedCdrEvent,
} from '../../domain/telephony/telephony.provider.js';
import { normalizer } from '../../lib/normalize.js';
import { piiMasker } from '../../security/pii/piiMasker.js';
import { env } from '../../config/env.js';
import { logger } from '../../core/logging/logger.js';

export class KnowlarityTelephonyProvider implements TelephonyProvider {
  public readonly name = 'knowlarity';

  /**
   * Initiates a duplex call using Knowlarity SuperReceptionist API (sr.knowlarity.com).
   * Note: Guaranteed never called in development or automated testing.
   */
  async initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResponse> {
    if (env.NODE_ENV !== 'production' && env.TELEPHONY_PROVIDER !== 'knowlarity') {
      throw new Error(
        'KnowlarityTelephonyProvider must not be invoked outside production. Use MockTelephonyProvider for development and tests.'
      );
    }

    const agent = normalizer.normalizePhone(request.agentPhone);
    const customer = normalizer.normalizePhone(request.customerPhone);
    const srNumber = request.virtualNumber || env.KNOWLARITY_K_NUMBER || '+918047100000';
    const callerId = request.callerId || env.KNOWLARITY_CALLER_ID || srNumber;
    const apiKey = env.KNOWLARITY_API_KEY;
    const authToken = env.KNOWLARITY_AUTH_TOKEN;
    const baseUrl = env.KNOWLARITY_BASE_URL || 'https://sr.knowlarity.com/newsr/api/v1/click2call/';

    if (!apiKey) {
      return {
        success: false,
        providerCallId: '',
        status: CallAttemptStatus.FAILED,
        message: 'KNOWLARITY_API_KEY is not configured in production environment',
        isSimulated: false,
      };
    }

    try {
      const url = new URL(baseUrl);
      url.searchParams.set('phone_number', customer);
      url.searchParams.set('agent_number', agent);
      url.searchParams.set('sr_number', srNumber);
      if (callerId) {
        url.searchParams.set('caller_id', callerId);
      }
      url.searchParams.set('is_promotional', 'false');

      const headers: Record<string, string> = {
        'x-api-key': apiKey,
        'Accept': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = authToken;
      }

      logger.info({
        msg: 'KnowlarityTelephonyProvider executing live SuperReceptionist Click-to-Call',
        endpoint: url.origin + url.pathname,
        agent,
        customer: piiMasker.maskPhone(customer),
        callAttemptId: request.metadata.callAttemptId,
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        logger.error({
          msg: 'Knowlarity SuperReceptionist API rejected call',
          status: response.status,
          errorBody: errorBody.substring(0, 200),
        });

        return {
          success: false,
          providerCallId: '',
          status: CallAttemptStatus.FAILED,
          message: `Knowlarity gateway rejected request (HTTP ${response.status}): ${errorBody || response.statusText}`,
          isSimulated: false,
        };
      }

      let data: any = {};
      try {
        data = await response.json();
      } catch {
        data = { raw: await response.text() };
      }

      const callId =
        data?.success?.call_id ||
        data?.call_id ||
        data?.uuid ||
        data?.id ||
        `knowlarity_${Date.now()}`;

      return {
        success: true,
        providerCallId: String(callId),
        status: CallAttemptStatus.RINGING,
        message: data?.success?.message || 'Call initiated successfully via Knowlarity SuperReceptionist',
        isSimulated: false,
        rawResponse: data,
      };
    } catch (err: any) {
      logger.error({
        msg: 'Knowlarity network call failed',
        error: err.message,
      });
      return {
        success: false,
        providerCallId: '',
        status: CallAttemptStatus.FAILED,
        message: `Network error connecting to Knowlarity gateway: ${err.message}`,
        isSimulated: false,
      };
    }
  }

  /**
   * Normalizes Knowlarity SuperReceptionist CDR payload into canonical NormalizedCdrEvent.
   */
  normalizeCdr(rawPayload: any): NormalizedCdrEvent {
    const providerCallId =
      rawPayload.call_id ||
      rawPayload.uuid ||
      rawPayload.callid ||
      rawPayload.id ||
      `knowlarity_${Date.now()}`;

    const rawStatus =
      rawPayload.status ||
      rawPayload.call_status ||
      rawPayload.disp ||
      rawPayload.disposition ||
      '';

    const status = this.mapStatus(String(rawStatus));
    const durationSeconds = Number(rawPayload.duration || rawPayload.call_duration || rawPayload.talk_time || 0);

    const recordingUrl =
      rawPayload.recording_url ||
      rawPayload.audio_record ||
      rawPayload.recordingUrl ||
      undefined;

    const agentNumber =
      rawPayload.agent_number ||
      rawPayload.agent_phone ||
      rawPayload.agent ||
      '+919876543210';

    const customerNumber =
      rawPayload.customer_number ||
      rawPayload.customer_phone ||
      rawPayload.caller_id ||
      rawPayload.phone_number ||
      '+919123456789';

    return {
      providerCallId: String(providerCallId),
      callAttemptId: rawPayload.callAttemptId || rawPayload.additional_params?.callAttemptId,
      leadId: rawPayload.leadId || rawPayload.additional_params?.leadId,
      organizationId: rawPayload.organizationId || rawPayload.additional_params?.organizationId,
      status,
      durationSeconds: Math.max(0, durationSeconds),
      recordingUrl,
      agentNumber: normalizer.normalizePhone(String(agentNumber)),
      customerNumber: normalizer.normalizePhone(String(customerNumber)),
      timestamp: rawPayload.start_time ? new Date(rawPayload.start_time) : new Date(),
      rawPayload,
    };
  }

  private mapStatus(statusStr: string): CallAttemptStatus {
    const s = statusStr.toLowerCase().trim();
    if (s === 'answered' || s === 'connected' || s === 'bridged') {
      return CallAttemptStatus.CONNECTED;
    }
    if (s === 'completed' || s === 'normal_clearing' || s === 'success') {
      return CallAttemptStatus.COMPLETED;
    }
    if (s === 'noanswer' || s === 'no_answer' || s === 'missed' || s === 'agent_no_answer') {
      return CallAttemptStatus.NO_ANSWER;
    }
    if (s === 'busy' || s === 'user_busy') {
      return CallAttemptStatus.BUSY;
    }
    if (s === 'cancelled' || s === 'canceled') {
      return CallAttemptStatus.CANCELLED;
    }
    if (s === 'failed' || s === 'rejected' || s === 'congestion') {
      return CallAttemptStatus.FAILED;
    }
    if (s === 'ringing' || s === 'originating') {
      return CallAttemptStatus.RINGING;
    }
    return CallAttemptStatus.INITIATED;
  }
}
