import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheAgent } from '../../../src/core/agents/cache.js';
import fs from 'fs/promises';
import type { CacheKey } from '../../../src/types/cache.js';

describe('CacheAgent', () => {
  let agent: CacheAgent;
  let testCacheDir: string;

  beforeEach(() => {
    // Use unique directory for each test to avoid race conditions
    testCacheDir = `.test-cache-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    agent = new CacheAgent(testCacheDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    } catch {}
  });

  it('should store and load data', async () => {
    const key: CacheKey = {
      type: 'index',
      scope: 'symbols',
      hash: 'abc123'
    };

    const data = { test: 'data', value: 42 };

    await agent.store(key, data);
    const loaded = await agent.load(key);

    expect(loaded).toEqual(data);
  });

  it('should return null for non-existent cache', async () => {
    const key: CacheKey = {
      type: 'index',
      scope: 'symbols',
      hash: 'nonexistent'
    };

    const loaded = await agent.load(key);
    expect(loaded).toBeNull();
  });

  it('should compute content hash', async () => {
    const hash1 = await agent.computeHash('test content');
    const hash2 = await agent.computeHash('test content');
    const hash3 = await agent.computeHash('different content');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1).toMatch(/^[a-f0-9]{64}$/); // SHA-256
  });

  it('should invalidate cache entries', async () => {
    const key: CacheKey = {
      type: 'index',
      scope: 'symbols',
      hash: 'xyz789'
    };

    await agent.store(key, { test: 'data' });

    await agent.invalidate('index-symbols-*');

    const loaded = await agent.load(key);
    expect(loaded).toBeNull();
  });

  it('should get cache stats', async () => {
    const key1: CacheKey = { type: 'index', scope: 'symbols', hash: 'hash1' };
    const key2: CacheKey = { type: 'index', scope: 'refs', hash: 'hash2' };

    await agent.store(key1, { data: '1' });
    await agent.store(key2, { data: '2' });

    const stats = await agent.getStats();

    expect(stats.entries).toBe(2);
    expect(stats.totalSize).toBeGreaterThan(0);
  });

  it('should track cache hit rate - all hits', async () => {
    const key: CacheKey = { type: 'index', scope: 'test', hash: 'hit123' };
    await agent.store(key, { data: 'test' });

    // 3 hits
    await agent.load(key);
    await agent.load(key);
    await agent.load(key);

    const stats = await agent.getStats();
    expect(stats.hitRate).toBe(1.0); // 100% hit rate (3 hits, 0 misses)
  });

  it('should track cache hit rate - all misses', async () => {
    const key1: CacheKey = { type: 'index', scope: 'test', hash: 'miss1' };
    const key2: CacheKey = { type: 'index', scope: 'test', hash: 'miss2' };
    const key3: CacheKey = { type: 'index', scope: 'test', hash: 'miss3' };

    // 3 misses
    await agent.load(key1);
    await agent.load(key2);
    await agent.load(key3);

    const stats = await agent.getStats();
    expect(stats.hitRate).toBe(0.0); // 0% hit rate (0 hits, 3 misses)
  });

  it('should track cache hit rate - mixed', async () => {
    const hit: CacheKey = { type: 'index', scope: 'test', hash: 'hit' };
    const miss: CacheKey = { type: 'index', scope: 'test', hash: 'miss' };

    await agent.store(hit, { data: 'cached' });

    // 2 hits
    await agent.load(hit);
    await agent.load(hit);

    // 2 misses
    await agent.load(miss);
    await agent.load(miss);

    const stats = await agent.getStats();
    expect(stats.hitRate).toBe(0.5); // 50% hit rate (2 hits, 2 misses)
  });

  it('should have 0 hit rate with no accesses', async () => {
    const stats = await agent.getStats();
    expect(stats.hitRate).toBe(0.0); // No accesses = 0% hit rate
  });
});
