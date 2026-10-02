import { describe, it, expect } from 'vitest';
import { normalizer } from '../../src/lib/normalize.js';
import { ValidationError } from '../../src/core/errors/appError.js';

describe('Data Normalization Utilities (§9.3)', () => {
  describe('Phone Normalization', () => {
    it('should format 10-digit Indian numbers to E.164 with +91', () => {
      expect(normalizer.normalizePhone('9876543210')).toBe('+919876543210');
      expect(normalizer.normalizePhone('  98765 43210  ')).toBe('+919876543210');
      expect(normalizer.normalizePhone('9876-543-210')).toBe('+919876543210');
    });

    it('should format numbers with leading 0 to +91', () => {
      expect(normalizer.normalizePhone('09876543210')).toBe('+919876543210');
    });

    it('should format numbers with 91 prefix to +91', () => {
      expect(normalizer.normalizePhone('919876543210')).toBe('+919876543210');
    });

    it('should preserve valid international numbers with +', () => {
      expect(normalizer.normalizePhone('+14155552671')).toBe('+14155552671');
      expect(normalizer.normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
      expect(normalizer.normalizePhone('+971501234567')).toBe('+971501234567');
    });

    it('should reject invalid or excessively short/long phone numbers', () => {
      expect(() => normalizer.normalizePhone('1234')).toThrowError(ValidationError);
      expect(() => normalizer.normalizePhone('abcdefghij')).toThrowError(ValidationError);
    });
  });

  describe('Email Normalization', () => {
    it('should lowercase and trim valid emails', () => {
      expect(normalizer.normalizeEmail('  Rohan.Mehta@AcmeRealty.com ')).toBe('rohan.mehta@acmerealty.com');
    });

    it('should return null for empty or null email', () => {
      expect(normalizer.normalizeEmail(null)).toBeNull();
      expect(normalizer.normalizeEmail('')).toBeNull();
      expect(normalizer.normalizeEmail(undefined)).toBeNull();
    });

    it('should reject malformed email strings', () => {
      expect(() => normalizer.normalizeEmail('invalid-email-address')).toThrowError(ValidationError);
    });
  });

  describe('Name Normalization', () => {
    it('should collapse multiple spaces and trim', () => {
      expect(normalizer.normalizeName('  Aarav    Kumar   Sharma  ')).toBe('Aarav Kumar Sharma');
    });

    it('should reject names shorter than 2 characters', () => {
      expect(() => normalizer.normalizeName('A')).toThrowError(ValidationError);
    });
  });
});
