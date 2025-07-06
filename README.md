# Cachly

A type-safe, production-ready in-memory cache system for Node.js and TypeScript, featuring advanced dependency tracking, intelligent invalidation, TTL, stale-while-revalidate, async operations, event system, statistics, advanced eviction, partitioning, compression, circuit breaker, distributed support, and more.

## Features

- **Type-safe API** with full TypeScript support
- **Dependency tracking** and automatic invalidation
- **TTL and stale-while-revalidate**
- **Async loader integration** (`getOrCompute`, `getOrComputeWithStale`)
- **Event system** for monitoring
- **Statistics and monitoring**
- **Eviction policies**: LRU, LFU, TTL
- **Partitioning** and namespace support
- **Persistence adapters** (Redis, File System)
- **Compression** (gzip, brotli, lz4)
- **Circuit breaker** pattern
- **Distributed cache** support
- **Cache warming** strategies

## Installation

```bash
npm install cachly
```

## Quick Start

```typescript
import { Cachly } from 'cachly';

const cache = new Cachly({
  maxItems: 1000,
  defaultTtl: 60000,
  staleWhileRevalidate: true,
  compression: { enabled: true, algorithm: 'gzip', threshold: 1024 },
});

// Set and get
await cache.set('user:1', { id: 1, name: 'John' });
const user = await cache.get('user:1');

// Async computation
const stats = await cache.getOrCompute('stats', async () => computeExpensiveStats(), { ttl: 30000 });

// Dependency tracking
await cache.set('post:1', postData, { dependsOn: ['user:1'] });
cache.delete('user:1'); // Also invalidates post:1
```

## API Reference

### Basic Operations

```typescript
await cache.set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
await cache.get<T>(key: string): Promise<T | undefined>
cache.has(key: string): boolean
cache.delete(key: string): void
cache.clear(): void
```

### Async Operations

```typescript
await cache.getOrCompute<T>(key: string, loader: () => Promise<T>, options?: CacheOptions): Promise<T>
await cache.getOrComputeWithStale<T>(key: string, loader: () => Promise<T>, options?: CacheOptions): Promise<T>
```

### Events

```typescript
cache.on('hit', (key) => { /* ... */ });
cache.on('miss', (key) => { /* ... */ });
cache.on('set', (key, value) => { /* ... */ });
cache.on('delete', (key) => { /* ... */ });
cache.on('evict', (key, reason) => { /* ... */ });
cache.on('compress', (key, originalSize, compressedSize) => { /* ... */ });
cache.on('partitionHit', (partition, key) => { /* ... */ });
```

### Statistics & Monitoring

```typescript
const stats = cache.stats();
// { hits, misses, evictions, memoryUsage, keyCount, totalAccesses, hitRate, missRate, avgLoadTime, compressionRatio }

const metrics = cache.metrics();
// { hitRate, missRate, avgLoadTime, memoryEfficiency, compressionRatio, circuitBreakerTrips, partitionDistribution }

const health = cache.health();
// { status, issues, lastCheck, uptime }
```

### Advanced Features

- **Partitioning**: `getPartitionInfo(partitionId)`, `getAllPartitions()`, `isBalanced()`
- **Circuit Breaker**: `getCircuitBreakerState()`
- **Cache Warming**: `warm(items)`, `warmProgressive(items)`, `warmWithDependencies(items)`

### Configuration

```typescript
interface CacheConfig {
  maxItems?: number;
  maxMemory?: number;
  defaultTtl?: number;
  staleWhileRevalidate?: boolean;
  log?: boolean;
  namespace?: string;
  persistence?: 'none' | PersistenceAdapter;
  evictionPolicy?: 'lru' | 'ttl' | 'lfu';
  compression?: { enabled: boolean; algorithm: 'gzip' | 'brotli' | 'lz4'; threshold: number; };
  circuitBreaker?: { enabled: boolean; failureThreshold: number; recoveryTimeout: number; };
  partitioning?: { enabled: boolean; strategy: 'hash' | 'range' | 'custom'; partitions: number; };
  monitoring?: { enabled: boolean; metrics: string[]; };
  distributed?: { enabled: boolean; nodes: string[]; replication: boolean; consistency: 'eventual' | 'strong'; partitionStrategy: string; };
}
```

## Persistence Adapters

```typescript
import { FSAdapter } from 'cachly';
const cache = new Cachly({ persistence: new FSAdapter('./cache') });
```

## Namespaces & Partitioning

```typescript
import { CachlyNamespace } from 'cachly';
const userCache = CachlyNamespace.namespace('user');
const postCache = CachlyNamespace.namespace('post');
```

## Cache Warming

```typescript
await cache.warm([
  { key: 'config', loader: loadConfig, ttl: 120000 },
  { key: 'meta', loader: fetchMeta },
  { key: 'stats', loader: computeStats, dependsOn: ['config'] }
]);
```

## License

MIT 