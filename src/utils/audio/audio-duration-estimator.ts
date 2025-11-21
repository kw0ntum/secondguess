/**
 * Audio Duration Estimator
 * Estimates audio duration from stream data
 */

import { AudioStream } from '@/models';

export class AudioDurationEstimator {
  /**
   * Estimate audio duration in seconds
   */
  static estimate(audioStream: AudioStream): number {
    // For compressed formats, we can't accurately estimate without decoding
    if (this.isCompressedFormat(audioStream.format)) {
      return this.estimateCompressed(audioStream);
    }
    
    // For uncompressed formats, calculate from data size
    return this.estimateUncompressed(audioStream);
  }

  private static isCompressedFormat(format: string): boolean {
    const compressed = ['webm', 'mp3', 'ogg', 'opus'];
    return compressed.includes(format.toLowerCase());
  }

  private static estimateUncompressed(audioStream: AudioStream): number {
    const bytesPerSample = 2; // Assuming 16-bit samples
    const samples = audioStream.data.byteLength / (bytesPerSample * audioStream.channels);
    return samples / audioStream.sampleRate;
  }

  private static estimateCompressed(audioStream: AudioStream): number {
    // Rough estimation based on typical compression ratios
    // WebM/Opus: ~10:1 compression
    // MP3: ~11:1 compression
    // OGG: ~10:1 compression
    
    const compressionRatio = 10;
    const estimatedUncompressedSize = audioStream.data.byteLength * compressionRatio;
    const bytesPerSample = 2;
    const samples = estimatedUncompressedSize / (bytesPerSample * audioStream.channels);
    
    return samples / audioStream.sampleRate;
  }
}
