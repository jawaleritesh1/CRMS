import { TelephonyProvider } from '../../domain/telephony/telephony.provider.js';
import { MockTelephonyProvider } from './mockTelephonyProvider.js';
import { KnowlarityTelephonyProvider } from './knowlarityTelephonyProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../core/logging/logger.js';

let customProvider: TelephonyProvider | null = null;

export class TelephonyProviderFactory {
  /**
   * Resolves the active TelephonyProvider.
   * In development and automated testing, strictly resolves MockTelephonyProvider.
   * In production, resolves KnowlarityTelephonyProvider if TELEPHONY_PROVIDER is configured to 'knowlarity'.
   */
  static getProvider(): TelephonyProvider {
    if (customProvider) {
      return customProvider;
    }

    const isProd = env.NODE_ENV === 'production';
    const isKnowlarity = env.TELEPHONY_PROVIDER === 'knowlarity';

    if (isProd && isKnowlarity) {
      logger.info({ msg: 'TelephonyProviderFactory: Resolving production KnowlarityTelephonyProvider' });
      return new KnowlarityTelephonyProvider();
    }

    // Default to MockTelephonyProvider for development and tests
    return MockTelephonyProvider.getInstance();
  }

  /**
   * For testing or injecting specialized mock providers.
   */
  static setCustomProvider(provider: TelephonyProvider | null) {
    customProvider = provider;
  }
}

export const getTelephonyProvider = () => TelephonyProviderFactory.getProvider();
