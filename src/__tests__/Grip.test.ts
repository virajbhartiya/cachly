import { Grip } from '../Grip';

describe('Grip', () => {
  let cache: Grip;

  beforeEach(() => {
    cache = new Grip();
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get('key1');
      expect(result).toBe('value1');
    });

    it('should return undefined for non-existent keys', async () => {
      const result = await cache.get('nonexistent');
      expect(result).toBeUndefined();
    });

    it('should check if key exists', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete keys', async () => {
      await cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      
      cache.delete('key1');
      expect(cache.has('key1')).toBe(false);
    });

    it('should clear all items', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('key2')).toBe(true);
      
      cache.clear();
      expect(cache.has('key1')).toBe(false);
      expect(cache.has('key2')).toBe(false);
    });
  });

  describe('TTL', () => {
    it('should expire items after TTL', async () => {
      await cache.set('key1', 'value1', { ttl: 100 });
      expect(await cache.get('key1')).toBe('value1');
      
      await new Promise(resolve => setTimeout(resolve, 150));
      expect(await cache.get('key1')).toBeUndefined();
    });

    it('should not expire items without TTL', async () => {
      await cache.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(await cache.get('key1')).toBe('value1');
    });
  });

  describe('Dependency Tracking', () => {
    it('should invalidate dependents when dependency is deleted', async () => {
      await cache.set('parent', 'parent-value');
      await cache.set('child', 'child-value', { dependsOn: ['parent'] });
      
      expect(cache.has('parent')).toBe(true);
      expect(cache.has('child')).toBe(true);
      
      cache.delete('parent');
      expect(cache.has('parent')).toBe(false);
      expect(cache.has('child')).toBe(false);
    });

    it('should handle multiple dependencies', async () => {
      await cache.set('dep1', 'value1');
      await cache.set('dep2', 'value2');
      await cache.set('child', 'child-value', { dependsOn: ['dep1', 'dep2'] });
      
      cache.delete('dep1');
      expect(cache.has('child')).toBe(false);
    });
  });

  describe('Async Operations', () => {
    it('should handle getOrCompute', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return 'computed-value';
      };

      const result1 = await cache.getOrCompute('key1', loader);
      const result2 = await cache.getOrCompute('key1', loader);

      expect(result1).toBe('computed-value');
      expect(result2).toBe('computed-value');
      expect(callCount).toBe(1);
    });

    it('should handle getOrComputeWithStale', async () => {
      let callCount = 0;
      const loader = async () => {
        callCount++;
        return 'computed-value';
      };

      const result1 = await cache.getOrComputeWithStale('key1', loader);
      const result2 = await cache.getOrComputeWithStale('key1', loader);

      expect(result1).toBe('computed-value');
      expect(result2).toBe('computed-value');
      expect(callCount).toBe(1);
    });
  });

  describe('Statistics', () => {
    it('should track hits and misses', async () => {
      await cache.set('key1', 'value1');
      
      await cache.get('key1');
      await cache.get('key1');
      await cache.get('nonexistent');
      
      const stats = cache.stats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.totalAccesses).toBe(3);
    });

    it('should calculate hit rate', async () => {
      await cache.set('key1', 'value1');
      
      await cache.get('key1');
      await cache.get('key1');
      await cache.get('nonexistent');
      
      const stats = cache.stats();
      expect(stats.hitRate).toBe((2 / 3) * 100);
      expect(stats.missRate).toBe((1 / 3) * 100);
    });
  });

  describe('Eviction', () => {
    it('should evict items when maxItems is reached', async () => {
      const limitedCache = new Grip({ maxItems: 2 });
      
      await limitedCache.set('key1', 'value1');
      await limitedCache.set('key2', 'value2');
      await limitedCache.set('key3', 'value3');
      
      expect(limitedCache.has('key1')).toBe(false);
      expect(limitedCache.has('key2')).toBe(true);
      expect(limitedCache.has('key3')).toBe(true);
      
      limitedCache.destroy();
    });
  });

  describe('Events', () => {
    it('should emit events', async () => {
      const events: string[] = [];
      
      cache.on('set', (key) => events.push(`set:${key}`));
      cache.on('hit', (key) => events.push(`hit:${key}`));
      cache.on('hit', (key) => events.push(`hit:${key}`));
      cache.on('miss', (key) => events.push(`miss:${key}`));
      cache.on('delete', (key) => events.push(`delete:${key}`));
      
      await cache.set('key1', 'value1');
      await cache.get('key1');
      await cache.get('nonexistent');
      cache.delete('key1');
      
      expect(events).toContain('set:key1');
      expect(events).toContain('hit:key1');
      expect(events).toContain('miss:nonexistent');
      expect(events).toContain('delete:key1');
    });
  });

  describe('Warmup', () => {
    it('should warm up cache with items', async () => {
      const warmupItems = [
        {
          key: 'key1',
          loader: async () => 'value1',
          ttl: 1000,
        },
        {
          key: 'key2',
          loader: async () => 'value2',
          ttl: 2000,
        },
      ];

      await cache.warm(warmupItems);
      
      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('value2');
    });
  });
}); 