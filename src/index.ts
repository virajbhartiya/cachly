import { Cachly } from './Cachly';

export { Cachly } from './Cachly';
export * from './types';
export * from './utils/compression';
export * from './utils/CircuitBreaker';
export * from './utils/Partitioning';
export * from './utils/Monitoring';
export * from './adapters/FSAdapter';
export * from './decorators';
export * from './middleware/express';
export * from './cli';

export class CachlyNamespace {
  private static namespaces = new Map<string, Cachly>();

  static namespace(name: string, config?: any): Cachly {
    if (!this.namespaces.has(name)) {
      this.namespaces.set(name, new Cachly({ ...config, namespace: name }));
    }
    return this.namespaces.get(name)!;
  }

  static create(config?: any): Cachly {
    return new Cachly(config);
  }

  static clearAll(): void {
    for (const cache of this.namespaces.values()) {
      cache.destroy();
    }
    this.namespaces.clear();
  }
}

export default CachlyNamespace; 