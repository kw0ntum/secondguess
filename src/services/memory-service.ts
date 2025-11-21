/**
 * Memory Service Implementation
 * Provides memory storage and retrieval functionality using Mem0
 */

import { MemoryService } from '@/interfaces/memory-service';
import {
  LLMCallEntry,
  MemoryEntry,
  MemoryQuery,
  MemoryStats,
  MemoryHealthStatus,
  MemoryConfig
} from '@/models/memory-models';
import { getConfig } from '@/utils/config';
import { logger } from '@/utils/logger';
import * as winston from 'winston';

// Import Mem0 client
let MemoryClient: any;
try {
  // Try to import mem0ai - it may not be available in all environments
  const mem0Module = require('mem0ai');
  MemoryClient = mem0Module.Memory || mem0Module.default?.Memory || mem0Module;
} catch (error) {
  // Mem0 not available - service will operate in disabled mode
  MemoryClient = null;
}

/**
 * Implementation of the Memory Service
 * Handles all memory operations with Mem0 integration
 */
export class MemoryServiceImpl implements MemoryService {
  private mem0Client: any | null = null;
  private isEnabled: boolean;
  private isHealthy: boolean;
  private config: MemoryConfig;
  private logger: winston.Logger;
  
  // Circuit breaker fields
  private failureCount: number = 0;
  private lastFailureTime?: Date;
  private lastSuccessfulOperation?: Date;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 60000; // 1 minute

  constructor() {
    // Load configuration
    const appConfig = getConfig();
    this.config = appConfig.memory;
    
    // Create component logger
    this.logger = logger.child({ component: 'MemoryService' });
    
    // Initialize enabled state
    this.isEnabled = this.config.enabled;
    this.isHealthy = false;
    
    // Log initialization
    this.logger.info('Memory Service initializing', {
      enabled: this.isEnabled,
      hasApiKey: !!this.config.apiKey,
      timeout: this.config.timeout
    });
    
    // Initialize connection
    this.initialize();
  }

  /**
   * Initialize Mem0 client connection
   * Handles graceful failure for missing configuration
   */
  private initialize(): void {
    try {
      // Check if service is enabled
      if (!this.isEnabled) {
        this.logger.info('Memory Service disabled via configuration');
        return;
      }

      // Check if Mem0 client is available
      if (!MemoryClient) {
        this.logger.warn('Mem0 client library not available - operating in disabled mode');
        this.isEnabled = false;
        return;
      }

      // Validate API key
      if (!this.config.apiKey || this.config.apiKey.trim() === '') {
        this.logger.warn('Mem0 API key not configured - operating in disabled mode', {
          mode: 'disabled'
        });
        this.isEnabled = false;
        return;
      }

      // Initialize Mem0 client
      const clientConfig: any = {
        apiKey: this.config.apiKey
      };

      // Add optional endpoint if configured
      if (this.config.endpoint) {
        clientConfig.baseURL = this.config.endpoint;
      }

      // Create Mem0 client instance
      this.mem0Client = new MemoryClient(clientConfig);
      
      // Mark as healthy
      this.isHealthy = true;
      this.lastSuccessfulOperation = new Date();
      
      this.logger.info('Memory Service initialized successfully', {
        mode: 'active',
        hasEndpoint: !!this.config.endpoint
      });

    } catch (error: any) {
      // Graceful failure handling
      this.isHealthy = false;
      this.isEnabled = false;
      
      this.logger.error('Failed to initialize Memory Service - operating in disabled mode', {
        error: error.message,
        stack: error.stack,
        mode: 'disabled'
      });
      
      // Record failure for circuit breaker
      this.recordFailure();
    }
  }

