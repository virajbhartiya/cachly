// Express types - will be available when express is installed
interface Request {
  method: string;
  originalUrl: string;
  params: any;
}

interface Response {
  statusCode: number;
  send(body: any): Response;
  json(body: any): Response;
}

interface NextFunction {
  (error?: any): void;
}
import { Cachly } from '../Cachly';
import { CacheOptions } from '../types';

export interface CacheMiddlewareOptions {
  cache: Cachly;
  keyGenerator?: (req: Request) => string;
  ttl?: number;
  tags?: string[] | ((req: Request) => string[]);
  dependsOn?: string[] | ((req: Request) => string[]);
  skip?: (req: Request) => boolean;
  varyBy?: string[];
  statusCodes?: number[];
}

export function createCacheMiddleware(options: CacheMiddlewareOptions) {
  const {
    cache,
    keyGenerator = (req) => `${req.method}:${req.originalUrl}`,
    ttl,
    tags,
    dependsOn,
    skip = () => false,
    statusCodes = [200],
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (skip(req)) {
      return next();
    }

    const key = keyGenerator(req);
    const cacheOptions: Partial<CacheOptions> = {
      ...(ttl !== undefined && { ttl }),
      ...(tags !== undefined && { tags: typeof tags === 'function' ? tags(req) : tags }),
      ...(dependsOn !== undefined && { dependsOn: typeof dependsOn === 'function' ? dependsOn(req) : dependsOn }),
    };

    try {
      const cachedResponse = await cache.get(key);
      if (cachedResponse) {
        return res.json(cachedResponse);
      }

      // Store original send method
      const originalSend = res.send;
      const originalJson = res.json;

      // Override send method to cache responses
      res.send = function(body: any) {
        if (statusCodes.includes(res.statusCode)) {
          cache.set(key, body, cacheOptions);
        }
        return originalSend.call(this, body);
      };

      res.json = function(body: any) {
        if (statusCodes.includes(res.statusCode)) {
          cache.set(key, body, cacheOptions);
        }
        return originalJson.call(this, body);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function createInvalidateMiddleware(options: {
  cache: Cachly;
  tags?: string[] | ((req: Request) => string[]);
  keys?: string[] | ((req: Request) => string[]);
  pattern?: string | ((req: Request) => string);
}) {
  const { cache, tags, keys, pattern } = options;

  return async (req: Request, _: Response, next: NextFunction) => {
    try {
      // Invalidate by tags
      if (tags) {
        const tagsToInvalidate = typeof tags === 'function' ? tags(req) : tags;
        await cache.invalidateByTags(tagsToInvalidate);
      }

      // Invalidate by keys
      if (keys) {
        const keysToInvalidate = typeof keys === 'function' ? keys(req) : keys;
        for (const key of keysToInvalidate) {
          cache.delete(key);
        }
      }

      // Invalidate by pattern
      if (pattern) {
        const patternToUse = typeof pattern === 'function' ? pattern(req) : pattern;
        const keysToDelete = cache.getKeysByPattern(patternToUse);
        for (const key of keysToDelete) {
          cache.delete(key);
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Convenience functions
export const cacheMiddleware = createCacheMiddleware;
export const invalidateMiddleware = createInvalidateMiddleware; 