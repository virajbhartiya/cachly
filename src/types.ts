export interface CacheOptions {
  ttl: number | undefined;
  staleTtl: number | undefined;
  dependsOn: string[] | undefined;
  tags?: string[];
  onExpire: ((key: string, value: any) => void) | undefined;
  __testAwaitBackground?: boolean;
}

export interface CacheItem<T = any> {
  value: T | Buffer;
  createdAt: number;
  expiresAt: number | undefined;
  staleAt: number | undefined;
  dependsOn: Set<string>;
  dependents: Set<string>;
  tags?: Set<string>;
  accessCount: number;
  lastAccessed: number;
  compressed?: boolean;
  originalSize?: number;
  compressedSize?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  memoryUsage: number;
  keyCount: number;
  totalAccesses: number;
  hitRate: number;
  missRate: number;
  avgLoadTime: number;
  compressionRatio: number;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm: 'gzip' | 'brotli' | 'lz4';
  threshold: number;
  level?: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  fallback?: (key: string) => any;
  monitorWindow?: number;
}

export interface PartitioningConfig {
  enabled: boolean;
  strategy: 'hash' | 'range' | 'custom';
  partitions: number;
  partitionKey?: (key: string) => string;
}

export interface MonitoringConfig {
  enabled: boolean;
  metrics: string[];
  healthCheckInterval?: number;
  alertThresholds?: {
    hitRate?: number;
    memoryUsage?: number;
    avgLoadTime?: number;
  };
}

export interface DistributedConfig {
  enabled: boolean;
  nodes: string[];
  replication: boolean;
  consistency: 'strong' | 'eventual';
  partitionStrategy: 'consistent-hashing' | 'random' | 'round-robin';
}

export interface CacheConfig {
  maxItems?: number;
  maxMemory?: number;
  defaultTtl?: number;
  staleWhileRevalidate?: boolean;
  log?: boolean;
  namespace?: string;
  persistence?: 'none' | PersistenceAdapter;
  evictionPolicy?: 'lru' | 'ttl' | 'manual' | 'lfu';
  compression?: CompressionConfig;
  circuitBreaker?: CircuitBreakerConfig;
  partitioning?: PartitioningConfig;
  monitoring?: MonitoringConfig;
  distributed?: DistributedConfig;
  onHit?: (key: string) => void;
  onMiss?: (key: string) => void;
}

export interface PersistenceAdapter {
  get(key: string): Promise<any>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface CacheEventMap {
  hit: (key: string) => void;
  miss: (key: string) => void;
  evict: (key: string, reason: string) => void;
  set: (key: string, value: any) => void;
  delete: (key: string) => void;
  expire: (key: string, value: any) => void;
  compress: (key: string, originalSize: number, compressedSize: number) => void;
  circuitOpen: (key: string) => void;
  circuitClose: (key: string) => void;
  partitionHit: (partition: number, key: string) => void;
  tagInvalidated: (tag: string, affectedKeys: string[]) => void;
  bulkOperation: (operation: BulkOperation, result: any) => void;
  groupCreated: (group: CacheGroup) => void;
  groupDeleted: (groupName: string) => void;
}

export type CacheEventType = keyof CacheEventMap;

export interface WarmupItem {
  key: string;
  loader: () => Promise<any>;
  ttl?: number;
  staleTtl?: number;
  dependsOn?: string[];
  priority?: 'high' | 'medium' | 'low';
}

export interface ProgressiveWarmupItem extends WarmupItem {
  priority: 'high' | 'medium' | 'low';
}

export interface DependencyWarmupItem extends WarmupItem {
  deps: string[];
}

export interface NamespaceConfig extends CacheConfig {
  name: string;
}

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: string[];
  lastCheck: number;
  uptime: number;
}

export interface Metrics {
  hitRate: number;
  missRate: number;
  avgLoadTime: number;
  memoryEfficiency: number;
  compressionRatio: number;
  circuitBreakerTrips: number;
  partitionDistribution: Record<number, number>;
}

export interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  nextAttemptTime: number;
}

export interface PartitionInfo {
  id: number;
  keyCount: number;
  memoryUsage: number;
  hitRate: number;
}

export interface CacheGroup {
  name: string;
  keys: Set<string>;
  config: Partial<CacheConfig>;
}

export interface BulkOperation {
  get: string[];
  set: Array<{ key: string; value: any; options?: Partial<CacheOptions> }>;
  delete: string[];
  invalidateByTag: string[];
}

export interface CacheTag {
  name: string;
  keys: Set<string>;
  createdAt: number;
} 