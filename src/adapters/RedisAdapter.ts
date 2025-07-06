import { PersistenceAdapter } from '../types';

export class RedisAdapter implements PersistenceAdapter {
  private client: any;
  private connected = false;

  constructor(redisUrl?: string) {
    try {
      const redis = require('redis');
      this.client = redis.createClient(redisUrl);
      this.client.connect().then(() => {
        this.connected = true;
      }).catch((error: any) => {
        console.error('Failed to connect to Redis:', error);
      });
    } catch (error) {
      console.error('Redis not available:', error);
    }
  }

  async get(key: string): Promise<any> {
    if (!this.connected) return undefined;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : undefined;
    } catch (error) {
      console.error('Redis get error:', error);
      return undefined;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!this.connected) return;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl / 1000, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.connected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(): Promise<void> {
    if (!this.connected) return;
    
    try {
      await this.client.flushDb();
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }
} 