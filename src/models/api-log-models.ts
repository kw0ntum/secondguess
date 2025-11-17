/**
 * API Log Models
 * Structures for logging API calls with performance metrics
 */

export interface ApiLogEntry {
  id: string;
  timestamp: Date;
  method: string;
  endpoint: string;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  userId?: string;
  sessionId?: string;
  duration: number; // milliseconds
  networkMetrics: NetworkMetrics;
  error?: string;
}

export interface NetworkMetrics {
  latency: number; // Time to first byte (ms)
  processingTime: number; // Server processing time (ms)
  totalTime: number; // Total request time (ms)
  requestSize: number; // bytes
  responseSize: number; // bytes
  throughput: number; // bytes per second
}

export interface ApiLogFilter {
  startDate?: Date;
  endDate?: Date;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  minDuration?: number;
  maxDuration?: number;
  userId?: string;
  sessionId?: string;
  hasError?: boolean;
}

export interface ApiLogStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  averageProcessingTime: number;
  averageThroughput: number;
  slowestEndpoint: string;
  fastestEndpoint: string;
  mostUsedEndpoint: string;
  errorRate: number;
}

export interface ApiEndpointInfo {
  path: string;
  method: string;
  description: string;
  isActive: boolean;
  lastCalled?: Date;
  totalCalls: number;
  averageResponseTime: number;
  errorCount: number;
}
