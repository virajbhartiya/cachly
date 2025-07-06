import { Cachly } from '../Cachly';

describe('Cachly Tags & Groups', () => {
  let cache: Cachly;

  beforeEach(() => {
    cache = new Cachly();
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Tags', () => {
    it('should set and retrieve items with tags', async () => {
      await cache.set('user:1', { id: 1, name: 'John' }, { tags: ['users', 'active'] });
      await cache.set('user:2', { id: 2, name: 'Jane' }, { tags: ['users', 'inactive'] });
      await cache.set('post:1', { id: 1, title: 'Hello' }, { tags: ['posts'] });

      expect(cache.getKeysByTag('users')).toHaveLength(2);
      expect(cache.getKeysByTag('posts')).toHaveLength(1);
      expect(cache.getKeysByTag('active')).toHaveLength(1);
    });

    it('should get tags by key', async () => {
      await cache.set('user:1', { id: 1 }, { tags: ['users', 'active'] });
      
      const tags = cache.getTagsByKey('user:1');
      expect(tags).toContain('users');
      expect(tags).toContain('active');
    });

    it('should invalidate by tag', async () => {
      await cache.set('user:1', { id: 1 }, { tags: ['users'] });
      await cache.set('user:2', { id: 2 }, { tags: ['users'] });
      await cache.set('post:1', { id: 1 }, { tags: ['posts'] });

      const affectedKeys = await cache.invalidateByTag('users');
      expect(affectedKeys).toHaveLength(2);
      expect(affectedKeys).toContain('user:1');
      expect(affectedKeys).toContain('user:2');

      expect(await cache.get('user:1')).toBeUndefined();
      expect(await cache.get('user:2')).toBeUndefined();
      expect(await cache.get('post:1')).toBeDefined();
    });

    it('should invalidate by multiple tags', async () => {
      await cache.set('user:1', { id: 1 }, { tags: ['users', 'active'] });
      await cache.set('user:2', { id: 2 }, { tags: ['users', 'inactive'] });
      await cache.set('post:1', { id: 1 }, { tags: ['posts', 'active'] });

      const results = await cache.invalidateByTags(['users', 'active']);
      expect(results.users).toHaveLength(2);
      expect(results.active).toHaveLength(2);
    });
  });

  describe('Groups', () => {
    it('should create and manage groups', () => {
      const group = cache.createGroup('users', { maxItems: 100 });
      expect(group.name).toBe('users');
      expect(group.keys.size).toBe(0);
    });

    it('should add and remove keys from groups', async () => {
      cache.createGroup('users');
      
      await cache.set('user:1', { id: 1 });
      await cache.set('user:2', { id: 2 });

      expect(cache.addToGroup('users', 'user:1')).toBe(true);
      expect(cache.addToGroup('users', 'user:2')).toBe(true);

      const keys = cache.getGroupKeys('users');
      expect(keys).toContain('user:1');
      expect(keys).toContain('user:2');

      expect(cache.removeFromGroup('users', 'user:1')).toBe(true);
      expect(cache.getGroupKeys('users')).toHaveLength(1);
    });

    it('should delete groups and their keys', async () => {
      cache.createGroup('users');
      
      await cache.set('user:1', { id: 1 });
      await cache.set('user:2', { id: 2 });

      cache.addToGroup('users', 'user:1');
      cache.addToGroup('users', 'user:2');

      expect(cache.deleteGroup('users')).toBe(true);
      expect(await cache.get('user:1')).toBeUndefined();
      expect(await cache.get('user:2')).toBeUndefined();
    });
  });

  describe('Bulk Operations', () => {
    it('should perform bulk get operations', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const results = await cache.bulk({
        get: ['key1', 'key2', 'nonexistent'],
        set: [],
        delete: [],
        invalidateByTag: [],
      });

      expect(results.get.key1).toBe('value1');
      expect(results.get.key2).toBe('value2');
      expect(results.get.nonexistent).toBeUndefined();
    });

    it('should perform bulk set operations', async () => {
      const results = await cache.bulk({
        get: [],
        set: [
          { key: 'key1', value: 'value1' },
          { key: 'key2', value: 'value2', options: { ttl: 1000 } },
        ],
        delete: [],
        invalidateByTag: [],
      });

      expect(results.set).toContain('key1');
      expect(results.set).toContain('key2');
      expect(await cache.get('key1')).toBe('value1');
      expect(await cache.get('key2')).toBe('value2');
    });

    it('should perform bulk delete operations', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      const results = await cache.bulk({
        get: [],
        set: [],
        delete: ['key1', 'key2'],
        invalidateByTag: [],
      });

      expect(results.delete).toContain('key1');
      expect(results.delete).toContain('key2');
      expect(await cache.get('key1')).toBeUndefined();
      expect(await cache.get('key2')).toBeUndefined();
    });

    it('should perform bulk tag invalidation', async () => {
      await cache.set('user:1', { id: 1 }, { tags: ['users'] });
      await cache.set('user:2', { id: 2 }, { tags: ['users'] });
      await cache.set('post:1', { id: 1 }, { tags: ['posts'] });

      const results = await cache.bulk({
        get: [],
        set: [],
        delete: [],
        invalidateByTag: ['users'],
      });

      expect(results.invalidateByTag.users).toHaveLength(2);
      expect(await cache.get('user:1')).toBeUndefined();
      expect(await cache.get('user:2')).toBeUndefined();
      expect(await cache.get('post:1')).toBeDefined();
    });
  });

  describe('Cache Introspection', () => {
    it('should get keys by pattern', async () => {
      await cache.set('user:1', { id: 1 });
      await cache.set('user:2', { id: 2 });
      await cache.set('post:1', { id: 1 });

      const userKeys = cache.getKeysByPattern('user:*');
      expect(userKeys).toHaveLength(2);
      expect(userKeys).toContain('user:1');
      expect(userKeys).toContain('user:2');

      const postKeys = cache.getKeysByPattern('post:*');
      expect(postKeys).toHaveLength(1);
      expect(postKeys).toContain('post:1');
    });

    it('should get top accessed keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.get('key1');
      await cache.get('key1');
      await cache.get('key2');

      const topKeys = cache.getTopKeys(2);
      expect(topKeys[0].key).toBe('key1');
      expect(topKeys[0].accessCount).toBe(2);
      expect(topKeys[1].key).toBe('key2');
      expect(topKeys[1].accessCount).toBe(1);
    });

    it('should get least used keys', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');

      await cache.get('key1');
      await cache.get('key1');
      await cache.get('key2');

      const leastUsed = cache.getLeastUsedKeys(2);
      expect(leastUsed[0].key).toBe('key2');
      expect(leastUsed[0].accessCount).toBe(1);
      expect(leastUsed[1].key).toBe('key1');
      expect(leastUsed[1].accessCount).toBe(2);
    });

    it('should get keys by age', async () => {
      await cache.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10));
      await cache.set('key2', 'value2');

      const keysByAge = cache.getKeysByAge(2);
      expect(keysByAge[0].key).toBe('key1');
      expect(keysByAge[1].key).toBe('key2');
      expect(keysByAge[0].age).toBeGreaterThan(keysByAge[1].age);
    });
  });
}); 