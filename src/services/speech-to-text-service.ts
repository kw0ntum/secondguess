/**
 * Speech-to-Text Service Implementation using Google Cloud Speech-to-Text
 * 
 * @deprecated This file is deprecated and no longer used by the codebase.
 * Use the modular implementation instead:
 * - Import: import { SpeechToTextFactory } from './speech-to-text-factory'
 * - Usage: const service = SpeechToTextFactory.createWithFallback()
 * 
 * The functionality has been moved to:
 * - src/services/speech-providers/google-cloud-adapter.ts (Google Cloud implementation)
 * - src/services/speech-providers/mock-adapter.ts (Mock for testing)
 * - src/services/speech-to-text-factory.ts (Factory pattern)
 * 
 * This file is kept for backward compatibility only and may be removed in a future version.
 * See MIGRATION_TO_MODULAR.md for details.
 */

import { SpeechToTextService } from '@/interfaces';
import { AudioStream, TranscriptionResult, TranscriptionSegment } from '@/models';
import { validateAudioQualityMetrics, AudioQualityMetrics } from '@/utils/audio-utils';
import { logger } from '@/utils/logger';

// Google Cloud Speech imports
import { SpeechClient } from '@google-cloud/speech';

export class SpeechToTextServiceImpl implements SpeechToTextService {
  private speechClient: SpeechClient;
  private currentLanguage = 'en-US';
  private isServiceReady = false;
  private activeSessions = new Map<string, StreamingSession>();
  private confidenceThreshold = 0.7;

