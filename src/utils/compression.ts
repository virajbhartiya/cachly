import { CompressionConfig } from '../types';

export class CompressionUtil {
  static async compress(data: any, config: CompressionConfig): Promise<{ data: Buffer; originalSize: number; compressedSize: number }> {
    const serialized = JSON.stringify(data);
    const originalSize = Buffer.byteLength(serialized, 'utf8');
    
    if (originalSize < config.threshold) {
      return { data: Buffer.from(serialized), originalSize, compressedSize: originalSize };
    }

    try {
      let compressed: Buffer;
      
      switch (config.algorithm) {
        case 'gzip':
          compressed = await this.compressGzip(serialized, config.level);
          break;
        case 'brotli':
          compressed = await this.compressBrotli(serialized, config.level);
          break;
        case 'lz4':
          compressed = await this.compressLz4(serialized);
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${config.algorithm}`);
      }

      const compressedSize = compressed.length;
      return { data: compressed, originalSize, compressedSize };
    } catch (error) {
      // Fallback to uncompressed data
      return { data: Buffer.from(serialized), originalSize, compressedSize: originalSize };
    }
  }

  static async decompress(data: Buffer, algorithm: string): Promise<any> {
    try {
      let decompressed: string;
      
      switch (algorithm) {
        case 'gzip':
          decompressed = await this.decompressGzip(data);
          break;
        case 'brotli':
          decompressed = await this.decompressBrotli(data);
          break;
        case 'lz4':
          decompressed = await this.decompressLz4(data);
          break;
        default:
          // Assume uncompressed
          decompressed = data.toString('utf8');
      }

      return JSON.parse(decompressed);
    } catch (error) {
      throw new Error(`Failed to decompress data: ${error}`);
    }
  }

  private static async compressGzip(data: string, level?: number): Promise<Buffer> {
    const zlib = require('zlib');
    const gzip = zlib.createGzip({ level: level || 6 });
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      gzip.on('data', (chunk: Buffer) => chunks.push(chunk));
      gzip.on('end', () => resolve(Buffer.concat(chunks)));
      gzip.on('error', reject);
      gzip.write(data);
      gzip.end();
    });
  }

  private static async decompressGzip(data: Buffer): Promise<string> {
    const zlib = require('zlib');
    const gunzip = zlib.createGunzip();
    
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      gunzip.on('data', (chunk: Buffer) => chunks.push(chunk));
      gunzip.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      gunzip.on('error', reject);
      gunzip.write(data);
      gunzip.end();
    });
  }

  private static async compressBrotli(data: string, level?: number): Promise<Buffer> {
    try {
      const brotli = require('brotli');
      return Buffer.from(brotli.compress(Buffer.from(data), { quality: level || 6 }));
    } catch (error) {
      // Fallback to gzip if brotli is not available
      return this.compressGzip(data, level);
    }
  }

  private static async decompressBrotli(data: Buffer): Promise<string> {
    try {
      const brotli = require('brotli');
      return Buffer.from(brotli.decompress(data)).toString('utf8');
    } catch (error) {
      // Fallback to gzip if brotli is not available
      return this.decompressGzip(data);
    }
  }

  private static async compressLz4(data: string): Promise<Buffer> {
    try {
      const lz4 = require('lz4');
      return lz4.encode(Buffer.from(data));
    } catch (error) {
      // Fallback to gzip if lz4 is not available
      return this.compressGzip(data);
    }
  }

  private static async decompressLz4(data: Buffer): Promise<string> {
    try {
      const lz4 = require('lz4');
      return lz4.decode(data).toString('utf8');
    } catch (error) {
      // Fallback to gzip if lz4 is not available
      return this.decompressGzip(data);
    }
  }

  static calculateCompressionRatio(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return ((originalSize - compressedSize) / originalSize) * 100;
  }
} 