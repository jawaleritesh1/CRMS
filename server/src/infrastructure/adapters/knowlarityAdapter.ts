import { CallAttemptStatus } from '@prisma/client';
import { normalizer } from '../../lib/normalize.js';
import { piiMasker } from '../../security/pii/piiMasker.js';
import { env } from '../../config/env.js';
import { logger } from '../../core/logging/logger.js';

export interface KnowlarityMakeCallRequest {
  agentPhone: string;
  customerPhone: string;
  kNumber?: string;
  callerId?: string;
  additionalParams?: {
    leadId?: string;
    callAttemptId?: string;
    organizationId?: string;
    [key: string]: any;
  };
}

export interface KnowlarityMakeCallResponse {
  success: boolean;
  providerCallId: string;
  message: string;
  isSimulated?: boolean;
  rawResponse?: any;
}

export interface KnowlarityCdrPayload {
  providerCallId: string;
  status: CallAttemptStatus;
  durationSeconds: number;
  recordingUrl?: string;
  agentNumber: string;
  customerNumber: string;
  callAttemptId?: string;
  leadId?: string;
  rawPayload: any;
}

export class KnowlarityTelephonyAdapter {
  /**
   * Prepares the parameters for Knowlarity SuperReceptionist Click-to-Call duplex request (§19.1).
   * Host: sr.knowlarity.com
   * Canonical Endpoint: /newsr/api/v1/click2call/
   */
  static buildMakeCallPayload(request: KnowlarityMakeCallRequest) {
    const agent = normalizer.normalizePhone(request.agentPhone);
    const customer = normalizer.normalizePhone(request.customerPhone);
    const kNumber = request.kNumber || env.KNOWLARITY_K_NUMBER || '+918047100000';
    const callerId = request.callerId || env.KNOWLARITY_CALLER_ID || kNumber;

    return {
      k_number: kNumber,
      sr_number: kNumber,
      agent_number: agent,
      customer_number: customer,
      phone_number: customer,
      caller_id: callerId,
      is_promotional: 'false',
      additional_params: request.additionalParams || {},
    };
  }

  /**
   * Executes Click-to-Call request against Knowlarity SuperReceptionist API (sr.knowlarity.com).
   * Supports both real gateway dispatch and graceful development simulation.
   */
  static async executeMakeCall(
    request: KnowlarityMakeCallRequest,
    credentials?: {
      apiKey?: string;
      authToken?: string;
      baseUrl?: string;
    }
  ): Promise<KnowlarityMakeCallResponse> {
    const payload = this.buildMakeCallPayload(request);
    const apiKey = credentials?.apiKey || env.KNOWLARITY_API_KEY;
    const authToken = credentials?.authToken || env.KNOWLARITY_AUTH_TOKEN;
    const baseUrl = credentials?.baseUrl || env.KNOWLARITY_BASE_URL || 'https://sr.knowlarity.com/newsr/api/v1/click2call/';

    const isTest = env.NODE_ENV === 'test';
    const isDev = env.NODE_ENV === 'development';

    // If live Knowlarity credentials (apiKey and preferably authToken) are provided, attempt the live API call (skip in test runner unless credentials explicitly passed)
    if (apiKey && (!isTest || credentials?.apiKey)) {
      try {
        const url = new URL(baseUrl);
        url.searchParams.set('phone_number', payload.customer_number);
        url.searchParams.set('agent_number', payload.agent_number);
        url.searchParams.set('sr_number', payload.sr_number);
        if (payload.caller_id) {
          url.searchParams.set('caller_id', payload.caller_id);
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
          msg: 'Initiating real Knowlarity SuperReceptionist click-to-call',
          endpoint: url.origin + url.pathname,
          srNumber: payload.sr_number,
          agent: payload.agent_number,
          customer: piiMasker.maskPhone(payload.customer_number),
          callAttemptId: request.additionalParams?.callAttemptId,
          hasAuthToken: Boolean(authToken),
        });

        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
        });

