import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import type { CacheKey, CacheStats } from '../../types/cache.js';

export class CacheAgent {
  private cacheDir: string;
  private metadataFile: string;
  private hits: number = 0;
  private misses: number = 0;

  constructor(projectRoot: string = '.') {
    this.cacheDir = path.join(projectRoot, '.codeweaver', 'cache');
    this.metadataFile = path.join(projectRoot, '.codeweaver', 'metadata.json');
  }

  async store(key: CacheKey, data: any): Promise<void> {
    await fs.mkdir(this.cacheDir, { recursive: true });

    const filePath = this.getCacheFilePath(key);
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const content = JSON.stringify(data);
    await fs.writeFile(filePath, content, 'utf-8');

    // Update metadata
    await this.updateMetadata(key, content.length);
  }

  async load(key: CacheKey): Promise<any | null> {
    const filePath = this.getCacheFilePath(key);

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.hits++; // Cache hit
      return JSON.parse(content);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        this.misses++; // Cache miss
        return null;
      }
      throw error;
    }
  }

  async computeHash(content: string): Promise<string> {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async hashFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return this.computeHash(content);
    } catch {
      return '';
    }
  }

  async invalidate(pattern: string): Promise<void> {
    // Simple glob-style pattern matching
    // e.g., "index-symbols-*" matches "index-symbols-abc123"

    const entries = await this.getAllCacheFiles();
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');

    for (const entry of entries) {
      const keyStr = this.cacheKeyToString(entry);
      if (regex.test(keyStr)) {
        const filePath = this.getCacheFilePath(entry);
        try {
          await fs.unlink(filePath);
        } catch {}
      }
    }
  }

  async getStats(): Promise<CacheStats> {
    let totalSize = 0;
    let entries = 0;

    const allFiles = await this.getAllCacheFiles();

    for (const key of allFiles) {
      const filePath = this.getCacheFilePath(key);
      try {
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
        entries++;
      } catch {}
    }

    // Calculate hit rate
    const totalAccesses = this.hits + this.misses;
    const hitRate = totalAccesses > 0 ? this.hits / totalAccesses : 0;

    return {
      totalSize,
      entries,
      hitRate,
      lastCleanup: new Date()
    };
  }

  private getCacheFilePath(key: CacheKey): string {
    const fileName = `${key.type}${key.scope ? '-' + key.scope : ''}-${key.hash}.json`;
    return path.join(this.cacheDir, key.type, fileName);
  }

  private cacheKeyToString(key: CacheKey): string {
    return `${key.type}${key.scope ? '-' + key.scope : ''}-${key.hash}`;
  }

  private async getAllCacheFiles(): Promise<CacheKey[]> {
    const keys: CacheKey[] = [];

    try {
      const types = await fs.readdir(this.cacheDir);

      for (const type of types) {
        const typePath = path.join(this.cacheDir, type);
        const stat = await fs.stat(typePath);

        if (stat.isDirectory()) {
          const files = await fs.readdir(typePath);

          for (const file of files) {
            const match = file.match(/^(\w+)(?:-(\w+))?-([a-zA-Z0-9]+)\.json$/);
            if (match) {
              keys.push({
                type: match[1] as any,
                scope: match[2],
                hash: match[3]
              });
            }
          }
        }
      }
    } catch (error) {
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }

    return keys;
  }

  private async updateMetadata(_key: CacheKey, _sizeBytes: number): Promise<void> {
    // TODO: Implement full metadata tracking
    // For now, just ensure directory exists
    const dir = path.dirname(this.metadataFile);
    await fs.mkdir(dir, { recursive: true });
  }
}
