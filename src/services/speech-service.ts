/**
 * Speech Service - Unified interface for speech-to-text
 * @deprecated Use SpeechToTextFactory instead for better modularity
 */

import { SpeechToTextService } from '@/interfaces/speech-to-text-service';
import { SpeechToTextFactory } from './speech-to-text-factory';
import { AudioStream, TranscriptionResult } from '@/models';

export class SpeechService {
  private service: SpeechToTextService;

  constructor() {
    // Use factory with automatic fallback
    this.service = SpeechToTextFactory.createWithFallback();
  }

  async transcribe(audioStream: AudioStream): Promise<TranscriptionResult> {
    return this.service.transcribe(audioStream);
  }

  setLanguage(language: string): void {
    this.service.setLanguage(language);
  }

  getCurrentLanguage(): string {
    return this.service.getCurrentLanguage();
  }

  isReady(): boolean {
    return this.service.isReady();
  }
}