  /**
   * Store LLM call information in memory
   * Non-blocking operation that doesn't throw exceptions
   */
  async storeLLMCall(entry: LLMCallEntry): Promise<void> {
    // Fire-and-forget pattern - wrap everything in try-catch for error isolation
    try {
      // Log the operation
      this.logger.debug('storeLLMCall called', { 
        step: entry.step, 
        sessionId: entry.sessionId,
        hasUserId: !!entry.userId,
        workflowType: entry.workflowType
      });

      // Check if service is enabled and should attempt operation
      if (!this.shouldAttemptOperation()) {
        this.logger.debug('Skipping memory storage - service not available', {
          enabled: this.isEnabled,
          healthy: this.isHealthy,
          failureCount: this.failureCount
        });
        return;
      }

      // Validate entry before storage
      const { validateLLMCallEntry } = require('@/models/memory-models');
      if (!validateLLMCallEntry(entry)) {
        this.logger.error('Invalid LLM call entry - validation failed', {
          step: entry.step,
          sessionId: entry.sessionId,
          hasInput: !!entry.input,
          hasOutput: !!entry.output,
          hasTimestamp: !!entry.timestamp,
          type: 'validation_error'
        });
        return;
      }

      // Prepare data for Mem0 storage
      // Mem0 expects messages with role and content
      const memoryData = {
        messages: [
          {
            role: 'user',
            content: JSON.stringify({
              step: entry.step,
              input: entry.input,
              sessionId: entry.sessionId,
              userId: entry.userId,
              workflowType: entry.workflowType,
              timestamp: entry.timestamp.toISOString(),
              metadata: entry.metadata
            })
          },
          {
            role: 'assistant',
            content: JSON.stringify(entry.output)
          }
        ],
        user_id: entry.userId || entry.sessionId,
        metadata: {
          step: entry.step,
          sessionId: entry.sessionId,
          workflowType: entry.workflowType,
          timestamp: entry.timestamp.toISOString()
        }
      };

      // Store in Mem0 with timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Storage operation timeout')), this.config.timeout);
      });

      const storePromise = this.mem0Client.add(memoryData);

      await Promise.race([storePromise, timeoutPromise]);

      // Record success
      this.recordSuccess();

