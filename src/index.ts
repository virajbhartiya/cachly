import { Grip } from './Grip';

export { Grip } from './Grip';
export * from './types';
export * from './utils/compression';
export * from './utils/CircuitBreaker';
export * from './utils/Partitioning';
export * from './utils/Monitoring';
export * from './adapters/FSAdapter';

export class GripNamespace {
  private static namespaces = new Map<string, Grip>();

  static namespace(name: string, config?: any): Grip {
    if (!this.namespaces.has(name)) {
      this.namespaces.set(name, new Grip({ ...config, namespace: name }));
    }
    return this.namespaces.get(name)!;
  }

  static create(config?: any): Grip {
    return new Grip(config);
  }

  static clearAll(): void {
    for (const cache of this.namespaces.values()) {
      cache.destroy();
    }
    this.namespaces.clear();
  }
}

export default GripNamespace; 