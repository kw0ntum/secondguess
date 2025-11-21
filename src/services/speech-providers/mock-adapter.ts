/**
 * Mock Speech-to-Text Adapter (for testing)
 */

import { SpeechToTextAdapter, TranscriptionResult } from '@/interfaces/speech-to-text-adapter';

export class MockSpeechAdapter implements SpeechToTextAdapter {
  async transcribe(audioData: string, format: string): Promise<TranscriptionResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      transcript: 'This is a mock transcription for testing purposes.',
      confidence: 0.95,
    };
  }
}
