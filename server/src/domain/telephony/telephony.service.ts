import {
  CallAttemptStatus,
  CallDisposition,
  LeadDisposition,
} from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { piiMasker } from '../../security/pii/piiMasker.js';
import { scopeFilter } from '../../security/authorization/scopeFilter.js';
import { ResourceNotFoundError, OutsideScopeError, ValidationError } from '../../core/errors/appError.js';
import { getTelephonyProvider } from '../../infrastructure/telephony/telephonyProviderFactory.js';
import { NormalizedCdrEvent, TelephonyProvider } from './telephony.provider.js';
import { logger } from '../../core/logging/logger.js';

export interface InitiateCallInput {
  leadId: string;
  agentPhone?: string;
  callerId?: string;
}

export interface RecordCallDispositionInput {
  callAttemptId: string;
  disposition: CallDisposition;
  notes?: string;
  durationSeconds?: number;
  leadDisposition?: LeadDisposition;
  followUp?: {
    scheduledAt: string | Date;
    notes?: string;
    type?: string;
  };
}

export const telephonyService = {
  /**
   * Initiates a Click-to-Call duplex session via the active TelephonyProvider (§19.1).
   * 1. Validates actor authorization & tenant scope.
   * 2. Resolves and masks customer phone number.
   * 3. Creates an immutable CallAttempt technical record.
   * 4. Dispatches request to provider-neutral TelephonyProvider (MockTelephonyProvider in dev/test).
   */
  async initiateCall(
    actor: ActorContext,
    input: InitiateCallInput,
    client = defaultPrisma,
    providerOverride?: TelephonyProvider
  ) {
    const provider = providerOverride || getTelephonyProvider();

    // 1. Fetch lead with customer inside tenant
    const lead = await client.lead.findUnique({
      where: { id: input.leadId },
      include: { customer: true },
    });

    if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
      throw new ResourceNotFoundError('Lead not found for call initiation', 'leadId');
    }

    // 2. Check scope authorization
    const scopeWhere = scopeFilter.forLead(actor);
    if (scopeWhere.assignedToId && lead.assignedToId !== scopeWhere.assignedToId) {
      throw new OutsideScopeError('Lead is outside user authorized scope', 'leadId');
    }

    const customerPhone = lead.customer?.phone || lead.customer?.normalizedPhone;
    if (!customerPhone) {
      throw new ValidationError('Lead customer does not have a valid phone number', 'phone');
    }

    // 3. Resolve agent phone
    let agentPhone = input.agentPhone;
    if (!agentPhone) {
      const user = await client.user.findUnique({
        where: { id: actor.userId },
        select: { phone: true },
      });
      agentPhone = user?.phone || '+919876543210';
    }

    // 4. Mask customer number for logging & storage
    const maskedCustomerNumber = piiMasker.maskPhone(customerPhone);

    // 5. Create CallAttempt technical record
    const callAttempt = await client.callAttempt.create({
      data: {
        organizationId: actor.organizationId,
        leadId: lead.id,
        userId: actor.userId,
        status: CallAttemptStatus.INITIATED,
        maskedCustomerNumber,
        agentExtension: agentPhone,
        initiatedAt: new Date(),
      },
    });

    // 6. Execute initiateCall via provider abstraction (Mock in dev/test, Knowlarity in prod)
    const callResponse = await provider.initiateCall({
      agentPhone,
      customerPhone,
      callerId: input.callerId,
      metadata: {
        leadId: lead.id,
        callAttemptId: callAttempt.id,
        organizationId: actor.organizationId,
        userId: actor.userId,
      },
    });

    // 7. Update CallAttempt with provider reference and initial state
    const updatedAttempt = await client.callAttempt.update({
      where: { id: callAttempt.id },
      data: {
        providerCallId: callResponse.providerCallId || `call_${callAttempt.id}`,
        status: callResponse.success
          ? callResponse.status || CallAttemptStatus.RINGING
          : CallAttemptStatus.FAILED,
      },
    });

    logger.info({
      msg: 'Telephony call session initiated',
      provider: provider.name,
      callAttemptId: callAttempt.id,
      providerCallId: updatedAttempt.providerCallId,
      status: updatedAttempt.status,
      isSimulated: callResponse.isSimulated,
    });

    return {
      callAttemptId: updatedAttempt.id,
      providerCallId: updatedAttempt.providerCallId,
      status: updatedAttempt.status,
      maskedCustomerNumber,
      message: callResponse.message,
      isSimulated: callResponse.isSimulated ?? false,
      provider: provider.name,
    };
  },

  /**
   * Records call disposition and business outcome (§19.1, §10.1).
   * Persists CallRecord, optionally cascades LeadDisposition, and schedules follow-up if requested.
   */
  async recordCallDisposition(actor: ActorContext, input: RecordCallDispositionInput, client = defaultPrisma) {
    return client.$transaction(async (tx) => {
      // 1. Fetch CallAttempt
      const callAttempt = await tx.callAttempt.findUnique({
        where: { id: input.callAttemptId },
        include: { callRecord: true },
      });

      if (!callAttempt || callAttempt.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Call attempt not found', 'callAttemptId');
      }

      // 2. Mark CallAttempt as COMPLETED if not already terminal
      const terminalStatuses: CallAttemptStatus[] = [
        CallAttemptStatus.COMPLETED,
        CallAttemptStatus.FAILED,
        CallAttemptStatus.CANCELLED,
        CallAttemptStatus.NO_ANSWER,
        CallAttemptStatus.BUSY,
      ];

      const newStatus = terminalStatuses.includes(callAttempt.status)
        ? callAttempt.status
        : CallAttemptStatus.COMPLETED;

      await tx.callAttempt.update({
        where: { id: callAttempt.id },
        data: {
          status: newStatus,
          endedAt: callAttempt.endedAt || new Date(),
        },
      });

      // 3. Upsert CallRecord (Business call fact)
      const callRecord = await tx.callRecord.upsert({
        where: { callAttemptId: callAttempt.id },
        create: {
          organizationId: actor.organizationId,
          callAttemptId: callAttempt.id,
          leadId: callAttempt.leadId,
          userId: actor.userId,
          durationSeconds: input.durationSeconds ?? 0,
          disposition: input.disposition,
          notes: input.notes ?? null,
        },
        update: {
          durationSeconds: input.durationSeconds ?? undefined,
          disposition: input.disposition,
          notes: input.notes ?? undefined,
        },
      });

      // 4. Optionally update Lead.disposition if provided
      if (input.leadDisposition) {
        await tx.lead.update({
          where: { id: callAttempt.leadId },
          data: {
            disposition: input.leadDisposition,
            version: { increment: 1 },
          },
        });
      }

      // 5. Optionally schedule follow-up
      if (input.followUp) {
        const scheduledDate = new Date(input.followUp.scheduledAt);
        await tx.followUp.create({
          data: {
            organizationId: actor.organizationId,
            leadId: callAttempt.leadId,
            assignedToId: actor.userId,
            type: input.followUp.type || 'CALL',
            status: 'PENDING',
            scheduledAt: scheduledDate,
            notes: input.followUp.notes || input.notes || null,
          },
        });

        // Update derived lead nextFollowUpAt (§10.6)
        await tx.lead.update({
          where: { id: callAttempt.leadId },
          data: {
            nextFollowUpAt: scheduledDate,
          },
        });
      }

      // 6. Record note if notes provided
      if (input.notes) {
        await tx.note.create({
          data: {
            organizationId: actor.organizationId,
            leadId: callAttempt.leadId,
            authorId: actor.userId,
            content: `[Call Log - ${input.disposition}]: ${input.notes}`,
          },
        });
      }

      logger.info({
        msg: 'Call disposition saved successfully',
        callAttemptId: callAttempt.id,
        callRecordId: callRecord.id,
        disposition: input.disposition,
        leadDisposition: input.leadDisposition,
      });

      return callRecord;
    });
  },

  /**
   * Processes a normalized CDR event with strict idempotency and out-of-order protection (§19.1, §36.2).
   */
  async processCdrEvent(cdr: NormalizedCdrEvent, client = defaultPrisma) {
    // 1. Locate CallAttempt by providerCallId or direct ID
    const callAttempt = await client.callAttempt.findFirst({
      where: {
        OR: [
          { providerCallId: cdr.providerCallId },
          ...(cdr.callAttemptId ? [{ id: cdr.callAttemptId }] : []),
        ],
      },
    });

    if (!callAttempt) {
      logger.info({
        msg: 'No matching CallAttempt found for normalized CDR event. Webhook recorded for audit.',
        providerCallId: cdr.providerCallId,
      });
      return null;
    }

    const terminalStatuses: CallAttemptStatus[] = [
      CallAttemptStatus.COMPLETED,
      CallAttemptStatus.FAILED,
      CallAttemptStatus.CANCELLED,
      CallAttemptStatus.NO_ANSWER,
      CallAttemptStatus.BUSY,
    ];

    const isCurrentTerminal = terminalStatuses.includes(callAttempt.status);

    // Idempotency: If duplicate event received with identical status, return early without overwriting
    if (callAttempt.status === cdr.status && cdr.rawPayload?.isDuplicate) {
      logger.info({
        msg: 'Duplicate CDR event received; idempotently returning existing CallAttempt',
        providerCallId: cdr.providerCallId,
        status: callAttempt.status,
      });
      const record = await client.callRecord.findUnique({ where: { callAttemptId: callAttempt.id } });
      return { callAttempt, callRecord: record };
    }

    // Out-of-Order Guard: If current status is terminal and incoming status is non-terminal (e.g. late RINGING or CONNECTED),
    // ignore status downgrade to protect state machine invariants (§36.2).
    let resolvedStatus = cdr.status;
    if (isCurrentTerminal && !terminalStatuses.includes(cdr.status)) {
      logger.warn({
        msg: 'Ignored out-of-order non-terminal status update on already terminal CallAttempt',
        callAttemptId: callAttempt.id,
        currentStatus: callAttempt.status,
        ignoredIncomingStatus: cdr.status,
      });
      resolvedStatus = callAttempt.status;
    }

    // Update timestamps safely
    const connectedAt =
      cdr.status === CallAttemptStatus.CONNECTED || cdr.status === CallAttemptStatus.COMPLETED
        ? callAttempt.connectedAt || new Date()
        : callAttempt.connectedAt;

    const endedAt =
      terminalStatuses.includes(resolvedStatus)
        ? callAttempt.endedAt || new Date()
        : callAttempt.endedAt;

    // Update CallAttempt
    const updatedAttempt = await client.callAttempt.update({
      where: { id: callAttempt.id },
      data: {
        status: resolvedStatus,
        connectedAt,
        endedAt,
      },
    });

    // Upsert CallRecord with duration and recording ref
    const callRecord = await client.callRecord.upsert({
      where: { callAttemptId: callAttempt.id },
      create: {
        organizationId: callAttempt.organizationId,
        callAttemptId: callAttempt.id,
        leadId: callAttempt.leadId,
        userId: callAttempt.userId,
        durationSeconds: cdr.durationSeconds,
        recordingRef: cdr.recordingUrl ?? null,
      },
      update: {
        durationSeconds: cdr.durationSeconds || undefined,
        recordingRef: cdr.recordingUrl ?? undefined,
      },
    });

    logger.info({
      msg: 'Normalized CDR processed and applied to CallAttempt and CallRecord',
      callAttemptId: updatedAttempt.id,
      providerCallId: cdr.providerCallId,
      status: updatedAttempt.status,
      durationSeconds: cdr.durationSeconds,
      hasRecording: !!cdr.recordingUrl,
    });

    return {
      callAttempt: updatedAttempt,
      callRecord,
    };
  },

  /**
   * Normalizes incoming raw CDR payload using active provider and applies it (§19.1).
   */
  async handleCdrWebhook(payload: any, client = defaultPrisma, providerOverride?: TelephonyProvider) {
    const provider = providerOverride || getTelephonyProvider();
    const cdr = provider.normalizeCdr(payload);
    return this.processCdrEvent(cdr, client);
  },

  /**
   * Retrieves a CallAttempt by ID within the actor's tenant boundary.
   */
  async getCallAttempt(actor: ActorContext, callAttemptId: string, client = defaultPrisma) {
    const callAttempt = await client.callAttempt.findUnique({
      where: { id: callAttemptId },
      include: {
        callRecord: true,
        lead: {
          select: {
            id: true,
            status: true,
            lifecycleStage: true,
            temperature: true,
            disposition: true,
            customer: true,
          },
        },
      },
    });

    if (!callAttempt || callAttempt.organizationId !== actor.organizationId) {
      throw new ResourceNotFoundError('Call attempt not found', 'callAttemptId');
    }

    return {
      ...callAttempt,
      maskedCustomerNumber: callAttempt.maskedCustomerNumber,
    };
  },

  /**
   * Retrieves recent calls for the actor's tenant or lead.
   */
  async getRecentCalls(
    actor: ActorContext,
    options?: { leadId?: string; limit?: number },
    client = defaultPrisma
  ) {
    const limit = Math.min(options?.limit || 20, 100);

    return client.callAttempt.findMany({
      where: {
        organizationId: actor.organizationId,
        ...(options?.leadId ? { leadId: options.leadId } : {}),
      },
      include: {
        callRecord: true,
        lead: {
          select: {
            id: true,
            customer: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { initiatedAt: 'desc' },
      take: limit,
    });
  },
};
