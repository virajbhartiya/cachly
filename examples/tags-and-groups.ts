import { Cachly } from '../src/Cachly';

async function tagsAndGroups() {
  console.log('=== Tags and Groups ===\n');

  const cache = new Cachly({
    log: true,
  });

  // 1. Tags - basic usage
  console.log('1. Tags - basic usage:');
  await cache.set('user:1', { id: 1, name: 'John' }, { tags: ['users', 'active'] });
  await cache.set('user:2', { id: 2, name: 'Jane' }, { tags: ['users', 'inactive'] });
  await cache.set('post:1', { id: 1, title: 'Hello World' }, { tags: ['posts', 'published'] });
  await cache.set('post:2', { id: 2, title: 'Draft Post' }, { tags: ['posts', 'draft'] });

  console.log('Keys with "users" tag:', cache.getKeysByTag('users'));
  console.log('Keys with "posts" tag:', cache.getKeysByTag('posts'));
  console.log('Keys with "active" tag:', cache.getKeysByTag('active'));
  console.log('');

  // 2. Get tags by key
  console.log('2. Get tags by key:');
  console.log('Tags for user:1:', cache.getTagsByKey('user:1'));
  console.log('Tags for post:1:', cache.getTagsByKey('post:1'));
  console.log('');

  // 3. Invalidate by tag
  console.log('3. Invalidate by tag:');
  console.log('Before invalidating "users" tag:');
  console.log('  user:1 exists:', cache.has('user:1'));
  console.log('  user:2 exists:', cache.has('user:2'));
  console.log('  post:1 exists:', cache.has('post:1'));

  const affectedKeys = await cache.invalidateByTag('users');
  console.log('Affected keys:', affectedKeys);

  console.log('After invalidating "users" tag:');
  console.log('  user:1 exists:', cache.has('user:1'));
  console.log('  user:2 exists:', cache.has('user:2'));
  console.log('  post:1 exists:', cache.has('post:1'));
  console.log('');

  // 4. Invalidate by multiple tags
  console.log('4. Invalidate by multiple tags:');
  await cache.set('user:3', { id: 3, name: 'Bob' }, { tags: ['users', 'active'] });
  await cache.set('user:4', { id: 4, name: 'Alice' }, { tags: ['users', 'active'] });
  await cache.set('post:3', { id: 3, title: 'Another Post' }, { tags: ['posts', 'published'] });

  const results = await cache.invalidateByTags(['users', 'active']);
  console.log('Invalidation results:', results);
  console.log('');

  // 5. Cache groups
  console.log('5. Cache groups:');
  const userGroup = cache.createGroup('users', { maxItems: 100 });
  const postGroup = cache.createGroup('posts', { maxItems: 50 });

  await cache.set('group:user:1', { id: 1, name: 'Group User 1' });
  await cache.set('group:user:2', { id: 2, name: 'Group User 2' });
  await cache.set('group:post:1', { id: 1, title: 'Group Post 1' });

  cache.addToGroup('users', 'group:user:1');
  cache.addToGroup('users', 'group:user:2');
  cache.addToGroup('posts', 'group:post:1');

  console.log('User group keys:', cache.getGroupKeys('users'));
  console.log('Post group keys:', cache.getGroupKeys('posts'));
  console.log('');

  // 6. Remove from group
  console.log('6. Remove from group:');
  cache.removeFromGroup('users', 'group:user:1');
  console.log('User group keys after removal:', cache.getGroupKeys('users'));
  console.log('');

  // 7. Delete group
  console.log('7. Delete group:');
  console.log('Before deleting post group:');
  console.log('  group:post:1 exists:', cache.has('group:post:1'));
  
  cache.deleteGroup('posts');
  
  console.log('After deleting post group:');
  console.log('  group:post:1 exists:', cache.has('group:post:1'));
  console.log('');

  // 8. Bulk operations
  console.log('8. Bulk operations:');
  
  // Set some data for bulk operations
  await cache.set('bulk:key1', 'value1', { tags: ['bulk'] });
  await cache.set('bulk:key2', 'value2', { tags: ['bulk'] });
  await cache.set('bulk:key3', 'value3', { tags: ['bulk'] });

  const bulkResults = await cache.bulk({
    get: ['bulk:key1', 'bulk:key2', 'nonexistent'],
    set: [
      { key: 'bulk:new1', value: 'newvalue1' },
      { key: 'bulk:new2', value: 'newvalue2', options: { ttl: 5000 } }
    ],
    delete: ['bulk:key3'],
    invalidateByTag: ['bulk'],
  });

  console.log('Bulk operation results:', {
    get: Object.keys(bulkResults.get).length,
    set: bulkResults.set.length,
    delete: bulkResults.delete.length,
    invalidateByTag: Object.keys(bulkResults.invalidateByTag).length,
  });
  console.log('');

  // 9. Cache introspection
  console.log('9. Cache introspection:');
  await cache.set('intro:user:1', { id: 1 });
  await cache.set('intro:user:2', { id: 2 });
  await cache.set('intro:post:1', { id: 1 });
  await cache.set('intro:post:2', { id: 2 });

  // Access some keys to build access patterns
  await cache.get('intro:user:1');
  await cache.get('intro:user:1');
  await cache.get('intro:user:2');
  await cache.get('intro:post:1');

  console.log('Keys by pattern "intro:user:*":', cache.getKeysByPattern('intro:user:*'));
  console.log('Keys by pattern "intro:post:*":', cache.getKeysByPattern('intro:post:*'));
  console.log('Top accessed keys:', cache.getTopKeys(3));
  console.log('Least used keys:', cache.getLeastUsedKeys(3));
  console.log('');

  cache.destroy();
}

tagsAndGroups().catch(console.error); 