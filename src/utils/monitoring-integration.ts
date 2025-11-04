import { EventEmitter } from 'events';
import { systemMonitor, SystemHealth, Alert } from './system-monitor';
import { serviceMonitor, ServiceCall } from './service-monitor';
import { alertingSystem, AlertChannel, AlertRule } from './alerting';
import { logger, logSystemStartup, logSystemShutdown, logError } from './logger';

export interface MonitoringIntegrationConfig {
  enableRealTimeAlerts: boolean;
  enablePerformanceTracking: boolean;
  enableHealthChecks: boolean;
  enableMetricsCollection: boolean;
  dashboardRefreshInterval: number;
  criticalServiceThresholds: {
    responseTime: number;
    errorRate: number;
    availability: number;
  };
}

export interface ComponentHealth {
  component: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  metrics: Record<string, any>;
  issues: string[];
}

export interface SystemOverview {
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  components: ComponentHealth[];
  activeAlerts: Alert[];
  systemMetrics: {
    uptime: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
    activeSessions: number;
  };
  performance: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage?: number;
  };
}

/**
 * Comprehensive monitoring integration service
 * Coordinates all monitoring aspects and provides unified interface
 */
export class MonitoringIntegration extends EventEmitter {
  private config: MonitoringIntegrationConfig;
  private componentHealthChecks = new Map<string, () => Promise<ComponentHealth>>();
  private criticalServices = new Set<string>();
  private dashboardInterval?: NodeJS.Timeout;

  constructor(config: MonitoringIntegrationConfig) {
    super();
    this.config = config;
    this.setupEventHandlers();
    this.registerCriticalServices();
    this.startDashboardUpdates();
  }

  /**
   * Setup event handlers for monitoring events
   */
  private setupEventHandlers(): void {
    // System monitor events
    systemMonitor.on('healthCheck', this.handleHealthCheck.bind(this));
    systemMonitor.on('alert', this.handleAlert.bind(this));
    systemMonitor.on('alertResolved', this.handleAlertResolved.bind(this));

    // Service monitor events (if it were an EventEmitter)
    this.setupServiceMonitoringEvents();

    logSystemStartup('MonitoringIntegration', {
      config: this.config,
      criticalServices: Array.from(this.criticalServices)
    });
  }

