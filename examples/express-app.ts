// Note: This example requires express to be installed
// npm install express @types/express

// Express types - will be available when express is installed
interface Request {
  method: string;
  originalUrl: string;
  params: any;
  query: any;
  body: any;
}

interface Response {
  statusCode: number;
  status(code: number): Response;
  json(body: any): Response;
  send(body: any): Response;
}

interface NextFunction {
  (error?: any): void;
}

interface Express {
  use(path: string, middleware: any): void;
  get(path: string, handler: (req: Request, res: Response) => void): void;
  put(path: string, handler: (req: Request, res: Response) => void): void;
  post(path: string, handler: (req: Request, res: Response) => void): void;
  delete(path: string, handler: (req: Request, res: Response) => void): void;
  listen(port: number, callback: () => void): void;
}

// Mock express for this example
const express = {
  json: () => (req: Request, res: Response, next: NextFunction) => next(),
  use: () => {},
  get: () => {},
  put: () => {},
  post: () => {},
  delete: () => {},
  listen: (port: number, callback: () => void) => {
    console.log(`Mock server listening on port ${port}`);
    callback();
  }
} as any;

import { Cachly, createCacheMiddleware, createInvalidateMiddleware } from '../src/index';

// Note: This example requires express to be installed
// npm install express @types/express

const app = express();
const port = 3000;

// Create cache instance
const cacheInstance = new Cachly({
  maxItems: 1000,
  defaultTtl: 30000, // 30 seconds
  log: true,
  onHit: (key) => console.log(`[CACHE HIT] ${key}`),
  onMiss: (key) => console.log(`[CACHE MISS] ${key}`),
});

// Simulate database
const users = new Map([
  ['1', { id: '1', name: 'John Doe', email: 'john@example.com' }],
  ['2', { id: '2', name: 'Jane Smith', email: 'jane@example.com' }],
  ['3', { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }],
]);

const posts = new Map([
  ['1', { id: '1', title: 'First Post', content: 'Hello World!', authorId: '1' }],
  ['2', { id: '2', title: 'Second Post', content: 'Another post', authorId: '2' }],
]);

// Service class without decorators (decorators require experimental TypeScript features)
class UserService {
  async getUser(id: string) {
    console.log(`[DB] Fetching user ${id}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate DB delay
    return users.get(id) || null;
  }

  async getAllUsers() {
    console.log('[DB] Fetching all users');
    await new Promise(resolve => setTimeout(resolve, 200));
    return Array.from(users.values());
  }

  async updateUser(id: string, data: any) {
    console.log(`[DB] Updating user ${id}`);
    await new Promise(resolve => setTimeout(resolve, 150));
    users.set(id, { ...users.get(id), ...data });
    return users.get(id);
  }
}

class PostService {
  async getPost(id: string) {
    console.log(`[DB] Fetching post ${id}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    return posts.get(id) || null;
  }

  async getAllPosts() {
    console.log('[DB] Fetching all posts');
    await new Promise(resolve => setTimeout(resolve, 200));
    return Array.from(posts.values());
  }

  async createPost(data: any) {
    console.log('[DB] Creating new post');
    await new Promise(resolve => setTimeout(resolve, 150));
    const id = (posts.size + 1).toString();
    const post = { id, ...data };
    posts.set(id, post);
    return post;
  }
}

const userService = new UserService();
const postService = new PostService();

// Middleware examples
app.use(express.json());

// Cache middleware for user routes
app.use('/api/users', createCacheMiddleware({
  cache: cacheInstance,
  ttl: 30000,
  tags: (req) => ['users', req.params.id],
  skip: (req) => req.method !== 'GET',
}));

// Cache middleware for post routes
app.use('/api/posts', createCacheMiddleware({
  cache: cacheInstance,
  ttl: 45000,
  tags: (req) => ['posts', req.params.id],
  skip: (req) => req.method !== 'GET',
}));

// Invalidate middleware for updates
app.use('/api/users/:id', createInvalidateMiddleware({
  cache: cacheInstance,
  tags: ['users'],
}));

app.use('/api/posts', createInvalidateMiddleware({
  cache: cacheInstance,
  tags: ['posts'],
}));

// Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await userService.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await postService.getAllPosts();
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await postService.getPost(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const post = await postService.createPost(req.body);
    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Cache management endpoints
app.get('/api/cache/stats', (req, res) => {
  const stats = cacheInstance.stats();
  res.json({
    hits: stats.hits,
    misses: stats.misses,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    keyCount: stats.keyCount,
    memoryUsage: stats.memoryUsage,
  });
});

app.get('/api/cache/keys', (req, res) => {
  const pattern = req.query.pattern as string;
  const keys = cacheInstance.getKeys(pattern);
  res.json({ keys, count: keys.length });
});

app.delete('/api/cache/clear', (req, res) => {
  cacheInstance.clear();
  res.json({ message: 'Cache cleared' });
});

app.delete('/api/cache/tags/:tag', async (req, res) => {
  try {
    const affectedKeys = await cacheInstance.invalidateByTag(req.params.tag);
    res.json({ message: 'Tag invalidated', affectedKeys });
  } catch (error) {
    res.status(500).json({ error: 'Failed to invalidate tag' });
  }
});

// Health check
app.get('/health', (req, res) => {
  const health = cacheInstance.health();
  res.json(health);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Express app with Cachly running on http://localhost:${port}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /api/users              - Get all users (cached)');
  console.log('  GET  /api/users/:id          - Get user by ID (cached)');
  console.log('  PUT  /api/users/:id          - Update user (invalidates cache)');
  console.log('  GET  /api/posts              - Get all posts (cached)');
  console.log('  GET  /api/posts/:id          - Get post by ID (cached)');
  console.log('  POST /api/posts              - Create post (invalidates cache)');
  console.log('  GET  /api/cache/stats        - Cache statistics');
  console.log('  GET  /api/cache/keys         - List cache keys');
  console.log('  DELETE /api/cache/clear      - Clear all cache');
  console.log('  DELETE /api/cache/tags/:tag  - Invalidate by tag');
  console.log('  GET  /health                 - Health check');
  console.log('');
  console.log('Try these commands to test:');
  console.log('  curl http://localhost:3000/api/users/1');
  console.log('  curl http://localhost:3000/api/cache/stats');
  console.log('  curl -X PUT http://localhost:3000/api/users/1 -H "Content-Type: application/json" -d \'{"name":"Updated Name"}\'');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  cacheInstance.destroy();
  process.exit(0);
});

export { app, cacheInstance }; 