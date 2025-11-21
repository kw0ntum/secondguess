/**
 * Speech-to-Text Service Factory
 * Creates the appropriate speech-to-text adapter based on configuration
 */

import { SpeechToTextService } from '@/interfaces';
import { GoogleCloudAdapter, MockAdapter } from './speech-providers';
import { logger } from '@/utils/logger';

export type SpeechProvider = 'google' | 'mock';

export interface SpeechToTextConfig {
  provider: SpeechProvider;
  fallbackProvider?: SpeechProvider;
  enableFallback?: boolean;
}

export class SpeechToTextFactory {
  private static instance: SpeechToTextService | null = null;
  private static fallbackInstance: SpeechToTextService | null = null;
  private static config: SpeechToTextConfig | null = null;

  /**
   * Create a speech-to-text service instance
   */
  static create(config?: SpeechToTextConfig): SpeechToTextService {
    // Use default config if none provided
    const finalConfig = config || this.getDefaultConfig();
    this.config = finalConfig;

    // Return cached instance if available
    if (this.instance) {
      return this.instance;
    }

    // Create new instance
    this.instance = this.createAdapter(finalConfig.provider);

    // Create fallback if enabled
    if (finalConfig.enableFallback && finalConfig.fallbackProvider) {
      this.fallbackInstance = this.createAdapter(finalConfig.fallbackProvider);
    }

    return this.instance;
  }

  /**
   * Create adapter with fallback support
   */
  static createWithFallback(config?: SpeechToTextConfig): SpeechToTextService {
    const finalConfig = config || this.getDefaultConfig();
    const primary = this.create(finalConfig);

    // If no fallback, return primary
    if (!finalConfig.enableFallback || !finalConfig.fallbackProvider) {
      return primary;
    }

    // Wrap with fallback logic
    return this.wrapWithFallback(primary, finalConfig.fallbackProvider);
  }

  /**
   * Get the current provider name
   */
  static getCurrentProvider(): SpeechProvider {
    return this.config?.provider || 'google';
  }

  /**
   * Reset factory (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    this.fallbackInstance = null;
    this.config = null;
  }

  private static createAdapter(provider: SpeechProvider): SpeechToTextService {
    logger.info(`Creating speech-to-text adapter: ${provider}`);

    switch (provider) {
      case 'google':
        return new GoogleCloudAdapter();
      case 'mock':
        return new MockAdapter();
      default:
        logger.warn(`Unknown provider: ${provider}, falling back to Google Cloud`);
        return new GoogleCloudAdapter();
    }
  }

  private static wrapWithFallback(
    primary: SpeechToTextService,
    fallbackProvider: SpeechProvider
  ): SpeechToTextService {
    const fallback = this.createAdapter(fallbackProvider);

    // Create a proxy that tries primary first, then fallback
    return new Proxy(primary, {
      get(target, prop) {
        const originalMethod = target[prop as keyof SpeechToTextService];

        // Only wrap async methods
        if (typeof originalMethod === 'function' && prop === 'transcribe') {
          return async function (...args: any[]) {
            try {
              return await (originalMethod as any).apply(target, args);
            } catch (error) {
              logger.warn(`Primary provider failed, trying fallback: ${error}`);
              try {
                return await (fallback[prop as keyof SpeechToTextService] as any)(...args);
              } catch (fallbackError) {
                logger.error(`Fallback provider also failed: ${fallbackError}`);
                throw error; // Throw original error
              }
            }
          };
        }

        return originalMethod;
      },
    });
  }

  private static getDefaultConfig(): SpeechToTextConfig {
    // Read from environment variables
    const provider = (process.env.SPEECH_PROVIDER || 'google') as SpeechProvider;
    const fallbackProvider = process.env.SPEECH_FALLBACK_PROVIDER as SpeechProvider;
    const enableFallback = process.env.SPEECH_ENABLE_FALLBACK === 'true';

    return {
      provider,
      fallbackProvider,
      enableFallback,
    };
  }
}
