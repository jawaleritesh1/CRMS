import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KnowlarityTelephonyAdapter } from '../../src/infrastructure/adapters/knowlarityAdapter.js';
import { telephonyService } from '../../src/domain/telephony/telephony.service.js';
import { prisma } from '../../src/core/database/prisma.js';
import {
  CallAttemptStatus,
  CallDisposition,
  LeadDisposition,
  ScopeType,
} from '@prisma/client';
import { ActorContext } from '../../security/context/actorContext.js';

describe('Knowlarity SuperReceptionist (sr.knowlarity.com) Telephony Integration', () => {
  const mockActor: ActorContext = {
    userId: 'user_sales_1',
    membershipId: 'mem_sales_1',
    organizationId: 'org_ralix_demo',
    roleId: 'role_sales',
    roleSlug: 'sales_executive',
    capabilities: new Set(['LEAD_VIEW', 'LEAD_UPDATE']),
    scope: ScopeType.ORGANIZATION,
    teamIds: [],
    projectIds: [],
    isSystemActor: false,
    authorizationVersion: 1,
    correlationId: 'corr_test_knowlarity',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('KnowlarityTelephonyAdapter', () => {
    it('builds valid SuperReceptionist duplex makecall payload with E.164 normalized numbers', () => {
      const payload = KnowlarityTelephonyAdapter.buildMakeCallPayload({
        agentPhone: '9876543210',
        customerPhone: '+91 91234 56789',
        kNumber: '+918047101111',
        callerId: '+918047101111',
        additionalParams: { leadId: 'lead_123', callAttemptId: 'att_456' },
      });

      expect(payload.agent_number).toBe('+919876543210');
      expect(payload.customer_number).toBe('+919123456789');
      expect(payload.k_number).toBe('+918047101111');
      expect(payload.caller_id).toBe('+918047101111');
      expect(payload.additional_params).toEqual({
        leadId: 'lead_123',
        callAttemptId: 'att_456',
      });
    });

    it('simulates duplex call in development mode and returns a generated providerCallId', async () => {
      const response = await KnowlarityTelephonyAdapter.executeMakeCall({
        agentPhone: '+919876543210',
        customerPhone: '+919123456789',
      });

      expect(response.success).toBe(true);
      expect(response.isSimulated).toBe(true);
      expect(response.providerCallId).toMatch(/^knowlarity_sr_/);
      expect(response.message).toContain('Knowlarity SuperReceptionist');
    });

    it('maps Knowlarity SuperReceptionist CDR status to domain CallAttemptStatus', () => {
      expect(KnowlarityTelephonyAdapter.mapCallStatus('Answered')).toBe(CallAttemptStatus.CONNECTED);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('completed')).toBe(CallAttemptStatus.COMPLETED);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('noanswer')).toBe(CallAttemptStatus.NO_ANSWER);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('missed')).toBe(CallAttemptStatus.NO_ANSWER);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('busy')).toBe(CallAttemptStatus.BUSY);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('cancelled')).toBe(CallAttemptStatus.CANCELLED);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('failed')).toBe(CallAttemptStatus.FAILED);
      expect(KnowlarityTelephonyAdapter.mapCallStatus('unknown_status')).toBe(CallAttemptStatus.INITIATED);
    });

    it('parses incoming Knowlarity SuperReceptionist CDR webhook payload accurately', () => {
      const rawCdr = {
        call_id: 'sr_call_abc123',
        call_status: 'answered',
        call_duration: '142',
        recording_url: 'https://sr.knowlarity.com/recordings/call_abc123.mp3',
        agent_number: '+919876543210',
        customer_number: '+919123456789',
        additional_params: {
          callAttemptId: 'att_test_789',
          leadId: 'lead_test_001',
        },
      };

      const parsed = KnowlarityTelephonyAdapter.parseWebhook(rawCdr);
      expect(parsed).not.toBeNull();
      expect(parsed?.providerCallId).toBe('sr_call_abc123');
      expect(parsed?.status).toBe(CallAttemptStatus.CONNECTED);
      expect(parsed?.durationSeconds).toBe(142);
      expect(parsed?.recordingUrl).toBe('https://sr.knowlarity.com/recordings/call_abc123.mp3');
      expect(parsed?.callAttemptId).toBe('att_test_789');
      expect(parsed?.leadId).toBe('lead_test_001');
    });
  });

  describe('Telephony Service Invariants', () => {
    it('creates CallAttempt and stores masked phone and providerCallId on initiateCall', async () => {
      const mockLead = {
        id: 'lead_1',
        organizationId: 'org_ralix_demo',
        assignedToId: 'user_sales_1',
        deletedAt: null,
        customer: {
          id: 'cust_1',
          name: 'Vikram Malhotra',
          phone: '+919876543210',
          normalizedPhone: '+919876543210',
        },
      };

      vi.spyOn(prisma.lead, 'findUnique').mockResolvedValue(mockLead as any);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'user_sales_1',
        phone: '+919988776655',
      } as any);

      vi.spyOn(prisma.callAttempt, 'create').mockResolvedValue({
        id: 'att_new_1',
        organizationId: 'org_ralix_demo',
        leadId: 'lead_1',
        userId: 'user_sales_1',
        status: CallAttemptStatus.INITIATED,
        maskedCustomerNumber: '+91 98765*****',
      } as any);

      vi.spyOn(prisma.callAttempt, 'update').mockResolvedValue({
        id: 'att_new_1',
        providerCallId: 'knowlarity_sr_call_99',
        status: CallAttemptStatus.RINGING,
      } as any);

      const result = await telephonyService.initiateCall(mockActor, {
        leadId: 'lead_1',
      });

      expect(result.callAttemptId).toBe('att_new_1');
      expect(result.status).toBe(CallAttemptStatus.RINGING);
      expect(result.maskedCustomerNumber).toContain('*');
    });

    it('processes CDR webhook to update CallAttempt and upsert CallRecord with duration and audio URL', async () => {
      const mockAttempt = {
        id: 'att_123',
        organizationId: 'org_ralix_demo',
        leadId: 'lead_1',
        userId: 'user_sales_1',
        providerCallId: 'sr_call_999',
        status: CallAttemptStatus.RINGING,
        connectedAt: null,
      };

      vi.spyOn(prisma.callAttempt, 'findFirst').mockResolvedValue(mockAttempt as any);
      vi.spyOn(prisma.callAttempt, 'update').mockResolvedValue({
        ...mockAttempt,
        status: CallAttemptStatus.COMPLETED,
        endedAt: new Date(),
      } as any);

      const upsertSpy = vi.spyOn(prisma.callRecord, 'upsert').mockResolvedValue({
        id: 'rec_123',
        organizationId: 'org_ralix_demo',
        callAttemptId: 'att_123',
        leadId: 'lead_1',
        userId: 'user_sales_1',
        durationSeconds: 185,
        recordingRef: 'https://sr.knowlarity.com/audio/sr_call_999.mp3',
      } as any);

      const webhookPayload = {
        call_id: 'sr_call_999',
        status: 'completed',
        duration: '185',
        recording_url: 'https://sr.knowlarity.com/audio/sr_call_999.mp3',
      };

      const result = await telephonyService.handleCdrWebhook(webhookPayload);
      expect(result).not.toBeNull();
      expect(result?.callAttempt.status).toBe(CallAttemptStatus.COMPLETED);
      expect(upsertSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { callAttemptId: 'att_123' },
          create: expect.objectContaining({
            durationSeconds: 185,
            recordingRef: 'https://sr.knowlarity.com/audio/sr_call_999.mp3',
          }),
        })
      );
    });
  });
});
