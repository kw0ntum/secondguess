/**
 * Speech-to-Text Adapter Interface
 * Minimal interface for speech providers
 */

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
}

export interface SpeechToTextAdapter {
  transcribe(audioData: string, format: string): Promise<TranscriptionResult>;
}
