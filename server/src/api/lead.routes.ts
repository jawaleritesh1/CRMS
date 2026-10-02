import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  LeadLifecycleStage,
  LeadTemperature,
  LeadDisposition,
  AssignmentReason,
} from '@prisma/client';
import { authMiddleware, requireCapability } from '../security/middleware/authMiddleware.js';
import { leadService } from '../domain/lead/lead.service.js';
import { assignmentService } from '../domain/assignment/assignment.service.js';
import { prisma } from '../core/database/prisma.js';
import { scopeFilter } from '../security/authorization/scopeFilter.js';
import { piiMasker } from '../security/pii/piiMasker.js';
import { ResourceNotFoundError, OutsideScopeError } from '../core/errors/appError.js';

export const leadRouter = Router();

// Apply auth to all lead routes
leadRouter.use(authMiddleware);

const createLeadSchema = z.object({
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email().optional().nullable(),
    city: z.string().optional().nullable(),
  }),
  projectId: z.string().optional(),
  sourceId: z.string().optional(),
  campaignId: z.string().optional(),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
  preferredConfig: z.string().optional(),
  notes: z.string().optional(),
});

const changeStageSchema = z.object({
  toStage: z.nativeEnum(LeadLifecycleStage),
  reason: z.string().optional(),
  expectedVersion: z.number().int().optional(),
});

const updateTemperatureSchema = z.object({
  toTemperature: z.nativeEnum(LeadTemperature),
  reason: z.string().optional(),
});

const updateDispositionSchema = z.object({
  toDisposition: z.nativeEnum(LeadDisposition),
  reason: z.string().optional(),
});

// POST /api/v1/leads - Create Lead
leadRouter.post(
  '/',
  requireCapability('LEAD_CREATE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = createLeadSchema.parse(req.body);
      const lead = await leadService.createLead(req.actor!, input);
      res.status(201).json({ success: true, data: lead });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/leads - List Leads within scope
leadRouter.get(
  '/',
  requireCapability('LEAD_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = req.actor!;
      const scopeWhere = scopeFilter.forLead(actor);
      const finalWhere = scopeFilter.composeWhere(actor, scopeWhere, { deletedAt: null });

      const leads = await prisma.lead.findMany({
        where: finalWhere,
        include: {
          customer: true,
          project: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, user: { select: { name: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Project customer PII according to policy & actor capability (§31.3)
      const projectedLeads = leads.map((lead) => ({
        ...lead,
        customer: piiMasker.projectCustomer(lead.customer, actor),
      }));

      res.status(200).json({ success: true, data: projectedLeads });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/leads/:id - Get Lead Details
leadRouter.get(
  '/:id',
  requireCapability('LEAD_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = req.actor!;
      const lead = await prisma.lead.findUnique({
        where: { id: req.params.id },
        include: {
          customer: true,
          project: true,
          stageHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
          statusHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
          temperatureHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
          dispositionHistory: { orderBy: { createdAt: 'desc' }, take: 10 },
          duplicateCandidates: true,
        },
      });

      if (!lead || lead.organizationId !== actor.organizationId || lead.deletedAt) {
        throw new ResourceNotFoundError('Lead not found', 'leadId');
      }

      // Check record scope ownership (§7.3)
      const scopeWhere = scopeFilter.forLead(actor);
      if (scopeWhere.assignedToId && lead.assignedToId !== scopeWhere.assignedToId) {
        throw new OutsideScopeError('Lead is outside user authorized scope', 'leadId');
      }

      res.status(200).json({
        success: true,
        data: {
          ...lead,
          customer: piiMasker.projectCustomer(lead.customer, actor),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/leads/:id/stage - Change Stage
leadRouter.patch(
  '/:id/stage',
  requireCapability('LEAD_UPDATE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = changeStageSchema.parse(req.body);
      const updated = await leadService.changeLeadStage(req.actor!, {
        leadId: req.params.id as string,
        toStage: input.toStage,
        reason: input.reason,
        expectedVersion: input.expectedVersion,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/leads/:id/temperature - Update Temperature
leadRouter.patch(
  '/:id/temperature',
  requireCapability('LEAD_UPDATE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateTemperatureSchema.parse(req.body);
      const updated = await leadService.updateTemperature(req.actor!, {
        leadId: req.params.id as string,
        toTemperature: input.toTemperature,
        reason: input.reason,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/v1/leads/:id/disposition - Update Disposition
leadRouter.patch(
  '/:id/disposition',
  requireCapability('LEAD_UPDATE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = updateDispositionSchema.parse(req.body);
      const updated = await leadService.updateDisposition(req.actor!, {
        leadId: req.params.id as string,
        toDisposition: input.toDisposition,
        reason: input.reason,
      });
      res.status(200).json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
);

const assignLeadSchema = z.object({
  toUserIdOrMembershipId: z.string().min(1),
  reason: z.nativeEnum(AssignmentReason).optional(),
});

// POST /api/v1/leads/:id/assign - Assign or Reassign Lead (§11.1)
leadRouter.post(
  '/:id/assign',
  requireCapability('LEAD_ASSIGN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = assignLeadSchema.parse(req.body);
      const result = await assignmentService.assignLead(req.actor!, {
        leadId: req.params.id as string,
        toUserIdOrMembershipId: input.toUserIdOrMembershipId,
        reason: input.reason,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/leads/:id/claim - First-Accept-Wins Atomic Lead Claim (§11, §39, INV-CLM-001)
leadRouter.post(
  '/:id/claim',
  requireCapability('LEAD_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await leadService.claimLead(req.actor!, {
        leadId: req.params.id as string,
      });

      res.status(200).json({
        success: true,
        data: {
          lead: {
            ...result,
            customer: piiMasker.projectCustomer(result.customer, req.actor!),
          },
          claimedAt: new Date().toISOString(),
          message: 'Lead claimed successfully',
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

