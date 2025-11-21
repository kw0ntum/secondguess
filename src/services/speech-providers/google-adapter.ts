/**
 * Google Cloud Speech-to-Text Adapter
 */

import { SpeechClient } from '@google-cloud/speech';
import { SpeechToTextAdapter, TranscriptionResult } from '@/interfaces/speech-to-text-adapter';
import { logger } from '@/utils/logger';

export class GoogleSpeechAdapter implements SpeechToTextAdapter {
  private client: SpeechClient;

  constructor() {
    this.client = new SpeechClient();
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
