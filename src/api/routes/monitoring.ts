import { Router, Request, Response } from 'express';
import { systemMonitor } from '../../utils/system-monitor';
import { serviceMonitor } from '../../utils/service-monitor';
import { alertingSystem } from '../../utils/alerting';
import { logger } from '../../utils/logger';
import { routeSpecificMonitoring } from '../middleware/monitoring';

const router = Router();

/**
 * Get system health status
 */
router.get('/health', routeSpecificMonitoring('health'), async (req: Request, res: Response) => {
  try {
    const health = await systemMonitor.getSystemHealth();
    
    res.status(health.status === 'healthy' ? 200 : 
               health.status === 'degraded' ? 206 : 503)
       .json(health);
       
  } catch (error) {
    logger.error('Failed to get system health', { error: (error as Error).message });
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date()
    });
  }
});

/**
 * Get detailed monitoring dashboard data
 */
router.get('/dashboard', routeSpecificMonitoring('dashboard'), async (req: Request, res: Response) => {
  try {
    const dashboardData = systemMonitor.getDashboardData();
    
    // Resolve the health promise
    const health = await dashboardData.health;
    
    const response = {
      ...dashboardData,
      health,
      alertingStats: alertingSystem.getStatistics(),
      serviceHealth: serviceMonitor.getHealthSummary()
    };
    
    res.json(response);
    
  } catch (error) {
    logger.error('Failed to get dashboard data', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve dashboard data',
      timestamp: new Date()
    });
  }
});

/**
 * Get service metrics
 */
router.get('/services/:serviceName/metrics', routeSpecificMonitoring('service-metrics'), (req: Request, res: Response): void => {
  try {
    const { serviceName } = req.params;
    const { method } = req.query;
    
    if (!serviceName) {
      res.status(400).json({
        error: 'Service name is required'
      });
      return;
    }
    
    const metrics = serviceMonitor.getServiceMetrics(serviceName, method as string | undefined);
    
    res.json({
      serviceName,
      method: method || 'all',
      metrics,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get service metrics', { 
      serviceName: req.params.serviceName,
      error: (error as Error).message 
    });
    res.status(500).json({
      error: 'Failed to retrieve service metrics',
      timestamp: new Date()
    });
  }
});

/**
 * Get all service metrics
 */
router.get('/services/metrics', routeSpecificMonitoring('all-service-metrics'), (req: Request, res: Response) => {
  try {
    const allMetrics = serviceMonitor.getAllMetrics();
    const healthSummary = serviceMonitor.getHealthSummary();
    
    res.json({
      metrics: Object.fromEntries(allMetrics),
      summary: healthSummary,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get all service metrics', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve service metrics',
      timestamp: new Date()
    });
  }
});

/**
 * Get active service calls
 */
router.get('/services/active-calls', routeSpecificMonitoring('active-calls'), (req: Request, res: Response) => {
  try {
    const activeCalls = serviceMonitor.getActiveCalls();
    
    res.json({
      activeCalls,
      count: activeCalls.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get active calls', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve active calls',
      timestamp: new Date()
    });
  }
});

/**
 * Get alerts
 */
router.get('/alerts', routeSpecificMonitoring('alerts'), (req: Request, res: Response) => {
  try {
    const { active, limit } = req.query;
    
    const alerts = active === 'true' 
      ? systemMonitor.getActiveAlerts()
      : systemMonitor.getAllAlerts(limit ? parseInt(limit as string) : undefined);
    
    res.json({
      alerts,
      count: alerts.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get alerts', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve alerts',
      timestamp: new Date()
    });
  }
});

/**
 * Resolve an alert
 */
router.patch('/alerts/:alertId/resolve', routeSpecificMonitoring('resolve-alert'), (req: Request, res: Response): void => {
  try {
    const { alertId } = req.params;
    
    if (!alertId) {
      res.status(400).json({
        error: 'Alert ID is required'
      });
      return;
    }
    
    const resolved = systemMonitor.resolveAlert(alertId);
    
    if (resolved) {
      res.json({
        success: true,
        message: 'Alert resolved successfully',
        alertId,
        timestamp: new Date()
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Alert not found or already resolved',
        alertId,
        timestamp: new Date()
      });
    }
    
  } catch (error) {
    logger.error('Failed to resolve alert', { 
      alertId: req.params.alertId,
      error: (error as Error).message 
    });
    res.status(500).json({
      error: 'Failed to resolve alert',
      timestamp: new Date()
    });
  }
});

/**
 * Get metrics history
 */
router.get('/metrics/history', routeSpecificMonitoring('metrics-history'), (req: Request, res: Response) => {
  try {
    const { hours } = req.query;
    const hoursNum = hours ? parseInt(hours as string) : undefined;
    
    const history = systemMonitor.getMetricsHistory(hoursNum);
    
    res.json({
      history,
      count: history.length,
      period: hoursNum ? `${hoursNum} hours` : 'all',
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get metrics history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve metrics history',
      timestamp: new Date()
    });
  }
});

/**
 * Get call history
 */
router.get('/services/call-history', routeSpecificMonitoring('call-history'), (req: Request, res: Response) => {
  try {
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : undefined;
    
    const history = serviceMonitor.getCallHistory(limitNum);
    
    res.json({
      history,
      count: history.length,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get call history', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve call history',
      timestamp: new Date()
    });
  }
});

/**
 * Reset monitoring data (for testing/maintenance)
 */
router.post('/reset', routeSpecificMonitoring('reset-monitoring'), (req: Request, res: Response) => {
  try {
    serviceMonitor.reset();
    
    logger.info('Monitoring data reset', {
      requestId: (req as any).requestId,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Monitoring data reset successfully',
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to reset monitoring data', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to reset monitoring data',
      timestamp: new Date()
    });
  }
});

/**
 * Get alerting system statistics
 */
router.get('/alerting/stats', routeSpecificMonitoring('alerting-stats'), (req: Request, res: Response) => {
  try {
    const stats = alertingSystem.getStatistics();
    
    res.json({
      ...stats,
      timestamp: new Date()
    });
    
  } catch (error) {
    logger.error('Failed to get alerting statistics', { error: (error as Error).message });
    res.status(500).json({
      error: 'Failed to retrieve alerting statistics',
      timestamp: new Date()
    });
  }
});

export default router;