import { Cachly } from '../src/Cachly';

async function basicUsage() {
  console.log('=== Basic Cache Usage ===\n');

  // Create cache instance
  const cache = new Cachly({
    maxItems: 1000,
    defaultTtl: 60000, // 1 minute
    log: true,
  });

  // Basic set and get
  console.log('1. Basic set and get:');
  await cache.set('user:1', { id: 1, name: 'John Doe', email: 'john@example.com' });
  const user = await cache.get('user:1');
  console.log('Retrieved user:', user);
  console.log('');

  // Check if key exists
  console.log('2. Check if key exists:');
  console.log('Has user:1:', cache.has('user:1'));
  console.log('Has user:2:', cache.has('user:2'));
  console.log('');

  // TTL example
  console.log('3. TTL example:');
  await cache.set('temp:data', 'This will expire in 2 seconds', { ttl: 2000 });
  console.log('Temp data set with 2s TTL');
  
  const tempData = await cache.get('temp:data');
  console.log('Immediately retrieved:', tempData);
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 2500));
  const expiredData = await cache.get('temp:data');
  console.log('After 2.5s (expired):', expiredData);
  console.log('');

  // Delete key
  console.log('4. Delete key:');
  await cache.set('delete:me', 'I will be deleted');
  console.log('Before delete:', await cache.get('delete:me'));
  cache.delete('delete:me');
  console.log('After delete:', await cache.get('delete:me'));
  console.log('');

  // Clear all
  console.log('5. Clear all:');
  await cache.set('key1', 'value1');
  await cache.set('key2', 'value2');
  console.log('Keys before clear:', cache.getKeys());
  cache.clear();
  console.log('Keys after clear:', cache.getKeys());
  console.log('');

  // Stats
  console.log('6. Cache statistics:');
  await cache.set('stats:key', 'value');
  await cache.get('stats:key');
  await cache.get('stats:key');
  await cache.get('nonexistent');
  
  const stats = cache.stats();
  console.log('Cache stats:', {
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    keyCount: stats.keyCount,
  });

  cache.destroy();
}

basicUsage().catch(console.error); 