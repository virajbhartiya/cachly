import { PartitioningConfig, PartitionInfo } from '../types';

export class PartitioningUtil {
  private config: PartitioningConfig;
  private partitions: Map<number, PartitionInfo> = new Map();

  constructor(config: PartitioningConfig) {
    this.config = config;
    this.initializePartitions();
  }

  private initializePartitions(): void {
    for (let i = 0; i < this.config.partitions; i++) {
      this.partitions.set(i, {
        id: i,
        keyCount: 0,
        memoryUsage: 0,
        hitRate: 0,
      });
    }
  }

  getPartition(key: string): number {
    if (!this.config.enabled) return 0;

    let partitionKey: string;
    
    if (this.config.partitionKey) {
      partitionKey = this.config.partitionKey(key);
    } else {
      partitionKey = key;
    }

    switch (this.config.strategy) {
      case 'hash':
        return this.hashPartition(partitionKey);
      case 'range':
        return this.rangePartition(partitionKey);
      case 'custom':
        return this.customPartition(partitionKey);
      default:
        return this.hashPartition(partitionKey);
    }
  }

  private hashPartition(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % this.config.partitions;
  }

  private rangePartition(key: string): number {
    const firstChar = key.charAt(0).toLowerCase();
    const charCode = firstChar.charCodeAt(0);
    return charCode % this.config.partitions;
  }

  private customPartition(key: string): number {
    // Custom partitioning logic - can be extended
    return this.hashPartition(key);
  }

  updatePartitionStats(partitionId: number, keyCount: number, memoryUsage: number, hitRate: number): void {
    const partition = this.partitions.get(partitionId);
    if (partition) {
      partition.keyCount = keyCount;
      partition.memoryUsage = memoryUsage;
      partition.hitRate = hitRate;
    }
  }

  getPartitionInfo(partitionId: number): PartitionInfo | undefined {
    return this.partitions.get(partitionId);
  }

  getAllPartitions(): PartitionInfo[] {
    return Array.from(this.partitions.values());
  }

  getPartitionDistribution(): Record<number, number> {
    const distribution: Record<number, number> = {};
    for (const partition of this.partitions.values()) {
      distribution[partition.id] = partition.keyCount;
    }
    return distribution;
  }

  getBalancedPartition(): number {
    let minKeys = Infinity;
    let selectedPartition = 0;

    for (const partition of this.partitions.values()) {
      if (partition.keyCount < minKeys) {
        minKeys = partition.keyCount;
        selectedPartition = partition.id;
      }
    }

    return selectedPartition;
  }

  isBalanced(): boolean {
    const keyCounts = Array.from(this.partitions.values()).map(p => p.keyCount);
    const avg = keyCounts.reduce((sum, count) => sum + count, 0) / keyCounts.length;
    const variance = keyCounts.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / keyCounts.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Consider balanced if standard deviation is less than 20% of average
    return standardDeviation < avg * 0.2;
  }
} 