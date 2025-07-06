import { Grip } from '../Grip';

describe('Grip Advanced Features', () => {
  let cache: Grip;

  beforeEach(() => {
    cache = new Grip();
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Compression', () => {
    it('should compress large values', async () => {
      const cacheWithCompression = new Grip({
        compression: { enabled: true, algorithm: 'gzip', threshold: 100 }
      });

      const largeValue = 'x'.repeat(200);
      await cacheWithCompression.set('large-key', largeValue);

      const item = (cacheWithCompression as any).items.get('large-key');
      expect(item.compressed).toBe(true);
      expect(item.originalSize).toBeGreaterThan(item.compressedSize);

      const retrieved = await cacheWithCompression.get('large-key');
      expect(retrieved).toBe(largeValue);

      cacheWithCompression.destroy();
    });

    it('should not compress small values', async () => {
      const cacheWithCompression = new Grip({
        compression: { enabled: true, algorithm: 'gzip', threshold: 1000 }
      });

      const smallValue = 'small';
      await cacheWithCompression.set('small-key', smallValue);

      const item = (cacheWithCompression as any).items.get('small-key');
      expect(item.compressed).toBe(false);

      const retrieved = await cacheWithCompression.get('small-key');
      expect(retrieved).toBe(smallValue);

      cacheWithCompression.destroy();
    });
  });

  describe('Circuit Breaker', () => {
    it('should handle circuit breaker pattern', async () => {
      const cacheWithCircuitBreaker = new Grip({
        circuitBreaker: { enabled: true, failureThreshold: 2, recoveryTimeout: 100 }
      });

      let failureCount = 0;
      const failingLoader = async () => {
        failureCount++;
        throw new Error('Simulated failure');
      };

      // First two failures should work
      await expect(cacheWithCircuitBreaker.getOrCompute('key', failingLoader)).rejects.toThrow();
      await expect(cacheWithCircuitBreaker.getOrCompute('key', failingLoader)).rejects.toThrow();

      // Third failure should trigger circuit breaker
      await expect(cacheWithCircuitBreaker.getOrCompute('key', failingLoader)).rejects.toThrow();

      const state = cacheWithCircuitBreaker.getCircuitBreakerState();
      expect(state?.state).toBe('open');

      cacheWithCircuitBreaker.destroy();
    });

    it('should recover after timeout', async () => {
      const cacheWithCircuitBreaker = new Grip({
        circuitBreaker: { enabled: true, failureThreshold: 1, recoveryTimeout: 50 }
      });

      const failingLoader = async () => {
        throw new Error('Simulated failure');
      };

      // Trigger circuit breaker
      await expect(cacheWithCircuitBreaker.getOrCompute('key', failingLoader)).rejects.toThrow();

      // Wait for recovery
      await new Promise(resolve => setTimeout(resolve, 100));

      const state = cacheWithCircuitBreaker.getCircuitBreakerState();
      expect(state?.state).toBe('half-open');

      cacheWithCircuitBreaker.destroy();
    });
  });

  describe('Partitioning', () => {
    it('should distribute keys across partitions', () => {
      const cacheWithPartitioning = new Grip({
        partitioning: { enabled: true, strategy: 'hash', partitions: 4 }
      });

      const partition1 = cacheWithPartitioning.getPartitionInfo(0);
      const partition2 = cacheWithPartitioning.getPartitionInfo(1);

      expect(partition1).toBeDefined();
      expect(partition2).toBeDefined();
      expect(partition1?.id).toBe(0);
      expect(partition2?.id).toBe(1);

      cacheWithPartitioning.destroy();
    });

    it('should check partition balance', () => {
      const cacheWithPartitioning = new Grip({
        partitioning: { enabled: true, strategy: 'hash', partitions: 4 }
      });

      const isBalanced = cacheWithPartitioning.isBalanced();
      expect(typeof isBalanced).toBe('boolean');

      cacheWithPartitioning.destroy();
    });

    it('should get all partitions', () => {
      const cacheWithPartitioning = new Grip({
        partitioning: { enabled: true, strategy: 'hash', partitions: 4 }
      });

      const partitions = cacheWithPartitioning.getAllPartitions();
      expect(partitions).toHaveLength(4);

      cacheWithPartitioning.destroy();
    });
  });

  describe('Monitoring', () => {
    it('should provide health status', () => {
      const cacheWithMonitoring = new Grip({
        monitoring: { enabled: true, metrics: ['hitRate', 'memoryUsage'] }
      });

      const health = cacheWithMonitoring.health();
      expect(health.status).toBe('healthy');
      expect(health.lastCheck).toBeGreaterThan(0);

      cacheWithMonitoring.destroy();
    });

    it('should provide detailed metrics', () => {
      const cacheWithMonitoring = new Grip({
        monitoring: { enabled: true, metrics: ['hitRate', 'memoryUsage'] }
      });

      const metrics = cacheWithMonitoring.metrics();
      expect(metrics.hitRate).toBeDefined();
      expect(metrics.missRate).toBeDefined();
      expect(metrics.avgLoadTime).toBeDefined();
      expect(metrics.memoryEfficiency).toBeDefined();
      expect(metrics.compressionRatio).toBeDefined();

      cacheWithMonitoring.destroy();
    });
  });

  describe('Progressive Warmup', () => {
    it('should warm up with priority levels', async () => {
      const warmupItems = [
        {
          key: 'high-priority',
          loader: async () => 'high-value',
          priority: 'high' as const,
          ttl: 1000,
        },
        {
          key: 'medium-priority',
          loader: async () => 'medium-value',
          priority: 'medium' as const,
          ttl: 2000,
        },
        {
          key: 'low-priority',
          loader: async () => 'low-value',
          priority: 'low' as const,
          ttl: 3000,
        },
      ];

      await cache.warmProgressive(warmupItems);

      expect(await cache.get('high-priority')).toBe('high-value');
      expect(await cache.get('medium-priority')).toBe('medium-value');
      expect(await cache.get('low-priority')).toBe('low-value');
    });
  });

  describe('Dependency Warmup', () => {
    it('should warm up respecting dependencies', async () => {
      const warmupItems = [
        {
          key: 'parent',
          loader: async () => 'parent-value',
          deps: [],
          ttl: 1000,
        },
        {
          key: 'child',
          loader: async () => 'child-value',
          deps: ['parent'],
          ttl: 2000,
        },
        {
          key: 'grandchild',
          loader: async () => 'grandchild-value',
          deps: ['child'],
          ttl: 3000,
        },
      ];

      await cache.warmWithDependencies(warmupItems);

      expect(await cache.get('parent')).toBe('parent-value');
      expect(await cache.get('child')).toBe('child-value');
      expect(await cache.get('grandchild')).toBe('grandchild-value');
    });
  });

  describe('Stale While Revalidate', () => {
    it('should serve stale content while revalidating', async () => {
      const cacheWithStale = new Grip({
        staleWhileRevalidate: true,
        defaultTtl: 100,
      });

      await cacheWithStale.set('key', 'initial-value', { staleTtl: 200 });

      // Wait for TTL to expire but before stale TTL
      await new Promise(resolve => setTimeout(resolve, 150));

      let callCount = 0;
      const loader = async () => {
        callCount++;
        return 'new-value';
      };

      const result = await cacheWithStale.getOrComputeWithStale('key', loader);
      expect(result).toBe('initial-value');

      // Wait for background refresh
      await new Promise(resolve => setTimeout(resolve, 50));

      const updatedResult = await cacheWithStale.get('key');
      expect(updatedResult).toBe('new-value');

      cacheWithStale.destroy();
    });
  });

  describe('Memory Management', () => {
    it('should track memory usage', async () => {
      const cacheWithMemoryLimit = new Grip({
        maxMemory: 1000,
      });

      await cacheWithMemoryLimit.set('key1', 'value1');
      await cacheWithMemoryLimit.set('key2', 'value2');

      const stats = cacheWithMemoryLimit.stats();
      expect(stats.memoryUsage).toBeGreaterThan(0);

      cacheWithMemoryLimit.destroy();
    });

    it('should evict based on memory limit', async () => {
      const cacheWithMemoryLimit = new Grip({
        maxMemory: 100,
        evictionPolicy: 'lru',
      });

      // Add items that exceed memory limit
      await cacheWithMemoryLimit.set('key1', 'x'.repeat(50));
      await cacheWithMemoryLimit.set('key2', 'x'.repeat(50));
      await cacheWithMemoryLimit.set('key3', 'x'.repeat(50));

      const stats = cacheWithMemoryLimit.stats();
      expect(stats.evictions).toBeGreaterThan(0);

      cacheWithMemoryLimit.destroy();
    });
  });

  describe('Event System', () => {
    it('should emit compression events', async () => {
      const cacheWithCompression = new Grip({
        compression: { enabled: true, algorithm: 'gzip', threshold: 100 }
      });

      const events: any[] = [];
      cacheWithCompression.on('compress', (key, originalSize, compressedSize) => {
        events.push({ key, originalSize, compressedSize });
      });

      const largeValue = 'x'.repeat(200);
      await cacheWithCompression.set('large-key', largeValue);

      expect(events).toHaveLength(1);
      expect(events[0].key).toBe('large-key');
      expect(events[0].originalSize).toBeGreaterThan(events[0].compressedSize);

      cacheWithCompression.destroy();
    });

    it('should emit partition events', async () => {
      const cacheWithPartitioning = new Grip({
        partitioning: { enabled: true, strategy: 'hash', partitions: 4 }
      });

      const events: any[] = [];
      cacheWithPartitioning.on('partitionHit', (partition, key) => {
        events.push({ partition, key });
      });

      await cacheWithPartitioning.set('test-key', 'test-value');
      await cacheWithPartitioning.get('test-key');

      expect(events).toHaveLength(1);
      expect(events[0].key).toBe('test-key');
      expect(typeof events[0].partition).toBe('number');

      cacheWithPartitioning.destroy();
    });
  });

  describe('Configuration', () => {
    it('should handle complex configuration', () => {
      const complexConfig = {
        maxItems: 500,
        maxMemory: 1024 * 1024,
        defaultTtl: 300000,
        staleWhileRevalidate: true,
        log: true,
        namespace: 'test-namespace',
        evictionPolicy: 'lfu' as const,
        compression: {
          enabled: true,
          algorithm: 'gzip' as const,
          threshold: 512,
        },
        circuitBreaker: {
          enabled: true,
          failureThreshold: 3,
          recoveryTimeout: 60000,
        },
        partitioning: {
          enabled: true,
          strategy: 'hash' as const,
          partitions: 8,
        },
        monitoring: {
          enabled: true,
          metrics: ['hitRate', 'memoryUsage', 'compressionRatio'],
        },
      };

      const cacheWithComplexConfig = new Grip(complexConfig);
      expect(cacheWithComplexConfig).toBeDefined();

      const health = cacheWithComplexConfig.health();
      expect(health.status).toBe('healthy');

      cacheWithComplexConfig.destroy();
    });
  });
});