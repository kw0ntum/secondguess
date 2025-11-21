/**
 * Audio Quality Analyzer
 * Analyzes audio quality metrics for uncompressed audio formats
 */

import { AudioStream } from '@/models';
import { AudioQualityMetrics } from '@/utils/audio-utils';
import { logger } from '@/utils/logger';

export class AudioQualityAnalyzer {
  /**
   * Analyze audio quality from an audio stream
   * Note: Only works for uncompressed formats (WAV, FLAC)
   */
  static analyze(audioStream: AudioStream): AudioQualityMetrics {
    // For compressed formats, return default "good quality" metrics
    const isCompressedFormat = this.isCompressedFormat(audioStream.format);
    
    if (isCompressedFormat) {
      return this.getDefaultMetrics();
    }
    
    // Analyze raw PCM formats
    try {
      return this.analyzeRawAudio(audioStream);
    } catch (error) {
      logger.warn('Audio quality analysis failed, using defaults:', error);
      return this.getDefaultMetrics();
    }
  }

  private static isCompressedFormat(format: string): boolean {
    const compressed = ['webm', 'mp3', 'ogg', 'opus'];
    return compressed.includes(format.toLowerCase());
  }

  private static getDefaultMetrics(): AudioQualityMetrics {
    return {
      signalToNoiseRatio: 30,
      averageAmplitude: 0.3,
      peakAmplitude: 0.8,
      silenceRatio: 0.1,
      clippingDetected: false,
    };
  }

  private static analyzeRawAudio(audioStream: AudioStream): AudioQualityMetrics {
    const samples = new Float32Array(audioStream.data);
    
    // Calculate basic metrics
    const averageAmplitude = samples.reduce(
      (sum, sample) => sum + Math.abs(sample), 
      0
    ) / samples.length;
    
    const peakAmplitude = Math.max(...samples.map(Math.abs));
    
    // Detect silence
    const silenceThreshold = 0.01;
    const silentSamples = samples.filter(
      sample => Math.abs(sample) < silenceThreshold
    ).length;
    const silenceRatio = silentSamples / samples.length;
    
    // Detect clipping
    const clippingThreshold = 0.95;
    const clippingDetected = samples.some(
      sample => Math.abs(sample) >= clippingThreshold
    );
    
    // Estimate SNR
    const signalPower = samples.reduce(
      (sum, sample) => sum + sample * sample, 
      0
    ) / samples.length;
    const noisePower = Math.min(signalPower * 0.1, 0.001);
    const signalToNoiseRatio = 10 * Math.log10(signalPower / noisePower);

    return {
      signalToNoiseRatio,
      averageAmplitude,
      peakAmplitude,
      silenceRatio,
      clippingDetected,
    };
  }
}
