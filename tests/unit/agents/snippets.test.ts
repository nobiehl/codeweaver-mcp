import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SnippetsAgent } from '../../../src/core/agents/snippets.js';
import fs from 'fs/promises';
import path from 'path';

describe('SnippetsAgent', () => {
  let agent: SnippetsAgent;
  const testDir = '.test-snippets';
  const testFile = path.join(testDir, 'Test.java');

  beforeEach(async () => {
    agent = new SnippetsAgent(testDir);

    // Create test Java file
    await fs.mkdir(testDir, { recursive: true });
    const javaCode = `package com.example;

public class Test {
    private String name;

    public Test(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}`;
    await fs.writeFile(testFile, javaCode, 'utf-8');
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should read entire file', async () => {
    const content = await agent.readFile('Test.java');

    expect(content).toContain('package com.example');
    expect(content).toContain('public class Test');
    expect(content).toContain('public String getName()');
  });

  it('should read specific line range', async () => {
    const snippet = await agent.readLines('Test.java', 4, 8);

    expect(snippet).toContain('private String name');
    expect(snippet).toContain('public Test(String name)');
    expect(snippet).not.toContain('package com.example');
  });

  it('should count tokens in text', () => {
    const text = 'public class Test { }';
    const tokens = agent.countTokens(text);

    expect(tokens).toBeGreaterThan(0);
    expect(tokens).toBeLessThan(20); // Simple heuristic
  });

  it('should truncate text to token limit', () => {
    const longText = 'word '.repeat(1000); // ~1000 tokens
    const truncated = agent.truncateToTokens(longText, 100);

    const tokens = agent.countTokens(truncated);
    expect(tokens).toBeLessThanOrEqual(100);
    expect(truncated.length).toBeLessThan(longText.length);
  });

  it('should return null for non-existent file', async () => {
    const content = await agent.readFile('NonExistent.java');
    expect(content).toBeNull();
  });

  it('should handle line range beyond file length', async () => {
    const snippet = await agent.readLines('Test.java', 100, 200);
    expect(snippet).toBe('');
  });

  it('should get file with line numbers', async () => {
    const numbered = await agent.readFileWithLineNumbers('Test.java');

    expect(numbered).toContain('1: package com.example');
    expect(numbered).toContain('3: public class Test {');
  });
});
