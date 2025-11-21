/**
 * Memory Models
 * 
 * Data structures and validation functions for Mem0 memory integration.
 * These models support storing and retrieving LLM call information including
 * steps, inputs, outputs, and associated metadata.
 */

/**
 * Entry for storing LLM call information
 */
export interface LLMCallEntry {
  /** Name of the operation (e.g., "workflow_summarization", "conversation_processing") */
  step: string;
  
  /** Input parameters to the LLM */
  input: Record<string, any>;
  
  /** Output from the LLM */
  output: Record<string, any>;
  
  /** Associated session identifier */
  sessionId: string;
  
  /** Associated user identifier (optional) */
  userId?: string;
  
  /** Type of workflow (optional) */
  workflowType?: string;
  
  /** When the call occurred */
  timestamp: Date;
  
  /** Additional context (optional) */
  metadata?: Record<string, any>;
}

/**
 * Stored memory entry (includes Mem0 metadata)
 */
export interface MemoryEntry {
  /** Mem0 memory ID */
  id: string;
  
  /** Name of the operation */
  step: string;
  
  /** Input parameters to the LLM */
  input: Record<string, any>;
  
  /** Output from the LLM */
  output: Record<string, any>;
  
  /** Associated session identifier */
  sessionId: string;
  
  /** Associated user identifier (optional) */
  userId?: string;
  
  /** Type of workflow (optional) */
  workflowType?: string;
  
  /** When the call occurred */
  timestamp: Date;
  
  /** Additional context (optional) */
  metadata?: Record<string, any>;
  
  /** Mem0-specific metadata (optional) */
  mem0Metadata?: Record<string, any>;
}

/**
 * Query parameters for retrieving memory
 */
export interface MemoryQuery {
  /** Filter by session ID */
  sessionId?: string;
  
  /** Filter by user ID */
  userId?: string;
  
  /** Filter by workflow type */
  workflowType?: string;
  
  /** Filter by step name */
  step?: string;
  
  /** Maximum number of results to return */
  limit?: number;
  
  /** Number of results to skip */
  offset?: number;
  
  /** Filter by start date (inclusive) */
  startDate?: Date;
  
  /** Filter by end date (inclusive) */
  endDate?: Date;
}

/**
 * Memory statistics for a session or user
 */
export interface MemoryStats {
  /** Total number of memory entries */
  totalEntries: number;
  
  /** Count of entries grouped by step name */
  entriesByStep: Record<string, number>;
  
  /** Timestamp of the oldest entry */
  oldestEntry?: Date;
  
  /** Timestamp of the newest entry */
  newestEntry?: Date;
  
  /** Average number of entries per session */
  averageEntriesPerSession: number;
}

/**
 * Memory service health status
 */
export interface MemoryHealthStatus {
  /** Whether the service is available for use */
  isAvailable: boolean;
  
  /** Whether the service is operating normally */
  isHealthy: boolean;
  
  /** Timestamp of the last successful operation */
  lastSuccessfulOperation?: Date;
  
  /** Timestamp of the last failure */
  lastFailure?: Date;
  
  /** Number of consecutive failures */
  failureCount: number;
  
  /** Current operational mode */
  mode: 'active' | 'degraded' | 'disabled';
}

/**
 * Memory service configuration
 */
export interface MemoryConfig {
  /** Whether memory functionality is enabled */
  enabled: boolean;
  
  /** Mem0 API key */
  apiKey: string;
  
  /** Optional custom Mem0 endpoint */
  endpoint?: string;
  
  /** Timeout for operations in milliseconds */
  timeout: number;
  
  /** Number of retry attempts for failed operations */
  retryAttempts: number;
  
  /** Delay between retry attempts in milliseconds */
  retryDelay: number;
}

/**
 * Validates an LLM call entry for required fields and data types
 * 
 * @param entry - The LLM call entry to validate
 * @returns true if the entry is valid, false otherwise
 */
export function validateLLMCallEntry(entry: LLMCallEntry): boolean {
  // Check required fields are present
  if (!entry.step || !entry.input || !entry.output || !entry.sessionId) {
    return false;
  }
  
  // Check that step is a non-empty string
  if (typeof entry.step !== 'string' || entry.step.trim().length === 0) {
    return false;
  }
  
  // Check that sessionId is a non-empty string
  if (typeof entry.sessionId !== 'string' || entry.sessionId.trim().length === 0) {
    return false;
  }
  
  // Check that input and output are objects
  if (typeof entry.input !== 'object' || entry.input === null || Array.isArray(entry.input)) {
    return false;
  }
  
  if (typeof entry.output !== 'object' || entry.output === null || Array.isArray(entry.output)) {
    return false;
  }
  
  // Check that timestamp is a valid Date
  if (!entry.timestamp || !(entry.timestamp instanceof Date)) {
    return false;
  }
  
  // Check that timestamp is not invalid
  if (isNaN(entry.timestamp.getTime())) {
    return false;
  }
  
  // Check optional fields if present
  if (entry.userId !== undefined) {
    if (typeof entry.userId !== 'string' || entry.userId.trim().length === 0) {
      return false;
    }
  }
  
  if (entry.workflowType !== undefined) {
    if (typeof entry.workflowType !== 'string' || entry.workflowType.trim().length === 0) {
      return false;
    }
  }
  
  if (entry.metadata !== undefined) {
    if (typeof entry.metadata !== 'object' || entry.metadata === null || Array.isArray(entry.metadata)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Validates a memory query for valid parameters
 * 
 * @param query - The memory query to validate
 * @returns true if the query is valid, false otherwise
 */
export function validateMemoryQuery(query: MemoryQuery): boolean {
  // Check that limit is non-negative if provided
  if (query.limit !== undefined) {
    if (typeof query.limit !== 'number' || query.limit < 0 || !Number.isInteger(query.limit)) {
      return false;
    }
  }
  
  // Check that offset is non-negative if provided
  if (query.offset !== undefined) {
    if (typeof query.offset !== 'number' || query.offset < 0 || !Number.isInteger(query.offset)) {
      return false;
    }
  }
  
  // Check that date range is valid if both dates are provided
  if (query.startDate && query.endDate) {
    if (!(query.startDate instanceof Date) || !(query.endDate instanceof Date)) {
      return false;
    }
    
    if (isNaN(query.startDate.getTime()) || isNaN(query.endDate.getTime())) {
      return false;
    }
    
    if (query.startDate > query.endDate) {
      return false;
    }
  }
  
  // Check individual dates if provided
  if (query.startDate !== undefined && query.startDate !== null) {
    if (!(query.startDate instanceof Date) || isNaN(query.startDate.getTime())) {
      return false;
    }
  }
  
  if (query.endDate !== undefined && query.endDate !== null) {
    if (!(query.endDate instanceof Date) || isNaN(query.endDate.getTime())) {
      return false;
    }
  }
  
  // Check string fields if provided
  if (query.sessionId !== undefined) {
    if (typeof query.sessionId !== 'string' || query.sessionId.trim().length === 0) {
      return false;
    }
  }
  
  if (query.userId !== undefined) {
    if (typeof query.userId !== 'string' || query.userId.trim().length === 0) {
      return false;
    }
  }
  
  if (query.workflowType !== undefined) {
    if (typeof query.workflowType !== 'string' || query.workflowType.trim().length === 0) {
      return false;
    }
  }
  
  if (query.step !== undefined) {
    if (typeof query.step !== 'string' || query.step.trim().length === 0) {
      return false;
    }
  }
  
  return true;
}
