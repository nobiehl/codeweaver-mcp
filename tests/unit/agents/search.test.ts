import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SearchAgent } from '../../../src/core/agents/search.js';
import fs from 'fs/promises';
import path from 'path';

describe('SearchAgent', () => {
  let agent: SearchAgent;
  const testDir = '.test-search';

  beforeEach(async () => {
    agent = new SearchAgent(testDir);

    // Create test directory structure
    await fs.mkdir(testDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'src'), { recursive: true });
    await fs.mkdir(path.join(testDir, 'test'), { recursive: true });

    // Create test files
    await fs.writeFile(
      path.join(testDir, 'src', 'Example.java'),
      `package com.example;

public class Example {
    private String name;

    public void processData() {
        System.out.println("Processing data");
    }

    public String getName() {
        return name;
    }
}`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(testDir, 'src', 'Helper.java'),
      `package com.example;

public class Helper {
    public static void helperMethod() {
        System.out.println("Helper method");
    }
}`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(testDir, 'test', 'ExampleTest.java'),
      `package com.example;

import org.junit.Test;

public class ExampleTest {
    @Test
    public void testExample() {
        Example ex = new Example();
    }
}`,
      'utf-8'
    );

    await fs.writeFile(
      path.join(testDir, 'README.md'),
      `# Example Project

This is a test project for searching.`,
      'utf-8'
    );
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should search for keyword in files', async () => {
    const results = await agent.searchKeyword('processData');

    expect(results.length).toBeGreaterThan(0);
    const match = results[0];
    expect(match.file).toContain('Example.java');
    expect(match.line).toBeGreaterThan(0);
    expect(match.content).toContain('processData');
  });

  it('should search with regex pattern', async () => {
    const results = await agent.searchPattern(/public\s+void\s+\w+\(\)/);

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.content.includes('processData'))).toBe(true);
  });

  it('should filter by file extension', async () => {
    const results = await agent.searchKeyword('Example', { fileExtensions: ['.java'] });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.file.endsWith('.java'))).toBe(true);
  });

  it('should exclude directories', async () => {
    const results = await agent.searchKeyword('Example', { excludeDirs: ['test'] });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => !r.file.includes('test'))).toBe(true);
  });

  it('should search case-insensitive', async () => {
    const results = await agent.searchKeyword('PROCESSDATA', { caseSensitive: false });

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].content.toLowerCase()).toContain('processdata');
  });

  it('should limit results', async () => {
    const results = await agent.searchKeyword('public', { maxResults: 2 });

    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('should include context lines', async () => {
    const results = await agent.searchKeyword('processData', { contextLines: 1 });

    expect(results.length).toBeGreaterThan(0);
    const match = results[0];
    expect(match.beforeContext).toBeDefined();
    expect(match.afterContext).toBeDefined();
    expect(match.beforeContext!.length).toBeGreaterThan(0);
  });

  it('should search in specific directory', async () => {
    const results = await agent.searchKeyword('Example', { searchPath: 'src' });

    expect(results.length).toBeGreaterThan(0);
    expect(results.every(r => r.file.includes('src'))).toBe(true);
  });

  it('should return empty array for non-matching keyword', async () => {
    const results = await agent.searchKeyword('NonExistentKeyword12345');

    expect(results).toEqual([]);
  });

  it('should find files by name pattern', async () => {
    const files = await agent.findFiles('*Test.java');

    expect(files.length).toBeGreaterThan(0);
    expect(files[0]).toContain('ExampleTest.java');
  });

  it('should find files by extension', async () => {
    const files = await agent.findFiles('*.md');

    expect(files.length).toBe(1);
    expect(files[0]).toContain('README.md');
  });
});
