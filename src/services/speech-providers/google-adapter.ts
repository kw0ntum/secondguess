/**
 * Google Cloud Speech-to-Text Adapter
 */

import { SpeechClient } from '@google-cloud/speech';
import { SpeechToTextAdapter, TranscriptionResult } from '@/interfaces/speech-to-text-adapter';
import { logger } from '@/utils/logger';

export class GoogleSpeechAdapter implements SpeechToTextAdapter {
  private client: SpeechClient;

  constructor() {
    try {
      // Configure credentials from environment variable
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      if (credentialsPath) {
        // Use explicit credentials file
        this.client = new SpeechClient({
          keyFilename: credentialsPath
        });
        logger.info('Google Speech adapter initialized with credentials file', { 
          credentialsPath 
        });
      } else if (process.env.GOOGLE_CLOUD_PROJECT) {
        // Use application default credentials (for GCP environments)
        this.client = new SpeechClient();
        logger.info('Google Speech adapter initialized with application default credentials');
      } else {
        // No credentials configured
        logger.warn('Google Cloud credentials not configured. Speech transcription may fail.');
        logger.warn('Set GOOGLE_APPLICATION_CREDENTIALS environment variable to credentials file path.');
        this.client = new SpeechClient();
      }
    } catch (error) {
      logger.error('Failed to initialize Google Cloud adapter:', error);
      throw new Error('Could not initialize Google Cloud Speech adapter. Please check credentials configuration.');
    }
  }

  async transcribe(audioData: string, format: string): Promise<TranscriptionResult> {
    try {
      const audio = {
        content: audioData,
      };

      const config = {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 48000,
        languageCode: 'en-US',
      };

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.client.recognize(request);
      const transcription = response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join('\n') || '';

      const confidence = response.results?.[0]?.alternatives?.[0]?.confidence || 0;

      return {
        transcript: transcription,
        confidence: confidence,
      };
    } catch (error) {
      logger.error('Google Speech transcription failed:', error);
      throw new Error('Transcription failed');
    }
  }
}
