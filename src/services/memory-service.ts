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
    // Implementation will be added in task 5
    this.logger.debug('retrieveMemory called', { query });
    return [];
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
