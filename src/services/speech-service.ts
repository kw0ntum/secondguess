/**
 * Speech Service - Factory for speech providers
 */

import { SpeechToTextAdapter } from '@/interfaces/speech-to-text-adapter';
import { GoogleSpeechAdapter } from './speech-providers/google-adapter';
import { MockSpeechAdapter } from './speech-providers/mock-adapter';
import { getConfig } from '@/utils/config';

export class SpeechService {
  private adapter: SpeechToTextAdapter;

  constructor() {
    const config = getConfig();
    const provider = process.env.SPEECH_PROVIDER || 'mock';

    if (provider === 'google') {
      this.adapter = new GoogleSpeechAdapter();
    } else {
      this.adapter = new MockSpeechAdapter();
    }
  }

  async transcribe(audioData: string, format: string) {
    return this.adapter.transcribe(audioData, format);
  }
}
