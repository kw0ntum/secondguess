/**
 * Google Cloud Speech-to-Text Adapter
 * Implements SpeechToTextService using Google Cloud Speech API
 */

import { SpeechToTextService } from '@/interfaces';
import { AudioStream, TranscriptionResult, TranscriptionSegment } from '@/models';
import { validateAudioQualityMetrics } from '@/utils/audio-utils';
import { 
  AudioQualityAnalyzer, 
  AudioFormatMapper, 
  AudioDurationEstimator,
  TimeParser 
} from '@/utils/audio';
import { logger } from '@/utils/logger';
import { SpeechClient } from '@google-cloud/speech';

interface StreamingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  language: string;
  isActive: boolean;
  transcriptionBuffer: TranscriptionResult[];
}

export class GoogleCloudAdapter implements SpeechToTextService {
  private speechClient: SpeechClient;
  private currentLanguage = 'en-US';
  private isServiceReady = false;
  private activeSessions = new Map<string, StreamingSession>();
  private confidenceThreshold = 0.7;

  constructor() {
    this.speechClient = new SpeechClient();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      await this.speechClient.initialize();
      this.isServiceReady = true;
      logger.info('Google Cloud Speech-to-Text adapter initialized');
    } catch (error) {
      logger.error('Failed to initialize Google Cloud adapter:', error);
      this.isServiceReady = false;
    }
  }

  async transcribe(audioStream: AudioStream): Promise<TranscriptionResult> {
    if (!this.isServiceReady) {
      throw new Error('Google Cloud Speech adapter not ready');
    }

    try {
      // Analyze audio quality
      const qualityMetrics = AudioQualityAnalyzer.analyze(audioStream);
      const qualityValidation = validateAudioQualityMetrics(qualityMetrics);
      
      if (!qualityValidation.isValid) {
        logger.warn('Audio quality issues detected:', qualityValidation.issues);
      }

      // Configure recognition request
      const request = {
        config: {
          encoding: AudioFormatMapper.toGoogleCloudEncoding(audioStream.format) as any,
          sampleRateHertz: audioStream.sampleRate,
          languageCode: this.currentLanguage,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
          model: 'latest_long',
          useEnhanced: true,
        },
        audio: {
          content: Buffer.from(audioStream.data).toString('base64'),
        },
      };

      // Perform recognition
      const response = await this.speechClient.recognize(request as any);

      if (!response || !response[0] || !response[0].results || response[0].results.length === 0) {
        return this.createEmptyResult(audioStream);
      }

      // Process results
      return this.processResults(response[0].results, audioStream);

    } catch (error) {
      logger.error('Google Cloud transcription failed:', error);
      throw new Error(`Transcription failed: ${error}`);
    }
  }

  getConfidenceScore(segment: string): number {
    if (!segment || segment.trim().length === 0) {
      return 0;
    }

    let confidence = 0.8;
    
    if (segment.length > 50) confidence += 0.1;
    if (/[.!?]$/.test(segment.trim())) confidence += 0.05;
    if (/^[A-Z]/.test(segment.trim())) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  setLanguage(language: string): void {
    this.currentLanguage = language;
    logger.info(`Google Cloud adapter language set to: ${language}`);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  isReady(): boolean {
    return this.isServiceReady;
  }

  async startSession(): Promise<string> {
    const sessionId = `gcloud-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const session: StreamingSession = {
      id: sessionId,
      startTime: new Date(),
      language: this.currentLanguage,
      isActive: true,
      transcriptionBuffer: [],
    };

    this.activeSessions.set(sessionId, session);
    logger.info(`Started Google Cloud STT session: ${sessionId}`);
    
    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      this.activeSessions.delete(sessionId);
      logger.info(`Ended Google Cloud STT session: ${sessionId}`);
    }
  }

  private processResults(results: any[], audioStream: AudioStream): TranscriptionResult {
    const segments: TranscriptionSegment[] = [];
    let fullText = '';
    let totalConfidence = 0;
    let segmentCount = 0;

    for (const result of results) {
      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0];
        if (alternative) {
          const text = alternative.transcript || '';
          const confidence = alternative.confidence || 0;

          fullText += text + ' ';
          totalConfidence += confidence;
          segmentCount++;

          if (alternative.words && alternative.words.length > 0) {
            for (const word of alternative.words) {
              segments.push({
                text: word.word || '',
                startTime: TimeParser.parseGoogleTime(word.startTime),
                endTime: TimeParser.parseGoogleTime(word.endTime),
                confidence: word.confidence || confidence,
              });
            }
          } else {
            segments.push({
              text,
              startTime: 0,
              endTime: AudioDurationEstimator.estimate(audioStream),
              confidence,
            });
          }
        }
      }
    }

    const averageConfidence = segmentCount > 0 ? totalConfidence / segmentCount : 0;

    return {
      text: fullText.trim(),
      confidence: averageConfidence,
      segments,
      timestamp: new Date(),
      sessionId: `sync-${Date.now()}`,
      language: this.currentLanguage,
    };
  }

  private createEmptyResult(audioStream: AudioStream): TranscriptionResult {
    return {
      text: '',
      confidence: 0,
      segments: [],
      timestamp: new Date(),
      sessionId: `empty-${Date.now()}`,
      language: this.currentLanguage,
    };
  }
}
