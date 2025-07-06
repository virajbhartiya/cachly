import { Cachly } from '../src/Cachly';

async function hooksAndEvents() {
  console.log('=== Hooks and Events ===\n');

  // 1. Cache with hit/miss hooks via config
  console.log('1. Cache with hit/miss hooks via config:');
  const cacheWithHooks = new Cachly({
    onHit: (key) => {
      console.log(`  [HOOK] Cache HIT: ${key}`);
    },
    onMiss: (key) => {
      console.log(`  [HOOK] Cache MISS: ${key}`);
    },
    log: true,
  });

  await cacheWithHooks.set('hook:key1', 'value1');
  await cacheWithHooks.get('hook:key1'); // Should trigger hit hook
  await cacheWithHooks.get('hook:key2'); // Should trigger miss hook
  console.log('');

  // 2. Cache with hooks set via methods
  console.log('2. Cache with hooks set via methods:');
  const cacheWithMethods = new Cachly({ log: true });

  let hitCount = 0;
  let missCount = 0;

  cacheWithMethods.setHitHook((key) => {
    hitCount++;
    console.log(`  [METHOD] Hit #${hitCount}: ${key}`);
  });

  cacheWithMethods.setMissHook((key) => {
    missCount++;
    console.log(`  [METHOD] Miss #${missCount}: ${key}`);
  });

  await cacheWithMethods.set('method:key1', 'value1');
  await cacheWithMethods.get('method:key1'); // Should trigger hit hook
  await cacheWithMethods.get('method:key2'); // Should trigger miss hook
  console.log('');

  // 3. Event system
  console.log('3. Event system:');
  const cacheWithEvents = new Cachly({ log: true });

  // Set up event listeners
  cacheWithEvents.on('set', (key, value) => {
    console.log(`  [EVENT] SET: ${key} = ${JSON.stringify(value)}`);
  });

  // Note: 'get' event doesn't exist, only 'hit' and 'miss' events
  cacheWithEvents.on('hit', (key) => {
    console.log(`  [EVENT] HIT: ${key}`);
  });

  cacheWithEvents.on('hit', (key) => {
    console.log(`  [EVENT] HIT: ${key}`);
  });

  cacheWithEvents.on('miss', (key) => {
    console.log(`  [EVENT] MISS: ${key}`);
  });

  cacheWithEvents.on('delete', (key) => {
    console.log(`  [EVENT] DELETE: ${key}`);
  });

  cacheWithEvents.on('evict', (key, reason) => {
    console.log(`  [EVENT] EVICT: ${key} (${reason})`);
  });

  // Trigger events
  await cacheWithEvents.set('event:key1', { data: 'value1' });
  await cacheWithEvents.get('event:key1'); // Should trigger hit
  await cacheWithEvents.get('event:key2'); // Should trigger miss
  cacheWithEvents.delete('event:key1'); // Should trigger delete
  console.log('');

  // 4. Advanced event handling with async operations
  console.log('4. Advanced event handling with async operations:');
  const cacheWithAsyncEvents = new Cachly({
    defaultTtl: 5000, // 5 seconds
    log: true,
  });

  let asyncHitCount = 0;
  let asyncMissCount = 0;

  cacheWithAsyncEvents.on('hit', async (key) => {
    asyncHitCount++;
    console.log(`  [ASYNC] Hit #${asyncHitCount}: ${key}`);
    // Simulate async operation (e.g., logging to external service)
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  cacheWithAsyncEvents.on('miss', async (key) => {
    asyncMissCount++;
    console.log(`  [ASYNC] Miss #${asyncMissCount}: ${key}`);
    // Simulate async operation (e.g., analytics tracking)
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  // Test async events
  await cacheWithAsyncEvents.set('async:key1', 'value1');
  await cacheWithAsyncEvents.get('async:key1');
  await cacheWithAsyncEvents.get('async:key2');
  console.log('');

  // 5. Event-based monitoring
  console.log('5. Event-based monitoring:');
  const cacheWithMonitoring = new Cachly({ log: true });

  const eventStats = {
    sets: 0,
    gets: 0,
    hits: 0,
    misses: 0,
    deletes: 0,
    evictions: 0,
  };

  // Set up monitoring events
  cacheWithMonitoring.on('set', () => eventStats.sets++);
  cacheWithMonitoring.on('hit', () => eventStats.hits++);
  cacheWithMonitoring.on('miss', () => eventStats.misses++);
  cacheWithMonitoring.on('delete', () => eventStats.deletes++);
  cacheWithMonitoring.on('evict', () => eventStats.evictions++);

  // Perform operations
  await cacheWithMonitoring.set('monitor:key1', 'value1');
  await cacheWithMonitoring.set('monitor:key2', 'value2');
  await cacheWithMonitoring.get('monitor:key1'); // hit
  await cacheWithMonitoring.get('monitor:key2'); // hit
  await cacheWithMonitoring.get('monitor:key3'); // miss
  cacheWithMonitoring.delete('monitor:key1');

  console.log('Event statistics:', eventStats);
  console.log('');

  // 6. Custom event handling with error handling
  console.log('6. Custom event handling with error handling:');
  const cacheWithErrorHandling = new Cachly({ log: true });

  cacheWithErrorHandling.on('set', (key, value) => {
    try {
      // Simulate potential error in event handler
      if (key.includes('error')) {
        throw new Error('Simulated error in set handler');
      }
      console.log(`  [ERROR-HANDLED] SET: ${key}`);
    } catch (error) {
      console.log(`  [ERROR-HANDLED] Error in set handler: ${error.message}`);
    }
  });

  cacheWithErrorHandling.on('hit', (key) => {
    try {
      // Simulate potential error in event handler
      if (key.includes('error')) {
        throw new Error('Simulated error in hit handler');
      }
      console.log(`  [ERROR-HANDLED] HIT: ${key}`);
    } catch (error) {
      console.log(`  [ERROR-HANDLED] Error in hit handler: ${error.message}`);
    }
  });

  // Test error handling
  await cacheWithErrorHandling.set('normal:key', 'value');
  await cacheWithErrorHandling.set('error:key', 'value');
  await cacheWithErrorHandling.get('normal:key');
  await cacheWithErrorHandling.get('error:key');
  console.log('');

  // 7. Performance monitoring with events
  console.log('7. Performance monitoring with events:');
  const cacheWithPerformance = new Cachly({ log: true });

  const performanceMetrics = {
    totalOperations: 0,
    totalTime: 0,
    avgTime: 0,
  };

  cacheWithPerformance.on('set', () => {
    performanceMetrics.totalOperations++;
  });

  cacheWithPerformance.on('hit', () => {
    performanceMetrics.totalOperations++;
  });

  // Simulate operations with timing
  const startTime = Date.now();
  
  for (let i = 0; i < 10; i++) {
    await cacheWithPerformance.set(`perf:key${i}`, `value${i}`);
    await cacheWithPerformance.get(`perf:key${i}`);
  }

  const endTime = Date.now();
  performanceMetrics.totalTime = endTime - startTime;
  performanceMetrics.avgTime = performanceMetrics.totalTime / performanceMetrics.totalOperations;

  console.log('Performance metrics:', {
    totalOperations: performanceMetrics.totalOperations,
    totalTime: `${performanceMetrics.totalTime}ms`,
    avgTime: `${performanceMetrics.avgTime.toFixed(2)}ms per operation`,
  });

  // Cleanup
  cacheWithHooks.destroy();
  cacheWithMethods.destroy();
  cacheWithEvents.destroy();
  cacheWithAsyncEvents.destroy();
  cacheWithMonitoring.destroy();
  cacheWithErrorHandling.destroy();
  cacheWithPerformance.destroy();
}

hooksAndEvents().catch(console.error); 