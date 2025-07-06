import { Cachly } from '../src/Cachly';

async function asyncOperations() {
  console.log('=== Async Operations ===\n');

  const cache = new Cachly({
    defaultTtl: 30000, // 30 seconds
    staleWhileRevalidate: true,
    log: true,
  });

  // Simulate expensive database operations
  let dbCallCount = 0;
  const fetchUserFromDB = async (id: string) => {
    dbCallCount++;
    console.log(`  Database call #${dbCallCount} for user ${id}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
    return { id, name: `User ${id}`, email: `user${id}@example.com` };
  };

  const fetchUserStats = async (id: string) => {
    dbCallCount++;
    console.log(`  Database call #${dbCallCount} for stats ${id}`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate DB delay
    return { userId: id, posts: Math.floor(Math.random() * 100), followers: Math.floor(Math.random() * 1000) };
  };

  // 1. getOrCompute - basic usage
  console.log('1. getOrCompute - basic usage:');
  const user1 = await cache.getOrCompute('user:1', () => fetchUserFromDB('1'));
  console.log('First call (from DB):', user1);
  
  const user1Cached = await cache.getOrCompute('user:1', () => fetchUserFromDB('1'));
  console.log('Second call (from cache):', user1Cached);
  console.log('');

  // 2. getOrCompute with custom TTL
  console.log('2. getOrCompute with custom TTL:');
  const stats1 = await cache.getOrCompute(
    'stats:1', 
    () => fetchUserStats('1'), 
    { ttl: 10000 } // 10 seconds
  );
  console.log('Stats with custom TTL:', stats1);
  console.log('');

  // 3. getOrComputeWithStale - serves stale content while refreshing
  console.log('3. getOrComputeWithStale - stale while revalidate:');
  
  // Set initial data
  await cache.set('user:2', { id: '2', name: 'User 2', email: 'user2@example.com' }, { ttl: 5000 });
  
  // Wait for data to become stale
  await new Promise(resolve => setTimeout(resolve, 6000));
  
  console.log('Getting stale data while refreshing...');
  const user2Stale = await cache.getOrComputeWithStale(
    'user:2',
    () => fetchUserFromDB('2'),
    { ttl: 10000, staleTtl: 30000 }
  );
  console.log('Result (served stale while refreshing):', user2Stale);
  console.log('');

  // 4. Dependency tracking
  console.log('4. Dependency tracking:');
  await cache.set('user:3', { id: '3', name: 'User 3' });
  await cache.set('post:1', { id: '1', title: 'Post 1', authorId: '3' }, { 
    dependsOn: ['user:3'] 
  });
  
  console.log('Post before user deletion:', await cache.get('post:1'));
  cache.delete('user:3'); // This will also invalidate post:1
  console.log('Post after user deletion:', await cache.get('post:1'));
  console.log('');

  // 5. Cache warming
  console.log('5. Cache warming:');
  await cache.warm([
    {
      key: 'warm:user:4',
      loader: () => fetchUserFromDB('4'),
      ttl: 60000,
    },
    {
      key: 'warm:stats:4',
      loader: () => fetchUserStats('4'),
      ttl: 30000,
      dependsOn: ['warm:user:4'],
    },
  ]);
  
  console.log('Warmed user:', await cache.get('warm:user:4'));
  console.log('Warmed stats:', await cache.get('warm:stats:4'));
  console.log('');

  // 6. Performance comparison
  console.log('6. Performance comparison:');
  const startTime = Date.now();
  
  // Multiple concurrent requests for the same key
  const promises = Array(5).fill(0).map((_, i) => 
    cache.getOrCompute(`perf:user:${i}`, () => fetchUserFromDB(`${i}`))
  );
  
  const results = await Promise.all(promises);
  const endTime = Date.now();
  
  console.log(`Processed ${results.length} requests in ${endTime - startTime}ms`);
  console.log(`Database calls made: ${dbCallCount}`);
  console.log('');

  cache.destroy();
}

asyncOperations().catch(console.error); 