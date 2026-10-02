import { PrismaClient } from '@prisma/client';
import { ValidationError, TenantMismatchError, ResourceNotFoundError } from '../../core/errors/appError.js';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';

type PrismaTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const targetValidator = {
  /**
   * Asserts that target customer belongs to the actor's organization (§5.6, §7.5).
   */
  async validateCustomer(customerId: string, organizationId: string, client: PrismaTx = defaultPrisma) {
    const customer = await client.customer.findUnique({
      where: { id: customerId },
      select: { id: true, organizationId: true, deletedAt: true },
    });

    if (!customer || customer.deletedAt) {
      throw new ResourceNotFoundError('Target customer not found', 'customerId');
    }
    if (customer.organizationId !== organizationId) {
      throw new TenantMismatchError('Customer does not belong to this organization', 'customerId');
    }
    return customer;
  },

  /**
   * Asserts that target lead belongs to the actor's organization (§5.6, §7.5).
   */
  async validateLead(leadId: string, organizationId: string, client: PrismaTx = defaultPrisma) {
    const lead = await client.lead.findUnique({
      where: { id: leadId },
      select: { id: true, organizationId: true, deletedAt: true, lifecycleStage: true, status: true },
    });

    if (!lead || lead.deletedAt) {
      throw new ResourceNotFoundError('Target lead not found', 'leadId');
    }
    if (lead.organizationId !== organizationId) {
      throw new TenantMismatchError('Lead does not belong to this organization', 'leadId');
    }
    return lead;
  },

  /**
   * Asserts that target property unit belongs to the actor's organization (§5.6, §7.5).
   */
  async validatePropertyUnit(unitId: string, organizationId: string, client: PrismaTx = defaultPrisma) {
    const unit = await client.propertyUnit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        organizationId: true,
        availability: true,
        projectId: true,
        carpetAreaSqFt: true,
        basePrice: true,
        floorNumber: true,
        plcAmount: true,
      },
    });

    if (!unit) {
      throw new ResourceNotFoundError('Target property unit not found', 'unitId');
    }
    if (unit.organizationId !== organizationId) {
      throw new TenantMismatchError('Property unit does not belong to this organization', 'unitId');
    }
    return unit;
  },

  /**
   * Asserts that target assignee membership belongs to actor's organization and is ACTIVE (§5.6, §7.5).
   */
  async validateAssignee(userIdOrMembershipId: string, organizationId: string, client: PrismaTx = defaultPrisma) {
    const membership = await client.organizationMembership.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE',
        OR: [{ id: userIdOrMembershipId }, { userId: userIdOrMembershipId }],
      },
      select: { id: true, userId: true, organizationId: true, status: true, isAvailable: true },
    });

    if (!membership) {
      throw new ValidationError(
        'Target assignee is not an active member of this organization',
        'assignedToId'
      );
    }
    return membership;
  },

  /**
   * Asserts that target project belongs to actor's organization and is active (§5.6, §7.5).
   */
  async validateProject(projectId: string, organizationId: string, client: PrismaTx = defaultPrisma) {
    const project = await client.project.findUnique({
      where: { id: projectId },
      select: { id: true, organizationId: true, isActive: true },
    });

    if (!project) {
      throw new ResourceNotFoundError('Target project not found', 'projectId');
    }
    if (project.organizationId !== organizationId) {
      throw new TenantMismatchError('Project does not belong to this organization', 'projectId');
    }
    if (!project.isActive) {
      throw new ValidationError('Target project is inactive', 'projectId');
    }
    return project;
  },
};
