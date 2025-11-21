/**
 * Hash Generator Utility
 * Generates unique 15-character hashes for API calls and messages
 */

import crypto from 'crypto';

/**
 * Generate a 15-character hash from content
 * Uses SHA-256 and takes first 15 characters for uniqueness
 */
export function generateMessageHash(content: string, timestamp?: Date): string {
  const data = `${content}-${timestamp?.toISOString() || Date.now()}`;
  const hash = crypto.createHash('sha256').update(data).digest('hex');
  return hash.substring(0, 15).toUpperCase();
}

/**
 * Generate a hash from response data
 */
export function generateResponseHash(responseData: any): string {
  const content = JSON.stringify(responseData);
  return generateMessageHash(content);
}

/**
 * Generate a hash for API log entry
 */
export function generateApiLogHash(method: string, endpoint: string, timestamp: Date): string {
  const data = `${method}-${endpoint}-${timestamp.toISOString()}`;
  return generateMessageHash(data, timestamp);
}
