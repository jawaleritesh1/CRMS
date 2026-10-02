import { PrismaClient, DuplicateMatchType, DuplicateStatus } from '@prisma/client';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';

type PrismaTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export const duplicateDetector = {
  /**
   * Scans for existing leads in the same organization matching normalized phone or email (§10.8).
   * If a match is found, registers a DuplicateCandidate relationship without deleting either lead.
   */
  async scanForDuplicates(
    params: {
      organizationId: string;
      leadId: string;
      customerId: string;
    },
    client: PrismaTx = defaultPrisma
  ) {
    const { organizationId, leadId, customerId } = params;

    // Find any other existing lead with the same customer in this organization
    const matchingLeads = await client.lead.findMany({
      where: {
        organizationId,
        customerId,
        id: { not: leadId },
        deletedAt: null,
      },
      select: { id: true, createdAt: true, lifecycleStage: true },
      take: 5,
    });

    const candidates = [];
    for (const match of matchingLeads) {
      // Check if duplicate relation already recorded
      const existingCandidate = await client.duplicateCandidate.findFirst({
        where: {
          organizationId,
          OR: [
            { leadId, matchedLeadId: match.id },
            { leadId: match.id, matchedLeadId: leadId },
          ],
        },
      });

      if (!existingCandidate) {
        const candidate = await client.duplicateCandidate.create({
          data: {
            organizationId,
            leadId,
            matchedLeadId: match.id,
            matchType: DuplicateMatchType.NORMALIZED_PHONE,
            confidence: 1.0,
            status: DuplicateStatus.PENDING,
          },
        });
        candidates.push(candidate);
      }
    }

    return candidates;
  },
};
