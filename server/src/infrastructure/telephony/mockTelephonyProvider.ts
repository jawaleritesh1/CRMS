import { CallAttemptStatus } from '@prisma/client';
import {
  TelephonyProvider,
  TelephonyCallRequest,
  TelephonyCallResponse,
  NormalizedCdrEvent,
  MockSimulationScenario,
} from '../../domain/telephony/telephony.provider.js';
import { normalizer } from '../../lib/normalize.js';
import { piiMasker } from '../../security/pii/piiMasker.js';
import { logger } from '../../core/logging/logger.js';

export interface MockCallState {
  providerCallId: string;
  request: TelephonyCallRequest;
  status: CallAttemptStatus;
  subStatus?: string;
  sequence: number;
  initiatedAt: Date;
  connectedAt?: Date;
  endedAt?: Date;
  durationSeconds: number;
  scenario: MockSimulationScenario;
}

export type MockEventListener = (event: NormalizedCdrEvent) => void | Promise<void>;

export class MockTelephonyProvider implements TelephonyProvider {
  public readonly name = 'mock';
  private static instance: MockTelephonyProvider;

  private activeCalls = new Map<string, MockCallState>();
  private emittedEvents: NormalizedCdrEvent[] = [];
  private eventListeners = new Set<MockEventListener>();
  private currentScenario: MockSimulationScenario = 'HAPPY_PATH';
  private autoAdvanceDelayMs = 0; // 0 for immediate/deterministic synchronous testing

  private constructor() {}

  public static getInstance(): MockTelephonyProvider {
    if (!MockTelephonyProvider.instance) {
      MockTelephonyProvider.instance = new MockTelephonyProvider();
    }
    return MockTelephonyProvider.instance;
  }

  public setScenario(scenario: MockSimulationScenario, options?: { autoAdvanceDelayMs?: number }) {
    this.currentScenario = scenario;
    if (options?.autoAdvanceDelayMs !== undefined) {
      this.autoAdvanceDelayMs = options.autoAdvanceDelayMs;
    }
  }

  public getScenario(): MockSimulationScenario {
    return this.currentScenario;
  }

  public reset() {
    this.activeCalls.clear();
    this.emittedEvents = [];
    this.eventListeners.clear();
    this.currentScenario = 'HAPPY_PATH';
    this.autoAdvanceDelayMs = 0;
  }

  public subscribe(listener: MockEventListener): () => void {
    this.eventListeners.add(listener);
    return () => {
      this.eventListeners.delete(listener);
    };
  }

  public getEmittedEvents(providerCallId?: string): NormalizedCdrEvent[] {
    if (providerCallId) {
      return this.emittedEvents.filter((e) => e.providerCallId === providerCallId);
    }
    return [...this.emittedEvents];
  }

  public getCallState(providerCallId: string): MockCallState | undefined {
    return this.activeCalls.get(providerCallId);
  }

  /**
   * Dispatches a normalized internal event to all subscribers and records it in history.
   */
  public emitEvent(event: NormalizedCdrEvent): NormalizedCdrEvent {
    this.emittedEvents.push(event);

    logger.info({
      msg: 'MockTelephonyProvider emitted normalized event',
      providerCallId: event.providerCallId,
      status: event.status,
      subStatus: event.subStatus,
      sequence: event.sequenceNumber,
    });

    for (const listener of this.eventListeners) {
      try {
        const res = listener(event);
        if (res instanceof Promise) {
          res.catch((err) => {
            logger.error({
              msg: 'Error in MockTelephonyProvider event listener',
              error: err.message,
            });
          });
        }
      } catch (err: any) {
        logger.error({
          msg: 'Synchronous error in MockTelephonyProvider event listener',
          error: err.message,
        });
      }
    }

    return event;
  }

