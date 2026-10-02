import { describe, it, expect, vi, beforeEach } from 'vitest';
import { leadService } from '../../src/domain/lead/lead.service.js';
import { prisma } from '../../src/core/database/prisma.js';
import { ScopeType } from '@prisma/client';
import { ActorContext } from '../../src/security/context/actorContext.js';
import { ConflictError, ResourceNotFoundError } from '../../src/core/errors/appError.js';

describe('INV-CLM: First-Accept-Wins Lead Claim Concurrency Suite (§11, §39, INV-CLM-001)', () => {
  const actorA: ActorContext = {
    userId: 'user_agent_A',
    membershipId: 'mem_agent_A',
    organizationId: 'org_ralix_demo',
    roleId: 'role_sales',
    roleSlug: 'sales_executive',
    capabilities: new Set(['LEAD_VIEW', 'LEAD_UPDATE']),
    scope: ScopeType.ORGANIZATION,
    teamIds: [],
    projectIds: [],
    isSystemActor: false,
    authorizationVersion: 1,
    correlationId: 'corr_agent_A',
  };

  const actorB: ActorContext = {
    userId: 'user_agent_B',
    membershipId: 'mem_agent_B',
    organizationId: 'org_ralix_demo',
    roleId: 'role_sales',
    roleSlug: 'sales_executive',
    capabilities: new Set(['LEAD_VIEW', 'LEAD_UPDATE']),
    scope: ScopeType.ORGANIZATION,
    teamIds: [],
    projectIds: [],
    isSystemActor: false,
    authorizationVersion: 1,
    correlationId: 'corr_agent_B',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('INV-CLM-CONC-001: Under concurrent accept requests, exactly one telecaller wins and the loser receives ConflictError', async () => {
    let currentAssignedToId: string | null = null;
    let versionCounter = 0;

    const baseLead = {
      id: 'lead_unclaimed_1',
      organizationId: 'org_ralix_demo',
      projectId: 'proj_1',
      assignedToId: null,
      version: 0,
      deletedAt: null,
      customer: { id: 'cust_1', name: 'Rahul Sharma', phone: '+919876543210' },
      project: { id: 'proj_1', name: 'Park Avenue' },
    };

    let lockHeld = false;
    const lockQueue: (() => void)[] = [];

    const acquireLock = () =>
      new Promise<void>((resolve) => {
        if (!lockHeld) {
          lockHeld = true;
          resolve();
        } else {
          lockQueue.push(resolve);
        }
      });

    const releaseLock = () => {
      if (lockQueue.length > 0) {
        const next = lockQueue.shift();
        next?.();
      } else {
        lockHeld = false;
      }
    };

    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      await acquireLock();
      try {
        const txMock = {
          lead: {
            findUnique: vi.fn().mockImplementation(async () => {
              return {
                ...baseLead,
                assignedToId: currentAssignedToId,
                version: versionCounter,
              };
            }),
            update: vi.fn().mockImplementation(async (args: any) => {
              currentAssignedToId = args.data.assignedToId;
              versionCounter++;
              return {
                ...baseLead,
                assignedToId: currentAssignedToId,
                version: versionCounter,
              };
            }),
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({ id: 'user_agent_A', name: 'Agent A' }),
          },
          leadAssignment: {
            create: vi.fn().mockResolvedValue({ id: 'asgn_1' }),
          },
          auditLog: {
            create: vi.fn().mockResolvedValue({ id: 'audit_1' }),
          },
          outboxEvent: {
            create: vi.fn().mockResolvedValue({ id: 'outbox_1' }),
          },
        };
        return await cb(txMock);
      } finally {
        releaseLock();
      }
    });

    // Both Agent A and Agent B claim
    const claimA = leadService.claimLead(actorA, { leadId: 'lead_unclaimed_1' });
    const claimB = leadService.claimLead(actorB, { leadId: 'lead_unclaimed_1' });

    const results = await Promise.allSettled([claimA, claimB]);

    const successes = results.filter((r) => r.status === 'fulfilled');
    const failures = results.filter((r) => r.status === 'rejected');

    // Exactly one winner, exactly one conflict
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);

    const winnerResult = (successes[0] as PromiseFulfilledResult<any>).value;
    expect(winnerResult.assignedToId).toBe('user_agent_A');

    const loserError = (failures[0] as PromiseRejectedResult).reason;
    expect(loserError).toBeInstanceOf(ConflictError);
    expect(loserError.message).toContain('already accepted');
  });

  it('INV-CLM-TENANT: Rejects claim if lead belongs to another tenant', async () => {
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const txMock = {
        lead: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'lead_other_tenant',
            organizationId: 'org_DIFFERENT_TENANT', // Mismatch!
            assignedToId: null,
            deletedAt: null,
          }),
        },
      };
      return cb(txMock);
    });

    await expect(
      leadService.claimLead(actorA, { leadId: 'lead_other_tenant' })
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('INV-CLM-WORKFLOW: Full End-to-End Claim -> Auto-Dial -> Disposition -> FollowUp Pipeline', async () => {
    const { telephonyService } = await import('../../src/domain/telephony/telephony.service.js');
    const { CallDisposition, LeadDisposition, CallAttemptStatus } = await import('@prisma/client');

    const leadId = 'lead_e2e_101';
    const mockLead = {
      id: leadId,
      organizationId: 'org_ralix_demo',
      assignedToId: 'user_agent_A',
      deletedAt: null,
      customer: {
        id: 'cust_e2e',
        name: 'Rahul Sharma',
        phone: '+919876543210',
        normalizedPhone: '+919876543210',
      },
    };

    // 1. Telephony initiation
    vi.spyOn(prisma.lead, 'findUnique').mockResolvedValue(mockLead as any);
    vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({ id: 'user_agent_A', phone: '+919988776655' } as any);
    vi.spyOn(prisma.callAttempt, 'create').mockResolvedValue({
      id: 'att_e2e_1',
      organizationId: 'org_ralix_demo',
      leadId,
      userId: 'user_agent_A',
      status: CallAttemptStatus.INITIATED,
    } as any);
    vi.spyOn(prisma.callAttempt, 'update').mockResolvedValue({
      id: 'att_e2e_1',
      providerCallId: 'knowlarity_sr_call_101',
      status: CallAttemptStatus.RINGING,
    } as any);

    const callResult = await telephonyService.initiateCall(actorA, { leadId });
    expect(callResult.callAttemptId).toBe('att_e2e_1');
    expect(callResult.status).toBe(CallAttemptStatus.RINGING);
    expect(callResult.maskedCustomerNumber).toContain('*');

    // 2. Post-call disposition
    vi.spyOn(prisma, '$transaction').mockImplementation(async (cb: any) => {
      const txMock = {
        callAttempt: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'att_e2e_1',
            organizationId: 'org_ralix_demo',
            leadId,
          }),
          update: vi.fn().mockResolvedValue({ id: 'att_e2e_1', status: CallAttemptStatus.COMPLETED }),
        },
        callRecord: {
          upsert: vi.fn().mockResolvedValue({
            id: 'rec_e2e_1',
            callAttemptId: 'att_e2e_1',
            disposition: CallDisposition.INTERESTED,
            durationSeconds: 145,
          }),
        },
        followUp: {
          create: vi.fn().mockResolvedValue({ id: 'flw_1' }),
        },
        lead: {
          findUnique: vi.fn().mockResolvedValue(mockLead),
          update: vi.fn().mockResolvedValue({ ...mockLead, disposition: LeadDisposition.INTERESTED }),
        },
        leadDispositionHistory: {
          create: vi.fn().mockResolvedValue({ id: 'ldh_1' }),
        },
        auditLog: {
          create: vi.fn().mockResolvedValue({ id: 'aud_1' }),
        },
        outboxEvent: {
          create: vi.fn().mockResolvedValue({ id: 'out_1' }),
        },
        note: {
          create: vi.fn().mockResolvedValue({ id: 'note_1' }),
        },
      };
      return cb(txMock);
    });

    const dispositionResult = await telephonyService.recordCallDisposition(actorA, {
      callAttemptId: 'att_e2e_1',
      disposition: CallDisposition.INTERESTED,
      leadDisposition: LeadDisposition.INTERESTED,
      durationSeconds: 145,
      notes: 'Customer interested in 2BHK on 4th floor. Requested site visit.',
      followUp: {
        scheduledAt: new Date(Date.now() + 86400000),
        notes: 'Site visit confirmed',
        type: 'SITE_VISIT',
      },
    });

    expect(dispositionResult.disposition).toBe(CallDisposition.INTERESTED);
    expect(dispositionResult.durationSeconds).toBe(145);
  });
});

