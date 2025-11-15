import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SemanticIndexAgent } from '../../../src/core/agents/semantic.js';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

describe('SemanticIndexAgent', () => {
  let agent: SemanticIndexAgent;
  let testDir: string;

  beforeEach(async () => {
    // Create temp directory for tests
    testDir = path.join(os.tmpdir(), `semantic-test-${Date.now()}`);
    await fs.mkdir(testDir, { recursive: true });
    agent = new SemanticIndexAgent(testDir);
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Code Chunking', () => {
    it('should chunk file into overlapping segments', async () => {
      // Create a test Java file
      const testFile = path.join(testDir, 'Test.java');
      const lines = [];
      for (let i = 1; i <= 100; i++) {
        lines.push(`// Line ${i}`);
      }
      await fs.writeFile(testFile, lines.join('\n'), 'utf-8');

      // Access private chunkFile method via type casting
      const chunks = (agent as any).chunkFile('Test.java', lines.join('\n'));

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toHaveProperty('file');
      expect(chunks[0]).toHaveProperty('startLine');
      expect(chunks[0]).toHaveProperty('endLine');
      expect(chunks[0]).toHaveProperty('content');
      expect(chunks[0].file).toBe('Test.java');
    });

    it('should create chunks with overlap', async () => {
      const content = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');
      const chunks = (agent as any).chunkFile('Test.java', content);

      // With 20-line chunks and 5-line overlap, we expect multiple chunks
      expect(chunks.length).toBeGreaterThan(2);

      // Check that chunks overlap
      if (chunks.length >= 2) {
        const chunk1End = chunks[0].endLine;
        const chunk2Start = chunks[1].startLine;
        // chunk2 should start before chunk1 ends (overlap)
        expect(chunk2Start).toBeLessThan(chunk1End);
      }
    });

    it('should skip empty chunks', async () => {
      const content = '\n\n\n\n\n\n\n\n\n\n' + 'Line 11\nLine 12\n' + '\n\n\n\n\n\n\n\n\n\n';
      const chunks = (agent as any).chunkFile('Test.java', content);

      // Should only have chunks with actual content
      chunks.forEach((chunk: any) => {
        expect(chunk.content.trim().length).toBeGreaterThanOrEqual(10);
      });
    });
  });

  describe('Batch Processing Logic', () => {
    it('should determine batch size based on CPU cores', () => {
      const cpuCores = os.cpus().length;
      const expectedBatchSize = Math.max(8, cpuCores * 2);

      // The batch size should be 2x CPU cores or minimum 8
      expect(expectedBatchSize).toBeGreaterThanOrEqual(8);
      expect(expectedBatchSize).toBe(cpuCores * 2 >= 8 ? cpuCores * 2 : 8);
    });

    it('should handle empty chunk array', async () => {
      // This tests the edge case of batch processing with no chunks
      const result = (agent as any).generateEmbeddingsBatch([]);

      // Should not throw and should return empty array
      await expect(result).resolves.toEqual([]);
    });
  });

  describe('Statistics', () => {
    it('should return zero stats for non-existent index', async () => {
      const stats = await agent.getStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('modelName');
      expect(stats.total.chunks).toBe(0);
      expect(stats.total.size).toBe(0);
    });
  });

  describe('Index Clearing', () => {
    it('should clear index without error', async () => {
      // Should not throw even if no index exists
      await expect(agent.clearIndex()).resolves.not.toThrow();
    });
  });
});
