import { PrismaClient } from '@prisma/client';
import { normalizer } from '../../lib/normalize.js';
import { ActorContext } from '../../security/context/actorContext.js';
import { piiMasker } from '../../security/pii/piiMasker.js';
import { prisma as defaultPrisma } from '../../core/database/prisma.js';
import { ResourceNotFoundError } from '../../core/errors/appError.js';

type PrismaTx = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface ResolveCustomerInput {
  name: string;
  phone: string;
  email?: string | null;
  city?: string | null;
}

export const customerService = {
  /**
   * Resolves an existing customer by normalized phone within the actor's organization,
   * or creates a new customer if none exists (§9.4).
   */
  async resolveOrCreateCustomer(
    actor: ActorContext,
    input: ResolveCustomerInput,
    client: PrismaTx = defaultPrisma
  ) {
    const normalizedPhone = normalizer.normalizePhone(input.phone);
    const normalizedEmail = normalizer.normalizeEmail(input.email);
    const normalizedName = normalizer.normalizeName(input.name);

    let customer = await client.customer.findUnique({
      where: {
        organizationId_normalizedPhone: {
          organizationId: actor.organizationId,
          normalizedPhone,
        },
      },
    });

    if (!customer) {
      customer = await client.customer.create({
        data: {
          organizationId: actor.organizationId,
          name: normalizedName,
          phone: input.phone, // raw phone preserved
          normalizedPhone,
          email: input.email ?? null,
          normalizedEmail,
          city: input.city ?? null,
        },
      });
    } else {
      // Update email or city if not previously captured
      const updates: Record<string, any> = {};
      if (!customer.email && normalizedEmail) {
        updates.email = input.email;
        updates.normalizedEmail = normalizedEmail;
      }
      if (!customer.city && input.city) {
        updates.city = input.city;
      }

      if (Object.keys(updates).length > 0) {
        customer = await client.customer.update({
          where: { id: customer.id },
          data: updates,
        });
      }
    }

    return customer;
  },

  /**
   * Finds a customer by ID within the actor's organization, applying PII masking projection (§31.3).
   */
  async getCustomerById(
    actor: ActorContext,
    customerId: string,
    maskCustomerPhoneForCSE = true,
    client: PrismaTx = defaultPrisma
  ) {
    const customer = await client.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer || customer.organizationId !== actor.organizationId || customer.deletedAt) {
      throw new ResourceNotFoundError('Customer not found', 'customerId');
    }

    return piiMasker.projectCustomer(customer, actor, maskCustomerPhoneForCSE);
  },
};
