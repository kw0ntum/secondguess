/**
 * Time Parser Utilities
 * Parse time objects from various providers
 */

export class TimeParser {
  /**
   * Parse Google Cloud time object to seconds
   */
  static parseGoogleTime(timeObj: any): number {
    if (!timeObj) return 0;
    
    const seconds = timeObj.seconds || 0;
    const nanos = timeObj.nanos || 0;
    
    return Number(seconds) + (nanos / 1000000000);
  }

  /**
   * Parse AWS time string to seconds
   */
  static parseAWSTime(timeString: string): number {
    if (!timeString) return 0;
    return parseFloat(timeString);
  }

  /**
   * Convert seconds to milliseconds
   */
  static secondsToMillis(seconds: number): number {
    return seconds * 1000;
  }

  /**
   * Convert milliseconds to seconds
   */
  static millisToSeconds(millis: number): number {
    return millis / 1000;
  }
}