      // Log successful storage
      this.logger.debug('Memory stored successfully', {
        step: entry.step,
        sessionId: entry.sessionId,
        userId: entry.userId,
        type: 'memory_operation'
      });

    } catch (error: any) {
      // Error isolation - never throw exceptions to calling code
      this.recordFailure();

      this.logger.error('Memory storage failed', {
        step: entry.step,
        sessionId: entry.sessionId,
        error: error.message,
        stack: error.stack,
        type: 'memory_error'
      });

      // Don't throw - fire-and-forget pattern
    }
  }

  /**
   * Retrieve relevant memory entries for a session
   * Returns empty array on failure
   */
  async retrieveMemory(query: MemoryQuery): Promise<MemoryEntry[]> {
    try {
      // Log the operation
      this.logger.info('retrieveMemory called', {
        sessionId: query.sessionId,
        userId: query.userId,
        workflowType: query.workflowType,
        step: query.step,
        limit: query.limit,
        offset: query.offset,
        hasStartDate: !!query.startDate,
        hasEndDate: !!query.endDate
      });

      // Check if service is enabled and should attempt operation
      if (!this.shouldAttemptOperation()) {
        this.logger.debug('Skipping memory retrieval - service not available', {
          enabled: this.isEnabled,
          healthy: this.isHealthy,
          failureCount: this.failureCount
        });
        return [];
      }

      // Validate query parameters
      const { validateMemoryQuery } = require('@/models/memory-models');
      if (!validateMemoryQuery(query)) {
        this.logger.error('Invalid memory query - validation failed', {
          query,
          type: 'validation_error'
        });
        return [];
      }

      // Build Mem0 query parameters
      const mem0Query: any = {};

      // Set user_id for filtering (use sessionId if userId not provided)
      if (query.userId) {
        mem0Query.user_id = query.userId;
      } else if (query.sessionId) {
        mem0Query.user_id = query.sessionId;
      }

      // Set limit (default to 10 if not specified)
      mem0Query.limit = query.limit || 10;

      // Retrieve memories from Mem0 with timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Retrieval operation timeout')), this.config.timeout);
      });

      const retrievePromise = this.mem0Client.getAll(mem0Query);

      const mem0Results = await Promise.race([retrievePromise, timeoutPromise]);

      // Parse and filter results
      let entries: MemoryEntry[] = [];

      if (mem0Results && Array.isArray(mem0Results)) {
        entries = mem0Results
          .map((mem0Entry: any) => this.parseMemoryEntry(mem0Entry))
          .filter((entry: MemoryEntry | null) => entry !== null)
          .filter((entry: MemoryEntry) => this.applyFilters(entry, query)) as MemoryEntry[];
      }

      // Sort by timestamp in chronological order (most recent first)
      entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply offset if specified
      if (query.offset && query.offset > 0) {
        entries = entries.slice(query.offset);
      }

      // Apply limit again after filtering (in case Mem0 returned more than expected)
      if (query.limit && entries.length > query.limit) {
        entries = entries.slice(0, query.limit);
      }

      // Record success
      this.recordSuccess();

      // Log successful retrieval
      this.logger.info('Memory retrieved successfully', {
        sessionId: query.sessionId,
        userId: query.userId,
        resultCount: entries.length,
        type: 'memory_operation'
      });

      return entries;

    } catch (error: any) {
      // Error isolation - return empty array on failure
      this.recordFailure();

      this.logger.error('Memory retrieval failed', {
        query,
        error: error.message,
        stack: error.stack,
        type: 'memory_error'
      });

      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Parse a Mem0 entry into a MemoryEntry
   * Returns null if parsing fails
   */
  private parseMemoryEntry(mem0Entry: any): MemoryEntry | null {
    try {
      // Mem0 entries have an id and memory field
      if (!mem0Entry || !mem0Entry.id) {
        return null;
      }

      // Extract metadata
      const metadata = mem0Entry.metadata || {};
      
      // Try to parse the memory content
      // The memory field might contain the stored data
      let step = metadata.step || 'unknown';
      let sessionId = metadata.sessionId || '';
      let workflowType = metadata.workflowType;
      let timestamp = metadata.timestamp ? new Date(metadata.timestamp) : new Date();
      let input: Record<string, any> = {};
      let output: Record<string, any> = {};
      let userId: string | undefined;

      // Try to extract data from messages if available
      if (mem0Entry.messages && Array.isArray(mem0Entry.messages)) {
        for (const message of mem0Entry.messages) {
          if (message.role === 'user' && message.content) {
            try {
              const userData = JSON.parse(message.content);
              step = userData.step || step;
              input = userData.input || input;
              sessionId = userData.sessionId || sessionId;
              userId = userData.userId;
              workflowType = userData.workflowType || workflowType;
              if (userData.timestamp) {
                timestamp = new Date(userData.timestamp);
              }
            } catch (e) {
              // If parsing fails, use the content as-is
              input = { content: message.content };
            }
          } else if (message.role === 'assistant' && message.content) {
            try {
              output = JSON.parse(message.content);
            } catch (e) {
              // If parsing fails, use the content as-is
              output = { content: message.content };
            }
          }
        }
      }

      // Construct MemoryEntry
      const entry: MemoryEntry = {
        id: mem0Entry.id,
        step,
        input,
        output,
        sessionId,
        timestamp,
        mem0Metadata: mem0Entry.metadata
      };

      // Add optional fields only if they exist
      if (userId !== undefined) {
        entry.userId = userId;
      }
      
      if (workflowType !== undefined) {
        entry.workflowType = workflowType;
      }

      return entry;

    } catch (error: any) {
      this.logger.warn('Failed to parse memory entry', {
        entryId: mem0Entry?.id,
        error: error.message
      });
      return null;
    }
  }

  /**
   * Apply query filters to a memory entry
   * Returns true if the entry matches all filters
   */
  private applyFilters(entry: MemoryEntry, query: MemoryQuery): boolean {
    // Filter by sessionId
    if (query.sessionId && entry.sessionId !== query.sessionId) {
      return false;
    }

    // Filter by userId
    if (query.userId && entry.userId !== query.userId) {
      return false;
    }

    // Filter by workflowType
    if (query.workflowType && entry.workflowType !== query.workflowType) {
      return false;
    }

    // Filter by step
    if (query.step && entry.step !== query.step) {
      return false;
    }

    // Filter by date range
    if (query.startDate && entry.timestamp < query.startDate) {
      return false;
    }

    if (query.endDate && entry.timestamp > query.endDate) {
      return false;
    }

    return true;
  }

  /**
   * Clear memory for a specific session
   */
  async clearSessionMemory(sessionId: string): Promise<boolean> {
    // Implementation will be added in task 6
    this.logger.debug('clearSessionMemory called', { sessionId });
    return false;
  }

  /**
   * Get memory statistics for a session
   */
  async getMemoryStats(sessionId: string): Promise<MemoryStats> {
    // Implementation will be added in task 6
    this.logger.debug('getMemoryStats called', { sessionId });
    return {
      totalEntries: 0,
      entriesByStep: {},
      averageEntriesPerSession: 0
    };
  }

  /**
   * Check if memory service is available
   */
  isAvailable(): boolean {
    return this.isEnabled && this.isHealthy;
  }

  /**
   * Get health status of memory service
   */
  getHealthStatus(): MemoryHealthStatus {
    let mode: 'active' | 'degraded' | 'disabled';
    
    if (!this.isEnabled) {
      mode = 'disabled';
    } else if (!this.isHealthy || this.failureCount >= this.FAILURE_THRESHOLD) {
      mode = 'degraded';
    } else {
      mode = 'active';
    }
    
    const status: MemoryHealthStatus = {
      isAvailable: this.isAvailable(),
      isHealthy: this.isHealthy,
      failureCount: this.failureCount,
      mode
    };
    
    // Add optional fields only if they exist
    if (this.lastSuccessfulOperation !== undefined) {
      status.lastSuccessfulOperation = this.lastSuccessfulOperation;
    }
    
    if (this.lastFailureTime !== undefined) {
      status.lastFailure = this.lastFailureTime;
    }
    
    return status;
  }

  /**
   * Check if operation should be attempted based on circuit breaker state
   * Returns false if circuit breaker is open (too many failures)
   */
  private shouldAttemptOperation(): boolean {
    // If not enabled, don't attempt
    if (!this.isEnabled) {
      return false;
    }

    // If below failure threshold, always attempt
    if (this.failureCount < this.FAILURE_THRESHOLD) {
      return true;
    }

    // If at or above threshold, check if recovery timeout has passed
    if (this.lastFailureTime) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime.getTime();
      
      if (timeSinceLastFailure > this.RECOVERY_TIMEOUT) {
        // Recovery timeout passed - reset and try again
        this.logger.info('Circuit breaker recovery timeout passed - attempting operation', {
          failureCount: this.failureCount,
          timeSinceLastFailure
        });
        this.failureCount = 0;
        return true;
      }
    }

    // Circuit breaker is open - don't attempt
    this.logger.debug('Circuit breaker open - skipping operation', {
      failureCount: this.failureCount,
      threshold: this.FAILURE_THRESHOLD
    });
    return false;
  }

  /**
   * Record a failure for circuit breaker tracking
   * Increments failure count and updates health status
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    // Check if threshold reached
    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      this.isHealthy = false;
      
      this.logger.warn('Memory Service entering degraded mode due to repeated failures', {
        failureCount: this.failureCount,
        threshold: this.FAILURE_THRESHOLD,
        mode: 'degraded'
      });
    } else {
      this.logger.debug('Memory operation failure recorded', {
        failureCount: this.failureCount,
        threshold: this.FAILURE_THRESHOLD
      });
    }
  }

  /**
   * Record a success for circuit breaker tracking
   * Resets failure count and updates health status
   */
  private recordSuccess(): void {
    // Reset failure tracking
    const hadFailures = this.failureCount > 0;
    this.failureCount = 0;
    this.isHealthy = true;
    this.lastSuccessfulOperation = new Date();

    // Log recovery if we had failures
    if (hadFailures) {
      this.logger.info('Memory Service recovered - returning to active mode', {
        mode: 'active',
        lastFailure: this.lastFailureTime
      });
    }
  }
}
