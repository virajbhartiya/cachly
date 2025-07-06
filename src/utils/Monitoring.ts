import { MonitoringConfig, HealthStatus, Metrics } from '../types';

export class MonitoringUtil {
  private config: MonitoringConfig;
  private startTime: number;
  private loadTimes: number[] = [];
  private healthChecks: HealthStatus[] = [];
  private alertHistory: string[] = [];

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.startTime = Date.now();
  }

  recordLoadTime(duration: number): void {
    if (!this.config.enabled) return;

    this.loadTimes.push(duration);
    
    // Keep only last 1000 load times for performance
    if (this.loadTimes.length > 1000) {
      this.loadTimes = this.loadTimes.slice(-1000);
    }
  }

  getMetrics(): Metrics {
    const totalLoads = this.loadTimes.length;
    const avgLoadTime = totalLoads > 0 
      ? this.loadTimes.reduce((sum, time) => sum + time, 0) / totalLoads 
      : 0;

    return {
      hitRate: 0, // Will be calculated by cache
      missRate: 0, // Will be calculated by cache
      avgLoadTime,
      memoryEfficiency: 0, // Will be calculated by cache
      compressionRatio: 0, // Will be calculated by cache
      circuitBreakerTrips: 0, // Will be calculated by cache
      partitionDistribution: {}, // Will be calculated by cache
    };
  }

  health(): HealthStatus {
    const now = Date.now();
    const uptime = now - this.startTime;
    const issues: string[] = [];

    // Check alert thresholds
    if (this.config.alertThresholds) {
      const metrics = this.getMetrics();
      
      if (this.config.alertThresholds.hitRate && metrics.hitRate < this.config.alertThresholds.hitRate) {
        issues.push(`Hit rate (${metrics.hitRate.toFixed(2)}%) below threshold (${this.config.alertThresholds.hitRate}%)`);
      }

      if (this.config.alertThresholds.avgLoadTime && metrics.avgLoadTime > this.config.alertThresholds.avgLoadTime) {
        issues.push(`Average load time (${metrics.avgLoadTime.toFixed(2)}ms) above threshold (${this.config.alertThresholds.avgLoadTime}ms)`);
      }

      if (this.config.alertThresholds.memoryUsage && metrics.memoryEfficiency > this.config.alertThresholds.memoryUsage) {
        issues.push(`Memory usage (${metrics.memoryEfficiency.toFixed(2)}%) above threshold (${this.config.alertThresholds.memoryUsage}%)`);
      }
    }

    // Determine status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (issues.length > 0) {
      status = issues.length > 2 ? 'unhealthy' : 'degraded';
    }

    const healthStatus: HealthStatus = {
      status,
      issues,
      lastCheck: now,
      uptime,
    };

    this.healthChecks.push(healthStatus);
    
    // Keep only last 100 health checks
    if (this.healthChecks.length > 100) {
      this.healthChecks = this.healthChecks.slice(-100);
    }

    return healthStatus;
  }

  getHealthHistory(): HealthStatus[] {
    return [...this.healthChecks];
  }

  addAlert(message: string): void {
    if (!this.config.enabled) return;

    this.alertHistory.push(`${new Date().toISOString()}: ${message}`);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory = this.alertHistory.slice(-100);
    }
  }

  getAlerts(): string[] {
    return [...this.alertHistory];
  }

  clearAlerts(): void {
    this.alertHistory = [];
  }

  getUptime(): number {
    return Date.now() - this.startTime;
  }

  getLoadTimeStats(): { min: number; max: number; avg: number; p95: number; p99: number } {
    if (this.loadTimes.length === 0) {
      return { min: 0, max: 0, avg: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.loadTimes].sort((a, b) => a - b);
    const avg = sorted.reduce((sum, time) => sum + time, 0) / sorted.length;
    const p95Index = Math.floor(sorted.length * 0.95);
    const p99Index = Math.floor(sorted.length * 0.99);

    return {
      min: sorted[0] || 0,
      max: sorted[sorted.length - 1] || 0,
      avg,
      p95: sorted[p95Index] || 0,
      p99: sorted[p99Index] || 0,
    };
  }

  reset(): void {
    this.loadTimes = [];
    this.healthChecks = [];
    this.alertHistory = [];
    this.startTime = Date.now();
  }
} 