import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authMiddleware, requireCapability } from '../security/middleware/authMiddleware.js';
import { inventoryService } from '../domain/inventory/inventory.service.js';
import { prisma } from '../core/database/prisma.js';

export const inventoryRouter = Router();

// Apply auth to all inventory routes
inventoryRouter.use(authMiddleware);

const holdUnitSchema = z.object({
  leadId: z.string().optional(),
  holdDurationHours: z.number().int().min(1).max(72).optional(),
  reason: z.string().optional(),
});

const releaseUnitSchema = z.object({
  reason: z.string().optional(),
});

// GET /api/v1/inventory/units - List property units
inventoryRouter.get(
  '/units',
  requireCapability('UNIT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const actor = req.actor!;
      const units = await prisma.propertyUnit.findMany({
        where: { organizationId: actor.organizationId },
        include: {
          project: { select: { id: true, name: true } },
          tower: { select: { id: true, name: true } },
          holds: {
            where: { status: 'ACTIVE' },
            select: { id: true, heldAt: true, expiresAt: true, heldByUserId: true },
          },
        },
        orderBy: [{ towerId: 'asc' }, { floorNumber: 'asc' }, { unitNumber: 'asc' }],
        take: 100,
      });

      res.status(200).json({ success: true, data: units });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/inventory/units/:id/hold - Hold Unit (§14.3)
inventoryRouter.post(
  '/units/:id/hold',
  requireCapability('UNIT_HOLD'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = holdUnitSchema.parse(req.body);
      const result = await inventoryService.holdUnit(req.actor!, {
        unitId: req.params.id as string,
        leadId: input.leadId,
        holdDurationHours: input.holdDurationHours,
        reason: input.reason,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/inventory/units/:id/release - Release Unit (§14.5)
inventoryRouter.post(
  '/units/:id/release',
  requireCapability('UNIT_RELEASE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = releaseUnitSchema.parse(req.body);
      const result = await inventoryService.releaseUnit(req.actor!, {
        unitId: req.params.id as string,
        reason: input.reason,
      });
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);
