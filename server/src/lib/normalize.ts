import { ValidationError } from '../core/errors/appError.js';

export const normalizer = {
  /**
   * Normalizes customer and contact phone numbers to canonical E.164 format (§9.3).
   * Default region is India (+91) for standard 10-digit mobile numbers.
   */
  normalizePhone(rawPhone: string, defaultCountryCode = '+91'): string {
    if (!rawPhone || typeof rawPhone !== 'string') {
      throw new ValidationError('Phone number is required', 'phone');
    }

    // Strip all whitespace, dashes, parentheses, dots
    const cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');

    // Already E.164 with +
    if (cleaned.startsWith('+')) {
      const digitsOnly = cleaned.slice(1).replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        throw new ValidationError('Invalid international phone number format', 'phone');
      }
      return `+${digitsOnly}`;
    }

    // Numbers with leading 00
    if (cleaned.startsWith('00')) {
      const digitsOnly = cleaned.slice(2).replace(/\D/g, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 15) {
        throw new ValidationError('Invalid international phone number format', 'phone');
      }
      return `+${digitsOnly}`;
    }

    const digitsOnly = cleaned.replace(/\D/g, '');

    // 10-digit standard Indian mobile
    if (digitsOnly.length === 10) {
      if (/^[6-9]\d{9}$/.test(digitsOnly)) {
        return `${defaultCountryCode}${digitsOnly}`;
      }
      return `${defaultCountryCode}${digitsOnly}`;
    }

    // 11 digits starting with 0 (STD / domestic trunk prefix)
    if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
      return `${defaultCountryCode}${digitsOnly.slice(1)}`;
    }

    // 12 digits starting with 91 (India without leading +)
    if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
      return `+${digitsOnly}`;
    }

    // If bare digits length is between 10 and 15, prepend +
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      return `+${digitsOnly}`;
    }

    throw new ValidationError(
      `Unable to normalize phone number: ${rawPhone}. Expected standard 10-digit or E.164 format.`,
      'phone'
    );
  },

  /**
   * Normalizes email addresses: lowercase, trimmed (§9.3).
   */
  normalizeEmail(rawEmail?: string | null): string | null {
    if (!rawEmail || typeof rawEmail !== 'string') {
      return null;
    }
    const cleaned = rawEmail.trim().toLowerCase();
    if (!cleaned) return null;

    // Basic format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)) {
      throw new ValidationError(`Invalid email address format: ${rawEmail}`, 'email');
    }
    return cleaned;
  },

  /**
   * Normalizes customer names: trim and collapse consecutive whitespace.
   */
  normalizeName(rawName: string): string {
    if (!rawName || typeof rawName !== 'string') {
      throw new ValidationError('Name is required', 'name');
    }
    const cleaned = rawName.trim().replace(/\s+/g, ' ');
    if (cleaned.length < 2) {
      throw new ValidationError('Name must be at least 2 characters long', 'name');
    }
    return cleaned;
  },
};
