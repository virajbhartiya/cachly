import { PersistenceAdapter } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export class FSAdapter implements PersistenceAdapter {
  private cacheDir: string;

  constructor(cacheDir?: string) {
    this.cacheDir = cacheDir || path.join(process.cwd(), '.grip');
    this.ensureCacheDir();
  }

  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-zA-Z0-9]/g, '_');
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  async get(key: string): Promise<any> {
    try {
      const filePath = this.getFilePath(key);
      if (!fs.existsSync(filePath)) {
        return undefined;
      }

      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        fs.unlinkSync(filePath);
        return undefined;
      }

      return parsed.value;
    } catch (error) {
      console.error('FS get error:', error);
      return undefined;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      const data = {
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
        createdAt: Date.now(),
      };

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('FS set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const filePath = this.getFilePath(key);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('FS delete error:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      const files = fs.readdirSync(this.cacheDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          fs.unlinkSync(path.join(this.cacheDir, file));
        }
      }
    } catch (error) {
      console.error('FS clear error:', error);
    }
  }
} 