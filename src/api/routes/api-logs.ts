/**
 * API Logs Routes
 * Endpoints for accessing API call logs and statistics
 */

import { Router, Request, Response } from 'express';
import { authenticateUser } from '../middleware/auth';
import { apiLoggerService } from '../../services/api-logger-service';
import { ApiLogFilter } from '../../models/api-log-models';
import { logger } from '../../utils/logger';

const router = Router();

/**
 * GET /api/logs
 * Get API logs with optional filtering
 */
router.get('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      method,
      endpoint,
      statusCode,
      minDuration,
      maxDuration,
      userId,
      sessionId,
      hasError,
      messageHash,
      limit = '100',
      offset = '0'
    } = req.query;

    const filter: ApiLogFilter = {};
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);
    if (method) filter.method = method as string;
    if (endpoint) filter.endpoint = endpoint as string;
    if (statusCode) filter.statusCode = parseInt(statusCode as string);
    if (minDuration) filter.minDuration = parseInt(minDuration as string);
    if (maxDuration) filter.maxDuration = parseInt(maxDuration as string);
    if (userId) filter.userId = userId as string;
    if (sessionId) filter.sessionId = sessionId as string;
    if (hasError !== undefined) filter.hasError = hasError === 'true';
    if (messageHash) {
      filter.messageHash = (messageHash as string).trim();
      logger.info('Filtering logs by messageHash', { messageHash: filter.messageHash });
    }

    const logs = apiLoggerService.getLogs(
      filter,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    const totalCount = apiLoggerService.getLogCount(filter);

    res.json({
      success: true,
      logs,
      pagination: {
        total: totalCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        hasMore: totalCount > parseInt(offset as string) + logs.length
      }
    });
  } catch (error) {
    logger.error('Failed to get API logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API logs'
    });
  }
});

/**
 * GET /api/logs/stats
 * Get API statistics
 */
router.get('/stats', authenticateUser, async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      method,
      endpoint
    } = req.query;

    const filter: ApiLogFilter = {};
    if (startDate) filter.startDate = new Date(startDate as string);
    if (endDate) filter.endDate = new Date(endDate as string);
    if (method) filter.method = method as string;
    if (endpoint) filter.endpoint = endpoint as string;

    const stats = apiLoggerService.getStats(filter);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Failed to get API stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve API statistics'
    });
  }
});

/**
 * GET /api/logs/:id
 * Get a specific log entry by ID
 */
router.get('/:id', authenticateUser, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const logs = apiLoggerService.getLogs(undefined, 10000);
    const log = logs.find(l => l.id === id);

    if (!log) {
      res.status(404).json({
        success: false,
        error: 'Log entry not found'
      });
      return;
    }

    res.json({
      success: true,
      log
    });
  } catch (error) {
    logger.error('Failed to get log entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve log entry'
    });
  }
});

/**
 * DELETE /api/logs
 * Clear all logs (admin only)
 */
router.delete('/', authenticateUser, async (req: Request, res: Response) => {
  try {
    apiLoggerService.clearLogs();

    res.json({
      success: true,
      message: 'All logs cleared successfully'
    });
  } catch (error) {
    logger.error('Failed to clear logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear logs'
    });
  }
});

/**
 * GET /api/logs/endpoints/list
 * Get list of all API endpoints with their stats
 */
router.get('/endpoints/list', authenticateUser, async (req: Request, res: Response) => {
  try {
    const logs = apiLoggerService.getLogs(undefined, 10000);
    
    // Group logs by endpoint
    const endpointMap = new Map<string, any[]>();
    logs.forEach(log => {
      const key = `${log.method} ${log.endpoint}`;
      const existing = endpointMap.get(key) || [];
      existing.push(log);
      endpointMap.set(key, existing);
    });

    // Calculate stats for each endpoint
    const endpoints = Array.from(endpointMap.entries()).map(([key, logs]) => {
      const [method, path] = key.split(' ', 2);
      const totalCalls = logs.length;
      const errorCount = logs.filter(l => l.statusCode >= 400).length;
      const avgResponseTime = logs.reduce((sum, l) => sum + l.duration, 0) / totalCalls;
      const lastCalled = logs.length > 0 ? logs[0].timestamp : undefined;

      return {
        path,
        method,
        description: '', // Could be populated from route metadata
        isActive: true,
        lastCalled,
        totalCalls,
        averageResponseTime: Math.round(avgResponseTime),
        errorCount
      };
    });

    // Sort by total calls descending
    endpoints.sort((a, b) => b.totalCalls - a.totalCalls);

    res.json({
      success: true,
      endpoints
    });
  } catch (error) {
    logger.error('Failed to get endpoints list:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve endpoints list'
    });
  }
});

export default router;
