/**
 * API Logger Service
 * Handles logging of API calls with performance metrics
 */

import { ApiLogEntry, ApiLogFilter, ApiLogStats, NetworkMetrics } from '../models/api-log-models';
import { logger } from '../utils/logger';

export class ApiLoggerService {
  private logs: ApiLogEntry[] = [];
  private readonly MAX_LOGS = 10000; // Keep last 10k logs in memory

  /**
   * Log an API call with performance metrics
   */
  logApiCall(entry: ApiLogEntry): void {
    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Log to console for debugging
    logger.info('API call logged', {
      id: entry.id,
      method: entry.method,
      endpoint: entry.endpoint,
      statusCode: entry.statusCode,
      duration: entry.duration,
      latency: entry.networkMetrics.latency
    });
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filter?: ApiLogFilter, limit: number = 100, offset: number = 0): ApiLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      filteredLogs = filteredLogs.filter(log => {
        if (filter.startDate && log.timestamp < filter.startDate) return false;
        if (filter.endDate && log.timestamp > filter.endDate) return false;
        if (filter.method && log.method !== filter.method) return false;
        if (filter.endpoint && !log.endpoint.includes(filter.endpoint)) return false;
        if (filter.statusCode && log.statusCode !== filter.statusCode) return false;
        if (filter.minDuration && log.duration < filter.minDuration) return false;
        if (filter.maxDuration && log.duration > filter.maxDuration) return false;
        if (filter.userId && log.userId !== filter.userId) return false;
        if (filter.sessionId && log.sessionId !== filter.sessionId) return false;
        if (filter.hasError !== undefined && (!!log.error) !== filter.hasError) return false;
        return true;
      });
    }

    // Sort by timestamp descending (newest first)
    filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Get statistics about API calls
   */
  getStats(filter?: ApiLogFilter): ApiLogStats {
    const logs = filter ? this.getLogs(filter, this.logs.length) : this.logs;

    if (logs.length === 0) {
      return {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageLatency: 0,
        averageProcessingTime: 0,
        averageThroughput: 0,
        slowestEndpoint: '',
        fastestEndpoint: '',
        mostUsedEndpoint: '',
        errorRate: 0
      };
    }

    const successfulRequests = logs.filter(log => log.statusCode >= 200 && log.statusCode < 300).length;
    const failedRequests = logs.length - successfulRequests;

    const totalLatency = logs.reduce((sum, log) => sum + log.networkMetrics.latency, 0);
    const totalProcessingTime = logs.reduce((sum, log) => sum + log.networkMetrics.processingTime, 0);
    const totalThroughput = logs.reduce((sum, log) => sum + log.networkMetrics.throughput, 0);

    // Find slowest and fastest endpoints
    const endpointTimes = new Map<string, number[]>();
    logs.forEach(log => {
      const times = endpointTimes.get(log.endpoint) || [];
      times.push(log.duration);
      endpointTimes.set(log.endpoint, times);
    });

    let slowestEndpoint = '';
    let slowestTime = 0;
    let fastestEndpoint = '';
    let fastestTime = Infinity;

    endpointTimes.forEach((times, endpoint) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      if (avgTime > slowestTime) {
        slowestTime = avgTime;
        slowestEndpoint = endpoint;
      }
      if (avgTime < fastestTime) {
        fastestTime = avgTime;
        fastestEndpoint = endpoint;
      }
    });

    // Find most used endpoint
    const endpointCounts = new Map<string, number>();
    logs.forEach(log => {
      endpointCounts.set(log.endpoint, (endpointCounts.get(log.endpoint) || 0) + 1);
    });

    let mostUsedEndpoint = '';
    let maxCount = 0;
    endpointCounts.forEach((count, endpoint) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsedEndpoint = endpoint;
      }
    });

    return {
      totalRequests: logs.length,
      successfulRequests,
      failedRequests,
      averageLatency: totalLatency / logs.length,
      averageProcessingTime: totalProcessingTime / logs.length,
      averageThroughput: totalThroughput / logs.length,
      slowestEndpoint,
      fastestEndpoint,
      mostUsedEndpoint,
      errorRate: (failedRequests / logs.length) * 100
    };
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    logger.info('API logs cleared');
  }

  /**
   * Get total number of logs
   */
  getLogCount(filter?: ApiLogFilter): number {
    if (!filter) return this.logs.length;
    return this.getLogs(filter, this.logs.length).length;
  }
}

// Singleton instance
export const apiLoggerService = new ApiLoggerService();
