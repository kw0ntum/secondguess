/**
 * Mock Speech-to-Text Adapter
 * For testing and development without real API calls
 */

import { SpeechToTextService } from '@/interfaces';
import { AudioStream, TranscriptionResult } from '@/models';
import { logger } from '@/utils/logger';
import { AudioDurationEstimator } from '@/utils/audio';

export class MockAdapter implements SpeechToTextService {
  private currentLanguage = 'en-US';
  private activeSessions = new Set<string>();
  private mockResponses: string[] = [
    'This is a mock transcription for testing purposes.',
    'The quick brown fox jumps over the lazy dog.',
    'Testing speech to text functionality without real API calls.',
    'Mock adapter is working correctly.',
  ];

  async transcribe(audioStream: AudioStream): Promise<TranscriptionResult> {
    logger.info('Mock adapter: Simulating transcription');
    
    // Simulate API delay
    await this.simulateDelay(500);
    
    // Get a random mock response
    const text = this.mockResponses[Math.floor(Math.random() * this.mockResponses.length)] || 'Mock transcription';
    const duration = AudioDurationEstimator.estimate(audioStream);
    
    return {
      text,
      confidence: 0.95,
      segments: [
        {
          text,
          startTime: 0,
          endTime: duration,
          confidence: 0.95,
        },
      ],
      timestamp: new Date(),
      sessionId: `mock-${Date.now()}`,
      language: this.currentLanguage,
    };
  }

  getConfidenceScore(segment: string): number {
    return 0.95; // Mock always returns high confidence
  }

  setLanguage(language: string): void {
    this.currentLanguage = language;
    logger.info(`Mock adapter language set to: ${language}`);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  isReady(): boolean {
    return true; // Mock is always ready
  }

  async startSession(): Promise<string> {
    const sessionId = `mock-session-${Date.now()}`;
    this.activeSessions.add(sessionId);
    logger.info(`Mock adapter: Started session ${sessionId}`);
    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    this.activeSessions.delete(sessionId);
    logger.info(`Mock adapter: Ended session ${sessionId}`);
  }

  private async simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Add custom mock response for testing
   */
  addMockResponse(response: string): void {
    this.mockResponses.push(response);
  }

  /**
   * Clear all mock responses
   */
  clearMockResponses(): void {
    this.mockResponses = [];
  }
}
