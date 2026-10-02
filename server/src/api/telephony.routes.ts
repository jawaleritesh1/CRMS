import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { CallDisposition, LeadDisposition } from '@prisma/client';
import { authMiddleware, requireCapability } from '../security/middleware/authMiddleware.js';
import { telephonyService } from '../domain/telephony/telephony.service.js';

export const telephonyRouter = Router();

// Enforce auth on all telephony operations
telephonyRouter.use(authMiddleware);

const initiateCallSchema = z.object({
  leadId: z.string().min(1, 'leadId is required'),
  agentPhone: z.string().optional(),
});

const recordDispositionSchema = z.object({
  disposition: z.nativeEnum(CallDisposition),
  notes: z.string().optional(),
  durationSeconds: z.number().int().nonnegative().optional(),
  leadDisposition: z.nativeEnum(LeadDisposition).optional(),
  followUp: z
    .object({
      scheduledAt: z.string(),
      notes: z.string().optional(),
      type: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/v1/telephony/call - Initiate Click-to-Call duplex via Knowlarity SuperReceptionist
 */
telephonyRouter.post(
  '/call',
  requireCapability('LEAD_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = initiateCallSchema.parse(req.body);
      const result = await telephonyService.initiateCall(req.actor!, input);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/telephony/call/:id/disposition - Submit Call Disposition & Follow-up
 */
telephonyRouter.post(
  '/call/:id/disposition',
  requireCapability('LEAD_UPDATE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = recordDispositionSchema.parse(req.body);
      const result = await telephonyService.recordCallDisposition(req.actor!, {
        callAttemptId: req.params.id as string,
        ...input,
      });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/telephony/call/:id - Get Call Attempt details
 */
telephonyRouter.get(
  '/call/:id',
  requireCapability('LEAD_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await telephonyService.getCallAttempt(req.actor!, req.params.id as string);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/telephony/history - Get recent calls
 */
telephonyRouter.get(
  '/history',
  requireCapability('LEAD_VIEW'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leadId = req.query.leadId ? String(req.query.leadId) : undefined;
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : undefined;
      const result = await telephonyService.getRecentCalls(req.actor!, { leadId, limit });
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/telephony/mock-scenario - Configure active mock simulation scenario (Dev & Test only)
 */
telephonyRouter.post(
  '/mock-scenario',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { MockTelephonyProvider } = await import('../infrastructure/telephony/mockTelephonyProvider.js');
      const mockProvider = MockTelephonyProvider.getInstance();
      const { scenario, autoAdvanceDelayMs } = req.body;

      if (scenario) {
        mockProvider.setScenario(scenario, { autoAdvanceDelayMs });
      }

      res.status(200).json({
        success: true,
        currentScenario: mockProvider.getScenario(),
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/telephony/mock-event - Trigger a simulated lifecycle event (Dev & Test only)
 */
telephonyRouter.post(
  '/mock-event',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { MockTelephonyProvider } = await import('../infrastructure/telephony/mockTelephonyProvider.js');
      const mockProvider = MockTelephonyProvider.getInstance();
      const { providerCallId, eventType, durationSeconds } = req.body;

      if (!providerCallId) {
        res.status(400).json({ success: false, message: 'providerCallId is required' });
        return;
      }

      let event;
      switch (eventType) {
        case 'agent_ringing':
          event = mockProvider.simulateAgentRinging(providerCallId);
          break;
        case 'customer_ringing':
          event = mockProvider.simulateCustomerRinging(providerCallId);
          break;
        case 'connected':
          event = mockProvider.simulateConnected(providerCallId);
          break;
        case 'completed':
          event = mockProvider.simulateCompleted(providerCallId, durationSeconds ?? 45);
          break;
        case 'agent_no_answer':
          event = mockProvider.simulateAgentNoAnswer(providerCallId);
          break;
        case 'customer_no_answer':
          event = mockProvider.simulateCustomerNoAnswer(providerCallId);
          break;
        case 'customer_busy':
          event = mockProvider.simulateCustomerBusy(providerCallId);
          break;
        case 'provider_timeout':
          event = mockProvider.simulateProviderTimeout(providerCallId);
          break;
        case 'failed':
          event = mockProvider.simulateFailed(providerCallId);
          break;
        case 'cancelled':
          event = mockProvider.simulateCancelled(providerCallId);
          break;
        case 'duplicate_events':
          event = mockProvider.simulateDuplicateEvents(providerCallId);
          break;
        case 'out_of_order':
          event = mockProvider.simulateOutOfOrderEvents(providerCallId);
          break;
        default:
          res.status(400).json({ success: false, message: `Unknown eventType: ${eventType}` });
          return;
      }

      // Synchronize with database state
      if (Array.isArray(event)) {
        for (const ev of event) {
          await telephonyService.processCdrEvent(ev);
        }
      } else if (event) {
        await telephonyService.processCdrEvent(event);
      }

      res.status(200).json({
        success: true,
        event,
      });
    } catch (err) {
      next(err);
    }
  }
);