  /**
   * Initiates a mock call session.
   */
  public async initiateCall(request: TelephonyCallRequest): Promise<TelephonyCallResponse> {
    const providerCallId = `mock_call_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const normalizedAgent = normalizer.normalizePhone(request.agentPhone);
    const normalizedCustomer = normalizer.normalizePhone(request.customerPhone);

    const callState: MockCallState = {
      providerCallId,
      request: {
        ...request,
        agentPhone: normalizedAgent,
        customerPhone: normalizedCustomer,
      },
      status: CallAttemptStatus.INITIATED,
      subStatus: 'INITIATED',
      sequence: 1,
      initiatedAt: new Date(),
      durationSeconds: 0,
      scenario: this.currentScenario,
    };

    this.activeCalls.set(providerCallId, callState);

    logger.info({
      msg: 'MockTelephonyProvider initiated call',
      providerCallId,
      scenario: this.currentScenario,
      agent: normalizedAgent,
      customer: piiMasker.maskPhone(normalizedCustomer),
      leadId: request.metadata.leadId,
    });

    // Execute scenario progression
    if (this.autoAdvanceDelayMs === 0) {
      this.executeScenarioSync(callState);
    } else {
      this.executeScenarioAsync(callState, this.autoAdvanceDelayMs);
    }

    return {
      success: true,
      providerCallId,
      status: CallAttemptStatus.INITIATED,
      message: `Mock call session ${providerCallId} initiated under scenario: ${this.currentScenario}`,
      isSimulated: true,
      rawResponse: {
        provider: 'mock',
        providerCallId,
        scenario: this.currentScenario,
      },
    };
  }

  /**
   * Normalizes incoming raw payloads (e.g. from mock HTTP webhooks or manual triggers).
   */
  public normalizeCdr(rawPayload: any): NormalizedCdrEvent {
    const providerCallId =
      rawPayload.providerCallId ||
      rawPayload.call_id ||
      rawPayload.id ||
      `mock_cdr_${Date.now()}`;

    const status = this.mapStatus(rawPayload.status || rawPayload.call_status);
    const subStatus = rawPayload.subStatus || rawPayload.sub_status;
    const durationSeconds = Number(rawPayload.durationSeconds || rawPayload.duration || 0);

    return {
      providerCallId: String(providerCallId),
      callAttemptId: rawPayload.callAttemptId || rawPayload.call_attempt_id,
      leadId: rawPayload.leadId || rawPayload.lead_id,
      organizationId: rawPayload.organizationId || rawPayload.organization_id,
      status,
      subStatus,
      durationSeconds: Math.max(0, durationSeconds),
      recordingUrl: rawPayload.recordingUrl || rawPayload.recording_url,
      agentNumber: normalizer.normalizePhone(rawPayload.agentNumber || rawPayload.agent_number || '+919876543210'),
      customerNumber: normalizer.normalizePhone(rawPayload.customerNumber || rawPayload.customer_number || '+919123456789'),
      sequenceNumber: Number(rawPayload.sequenceNumber || rawPayload.sequence || 1),
      timestamp: rawPayload.timestamp ? new Date(rawPayload.timestamp) : new Date(),
      rawPayload,
    };
  }

  // --------------------------------------------------------------------------
  // Granular Simulation Triggers for Automated Invariant & Failure Testing
  // --------------------------------------------------------------------------

  public simulateAgentRinging(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.RINGING;
    state.subStatus = 'AGENT_RINGING';
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateCustomerRinging(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.RINGING;
    state.subStatus = 'CUSTOMER_RINGING';
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateConnected(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.CONNECTED;
    state.subStatus = 'CONNECTED';
    state.connectedAt = new Date();
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateCompleted(
    providerCallId: string,
    durationSeconds = 45,
    recordingUrl = `https://mock-telephony.storage/recordings/${providerCallId}.mp3`
  ): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.COMPLETED;
    state.subStatus = 'COMPLETED';
    state.endedAt = new Date();
    state.durationSeconds = durationSeconds;
    state.sequence++;

