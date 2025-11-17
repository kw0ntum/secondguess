/**
 * API Logger Middleware
 * Logs all API requests with performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { apiLoggerService } from '../../services/api-logger-service';
import { ApiLogEntry, NetworkMetrics } from '../../models/api-log-models';

interface RequestWithTiming extends Request {
  startTime?: number;
  logId?: string;
}

/**
 * Middleware to log API calls with performance metrics
 */
export function apiLoggerMiddleware(req: RequestWithTiming, res: Response, next: NextFunction): void {
  // Skip logging for health checks and static files
  if (req.path === '/api/monitoring/health' || req.path.startsWith('/dashboard/assets')) {
    return next();
  }

  // Generate unique log ID
  req.logId = uuidv4();
  req.startTime = Date.now();

  // Capture request data
  const requestData = {
    method: req.method,
    endpoint: req.path,
    headers: req.headers as Record<string, string>,
    body: req.body,
    query: req.query,
    params: req.params
  };

  // Calculate request size
  const requestSize = JSON.stringify(requestData).length;

  // Store original res.json and res.send
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override res.json to capture response
  res.json = function(body: any): Response {
    logResponse(body);
    return originalJson(body);
  };

  // Override res.send to capture response
  res.send = function(body: any): Response {
    logResponse(body);
    return originalSend(body);
  };

  function logResponse(responseBody: any): void {
    const endTime = Date.now();
    const duration = endTime - (req.startTime || endTime);

    // Calculate response size
    const responseSize = typeof responseBody === 'string' 
      ? responseBody.length 
      : JSON.stringify(responseBody).length;

    // Calculate network metrics
    const networkMetrics: NetworkMetrics = {
      latency: duration * 0.1, // Estimate: 10% of total time for network latency
      processingTime: duration * 0.9, // Estimate: 90% for server processing
      totalTime: duration,
      requestSize,
      responseSize,
      throughput: responseSize / (duration / 1000) // bytes per second
    };

    // Extract user/session info from request
    const userId = (req as any).user?.id || (req as any).userId;
    const sessionId = req.params.sessionId || (req as any).sessionId;

    // Create log entry
    const errorMessage = res.statusCode >= 400 ? extractError(responseBody) : undefined;
    const logEntry: ApiLogEntry = {
      id: req.logId!,
      timestamp: new Date(req.startTime!),
      method: req.method,
      endpoint: req.path,
      statusCode: res.statusCode,
      requestBody: sanitizeBody(requestData.body),
      responseBody: sanitizeBody(responseBody),
      requestHeaders: sanitizeHeaders(requestData.headers),
      responseHeaders: sanitizeHeaders(res.getHeaders() as Record<string, string>),
      userId,
      sessionId,
      duration,
      networkMetrics,
      ...(errorMessage && { error: errorMessage })
    };

    // Log the API call
    apiLoggerService.logApiCall(logEntry);
  }

  next();
}

/**
 * Sanitize request/response body to remove sensitive data
 */
function sanitizeBody(body: any): any {
  if (!body) return body;

  const sanitized = JSON.parse(JSON.stringify(body));

  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
  
  function removeSensitiveFields(obj: any): void {
    if (typeof obj !== 'object' || obj === null) return;

    for (const key in obj) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        obj[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        removeSensitiveFields(obj[key]);
      }
    }
  }

  removeSensitiveFields(sanitized);
  return sanitized;
}

/**
 * Sanitize headers to remove sensitive data
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase().includes('authorization') || 
        key.toLowerCase().includes('cookie') ||
        key.toLowerCase().includes('token')) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = String(value);
    }
  }

  return sanitized;
}

/**
 * Extract error message from response body
 */
function extractError(responseBody: any): string | undefined {
  if (!responseBody) return undefined;

  if (typeof responseBody === 'string') return responseBody;

  if (responseBody.error) {
    if (typeof responseBody.error === 'string') return responseBody.error;
    if (responseBody.error.message) return responseBody.error.message;
  }

  if (responseBody.message) return responseBody.message;

  return 'Unknown error';
}
