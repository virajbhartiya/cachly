# Cachly

A type-safe, production-ready in-memory cache system for Node.js and TypeScript, featuring advanced dependency tracking, intelligent invalidation, TTL, stale-while-revalidate, async operations, event system, statistics, advanced eviction, partitioning, compression, circuit breaker, distributed support, tags, groups, bulk operations, decorators, middleware, CLI tools, and cache hit/miss hooks.

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
- **Tags and bulk invalidation**
- **Cache groups** for organization
- **Bulk operations** for performance
- **Cache introspection** and analytics
- **Decorators** for easy integration
- **Express middleware** for web apps
- **CLI tool** for management
- **Cache hit/miss hooks** for custom logic

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

## Cache Hit/Miss Hooks

You can run custom logic on every cache hit or miss, e.g. for logging, metrics, or tracing.

### Via Config

```typescript
const cache = new Cachly({
  onHit: (key) => {
    console.log('Cache HIT:', key);
  },
  onMiss: (key) => {
    console.log('Cache MISS:', key);
  }
});

await cache.set('foo', 123);
await cache.get('foo'); // logs: Cache HIT: foo
await cache.get('bar'); // logs: Cache MISS: bar
```

### Via Methods

```typescript
const cache = new Cachly();

cache.setHitHook((key) => {
  // Custom logic for hit
  console.log('HIT', key);
});

cache.setMissHook((key) => {
  // Custom logic for miss
  console.log('MISS', key);
});
```

## Advanced Features

### Tags and Bulk Operations

```typescript
// Set with tags
await cache.set('user:1', userData, { tags: ['users', 'active'] });
await cache.set('user:2', userData, { tags: ['users', 'inactive'] });

// Invalidate by tag
await cache.invalidateByTag('users'); // Removes all user data

// Bulk operations
const results = await cache.bulk({
  get: ['key1', 'key2'],
  set: [
    { key: 'key3', value: 'value3' },
    { key: 'key4', value: 'value4', options: { ttl: 5000 } }
  ],
  delete: ['old-key'],
  invalidateByTag: ['expired-tag']
});
```

### Cache Groups

```typescript
// Create and manage groups
const userGroup = cache.createGroup('users', { maxItems: 100 });
cache.addToGroup('users', 'user:1');
cache.addToGroup('users', 'user:2');

// Get group keys
const userKeys = cache.getGroupKeys('users');

// Delete entire group
cache.deleteGroup('users');
```

### Cache Introspection

```typescript
// Pattern-based key discovery
const userKeys = cache.getKeysByPattern('user:*');
const postKeys = cache.getKeysByPattern('post:*');

// Analytics
const topKeys = cache.getTopKeys(10);
const leastUsed = cache.getLeastUsedKeys(10);
const oldestKeys = cache.getKeysByAge(10);
```

## Decorators

```typescript
import { cache, cacheWithTags, invalidateTags } from 'cachly';

class UserService {
  @cache({ ttl: 30000 })
  async getUser(id: string) {
    return await fetchUserFromDB(id);
  }

  @cacheWithTags(['users'], 60000)
  async getUsers() {
    return await fetchUsersFromDB();
  }

  @invalidateTags(['users'])
  async updateUser(id: string, data: any) {
    return await updateUserInDB(id, data);
  }
}
```

## Express Middleware

```typescript
import express from 'express';
import { createCacheMiddleware, createInvalidateMiddleware } from 'cachly';

const app = express();
const cache = new Cachly();

// Cache middleware
app.use('/api/users', createCacheMiddleware({
  cache,
  ttl: 30000,
  tags: (req) => ['users', req.params.id],
  skip: (req) => req.method !== 'GET'
}));

// Invalidate middleware
app.post('/api/users/:id', createInvalidateMiddleware({
  cache,
  tags: ['users']
}));
```

## CLI Tool

```bash
# Install globally
npm install -g cachly

# Start CLI
cachly

# Available commands
cachly> help
cachly> set user:1 "John Doe" 30000
cachly> get user:1
cachly> stats
cachly> keys user:*
cachly> top 10
cachly> clear
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

### Tags & Groups

```typescript
await cache.invalidateByTag(tag: string): Promise<string[]>
await cache.invalidateByTags(tags: string[]): Promise<Record<string, string[]>>
cache.getKeysByTag(tag: string): string[]
cache.getTagsByKey(key: string): string[]
cache.createGroup(name: string, config?: Partial<CacheConfig>): CacheGroup
cache.addToGroup(groupName: string, key: string): boolean
cache.getGroupKeys(groupName: string): string[]
cache.deleteGroup(groupName: string): boolean
```

### Bulk Operations

```typescript
await cache.bulk(operation: BulkOperation): Promise<any>
```

### Cache Introspection

```typescript
cache.getKeys(pattern?: string): string[]
cache.getKeysByPattern(pattern: string): string[]
cache.getTopKeys(limit?: number): Array<{ key: string; accessCount: number }>
cache.getLeastUsedKeys(limit?: number): Array<{ key: string; accessCount: number }>
cache.getKeysByAge(limit?: number): Array<{ key: string; age: number }>
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
cache.on('tagInvalidated', (tag, affectedKeys) => { /* ... */ });
cache.on('bulkOperation', (operation, result) => { /* ... */ });
cache.on('groupCreated', (group) => { /* ... */ });
cache.on('groupDeleted', (groupName) => { /* ... */ });
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
  evictionPolicy?: 'lru' | 'ttl' | 'manual' | 'lfu';
  compression?: { enabled: boolean; algorithm: 'gzip' | 'brotli' | 'lz4'; threshold: number; };
  circuitBreaker?: { enabled: boolean; failureThreshold: number; recoveryTimeout: number; };
  partitioning?: { enabled: boolean; strategy: 'hash' | 'range' | 'custom'; partitions: number; };
  monitoring?: { enabled: boolean; metrics: string[]; };
  distributed?: { enabled: boolean; nodes: string[]; replication: boolean; consistency: 'eventual' | 'strong'; partitionStrategy: string; };
  onHit?: (key: string) => void;
  onMiss?: (key: string) => void;
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