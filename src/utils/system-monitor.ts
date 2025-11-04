import { logger } from './logger';
import { serviceMonitor, ServiceMetrics } from './service-monitor';
import { EventEmitter } from 'events';
import { alertingSystem } from './alerting';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  services: Record<string, ServiceHealth>;
  metrics: SystemMetrics;
  alerts: Alert[];
}

export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime: number;
  errorRate: number;
  availability: number;
  details?: Record<string, any>;
}

export interface SystemMetrics {
  totalRequests: number;
  requestsPerMinute: number;
  averageResponseTime: number;
  errorRate: number;
  activeSessions: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  diskUsage?: number;
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  service?: string;
  resolved: boolean;
  metadata?: Record<string, any>;
}

export interface MonitoringConfig {
  healthCheckInterval: number;
  metricsRetentionPeriod: number;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  enableAlerts: boolean;
  enableMetricsCollection: boolean;
}

/**
 * System monitoring and health management
 */
export class SystemMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private healthCheckInterval?: NodeJS.Timeout;
  private metricsHistory: Array<{ timestamp: Date; metrics: SystemMetrics }> = [];
  private alerts: Alert[] = [];
  private startTime = Date.now();
  private activeSessions = new Set<string>();
  private requestCounts: Array<{ timestamp: Date; count: number }> = [];

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.startHealthChecks();
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);

    logger.info('System monitoring started', {
      interval: this.config.healthCheckInterval,
      alertsEnabled: this.config.enableAlerts
    });
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const systemHealth = await this.getSystemHealth();
      
      // Check for alerts
      if (this.config.enableAlerts) {
        this.checkAlertConditions(systemHealth);
      }

      // Store metrics history
      if (this.config.enableMetricsCollection) {
        this.storeMetrics(systemHealth.metrics);
      }

      // Emit health check event
      this.emit('healthCheck', systemHealth);

      logger.debug('Health check completed', {
        status: systemHealth.status,
        serviceCount: Object.keys(systemHealth.services).length,
        alertCount: systemHealth.alerts.length
      });

    } catch (error) {
      logger.error('Health check failed', { error: (error as Error).message });
      
      this.createAlert('critical', 'Health check system failure', 'system', {
        error: (error as Error).message
      });
    }
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    const services = await this.checkAllServices();
    const metrics = await this.collectSystemMetrics();
    const alerts = this.getActiveAlerts();

    // Determine overall system status
    const serviceStatuses = Object.values(services).map(s => s.status);
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (serviceStatuses.includes('unhealthy')) {
      status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: new Date(),
      uptime: Date.now() - this.startTime,
      version: process.env.npm_package_version || '1.0.0',
      services,
      metrics,
      alerts
    };
  }

  /**
   * Check health of all services
   */
  private async checkAllServices(): Promise<Record<string, ServiceHealth>> {
    const services: Record<string, ServiceHealth> = {};

    // Check core services
    const coreServices = [
      'ConversationManager',
      'SOPGenerator', 
      'SpeechToText',
      'TextToSpeech',
      'VisualGenerator',
      'DocumentExporter'
    ];

    for (const serviceName of coreServices) {
      services[serviceName] = await this.checkServiceHealth(serviceName);
    }

    return services;
  }

  /**
   * Check health of individual service
   */
  private async checkServiceHealth(serviceName: string): Promise<ServiceHealth> {
    const serviceMetrics = serviceMonitor.getServiceMetrics(serviceName) as Map<string, ServiceMetrics>;
    
    if (serviceMetrics.size === 0) {
      return {
        status: 'unknown',
        lastCheck: new Date(),
        responseTime: 0,
        errorRate: 0,
        availability: 0,
        details: { message: 'No metrics available' }
      };
    }

    // Aggregate metrics across all methods
    let totalCalls = 0;
    let totalSuccessful = 0;
    let totalResponseTime = 0;
    let methodCount = 0;

    for (const [methodName, metrics] of serviceMetrics) {
      totalCalls += metrics.totalCalls;
      totalSuccessful += metrics.successfulCalls;
      totalResponseTime += metrics.averageResponseTime;
      methodCount++;
    }

    const errorRate = totalCalls > 0 ? (totalCalls - totalSuccessful) / totalCalls : 0;
    const averageResponseTime = methodCount > 0 ? totalResponseTime / methodCount : 0;
    const availability = totalCalls > 0 ? totalSuccessful / totalCalls : 0;

    // Determine service status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (errorRate > this.config.alertThresholds.errorRate || 
        averageResponseTime > this.config.alertThresholds.responseTime) {
      status = 'unhealthy';
    } else if (errorRate > this.config.alertThresholds.errorRate * 0.5 || 
               averageResponseTime > this.config.alertThresholds.responseTime * 0.7) {
      status = 'degraded';
    }

    return {
      status,
      lastCheck: new Date(),
      responseTime: averageResponseTime,
      errorRate,
      availability,
      details: {
        totalCalls,
        methodCount,
        methods: Array.from(serviceMetrics.keys())
      }
    };
  }

  /**
   * Collect system-wide metrics
   */
  private async collectSystemMetrics(): Promise<SystemMetrics> {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = await this.getCPUUsage();
    
    // Calculate request metrics
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    const recentRequests = this.requestCounts.filter(r => r.timestamp.getTime() > oneMinuteAgo);
    const requestsPerMinute = recentRequests.reduce((sum, r) => sum + r.count, 0);

    // Get service metrics
    const allMetrics = serviceMonitor.getAllMetrics();
    let totalRequests = 0;
    let totalResponseTime = 0;
    let totalErrors = 0;
    let serviceCount = 0;

    for (const [service, metrics] of allMetrics) {
      totalRequests += metrics.totalCalls;
      totalResponseTime += metrics.averageResponseTime;
      totalErrors += metrics.failedCalls;
      serviceCount++;
    }

    const averageResponseTime = serviceCount > 0 ? totalResponseTime / serviceCount : 0;
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      totalRequests,
      requestsPerMinute,
      averageResponseTime,
      errorRate,
      activeSessions: this.activeSessions.size,
      memoryUsage,
      cpuUsage
    };
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const totalUsage = endUsage.user + endUsage.system;
        const cpuPercent = (totalUsage / 1000000) * 100; // Convert to percentage
        resolve(Math.min(cpuPercent, 100));
      }, 100);
    });
  }

  /**
   * Check for alert conditions
   */
  private checkAlertConditions(systemHealth: SystemHealth): void {
    const { metrics, services } = systemHealth;

    // Check memory usage
    const memoryUsagePercent = (metrics.memoryUsage.heapUsed / metrics.memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > this.config.alertThresholds.memoryUsage) {
      this.createAlert('warning', `High memory usage: ${memoryUsagePercent.toFixed(1)}%`, 'system', {
        memoryUsage: metrics.memoryUsage
      });
    }

    // Check CPU usage
    if (metrics.cpuUsage > this.config.alertThresholds.cpuUsage) {
      this.createAlert('warning', `High CPU usage: ${metrics.cpuUsage.toFixed(1)}%`, 'system', {
        cpuUsage: metrics.cpuUsage
      });
    }

    // Check service health
    for (const [serviceName, serviceHealth] of Object.entries(services)) {
      if (serviceHealth.status === 'unhealthy') {
        this.createAlert('error', `Service ${serviceName} is unhealthy`, serviceName, {
          errorRate: serviceHealth.errorRate,
          responseTime: serviceHealth.responseTime
        });
      } else if (serviceHealth.status === 'degraded') {
        this.createAlert('warning', `Service ${serviceName} is degraded`, serviceName, {
          errorRate: serviceHealth.errorRate,
          responseTime: serviceHealth.responseTime
        });
      }
    }

    // Check overall error rate
    if (metrics.errorRate > this.config.alertThresholds.errorRate) {
      this.createAlert('error', `High system error rate: ${(metrics.errorRate * 100).toFixed(1)}%`, 'system', {
        errorRate: metrics.errorRate
      });
    }
  }

  /**
   * Create a new alert
   */
  private createAlert(level: Alert['level'], message: string, service?: string, metadata?: Record<string, any>): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      timestamp: new Date(),
      resolved: false,
      ...(service && { service }),
      ...(metadata && { metadata })
    };

    this.alerts.push(alert);

    // Emit alert event
    this.emit('alert', alert);

    // Send to alerting system
    alertingSystem.processAlert(alert);

    logger.warn('Alert created', {
      alertId: alert.id,
      level: alert.level,
      message: alert.message,
      service: alert.service
    });

    // Auto-resolve info alerts after 5 minutes
    if (level === 'info') {
      setTimeout(() => {
        this.resolveAlert(alert.id);
      }, 5 * 60 * 1000);
    }
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    
    if (alert && !alert.resolved) {
      alert.resolved = true;
      
      this.emit('alertResolved', alert);
      
      logger.info('Alert resolved', {
        alertId: alert.id,
        message: alert.message
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Get active (unresolved) alerts
   */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter(a => !a.resolved);
  }

  /**
   * Get all alerts
   */
  getAllAlerts(limit?: number): Alert[] {
    const alerts = [...this.alerts].reverse(); // Most recent first
    return limit ? alerts.slice(0, limit) : alerts;
  }

  /**
   * Store metrics in history
   */
  private storeMetrics(metrics: SystemMetrics): void {
    this.metricsHistory.push({
      timestamp: new Date(),
      metrics: { ...metrics }
    });

    // Clean up old metrics
    const cutoffTime = Date.now() - this.config.metricsRetentionPeriod;
    this.metricsHistory = this.metricsHistory.filter(
      m => m.timestamp.getTime() > cutoffTime
    );
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours?: number): Array<{ timestamp: Date; metrics: SystemMetrics }> {
    if (!hours) {
      return [...this.metricsHistory];
    }

    const cutoffTime = Date.now() - (hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(m => m.timestamp.getTime() > cutoffTime);
  }

  /**
   * Track session activity
   */
  trackSession(sessionId: string, action: 'start' | 'end'): void {
    if (action === 'start') {
      this.activeSessions.add(sessionId);
      logger.debug('Session started', { sessionId, totalSessions: this.activeSessions.size });
    } else {
      this.activeSessions.delete(sessionId);
      logger.debug('Session ended', { sessionId, totalSessions: this.activeSessions.size });
    }
  }

  /**
   * Track request
   */
  trackRequest(): void {
    const now = new Date();
    const existingEntry = this.requestCounts.find(
      r => Math.abs(r.timestamp.getTime() - now.getTime()) < 1000
    );

    if (existingEntry) {
      existingEntry.count++;
    } else {
      this.requestCounts.push({ timestamp: now, count: 1 });
    }

    // Clean up old request counts (keep last hour)
    const oneHourAgo = now.getTime() - 3600000;
    this.requestCounts = this.requestCounts.filter(r => r.timestamp.getTime() > oneHourAgo);
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData(): {
    health: SystemHealth;
    metricsHistory: Array<{ timestamp: Date; metrics: SystemMetrics }>;
    recentAlerts: Alert[];
    serviceMetrics: Map<string, ServiceMetrics>;
  } {
    return {
      health: this.getSystemHealth() as any, // Will be resolved by caller
      metricsHistory: this.getMetricsHistory(24), // Last 24 hours
      recentAlerts: this.getAllAlerts(50),
      serviceMetrics: serviceMonitor.getAllMetrics()
    };
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      delete this.healthCheckInterval;
    }

    logger.info('System monitoring stopped');
  }
}

// Default configuration
export const defaultMonitoringConfig: MonitoringConfig = {
  healthCheckInterval: 30000, // 30 seconds
  metricsRetentionPeriod: 24 * 60 * 60 * 1000, // 24 hours
  alertThresholds: {
    responseTime: 5000, // 5 seconds
    errorRate: 0.1, // 10%
    memoryUsage: 80, // 80%
    cpuUsage: 80 // 80%
  },
  enableAlerts: true,
  enableMetricsCollection: true
};

// Export singleton instance
export const systemMonitor = new SystemMonitor(defaultMonitoringConfig);