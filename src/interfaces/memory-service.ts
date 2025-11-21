/**
 * Memory Service Interface
 * 
 * Defines the contract for the Mem0 memory integration service.
 * This service provides non-blocking, resilient storage and retrieval
 * of LLM call information to enable contextual memory across sessions.
 */

import {
  LLMCallEntry,
  MemoryEntry,
  MemoryQuery,
  MemoryStats,
  MemoryHealthStatus
} from '@/models/memory-models';

/**
 * Memory Service Interface
 * 
 * Provides methods for storing and retrieving LLM call information
 * using Mem0 as the underlying memory layer. All operations are
 * designed to be non-blocking and resilient, with graceful degradation
 * when the memory service is unavailable.
 */
export interface MemoryService {
  /**
   * Store LLM call information in memory
   * 
   * This is a fire-and-forget operation that stores the LLM call entry
   * asynchronously without blocking the caller. Errors are logged but
   * not thrown, ensuring that memory storage failures don't impact
   * core functionality.
   * 
   * @param entry - The LLM call entry to store, including step, input, output, and metadata
   * @returns Promise that resolves when storage is complete (or fails silently)
   * 
   * @example
   * ```typescript
   * await memoryService.storeLLMCall({
   *   step: 'workflow_summarization',
   *   input: { sessionId: 'abc123', messageCount: 5 },
   *   output: { summary: 'User wants to create a login flow' },
   *   sessionId: 'abc123',
   *   timestamp: new Date()
   * });
   * ```
   */
  storeLLMCall(entry: LLMCallEntry): Promise<void>;

  /**
   * Retrieve relevant memory entries for a session or user
   * 
   * Queries the memory store for entries matching the provided filters.
   * Returns an empty array on failure to ensure calling code can continue
   * processing even when memory retrieval fails.
   * 
   * @param query - Query parameters including filters and pagination options
   * @returns Promise resolving to array of matching memory entries (empty on failure)
   * 
   * @example
   * ```typescript
   * const memories = await memoryService.retrieveMemory({
   *   sessionId: 'abc123',
   *   step: 'workflow_summarization',
   *   limit: 5
   * });
   * ```
   */
  retrieveMemory(query: MemoryQuery): Promise<MemoryEntry[]>;

  /**
   * Clear all memory entries for a specific session
   * 
   * Removes all memory entries associated with the given session ID.
   * Useful for privacy requirements and session cleanup. Returns a
   * boolean indicating success or failure.
   * 
   * @param sessionId - The session ID whose memory should be cleared
   * @returns Promise resolving to true if successful, false otherwise
   * 
   * @example
   * ```typescript
   * const cleared = await memoryService.clearSessionMemory('abc123');
   * if (cleared) {
   *   console.log('Session memory cleared successfully');
   * }
   * ```
   */
  clearSessionMemory(sessionId: string): Promise<boolean>;

  /**
   * Get memory statistics for a session
   * 
   * Retrieves aggregate statistics about memory entries for a given session,
   * including total count, entries by step, and date ranges.
   * 
   * @param sessionId - The session ID to get statistics for
   * @returns Promise resolving to memory statistics
   * 
   * @example
   * ```typescript
   * const stats = await memoryService.getMemoryStats('abc123');
   * console.log(`Total entries: ${stats.totalEntries}`);
   * console.log(`Entries by step:`, stats.entriesByStep);
   * ```
   */
  getMemoryStats(sessionId: string): Promise<MemoryStats>;

  /**
   * Check if the memory service is available
   * 
   * Returns the current availability status of the memory service.
   * A service may be unavailable due to configuration issues, network
   * problems, or being explicitly disabled.
   * 
   * @returns true if the service is available, false otherwise
   * 
   * @example
   * ```typescript
   * if (memoryService.isAvailable()) {
   *   // Use memory features
   * } else {
   *   // Proceed without memory
   * }
   * ```
   */
  isAvailable(): boolean;

  /**
   * Get comprehensive health status of the memory service
   * 
   * Returns detailed health information including availability,
   * operational mode, failure counts, and timestamps of recent
   * operations. Useful for monitoring and diagnostics.
   * 
   * @returns Current health status of the memory service
   * 
   * @example
   * ```typescript
   * const health = memoryService.getHealthStatus();
   * console.log(`Mode: ${health.mode}`);
   * console.log(`Failures: ${health.failureCount}`);
   * ```
   */
  getHealthStatus(): MemoryHealthStatus;
}
