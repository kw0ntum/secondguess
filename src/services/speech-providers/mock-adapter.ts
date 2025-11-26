/**
 * Mock Speech-to-Text Adapter (for testing)
 */

import { SpeechToTextService } from '@/interfaces/speech-to-text-service';
import { AudioStream, TranscriptionResult } from '@/models';

export class MockSpeechAdapter implements SpeechToTextService {
  private language = 'en-US';
  private ready = true;

  async transcribe(audioStream: AudioStream): Promise<TranscriptionResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      text: 'This is a mock transcription for testing purposes.',
      confidence: 0.95,
      segments: [
        {
          text: 'This is a mock transcription for testing purposes.',
          startTime: 0,
          endTime: 3.5,
          confidence: 0.95
        }
      ],
      timestamp: new Date(),
      sessionId: `mock-${Date.now()}`,
      language: this.language
    };
  }

  getConfidenceScore(segment: string): number {
    return 0.95;
  }

  setLanguage(language: string): void {
    this.language = language;
  }

  getCurrentLanguage(): string {
    return this.language;
  }

  isReady(): boolean {
    return this.ready;
  }

  async startSession(): Promise<string> {
    return `mock-session-${Date.now()}`;
  }

  async endSession(sessionId: string): Promise<void> {
    // Mock implementation - no cleanup needed
  }
}
