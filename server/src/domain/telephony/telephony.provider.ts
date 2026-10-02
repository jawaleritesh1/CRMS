import { CallAttemptStatus } from '@prisma/client';

export type MockSimulationScenario =
  | 'HAPPY_PATH' // Initiated -> Agent Ringing -> Customer Ringing -> Connected -> Completed
  | 'AGENT_RINGING' // Initiated -> Agent Ringing (stays in ringing or manual trigger)
  | 'CUSTOMER_RINGING' // Initiated -> Agent Connected -> Customer Ringing
  | 'CONNECTED' // Initiated -> Connected (stays connected)
  | 'COMPLETED' // Full normal lifecycle completed
  | 'AGENT_NO_ANSWER' // Agent does not pick up
  | 'CUSTOMER_NO_ANSWER' // Customer does not answer
  | 'CUSTOMER_BUSY' // Customer line is busy
  | 'PROVIDER_TIMEOUT' // Provider gateway timeout
  | 'CALL_FAILED' // Network / circuit / carrier failure
  | 'CALL_CANCELLED' // Caller hangs up before answer
  | 'DUPLICATE_EVENTS' // Emits identical CDR webhook twice to test idempotency
  | 'OUT_OF_ORDER_EVENTS'; // Emits COMPLETED before CONNECTED to test out-of-order handling

export interface TelephonyCallMetadata {
  leadId: string;
  callAttemptId: string;
  organizationId: string;
  userId?: string;
  [key: string]: any;
}

export interface TelephonyCallRequest {
  agentPhone: string;
  customerPhone: string;
  callerId?: string;
  virtualNumber?: string;
  metadata: TelephonyCallMetadata;
}

export interface TelephonyCallResponse {
  success: boolean;
  providerCallId: string;
  message: string;
  status: CallAttemptStatus;
  isSimulated: boolean;
  rawResponse?: any;
}

export interface NormalizedCdrEvent {
  providerCallId: string;
  callAttemptId?: string;
  leadId?: string;
  organizationId?: string;
  status: CallAttemptStatus;
  subStatus?:
    | 'INITIATED'
    | 'AGENT_RINGING'
    | 'CUSTOMER_RINGING'
    | 'CONNECTED'
    | 'COMPLETED'
    | 'AGENT_NO_ANSWER'
    | 'CUSTOMER_NO_ANSWER'
    | 'CUSTOMER_BUSY'
    | 'PROVIDER_TIMEOUT'
    | 'CANCELLED'
    | 'FAILED';
  durationSeconds: number;
  recordingUrl?: string;
  agentNumber: string;
  customerNumber: string;
  sequenceNumber?: number;
  timestamp: Date;
  rawPayload: any;
}

export interface TelephonyProvider {
  readonly name: string;

  /**
   * Initiates a duplex call bridging agent and customer.
   */
  initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResponse>;

  /**
   * Normalizes provider-specific webhook/CDR payloads into a canonical NormalizedCdrEvent.
   */
  normalizeCdr(rawPayload: any): NormalizedCdrEvent;

  /**
   * Optionally verifies the authenticity of incoming webhook signatures.
   */
  verifyWebhookSignature?(
    headers: Record<string, string | string[] | undefined>,
    rawBody: string
  ): boolean;
}
