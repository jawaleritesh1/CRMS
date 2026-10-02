import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireCapability } from '../security/middleware/authMiddleware.js';
import { reportingService } from '../domain/reporting/reporting.service.js';

export const reportRouter = Router();

reportRouter.use(authMiddleware);

// GET /api/v1/reports/funnel - Historical Funnel Analytics (§33.3)
reportRouter.get(
  '/funnel',
  requireCapability('REPORT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cycle = req.query.cycle ? parseInt(req.query.cycle as string, 10) : undefined;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const funnel = await reportingService.getConversionFunnel(req.actor!, {
        cycle,
        startDate,
        endDate,
      });

      res.status(200).json({ success: true, data: funnel });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/reports/financials - Collections & Net Summary (§33.4)
reportRouter.get(
  '/financials',
  requireCapability('REPORT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const financials = await reportingService.getFinancialSummary(req.actor!);
      res.status(200).json({ success: true, data: financials });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/reports/audit - Audit Trail Search (§32.4)
reportRouter.get(
  '/audit',
  requireCapability('AUDIT_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entityType = req.query.entityType as string | undefined;
      const entityId = req.query.entityId as string | undefined;
      const actorId = req.query.actorId as string | undefined;
      const action = req.query.action as string | undefined;
      const take = req.query.take ? parseInt(req.query.take as string, 10) : 50;
      const skip = req.query.skip ? parseInt(req.query.skip as string, 10) : 0;

      const auditTrail = await reportingService.searchAuditTrail(req.actor!, {
        entityType,
        entityId,
        actorId,
        action,
        take,
        skip,
      });

      res.status(200).json({ success: true, data: auditTrail });
    } catch (err) {
      next(err);
    }
  }
);