    const event = this.createEventFromState(state);
    event.recordingUrl = recordingUrl;
    return this.emitEvent(event);
  }

  public simulateAgentNoAnswer(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.NO_ANSWER;
    state.subStatus = 'AGENT_NO_ANSWER';
    state.endedAt = new Date();
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateCustomerNoAnswer(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.NO_ANSWER;
    state.subStatus = 'CUSTOMER_NO_ANSWER';
    state.endedAt = new Date();
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateCustomerBusy(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.BUSY;
    state.subStatus = 'CUSTOMER_BUSY';
    state.endedAt = new Date();
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateProviderTimeout(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.FAILED;
    state.subStatus = 'PROVIDER_TIMEOUT';
    state.endedAt = new Date();
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  public simulateFailed(providerCallId: string, reason = 'Carrier network error'): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.FAILED;
    state.subStatus = 'FAILED';
    state.endedAt = new Date();
    state.sequence++;

    const event = this.createEventFromState(state);
    event.rawPayload = { ...event.rawPayload, reason };
    return this.emitEvent(event);
  }

  public simulateCancelled(providerCallId: string): NormalizedCdrEvent {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.CANCELLED;
    state.subStatus = 'CANCELLED';
    state.endedAt = new Date();
    state.sequence++;

    return this.emitEvent(this.createEventFromState(state));
  }

  /**
   * Simulates duplicate provider events: emits the exact same event twice to test idempotency (§36.2).
   */
  public simulateDuplicateEvents(providerCallId: string): [NormalizedCdrEvent, NormalizedCdrEvent] {
    const state = this.getOrInitState(providerCallId);
    state.status = CallAttemptStatus.CONNECTED;
    state.sequence++;
    const event = this.createEventFromState(state);

    // Emit event first time
    this.emitEvent(event);

    // Clone event with identical sequence & payload
    const duplicateEvent: NormalizedCdrEvent = {
      ...event,
      rawPayload: { ...event.rawPayload, isDuplicate: true },
    };

    // Emit identical second time
    this.emitEvent(duplicateEvent);

    return [event, duplicateEvent];
  }

  /**
   * Simulates out-of-order provider events: emits COMPLETED with sequence=3 BEFORE CONNECTED with sequence=2.
   */
  public simulateOutOfOrderEvents(providerCallId: string): [NormalizedCdrEvent, NormalizedCdrEvent] {
    const state = this.getOrInitState(providerCallId);

    // Create COMPLETED event (sequence 3)
    const completedEvent: NormalizedCdrEvent = {
      providerCallId,
      callAttemptId: state.request.metadata.callAttemptId,
      leadId: state.request.metadata.leadId,
      organizationId: state.request.metadata.organizationId,
      status: CallAttemptStatus.COMPLETED,
      subStatus: 'COMPLETED',
      durationSeconds: 52,
      recordingUrl: `https://mock-telephony.storage/recordings/${providerCallId}.mp3`,
      agentNumber: state.request.agentPhone,
      customerNumber: state.request.customerPhone,
      sequenceNumber: 3,
      timestamp: new Date(),
      rawPayload: { stage: 'COMPLETED_OUT_OF_ORDER' },
    };

    // Create earlier CONNECTED event (sequence 2)
    const connectedEvent: NormalizedCdrEvent = {
      providerCallId,
      callAttemptId: state.request.metadata.callAttemptId,
      leadId: state.request.metadata.leadId,
      organizationId: state.request.metadata.organizationId,
      status: CallAttemptStatus.CONNECTED,
      subStatus: 'CONNECTED',
      durationSeconds: 0,
      agentNumber: state.request.agentPhone,
      customerNumber: state.request.customerPhone,
      sequenceNumber: 2,
      timestamp: new Date(Date.now() - 30000),
      rawPayload: { stage: 'CONNECTED_LATE_ARRIVAL' },
    };

    // Emit COMPLETED first
    this.emitEvent(completedEvent);
    // Then emit CONNECTED later
    this.emitEvent(connectedEvent);

    return [completedEvent, connectedEvent];
  }

  // --------------------------------------------------------------------------
  // Internal Scenario Execution Logic
  // --------------------------------------------------------------------------

  private executeScenarioSync(state: MockCallState) {
    switch (state.scenario) {
      case 'HAPPY_PATH':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateCustomerRinging(state.providerCallId);
        this.simulateConnected(state.providerCallId);
        this.simulateCompleted(state.providerCallId, 60);
        break;

      case 'AGENT_RINGING':
        this.simulateAgentRinging(state.providerCallId);
        break;

      case 'CUSTOMER_RINGING':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateCustomerRinging(state.providerCallId);
        break;

      case 'CONNECTED':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateCustomerRinging(state.providerCallId);
        this.simulateConnected(state.providerCallId);
        break;

      case 'COMPLETED':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateConnected(state.providerCallId);
        this.simulateCompleted(state.providerCallId, 45);
        break;

      case 'AGENT_NO_ANSWER':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateAgentNoAnswer(state.providerCallId);
        break;

      case 'CUSTOMER_NO_ANSWER':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateCustomerRinging(state.providerCallId);
        this.simulateCustomerNoAnswer(state.providerCallId);
        break;

      case 'CUSTOMER_BUSY':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateCustomerBusy(state.providerCallId);
        break;

      case 'PROVIDER_TIMEOUT':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateProviderTimeout(state.providerCallId);
        break;

      case 'CALL_FAILED':
        this.simulateFailed(state.providerCallId);
        break;

      case 'CALL_CANCELLED':
        this.simulateCancelled(state.providerCallId);
        break;

      case 'DUPLICATE_EVENTS':
        this.simulateAgentRinging(state.providerCallId);
        this.simulateDuplicateEvents(state.providerCallId);
        break;

      case 'OUT_OF_ORDER_EVENTS':
        this.simulateOutOfOrderEvents(state.providerCallId);
        break;
    }
  }

  private executeScenarioAsync(state: MockCallState, delayMs: number) {
    setTimeout(() => {
      this.executeScenarioSync(state);
    }, delayMs);
  }

  private getOrInitState(providerCallId: string): MockCallState {
    let state = this.activeCalls.get(providerCallId);
    if (!state) {
      state = {
        providerCallId,
        request: {
          agentPhone: '+919876543210',
          customerPhone: '+919123456789',
          metadata: {
            leadId: 'mock_lead',
            callAttemptId: 'mock_attempt',
            organizationId: 'mock_org',
          },
        },
        status: CallAttemptStatus.INITIATED,
        sequence: 1,
        initiatedAt: new Date(),
        durationSeconds: 0,
        scenario: this.currentScenario,
      };
      this.activeCalls.set(providerCallId, state);
    }
    return state;
  }

  private createEventFromState(state: MockCallState): NormalizedCdrEvent {
    return {
      providerCallId: state.providerCallId,
      callAttemptId: state.request.metadata.callAttemptId,
      leadId: state.request.metadata.leadId,
      organizationId: state.request.metadata.organizationId,
      status: state.status,
      subStatus: state.subStatus as any,
      durationSeconds: state.durationSeconds,
      recordingUrl: state.durationSeconds > 0
        ? `https://mock-telephony.storage/recordings/${state.providerCallId}.mp3`
        : undefined,
      agentNumber: state.request.agentPhone,
      customerNumber: state.request.customerPhone,
      sequenceNumber: state.sequence,
      timestamp: new Date(),
      rawPayload: {
        provider: 'mock',
        status: state.status,
        subStatus: state.subStatus,
        sequence: state.sequence,
      },
    };
  }

  private mapStatus(statusStr: string | undefined): CallAttemptStatus {
    if (!statusStr) return CallAttemptStatus.INITIATED;
    const s = statusStr.toUpperCase();
    if (s.includes('ANSWER') && !s.includes('NO')) return CallAttemptStatus.CONNECTED;
    if (s.includes('CONNECT')) return CallAttemptStatus.CONNECTED;
    if (s.includes('COMPLET')) return CallAttemptStatus.COMPLETED;
    if (s.includes('BUSY')) return CallAttemptStatus.BUSY;
    if (s.includes('NO_ANSWER') || s.includes('MISSED')) return CallAttemptStatus.NO_ANSWER;
    if (s.includes('CANCEL')) return CallAttemptStatus.CANCELLED;
    if (s.includes('FAIL') || s.includes('TIMEOUT')) return CallAttemptStatus.FAILED;
    if (s.includes('RING')) return CallAttemptStatus.RINGING;
    return CallAttemptStatus.INITIATED;
  }
}
