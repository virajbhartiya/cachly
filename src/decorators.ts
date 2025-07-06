import { Cachly } from './Cachly';
import { CacheOptions } from './types';

export interface CacheDecoratorOptions extends Partial<CacheOptions> {
  key?: string | ((args: any[]) => string);
  ttl?: number;
  tags?: string[];
  dependsOn?: string[];
}

export class CacheDecorators {
  private static defaultCache = new Cachly();

  static setDefaultCache(cache: Cachly): void {
    CacheDecorators.defaultCache = cache;
  }

  static cache(options: CacheDecoratorOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const cacheKey = typeof options.key === 'function' 
          ? options.key(args)
          : options.key || `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

        const cacheOptions: Partial<CacheOptions> = {
          ...(options.ttl !== undefined && { ttl: options.ttl }),
          ...(options.tags !== undefined && { tags: options.tags }),
          ...(options.dependsOn !== undefined && { dependsOn: options.dependsOn }),
        };

        return await CacheDecorators.defaultCache.getOrCompute(
          cacheKey,
          () => originalMethod.apply(this, args),
          cacheOptions
        );
      };

      return descriptor;
    };
  }

  static invalidate(options: { tags?: string[]; keys?: string[]; pattern?: string }) {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const result = await originalMethod.apply(this, args);

        if (options.tags) {
          await CacheDecorators.defaultCache.invalidateByTags(options.tags);
        }

        if (options.keys) {
          for (const key of options.keys) {
            CacheDecorators.defaultCache.delete(key);
          }
        }

        if (options.pattern) {
          const keys = CacheDecorators.defaultCache.getKeysByPattern(options.pattern);
          for (const key of keys) {
            CacheDecorators.defaultCache.delete(key);
          }
        }

        return result;
      };

      return descriptor;
    };
  }

  static cacheMethod(key: string, ttl?: number) {
    return CacheDecorators.cache({ key, ...(ttl !== undefined && { ttl }) });
  }

  static cacheWithTags(tags: string[], ttl?: number) {
    return CacheDecorators.cache({ tags, ...(ttl !== undefined && { ttl }) });
  }

  static invalidateTags(tags: string[]) {
    return CacheDecorators.invalidate({ tags });
  }
}

export const cache = CacheDecorators.cache;
export const invalidate = CacheDecorators.invalidate;
export const cacheMethod = CacheDecorators.cacheMethod;
export const cacheWithTags = CacheDecorators.cacheWithTags;
export const invalidateTags = CacheDecorators.invalidateTags; 