        if (response.ok) {
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
            message: data?.success?.message || 'Call initiated successfully via Knowlarity SuperReceptionist',
            rawResponse: data,
          };
        }

        const errorBody = await response.text().catch(() => '');
        logger.warn({
          msg: 'Knowlarity SuperReceptionist API rejected call request',
          statusCode: response.status,
          errorBody: errorBody.substring(0, 200),
        });

        if (response.status === 401) {
          const detailMsg =
            'Knowlarity SuperReceptionist returned 401 Unauthorized. SuperReceptionist requires both the Application "x-api-key" and the "Authorization" token (SR Auth Token from SuperReceptionist portal: Integrations > Click2Call), plus your verified virtual receptionist number (sr_number).';

          // In development/test mode, log the guidance and fall back to simulation so workflows are not blocked
          if (isDev || isTest) {
            logger.warn({
              msg: 'Falling back to simulation in non-production due to Knowlarity 401 (missing SR Auth Token)',
              guidance: detailMsg,
            });
          } else {
            return {
              success: false,
              providerCallId: '',
              message: detailMsg,
            };
          }
        } else {
          if (!isDev && !isTest) {
            return {
              success: false,
              providerCallId: '',
              message: `HTTP ${response.status} from Knowlarity: ${errorBody || response.statusText}`,
            };
          }
        }
      } catch (err: any) {
        logger.error({
          msg: 'Knowlarity SuperReceptionist network request failed',
          error: err.message,
        });
        if (!isDev && !isTest) {
          return {
            success: false,
            providerCallId: '',
            message: `Network error connecting to sr.knowlarity.com: ${err.message}`,
          };
        }
      }
    }

    // In development / local testing without live credentials, generate a realistic simulated duplex call
    const simulatedCallId = `knowlarity_sr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    logger.info({
      msg: 'Executed simulated Knowlarity SuperReceptionist call (sr.knowlarity.com)',
      simulatedCallId,
      agent: payload.agent_number,
      kNumber: payload.k_number,
      customer: payload.customer_number,
    });

    return {
      success: true,
      providerCallId: simulatedCallId,
      message: 'Call initiated via Knowlarity SuperReceptionist (Development Simulation)',
      isSimulated: true,
      rawResponse: {
        success: {
          status: 'success',
          message: 'Call placed successfully to agent',
          call_id: simulatedCallId,
        },
      },
    };
  }

  /**
   * Maps Knowlarity status string to domain CallAttemptStatus (§19.1).
   */
  static mapCallStatus(statusStr: string): CallAttemptStatus {
    const s = (statusStr || '').toLowerCase().trim();
    switch (s) {
      case 'answered':
      case 'connected':
      case 'success':
      case 'in-progress':
        return CallAttemptStatus.CONNECTED;
      case 'completed':
      case 'call_completed':
        return CallAttemptStatus.COMPLETED;
      case 'noanswer':
      case 'no_answer':
      case 'missed':
      case 'timeout':
        return CallAttemptStatus.NO_ANSWER;
      case 'busy':
        return CallAttemptStatus.BUSY;
      case 'canceled':
      case 'cancelled':
        return CallAttemptStatus.CANCELLED;
      case 'failed':
      case 'error':
      case 'rejected':
        return CallAttemptStatus.FAILED;
      case 'ringing':
        return CallAttemptStatus.RINGING;
      default:
        return CallAttemptStatus.INITIATED;
    }
  }

  /**
   * Normalizes incoming Knowlarity SuperReceptionist Call Detail Record (CDR) webhook payload.
   */
  static parseWebhook(body: any): KnowlarityCdrPayload | null {
    if (!body || typeof body !== 'object') return null;

    const providerCallId =
      body?.call_id ||
      body?.callid ||
      body?.uuid ||
      body?.id ||
      body?.CallSid;

    if (!providerCallId) return null;

    const rawStatus =
      body?.status ||
      body?.call_status ||
      body?.disposition ||
      body?.Status ||
      '';

    const rawDuration =
      body?.call_duration ||
      body?.duration ||
      body?.call_duration_seconds ||
      body?.Duration ||
      '0';

    const durationSeconds = parseInt(String(rawDuration), 10);

    const recordingUrl =
      body?.recording_url ||
      body?.call_recording ||
      body?.audio_url ||
      body?.RecordingUrl ||
      undefined;

    const agentNumber =
      body?.agent_number ||
      body?.agent ||
      body?.from ||
      body?.From ||
      '';

    const customerNumber =
      body?.customer_number ||
      body?.customer ||
      body?.to ||
      body?.To ||
      '';

    const callAttemptId =
      body?.additional_params?.callAttemptId ||
      body?.call_attempt_id ||
      body?.callAttemptId;

    const leadId =
      body?.additional_params?.leadId ||
      body?.lead_id ||
      body?.leadId;

    return {
      providerCallId: String(providerCallId),
      status: this.mapCallStatus(rawStatus),
      durationSeconds: isNaN(durationSeconds) ? 0 : durationSeconds,
      recordingUrl,
      agentNumber: String(agentNumber),
      customerNumber: String(customerNumber),
      callAttemptId: callAttemptId ? String(callAttemptId) : undefined,
      leadId: leadId ? String(leadId) : undefined,
      rawPayload: body,
    };
  }
}
