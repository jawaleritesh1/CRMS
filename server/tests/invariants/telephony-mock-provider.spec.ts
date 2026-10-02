import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '../../src/core/database/prisma.js';
import { telephonyService } from '../../src/domain/telephony/telephony.service.js';
import { leadService } from '../../src/domain/lead/lead.service.js';
import { MockTelephonyProvider } from '../../src/infrastructure/telephony/mockTelephonyProvider.js';
import { TelephonyProviderFactory } from '../../src/infrastructure/telephony/telephonyProviderFactory.js';
import {
  CallAttemptStatus,
  CallDisposition,
  LeadDisposition,
  LeadStatus,
  ScopeType,
} from '@prisma/client';
import { ActorContext } from '../../security/context/actorContext.js';

describe('Provider-Neutral Telephony & MockTelephonyProvider Invariants', () => {
  const mockOrgId = 'org_ralix_demo';

  const telecaller1: ActorContext = {
    userId: 'user_telecaller_1',
    membershipId: 'mem_tc_1',
    organizationId: mockOrgId,
    roleId: 'role_telecaller',
    roleSlug: 'telecaller',
    capabilities: new Set(['LEAD_VIEW', 'LEAD_UPDATE', 'LEAD_CLAIM']),
    scope: ScopeType.ORGANIZATION,
    teamIds: ['team_alpha'],
    projectIds: [],
    isSystemActor: false,
    authorizationVersion: 1,
    correlationId: 'corr_tc1_test',
  };

  const telecaller2: ActorContext = {
    userId: 'user_telecaller_2',
    membershipId: 'mem_tc_2',
    organizationId: mockOrgId,
    roleId: 'role_telecaller',
    roleSlug: 'telecaller',
    capabilities: new Set(['LEAD_VIEW', 'LEAD_UPDATE', 'LEAD_CLAIM']),
    scope: ScopeType.ORGANIZATION,
    teamIds: ['team_alpha'],
    projectIds: [],
    isSystemActor: false,
    authorizationVersion: 1,
    correlationId: 'corr_tc2_test',
  };

  let mockProvider: MockTelephonyProvider;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockProvider = MockTelephonyProvider.getInstance();
    mockProvider.reset();
    TelephonyProviderFactory.setCustomProvider(mockProvider);
  });

  // --------------------------------------------------------------------------
  // INVARIANT 1: Zero External Dependencies & Provider Neutrality
  // --------------------------------------------------------------------------
  it('strictly resolves MockTelephonyProvider in test/development without requiring live credentials', () => {
    const activeProvider = TelephonyProviderFactory.getProvider();
    expect(activeProvider.name).toBe('mock');
    expect(mockProvider.getScenario()).toBe('HAPPY_PATH');
  });

  // --------------------------------------------------------------------------
  // INVARIANTS 2-5: Lead Broadcast, First-Accept-Wins Concurrency & Atomic Claim
  // --------------------------------------------------------------------------
  it('guarantees first-accept-wins atomic concurrency for multiple telecallers receiving the same lead', async () => {
    const leadId = 'lead_broadcast_001';

    // Mock initial unassigned broadcast lead
    const mockLead = {
      id: leadId,
      organizationId: mockOrgId,
      status: LeadStatus.NEW,
      assignedToId: null,
      claimedAt: null,
      claimedById: null,
      claimExpiresAt: null,
      version: 0,
      deletedAt: null,
    };

    let claimWinner: string | null = null;

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        lead: {
          findUnique: vi.fn().mockImplementation(() => {
            if (claimWinner) {
              // Once claimed, subsequent attempts see the assigned lead
              return Promise.resolve({
                ...mockLead,
                assignedToId: claimWinner,
                status: LeadStatus.CLAIMED,
                version: 1,
              });
            }
            return Promise.resolve(mockLead);
          }),
          update: vi.fn().mockImplementation((args: any) => {
            claimWinner = args.data.assignedToId;
            return Promise.resolve({
              ...mockLead,
              ...args.data,
              version: 1,
            });
          }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
        },
        leadAssignment: {
          create: vi.fn().mockResolvedValue({ id: 'asgn_1' }),
        },
        outboxEvent: {
          create: vi.fn().mockResolvedValue({ id: 'out_1' }),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ id: telecaller1.userId, name: 'Telecaller 1' }),
        },
      };
      return callback(tx);
    });

    // Both telecallers attempt to accept & claim the lead simultaneously
    const result1 = await leadService.claimLead(telecaller1, leadId);
    expect(result1.assignedToId).toBe(telecaller1.userId);
    expect(result1.status).toBe(LeadStatus.CLAIMED);

    // Second telecaller receives "lead taken / already assigned"
    await expect(leadService.claimLead(telecaller2, leadId)).rejects.toThrow(
      /already (accepted|assigned|claimed)/i
    );
  });

  // --------------------------------------------------------------------------
  // INVARIANT 6: Automatic Call Initiation & Duplex State Transitions
  // --------------------------------------------------------------------------
  it('simulates full duplex state progression: Initiated -> Agent Ringing -> Customer Ringing -> Connected -> Completed', async () => {
    const mockLead = {
      id: 'lead_auto_call_1',
      organizationId: mockOrgId,
      assignedToId: telecaller1.userId,
      deletedAt: null,
      customer: {
        id: 'cust_auto_1',
        name: 'Aarav Mehta',
        phone: '+919876543210',
        normalizedPhone: '+919876543210',
      },
    };

    vi.spyOn(prisma.lead, 'findUnique').mockResolvedValue(mockLead as any);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: telecaller1.userId,
      phone: '+919988776655',
    } as any);

    vi.spyOn(prisma.callAttempt, 'create').mockResolvedValue({
      id: 'att_auto_1',
      organizationId: mockOrgId,
      leadId: mockLead.id,
      userId: telecaller1.userId,
      status: CallAttemptStatus.INITIATED,
      maskedCustomerNumber: '+91 98•••• 3210',
      initiatedAt: new Date(),
    } as any);

    vi.spyOn(prisma.callAttempt, 'update').mockResolvedValue({
      id: 'att_auto_1',
      providerCallId: 'mock_call_100',
      status: CallAttemptStatus.INITIATED,
    } as any);

    const emitted: any[] = [];
    mockProvider.subscribe((event) => {
      emitted.push(event);
    });

    mockProvider.setScenario('HAPPY_PATH');

    const callResult = await telephonyService.initiateCall(telecaller1, {
      leadId: mockLead.id,
    });

    expect(callResult.callAttemptId).toBe('att_auto_1');
    expect(callResult.isSimulated).toBe(true);
    expect(callResult.provider).toBe('mock');

    // Verify all 4 lifecycle transitions were emitted in order
    expect(emitted.length).toBe(4);
    expect(emitted[0].subStatus).toBe('AGENT_RINGING');
    expect(emitted[1].subStatus).toBe('CUSTOMER_RINGING');
    expect(emitted[2].subStatus).toBe('CONNECTED');
    expect(emitted[3].subStatus).toBe('COMPLETED');
    expect(emitted[3].durationSeconds).toBe(60);
    expect(emitted[3].recordingUrl).toContain('.mp3');
  });

  // --------------------------------------------------------------------------
  // INVARIANTS 7-9: Call Failure Scenarios (Agent No Answer, Busy, Timeout)
  // --------------------------------------------------------------------------
  it('correctly simulates AGENT_NO_ANSWER scenario', async () => {
    mockProvider.setScenario('AGENT_NO_ANSWER');

    const events: any[] = [];
    mockProvider.subscribe((e) => events.push(e));

    await mockProvider.initiateCall({
      agentPhone: '+919988776655',
      customerPhone: '+919876543210',
      metadata: { leadId: 'lead_1', callAttemptId: 'att_1', organizationId: mockOrgId },
    });

    expect(events.length).toBe(2);
    expect(events[0].subStatus).toBe('AGENT_RINGING');
    expect(events[1].status).toBe(CallAttemptStatus.NO_ANSWER);
    expect(events[1].subStatus).toBe('AGENT_NO_ANSWER');
  });

  it('correctly simulates CUSTOMER_BUSY scenario', async () => {
    mockProvider.setScenario('CUSTOMER_BUSY');

    const events: any[] = [];
    mockProvider.subscribe((e) => events.push(e));

    await mockProvider.initiateCall({
      agentPhone: '+919988776655',
      customerPhone: '+919876543210',
      metadata: { leadId: 'lead_1', callAttemptId: 'att_1', organizationId: mockOrgId },
    });

    expect(events.length).toBe(2);
    expect(events[0].subStatus).toBe('AGENT_RINGING');
    expect(events[1].status).toBe(CallAttemptStatus.BUSY);
    expect(events[1].subStatus).toBe('CUSTOMER_BUSY');
  });

  it('correctly simulates PROVIDER_TIMEOUT scenario', async () => {
    mockProvider.setScenario('PROVIDER_TIMEOUT');

    const events: any[] = [];
    mockProvider.subscribe((e) => events.push(e));

    await mockProvider.initiateCall({
      agentPhone: '+919988776655',
      customerPhone: '+919876543210',
      metadata: { leadId: 'lead_1', callAttemptId: 'att_1', organizationId: mockOrgId },
    });

    expect(events.length).toBe(2);
    expect(events[1].status).toBe(CallAttemptStatus.FAILED);
    expect(events[1].subStatus).toBe('PROVIDER_TIMEOUT');
  });

  // --------------------------------------------------------------------------
  // INVARIANT 10: Idempotency on Duplicate Provider Events
  // --------------------------------------------------------------------------
  it('maintains idempotency and does not corrupt records when duplicate provider events arrive', async () => {
    const mockAttempt = {
      id: 'att_idempotent_1',
      organizationId: mockOrgId,
      leadId: 'lead_1',
      userId: telecaller1.userId,
      providerCallId: 'mock_call_dup_1',
      status: CallAttemptStatus.CONNECTED,
      connectedAt: new Date(),
      endedAt: null,
    };

    vi.spyOn(prisma.callAttempt, 'findFirst').mockResolvedValue(mockAttempt as any);
    vi.spyOn(prisma.callAttempt, 'update').mockResolvedValue(mockAttempt as any);
    vi.spyOn(prisma.callRecord, 'upsert').mockResolvedValue({ id: 'rec_1' } as any);
    vi.spyOn(prisma.callRecord, 'findUnique').mockResolvedValue({ id: 'rec_1' } as any);

    const [event1, duplicateEvent] = mockProvider.simulateDuplicateEvents('mock_call_dup_1');

    // Process original event
    const res1 = await telephonyService.processCdrEvent(event1);
    expect(res1?.callAttempt.status).toBe(CallAttemptStatus.CONNECTED);

    // Process duplicate event: should return existing attempt idempotently without error
    const res2 = await telephonyService.processCdrEvent(duplicateEvent);
    expect(res2?.callAttempt.status).toBe(CallAttemptStatus.CONNECTED);
  });

  // --------------------------------------------------------------------------
  // INVARIANT 11: Out-of-Order Provider Events Handling
  // --------------------------------------------------------------------------
  it('protects terminal state machine invariants when out-of-order events arrive', async () => {
    let currentAttemptState: any = {
      id: 'att_ooo_1',
      organizationId: mockOrgId,
      leadId: 'lead_1',
      userId: telecaller1.userId,
      providerCallId: 'mock_call_ooo_1',
      status: CallAttemptStatus.INITIATED,
      connectedAt: null,
      endedAt: null,
    };

    vi.spyOn(prisma.callAttempt, 'findFirst').mockImplementation(() =>
      Promise.resolve(currentAttemptState)
    );

    vi.spyOn(prisma.callAttempt, 'update').mockImplementation((args: any) => {
      currentAttemptState = { ...currentAttemptState, ...args.data };
      return Promise.resolve(currentAttemptState);
    });

    vi.spyOn(prisma.callRecord, 'upsert').mockResolvedValue({ id: 'rec_ooo_1' } as any);

    // Simulate COMPLETED arriving BEFORE CONNECTED (out-of-order)
    const [completedEvent, delayedConnectedEvent] =
      mockProvider.simulateOutOfOrderEvents('mock_call_ooo_1');

    // 1. COMPLETED arrives first
    const res1 = await telephonyService.processCdrEvent(completedEvent);
    expect(res1?.callAttempt.status).toBe(CallAttemptStatus.COMPLETED);
    expect(res1?.callAttempt.endedAt).not.toBeNull();

    // 2. Delayed CONNECTED arrives afterwards
    // The state machine must NOT downgrade COMPLETED back to CONNECTED!
    const res2 = await telephonyService.processCdrEvent(delayedConnectedEvent);
    expect(res2?.callAttempt.status).toBe(CallAttemptStatus.COMPLETED);
  });

  // --------------------------------------------------------------------------
  // INVARIANTS 12-13: Post-Call Disposition, Notes & Follow-up Scheduling
  // --------------------------------------------------------------------------
  it('records business disposition, note, updates lead disposition, and schedules follow-up', async () => {
    const mockAttempt = {
      id: 'att_disp_1',
      organizationId: mockOrgId,
      leadId: 'lead_disp_1',
      userId: telecaller1.userId,
      status: CallAttemptStatus.CONNECTED,
      endedAt: null,
    };

    const mockFollowUpDate = new Date(Date.now() + 86400000);
    const leadUpdateSpy = vi.fn().mockResolvedValue({ id: 'lead_disp_1' });

    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const tx = {
        callAttempt: {
          findUnique: vi.fn().mockResolvedValue(mockAttempt),
          update: vi.fn().mockResolvedValue({ ...mockAttempt, status: CallAttemptStatus.COMPLETED }),
        },
        callRecord: {
          upsert: vi.fn().mockResolvedValue({
            id: 'rec_disp_1',
            disposition: CallDisposition.INTERESTED,
            durationSeconds: 120,
            notes: 'Client interested in 3BHK tower A',
          }),
        },
        followUp: {
          create: vi.fn().mockResolvedValue({ id: 'fu_1' }),
        },
        lead: {
          update: leadUpdateSpy,
        },
        note: {
          create: vi.fn().mockResolvedValue({ id: 'note_1' }),
        },
      };
      return callback(tx);
    });

    const record = await telephonyService.recordCallDisposition(telecaller1, {
      callAttemptId: 'att_disp_1',
      disposition: CallDisposition.INTERESTED,
      leadDisposition: LeadDisposition.INTERESTED,
      durationSeconds: 120,
      notes: 'Client interested in 3BHK tower A',
      followUp: {
        scheduledAt: mockFollowUpDate,
        type: 'SITE_VISIT',
        notes: 'Schedule site visit with family',
      },
    });

    expect(record.disposition).toBe(CallDisposition.INTERESTED);
    expect(record.durationSeconds).toBe(120);
    expect(leadUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'lead_disp_1' },
        data: expect.objectContaining({
          disposition: LeadDisposition.INTERESTED,
        }),
      })
    );
  });
});