  constructor() {
    // Initialize Google Cloud Speech client
    this.speechClient = new SpeechClient();
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      // Test the connection to Google Cloud Speech
      await this.speechClient.initialize();
      this.isServiceReady = true;
      logger.info('Speech-to-Text service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Speech-to-Text service:', error);
      this.isServiceReady = false;
    }
  }

  async transcribe(audioStream: AudioStream): Promise<TranscriptionResult> {
    if (!this.isServiceReady) {
      throw new Error('Speech-to-Text service not ready');
    }

    try {
      // Validate audio quality first
      const qualityMetrics = this.analyzeAudioQuality(audioStream);
      const qualityValidation = validateAudioQualityMetrics(qualityMetrics);
      
      if (!qualityValidation.isValid) {
        logger.warn('Audio quality issues detected:', qualityValidation.issues);
      }

      // Configure recognition request
      const request = {
        config: {
          encoding: this.getGoogleAudioEncoding(audioStream.format) as any,
          sampleRateHertz: audioStream.sampleRate,
          languageCode: this.currentLanguage,
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          enableWordConfidence: true,
          model: 'latest_long', // Use latest model for better accuracy
          useEnhanced: true,
        },
        audio: {
          content: Buffer.from(audioStream.data).toString('base64'),
        },
      };

      // Perform synchronous recognition for short audio
      const response = await this.speechClient.recognize(request as any);

      if (!response || !response[0] || !response[0].results || response[0].results.length === 0) {
        return this.createEmptyTranscriptionResult(audioStream);
      }

      // Process results
      const segments: TranscriptionSegment[] = [];
      let fullText = '';
      let totalConfidence = 0;
      let segmentCount = 0;

      for (const result of response[0].results) {
        if (result.alternatives && result.alternatives.length > 0) {
          const alternative = result.alternatives[0];
          if (alternative) {
            const text = alternative.transcript || '';
            const confidence = alternative.confidence || 0;

            fullText += text + ' ';
            totalConfidence += confidence;
            segmentCount++;

            // Create segments from word info if available
            if (alternative.words && alternative.words.length > 0) {
              for (const word of alternative.words) {
                segments.push({
                  text: word.word || '',
                  startTime: this.parseGoogleTime(word.startTime),
                  endTime: this.parseGoogleTime(word.endTime),
                  confidence: word.confidence || confidence,
                });
              }
            } else {
              // Create a single segment for the entire result
              segments.push({
                text,
                startTime: 0,
                endTime: this.estimateAudioDuration(audioStream),
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

    } catch (error) {
      logger.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error}`);
    }
  }

  getConfidenceScore(segment: string): number {
    // This would typically analyze the segment against the model
    // For now, return a default confidence based on segment length and characteristics
    if (!segment || segment.trim().length === 0) {
      return 0;
    }

    // Simple heuristic: longer segments with proper punctuation get higher confidence
    let confidence = 0.8;
    
    if (segment.length > 50) confidence += 0.1;
    if (/[.!?]$/.test(segment.trim())) confidence += 0.05;
    if (/^[A-Z]/.test(segment.trim())) confidence += 0.05;
    
    return Math.min(confidence, 1.0);
  }

  setLanguage(language: string): void {
    this.currentLanguage = language;
    logger.info(`Language set to: ${language}`);
  }

  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  isReady(): boolean {
    return this.isServiceReady;
  }

  async startSession(): Promise<string> {
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const session: StreamingSession = {
      id: sessionId,
      startTime: new Date(),
      language: this.currentLanguage,
      isActive: true,
      transcriptionBuffer: [],
    };

    this.activeSessions.set(sessionId, session);
    logger.info(`Started STT session: ${sessionId}`);
    
    return sessionId;
  }

  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.endTime = new Date();
      this.activeSessions.delete(sessionId);
      logger.info(`Ended STT session: ${sessionId}`);
    }
  }

  // Private helper methods

  private getGoogleAudioEncoding(format: string): string {
    switch (format.toLowerCase()) {
      case 'wav':
        return 'LINEAR16';
      case 'flac':
        return 'FLAC';
      case 'ogg':
      case 'opus':
        return 'OGG_OPUS';
      case 'webm':
        return 'WEBM_OPUS';
      case 'mp3':
        return 'MP3';
      default:
        return 'LINEAR16';
    }
  }

  private parseGoogleTime(timeObj: any): number {
    if (!timeObj) return 0;
    
    const seconds = timeObj.seconds || 0;
    const nanos = timeObj.nanos || 0;
    
    return Number(seconds) + (nanos / 1000000000);
  }

  private estimateAudioDuration(audioStream: AudioStream): number {
    // Estimate duration based on audio data size and sample rate
    const bytesPerSample = 2; // Assuming 16-bit samples
    const samples = audioStream.data.byteLength / (bytesPerSample * audioStream.channels);
    return samples / audioStream.sampleRate;
  }

  private analyzeAudioQuality(audioStream: AudioStream): AudioQualityMetrics {
    // For compressed formats (WebM, MP3, OGG), we can't analyze raw samples
    // Return default metrics indicating good quality
    const isCompressedFormat = ['webm', 'mp3', 'ogg', 'opus'].includes(audioStream.format.toLowerCase());
    
    if (isCompressedFormat) {
      // Return default "good quality" metrics for compressed formats
      return {
        signalToNoiseRatio: 30, // Assume good SNR
        averageAmplitude: 0.3,
        peakAmplitude: 0.8,
        silenceRatio: 0.1,
        clippingDetected: false,
      };
    }
    
    // Only analyze raw PCM formats (WAV, FLAC)
    try {
      // For WAV/FLAC, convert audio data to analyze quality
      const samples = new Float32Array(audioStream.data);
      
      // Calculate basic metrics
      const averageAmplitude = samples.reduce((sum, sample) => sum + Math.abs(sample), 0) / samples.length;
      const peakAmplitude = Math.max(...samples.map(Math.abs));
      
      // Detect silence
      const silenceThreshold = 0.01;
      const silentSamples = samples.filter(sample => Math.abs(sample) < silenceThreshold).length;
      const silenceRatio = silentSamples / samples.length;
      
      // Detect clipping
      const clippingThreshold = 0.95;
      const clippingDetected = samples.some(sample => Math.abs(sample) >= clippingThreshold);
      
      // Estimate SNR (simplified)
      const signalPower = samples.reduce((sum, sample) => sum + sample * sample, 0) / samples.length;
      const noisePower = Math.min(signalPower * 0.1, 0.001); // Simplified noise estimation
      const signalToNoiseRatio = 10 * Math.log10(signalPower / noisePower);

      return {
        signalToNoiseRatio,
        averageAmplitude,
        peakAmplitude,
        silenceRatio,
        clippingDetected,
      };
    } catch (error) {
      // If analysis fails, return default metrics
      logger.warn('Audio quality analysis failed, using defaults:', error);
      return {
        signalToNoiseRatio: 25,
        averageAmplitude: 0.3,
        peakAmplitude: 0.7,
        silenceRatio: 0.15,
        clippingDetected: false,
      };
    }
  }

  private createEmptyTranscriptionResult(audioStream: AudioStream): TranscriptionResult {
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

// Supporting interfaces and types

interface StreamingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  language: string;
  isActive: boolean;
  transcriptionBuffer: TranscriptionResult[];
}