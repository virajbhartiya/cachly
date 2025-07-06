import { CircuitBreakerConfig, CircuitBreakerState } from '../types';

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private config: CircuitBreakerConfig;
  private failureCount = 0;
  private monitorWindow: number[] = [];

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
    this.state = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
  }

  async execute<T>(key: string, operation: () => Promise<T>, fallback?: (key: string) => T): Promise<T> {
    if (!this.config.enabled) {
      return operation();
    }

    if (this.state.state === 'open') {
      if (Date.now() < this.state.nextAttemptTime) {
        if (fallback) {
          return fallback(key);
        }
        throw new Error(`Circuit breaker is open for key: ${key}`);
      }
      this.state.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      if (fallback) {
        return fallback(key);
      }
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state.failureCount = 0;
    this.state.state = 'closed';
    this.monitorWindow = [];
  }

  private onFailure(): void {
    const now = Date.now();
    this.failureCount++;
    this.state.failureCount = this.failureCount;
    this.state.lastFailureTime = now;

    // Add to monitoring window
    this.monitorWindow.push(now);
    
    // Remove old entries from monitoring window
    const windowSize = this.config.monitorWindow || 60000; // 1 minute default
    this.monitorWindow = this.monitorWindow.filter(time => now - time < windowSize);

    if (this.failureCount >= this.config.failureThreshold) {
      this.state.state = 'open';
      this.state.nextAttemptTime = now + this.config.recoveryTimeout;
    }
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  isOpen(): boolean {
    return this.state.state === 'open';
  }

  isHalfOpen(): boolean {
    return this.state.state === 'half-open';
  }

  isClosed(): boolean {
    return this.state.state === 'closed';
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.failureCount = 0;
    this.state = {
      state: 'closed',
      failureCount: 0,
      lastFailureTime: 0,
      nextAttemptTime: 0,
    };
    this.monitorWindow = [];
  }

  getFailureRate(): number {
    if (this.monitorWindow.length === 0) return 0;
    const now = Date.now();
    const windowSize = this.config.monitorWindow || 60000;
    const recentFailures = this.monitorWindow.filter(time => now - time < windowSize).length;
    return recentFailures / this.monitorWindow.length;
  }
} 