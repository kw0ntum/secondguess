/**
 * Audio Format Mapper
 * Maps internal audio formats to provider-specific encodings
 */

export class AudioFormatMapper {
  /**
   * Map audio format to Google Cloud Speech encoding
   */
  static toGoogleCloudEncoding(format: string): string {
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

  /**
   * Map audio format to AWS Transcribe encoding (for future use)
   */
  static toAWSEncoding(format: string): string {
    switch (format.toLowerCase()) {
      case 'wav':
        return 'pcm';
      case 'flac':
        return 'flac';
      case 'ogg':
      case 'opus':
        return 'ogg-opus';
      case 'webm':
        return 'webm';
      case 'mp3':
        return 'mp3';
      default:
        return 'pcm';
    }
  }

  /**
   * Check if format is supported
   */
  static isSupported(format: string): boolean {
    const supported = ['wav', 'flac', 'ogg', 'opus', 'webm', 'mp3'];
    return supported.includes(format.toLowerCase());
  }

  /**
   * Get MIME type for format
   */
  static getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'wav':
        return 'audio/wav';
      case 'flac':
        return 'audio/flac';
      case 'ogg':
      case 'opus':
        return 'audio/ogg';
      case 'webm':
        return 'audio/webm';
      case 'mp3':
        return 'audio/mpeg';
      default:
        return 'audio/wav';
    }
  }
}
