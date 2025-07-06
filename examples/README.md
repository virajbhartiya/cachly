# Cachly Examples

This folder contains comprehensive examples demonstrating various features of the Cachly cache system.

## Examples Overview

### 1. `basic-usage.ts`
Demonstrates fundamental cache operations:
- Basic set/get operations
- TTL (Time To Live) functionality
- Key existence checks
- Delete and clear operations
- Cache statistics

### 2. `async-operations.ts`
Shows advanced async cache patterns:
- `getOrCompute` for lazy loading
- `getOrComputeWithStale` for stale-while-revalidate
- Dependency tracking between cache items
- Cache warming strategies
- Performance comparisons

### 3. `tags-and-groups.ts`
Demonstrates organizational features:
- Cache tags for grouping related items
- Tag-based invalidation
- Cache groups for logical organization
- Bulk operations (get, set, delete, invalidate)
- Cache introspection and analytics

### 4. `hooks-and-events.ts`
Shows monitoring and customization:
- Cache hit/miss hooks (via config and methods)
- Event system for monitoring cache activity
- Async event handling
- Performance monitoring with events
- Error handling in event handlers

## Running the Examples

To run any example:

```bash
# Build the project first
npm run build

# Run a specific example
npx ts-node examples/basic-usage.ts
npx ts-node examples/async-operations.ts
npx ts-node examples/tags-and-groups.ts
npx ts-node examples/hooks-and-events.ts
```

## Example Output

Each example provides detailed console output showing:
- Step-by-step demonstrations
- Expected vs actual results
- Performance metrics
- Error handling scenarios

## Use Cases

These examples cover common cache use cases:
- **Web Applications**: Session storage, API response caching
- **Data Processing**: Expensive computation caching
- **Microservices**: Inter-service data sharing
- **Real-time Systems**: Event-driven caching patterns
- **Analytics**: Performance monitoring and metrics

## Learning Path

1. Start with `basic-usage.ts` to understand core concepts
2. Move to `async-operations.ts` for advanced patterns
3. Explore `tags-and-groups.ts` for organization features
4. Finish with `hooks-and-events.ts` for monitoring and customization

## Customization

Feel free to modify these examples to:
- Test different configuration options
- Experiment with your own data structures
- Benchmark performance with your use cases
- Integrate with your existing codebase 