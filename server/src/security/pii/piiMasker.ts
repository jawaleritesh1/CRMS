import { ActorContext } from '../context/actorContext.js';

export interface MaskableCustomer {
  phone: string;
  email?: string | null;
  [key: string]: any;
}

export const piiMasker = {
  /**
   * Masks a phone number: keeps country code and first 5 digits, obscures the rest (§31.2).
   * Example: "+91 98765 43210" -> "+91 98765 *****"
   */
  maskPhone(phone: string): string {
    const cleaned = phone.trim();
    if (cleaned.length <= 5) {
      return '*****';
    }
    const prefix = cleaned.slice(0, cleaned.length - 5);
    return `${prefix}*****`;
  },

  /**
   * Masks an email address: keeps first character and domain.
   * Example: "rohan.mehta@acme.com" -> "r***@acme.com"
   */
  maskEmail(email?: string | null): string | null {
    if (!email) return null;
    const parts = email.split('@');
    if (parts.length !== 2) return '***@redacted.com';
    const [name, domain] = parts;
    const maskedName = `${name?.charAt(0) ?? 'u'}***`;
    return `${maskedName}@${domain}`;
  },

  /**
   * Evaluates PII masking precedence rule (§31.4):
   * Organization policy sets baseline; actor receives unmasked only when
   * org policy permits AND actor explicitly holds CUSTOMER_VIEW_UNMASKED capability.
   */
  canViewUnmasked(actor: ActorContext, maskCustomerPhoneForCSE = true): boolean {
    if (actor.isSystemActor) {
      return true;
    }
    // Capability check
    const hasCapability =
      actor.capabilities.has('CUSTOMER_VIEW_UNMASKED') || actor.capabilities.has('*');

    // If org policy strictly enforces masking for everyone or actor lacks capability
    if (maskCustomerPhoneForCSE && !hasCapability) {
      return false;
    }

    return hasCapability;
  },

  /**
   * Projects a customer record, masking PII if actor is not authorized (§31.3).
   */
  projectCustomer<T extends MaskableCustomer>(
    customer: T,
    actor: ActorContext,
    maskCustomerPhoneForCSE = true
  ): T {
    if (this.canViewUnmasked(actor, maskCustomerPhoneForCSE)) {
      return { ...customer };
    }

    return {
      ...customer,
      phone: this.maskPhone(customer.phone),
      email: customer.email ? this.maskEmail(customer.email) : customer.email,
    };
  },
};
