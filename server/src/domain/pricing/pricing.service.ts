import { CostSheetStatus, ChangeSource, DomainEventType } from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { targetValidator } from '../../security/authorization/targetValidator.js';
import { ResourceNotFoundError, ConflictError, ValidationError, ForbiddenError } from '../../core/errors/appError.js';

export interface GenerateCostSheetInput {
  leadId: string;
  unitId: string;
  pricingRuleVersionId?: string;
  parkingAmount?: number;
  amenitiesAmount?: number;
  discountRequested?: number;
}

export interface CostBreakdown {
  basePrice: number;
  floorRiseAmount: number;
  plcAmount: number;
  parkingAmount: number;
  amenitiesAmount: number;
  discountApplied: number;
  agreementValue: number;
  gstAmount: number;
  stampDutyAmount: number;
  registrationAmount: number;
  otherCharges: number;
  totalAllInclusive: number;
}

export const pricingService = {
  /**
   * Pure point-in-time calculation engine (§15.2).
   */
  calculateCostBreakdown(
    unit: {
      carpetAreaSqFt: number | any;
      basePrice: number | any;
      floorNumber: number;
      plcAmount: number | any;
    },
    params: {
      parkingAmount?: number;
      amenitiesAmount?: number;
      discountRequested?: number;
      floorRisePerFloor?: number;
      gstPercent?: number;
      stampDutyPercent?: number;
    } = {}
  ): CostBreakdown {
    const basePriceNum = Number(unit.basePrice);
    const plcNum = Number(unit.plcAmount || 0);
    const floorRisePerFloor = params.floorRisePerFloor ?? 50; // default 50 per sqft per floor above floor 1
    const floorRiseAmount = unit.floorNumber > 1 ? (unit.floorNumber - 1) * floorRisePerFloor * Number(unit.carpetAreaSqFt) : 0;
    const parkingAmount = params.parkingAmount ?? 300000;
    const amenitiesAmount = params.amenitiesAmount ?? 200000;
    const discountApplied = params.discountRequested ?? 0;

    const agreementValue = basePriceNum + floorRiseAmount + plcNum + parkingAmount + amenitiesAmount - discountApplied;
    if (agreementValue <= 0) {
      throw new ValidationError('Agreement value after discount must be positive', 'discountRequested');
    }

    const gstPercent = params.gstPercent ?? 5.0; // 5% GST
    const stampDutyPercent = params.stampDutyPercent ?? 6.0; // 6% Stamp duty

    const gstAmount = Math.round((agreementValue * gstPercent) / 100);
    const stampDutyAmount = Math.round((agreementValue * stampDutyPercent) / 100);
    const registrationAmount = 30000;
    const otherCharges = 50000;

    const totalAllInclusive = agreementValue + gstAmount + stampDutyAmount + registrationAmount + otherCharges;

    return {
      basePrice: basePriceNum,
      floorRiseAmount,
      plcAmount: plcNum,
      parkingAmount,
      amenitiesAmount,
      discountApplied,
      agreementValue,
      gstAmount,
      stampDutyAmount,
      registrationAmount,
      otherCharges,
      totalAllInclusive,
    };
  },

  /**
   * Generates a new versioned CostSheet row (§15.3, §35.1).
   */
  async generateCostSheet(actor: ActorContext, input: GenerateCostSheetInput) {
    return defaultPrisma.$transaction(async (tx) => {
      await targetValidator.validateLead(input.leadId, actor.organizationId, tx);
      const unit = await targetValidator.validatePropertyUnit(input.unitId, actor.organizationId, tx);

      // Check existing version count for this lead and unit
      const existingLatest = await tx.costSheet.findFirst({
        where: {
          organizationId: actor.organizationId,
          leadId: input.leadId,
          unitId: input.unitId,
        },
        orderBy: { version: 'desc' },
      });

      const nextVersion = existingLatest ? existingLatest.version + 1 : 1;

      // Calculate breakdown
      const breakdown = this.calculateCostBreakdown(
        {
          carpetAreaSqFt: unit.carpetAreaSqFt,
          basePrice: unit.basePrice,
          floorNumber: unit.floorNumber,
          plcAmount: unit.plcAmount,
        },
        {
          parkingAmount: input.parkingAmount,
          amenitiesAmount: input.amenitiesAmount,
          discountRequested: input.discountRequested,
        }
      );

      // Approval requirement: discounts > 100,000 require manager approval
      const discountRequiresApproval = (input.discountRequested ?? 0) > 100000;
      const status = discountRequiresApproval ? CostSheetStatus.DRAFT : CostSheetStatus.ISSUED;

      const costSheet = await tx.costSheet.create({
        data: {
          organizationId: actor.organizationId,
          leadId: input.leadId,
          unitId: input.unitId,
          pricingRuleVersionId: input.pricingRuleVersionId ?? null,
          version: nextVersion,
          status,
          basePrice: breakdown.basePrice,
          floorRiseAmount: breakdown.floorRiseAmount,
          plcAmount: breakdown.plcAmount,
          parkingAmount: breakdown.parkingAmount,
          amenitiesAmount: breakdown.amenitiesAmount,
          discountApplied: breakdown.discountApplied,
          agreementValue: breakdown.agreementValue,
          gstAmount: breakdown.gstAmount,
          stampDutyAmount: breakdown.stampDutyAmount,
          registrationAmount: breakdown.registrationAmount,
          otherCharges: breakdown.otherCharges,
          totalAllInclusive: breakdown.totalAllInclusive,
          generatedById: actor.userId,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'cost_sheet.generated',
          entityType: 'CostSheet',
          entityId: costSheet.id,
          newValue: {
            version: nextVersion,
            totalAllInclusive: breakdown.totalAllInclusive,
            status,
          },
          source: ChangeSource.MANUAL,
        },
      });

      // Transactional Outbox
      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.CostSheetGenerated,
          aggregateType: 'CostSheet',
          aggregateId: costSheet.id,
          correlationId: actor.correlationId,
          payload: {
            costSheetId: costSheet.id,
            leadId: input.leadId,
            unitId: input.unitId,
            version: nextVersion,
            totalAllInclusive: breakdown.totalAllInclusive,
          },
        },
      });

      return costSheet;
    });
  },

  /**
   * Approves a discounted cost sheet, transitioning status to APPROVED (§15.3).
   */
  async approveCostSheet(actor: ActorContext, costSheetId: string) {
    if (!actor.capabilities.has('COST_SHEET_APPROVE') && !actor.isSystemActor && !actor.capabilities.has('*')) {
      throw new ForbiddenError('Actor lacks COST_SHEET_APPROVE capability');
    }

    return defaultPrisma.$transaction(async (tx) => {
      const sheet = await tx.costSheet.findUnique({
        where: { id: costSheetId },
      });

      if (!sheet || sheet.organizationId !== actor.organizationId) {
        throw new ResourceNotFoundError('Cost sheet not found', 'costSheetId');
      }

      if (sheet.status !== CostSheetStatus.DRAFT) {
        throw new ConflictError(`Cannot approve cost sheet in ${sheet.status} state`);
      }

      const now = new Date();
      const updated = await tx.costSheet.update({
        where: { id: sheet.id },
        data: {
          status: CostSheetStatus.APPROVED,
          approvedById: actor.userId,
          approvedAt: now,
        },
      });

      await tx.auditLog.create({
        data: {
          organizationId: actor.organizationId,
          actorId: actor.userId,
          correlationId: actor.correlationId,
          action: 'cost_sheet.approved',
          entityType: 'CostSheet',
          entityId: sheet.id,
          oldValue: { status: sheet.status },
          newValue: { status: CostSheetStatus.APPROVED, approvedById: actor.userId },
        },
      });

      await tx.outboxEvent.create({
        data: {
          organizationId: actor.organizationId,
          eventType: DomainEventType.CostSheetApproved,
          aggregateType: 'CostSheet',
          aggregateId: sheet.id,
          correlationId: actor.correlationId,
          payload: {
            costSheetId: sheet.id,
            approvedById: actor.userId,
          },
        },
      });

      return updated;
    });
  },
};