  /**
   * Setup service monitoring events
   */
  private setupServiceMonitoringEvents(): void {
    // Since ServiceMonitor is not an EventEmitter, we'll poll for changes
    setInterval(() => {
      this.checkServiceHealth();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Register critical services that require special monitoring
   */
  private registerCriticalServices(): void {
    const criticalServices = [
      'ConversationManager',
      'SOPGenerator',
      'SpeechToText',
      'TextToSpeech',
      'DocumentExporter'
    ];

    criticalServices.forEach(service => {
      this.criticalServices.add(service);
    });

    // Register health check functions for each critical service
    this.registerComponentHealthCheck('ConversationManager', this.checkConversationManagerHealth.bind(this));
    this.registerComponentHealthCheck('SOPGenerator', this.checkSOPGeneratorHealth.bind(this));
    this.registerComponentHealthCheck('SpeechToText', this.checkSpeechToTextHealth.bind(this));
    this.registerComponentHealthCheck('TextToSpeech', this.checkTextToSpeechHealth.bind(this));
    this.registerComponentHealthCheck('DocumentExporter', this.checkDocumentExporterHealth.bind(this));
  }

  /**
   * Register a health check function for a component
   */
  registerComponentHealthCheck(component: string, healthCheck: () => Promise<ComponentHealth>): void {
    this.componentHealthChecks.set(component, healthCheck);
    
    logger.info('Component health check registered', {
      component,
      type: 'monitoring_registration'
    });
  }

  /**
   * Check health of all registered components
   */
  async checkAllComponentsHealth(): Promise<ComponentHealth[]> {
    const healthChecks: Promise<ComponentHealth>[] = [];

    for (const [component, healthCheck] of this.componentHealthChecks) {
      healthChecks.push(
        healthCheck().catch(error => ({
          component,
          status: 'unknown' as const,
          lastCheck: new Date(),
          metrics: {},
          issues: [`Health check failed: ${error.message}`]
        }))
      );
    }

    return Promise.all(healthChecks);
  }

  /**
   * Get comprehensive system overview
   */
  async getSystemOverview(): Promise<SystemOverview> {
    try {
      const [systemHealth, componentHealths] = await Promise.all([
        systemMonitor.getSystemHealth(),
        this.checkAllComponentsHealth()
      ]);

      // Determine overall health
      let overallHealth: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (systemHealth.status === 'unhealthy' || componentHealths.some(c => c.status === 'unhealthy')) {
        overallHealth = 'unhealthy';
      } else if (systemHealth.status === 'degraded' || componentHealths.some(c => c.status === 'degraded')) {
        overallHealth = 'degraded';
      }

      return {
        overallHealth,
        components: componentHealths,
        activeAlerts: systemHealth.alerts,
        systemMetrics: {
          uptime: systemHealth.uptime,
          totalRequests: systemHealth.metrics.totalRequests,
          errorRate: systemHealth.metrics.errorRate,
          averageResponseTime: systemHealth.metrics.averageResponseTime,
          activeSessions: systemHealth.metrics.activeSessions
        },
        performance: {
          memoryUsage: (systemHealth.metrics.memoryUsage.heapUsed / systemHealth.metrics.memoryUsage.heapTotal) * 100,
          cpuUsage: systemHealth.metrics.cpuUsage,
          diskUsage: systemHealth.metrics.diskUsage
        }
      };

    } catch (error) {
      logError(error as Error, { operation: 'getSystemOverview' });
      throw error;
    }
  }

  /**
   * Handle health check events
   */
  private handleHealthCheck(health: SystemHealth): void {
    this.emit('systemHealthUpdate', health);

    // Check for critical service issues
    this.checkCriticalServiceHealth(health);

    logger.debug('System health check completed', {
      status: health.status,
      serviceCount: Object.keys(health.services).length,
      alertCount: health.alerts.length
    });
  }

  /**
   * Handle alert events
   */
  private handleAlert(alert: Alert): void {
    this.emit('alert', alert);

    // Special handling for critical service alerts
    if (alert.service && this.criticalServices.has(alert.service)) {
      this.emit('criticalServiceAlert', alert);
      
      logger.error('Critical service alert', {
        service: alert.service,
        level: alert.level,
        message: alert.message,
        alertId: alert.id
      });
    }
  }

  /**
   * Handle alert resolved events
   */
  private handleAlertResolved(alert: Alert): void {
    this.emit('alertResolved', alert);
    
    logger.info('Alert resolved', {
      alertId: alert.id,
      service: alert.service,
      message: alert.message
    });
  }

  /**
   * Check critical service health
   */
  private checkCriticalServiceHealth(systemHealth: SystemHealth): void {
    for (const serviceName of this.criticalServices) {
      const serviceHealth = systemHealth.services[serviceName];
      
      if (!serviceHealth) {
        continue;
      }

      const { responseTime, errorRate, availability } = serviceHealth;
      const thresholds = this.config.criticalServiceThresholds;

      // Check if service exceeds critical thresholds
      if (responseTime > thresholds.responseTime ||
          errorRate > thresholds.errorRate ||
          availability < thresholds.availability) {
        
        this.emit('criticalServiceIssue', {
          service: serviceName,
          health: serviceHealth,
          thresholds
        });
      }
    }
  }

  /**
   * Check service health periodically
   */
  private checkServiceHealth(): void {
    const healthSummary = serviceMonitor.getHealthSummary();
    
    if (healthSummary.unhealthyServices > 0) {
      this.emit('serviceHealthDegraded', healthSummary);
    }
  }

  /**
   * Start dashboard updates
   */
  private startDashboardUpdates(): void {
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
    }

    this.dashboardInterval = setInterval(async () => {
      try {
        const overview = await this.getSystemOverview();
        this.emit('dashboardUpdate', overview);
      } catch (error) {
        logError(error as Error, { operation: 'dashboardUpdate' });
      }
    }, this.config.dashboardRefreshInterval);
  }

  /**
   * Add custom alert channel
   */
  addAlertChannel(channel: AlertChannel): void {
    alertingSystem.addChannel(channel);
    
    logger.info('Alert channel added', {
      channelName: channel.name,
      channelType: channel.type
    });
  }

  /**
   * Add custom alert rule
   */
  addAlertRule(rule: AlertRule): void {
    alertingSystem.addRule(rule);
    
    logger.info('Alert rule added', {
      ruleName: rule.name,
      channels: rule.channels
    });
  }

  /**
   * Component-specific health checks
   */
  private async checkConversationManagerHealth(): Promise<ComponentHealth> {
    const metrics = serviceMonitor.getServiceMetrics('ConversationManager') as Map<string, any>;
    const issues: string[] = [];
    
    let status: ComponentHealth['status'] = 'healthy';
    
    if (metrics.size === 0) {
      status = 'unknown';
      issues.push('No metrics available');
    } else {
      // Check for high error rates or slow responses
      for (const [method, methodMetrics] of metrics) {
        if (methodMetrics.errorRate > 0.1) {
          status = 'degraded';
          issues.push(`High error rate in ${method}: ${(methodMetrics.errorRate * 100).toFixed(1)}%`);
        }
        if (methodMetrics.averageResponseTime > 5000) {
          status = 'degraded';
          issues.push(`Slow response time in ${method}: ${methodMetrics.averageResponseTime}ms`);
        }
      }
    }

    return {
      component: 'ConversationManager',
      status,
      lastCheck: new Date(),
      metrics: Object.fromEntries(metrics),
      issues
    };
  }

  private async checkSOPGeneratorHealth(): Promise<ComponentHealth> {
    const metrics = serviceMonitor.getServiceMetrics('SOPGenerator') as Map<string, any>;
    const issues: string[] = [];
    
    let status: ComponentHealth['status'] = 'healthy';
    
    if (metrics.size === 0) {
      status = 'unknown';
      issues.push('No metrics available');
    }

    return {
      component: 'SOPGenerator',
      status,
      lastCheck: new Date(),
      metrics: Object.fromEntries(metrics),
      issues
    };
  }

  private async checkSpeechToTextHealth(): Promise<ComponentHealth> {
    const metrics = serviceMonitor.getServiceMetrics('SpeechToText') as Map<string, any>;
    const issues: string[] = [];
    
    let status: ComponentHealth['status'] = 'healthy';
    
    if (metrics.size === 0) {
      status = 'unknown';
      issues.push('No metrics available');
    }

    return {
      component: 'SpeechToText',
      status,
      lastCheck: new Date(),
      metrics: Object.fromEntries(metrics),
      issues
    };
  }

  private async checkTextToSpeechHealth(): Promise<ComponentHealth> {
    const metrics = serviceMonitor.getServiceMetrics('TextToSpeech') as Map<string, any>;
    const issues: string[] = [];
    
    let status: ComponentHealth['status'] = 'healthy';
    
    if (metrics.size === 0) {
      status = 'unknown';
      issues.push('No metrics available');
    }

    return {
      component: 'TextToSpeech',
      status,
      lastCheck: new Date(),
      metrics: Object.fromEntries(metrics),
      issues
    };
  }

  private async checkDocumentExporterHealth(): Promise<ComponentHealth> {
    const metrics = serviceMonitor.getServiceMetrics('DocumentExporter') as Map<string, any>;
    const issues: string[] = [];
    
    let status: ComponentHealth['status'] = 'healthy';
    
    if (metrics.size === 0) {
      status = 'unknown';
      issues.push('No metrics available');
    }

    return {
      component: 'DocumentExporter',
      status,
      lastCheck: new Date(),
      metrics: Object.fromEntries(metrics),
      issues
    };
  }

  /**
   * Stop monitoring integration
   */
  stop(): void {
    if (this.dashboardInterval) {
      clearInterval(this.dashboardInterval);
      delete this.dashboardInterval;
    }

    logSystemShutdown('MonitoringIntegration');
  }
}

// Default configuration
export const defaultMonitoringIntegrationConfig: MonitoringIntegrationConfig = {
  enableRealTimeAlerts: true,
  enablePerformanceTracking: true,
  enableHealthChecks: true,
  enableMetricsCollection: true,
  dashboardRefreshInterval: 30000, // 30 seconds
  criticalServiceThresholds: {
    responseTime: 10000, // 10 seconds
    errorRate: 0.05, // 5%
    availability: 0.95 // 95%
  }
};

// Export singleton instance
export const monitoringIntegration = new MonitoringIntegration(defaultMonitoringIntegrationConfig);