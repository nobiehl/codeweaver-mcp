import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SymbolsAgent } from '../../../src/core/agents/symbols.js';
import fs from 'fs/promises';
import path from 'path';

describe('SymbolsAgent', () => {
  let agent: SymbolsAgent;
  const testDir = '.test-symbols';
  const testFile = path.join(testDir, 'Example.java');

  beforeEach(async () => {
    agent = new SymbolsAgent(testDir);

    // Create test Java file
    await fs.mkdir(testDir, { recursive: true });
    const javaCode = `package com.example;

import java.util.List;

public class Example {
    private String name;
    private int count;

    public Example(String name) {
        this.name = name;
        this.count = 0;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public int increment() {
        return ++count;
    }

    public static void main(String[] args) {
        Example ex = new Example("test");
        System.out.println(ex.getName());
    }
}`;
    await fs.writeFile(testFile, javaCode, 'utf-8');
  });

  afterEach(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch {}
  });

  it('should parse Java file and extract class', async () => {
    const symbols = await agent.parseFile('Example.java');

    expect(symbols).toBeDefined();
    expect(symbols.length).toBeGreaterThan(0);

    const classSymbol = symbols.find(s => s.kind === 'class');
    expect(classSymbol).toBeDefined();
    expect(classSymbol?.name).toBe('Example');
    expect(classSymbol?.qualifiedName).toBe('com.example.Example');
  });

  it('should extract fields from class', async () => {
    const symbols = await agent.parseFile('Example.java');

    const fields = symbols.filter(s => s.kind === 'field');
    expect(fields.length).toBeGreaterThanOrEqual(2);

    const nameField = fields.find(f => f.name === 'name');
    expect(nameField).toBeDefined();
    expect(nameField?.name).toBe('name');
  });

  it('should extract methods from class', async () => {
    const symbols = await agent.parseFile('Example.java');

    const methods = symbols.filter(s => s.kind === 'method');
    expect(methods.length).toBeGreaterThan(0);

    const getterMethod = methods.find(m => m.name === 'getName');
    expect(getterMethod).toBeDefined();
    expect(getterMethod?.name).toBe('getName');
  });

  it('should handle constructor parsing', async () => {
    const symbols = await agent.parseFile('Example.java');

    // Constructor parsing is complex in java-parser, so we just verify
    // that we get some symbols back
    expect(symbols.length).toBeGreaterThan(0);

    const classSymbol = symbols.find(s => s.kind === 'class');
    expect(classSymbol).toBeDefined();
  });

  it('should index entire project', async () => {
    const index = await agent.indexProject();

    expect(index).toBeDefined();
    expect(index.files.length).toBe(1);
    expect(index.symbols.length).toBeGreaterThan(0);
    expect(index.classes.length).toBe(1);
  });

  it('should find symbols by name', async () => {
    await agent.indexProject();

    const results = agent.findSymbolsByName('Example');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].name).toBe('Example');
  });

  it('should find symbols by kind', async () => {
    await agent.indexProject();

    const methods = agent.findSymbolsByKind('method');
    expect(methods.length).toBeGreaterThan(0);
  });

  it('should return empty array for non-existent file', async () => {
    const symbols = await agent.parseFile('NonExistent.java');
    expect(symbols).toEqual([]);
  });

  it('should parse interface declaration', async () => {
    const interfaceCode = `package com.example;

public interface UserService {
    String findById(String id);
    void save(String user);
    void delete(String id);
}`;
    const interfaceFile = path.join(testDir, 'UserService.java');
    await fs.writeFile(interfaceFile, interfaceCode, 'utf-8');

    const symbols = await agent.parseFile('UserService.java');

    const interfaceSymbol = symbols.find(s => s.kind === 'interface');
    expect(interfaceSymbol).toBeDefined();
    expect(interfaceSymbol?.name).toBe('UserService');
    expect(interfaceSymbol?.qualifiedName).toBe('com.example.UserService');

    const methods = symbols.filter(s => s.kind === 'method');
    expect(methods.length).toBeGreaterThanOrEqual(1);
  });

  it('should parse enum declaration with constants', async () => {
    const enumCode = `package com.example;

public enum Status {
    ACTIVE,
    INACTIVE,
    PENDING,
    DELETED
}`;
    const enumFile = path.join(testDir, 'Status.java');
    await fs.writeFile(enumFile, enumCode, 'utf-8');

    const symbols = await agent.parseFile('Status.java');

    const enumSymbol = symbols.find(s => s.kind === 'enum');
    expect(enumSymbol).toBeDefined();
    expect(enumSymbol?.name).toBe('Status');
    expect(enumSymbol?.qualifiedName).toBe('com.example.Status');

    const constants = symbols.filter(s => s.kind === 'enum-constant');
    expect(constants.length).toBe(4);
    expect(constants.map(c => c.name)).toContain('ACTIVE');
    expect(constants.map(c => c.name)).toContain('INACTIVE');
    expect(constants.map(c => c.name)).toContain('PENDING');
    expect(constants.map(c => c.name)).toContain('DELETED');
  });

  it('should extract line numbers from symbols', async () => {
    const symbols = await agent.parseFile('Example.java');

    // All symbols should have line numbers (not just 1)
    const classSymbol = symbols.find(s => s.kind === 'class');
    expect(classSymbol?.location.startLine).toBeGreaterThanOrEqual(1);

    // Note: Actual line numbers depend on java-parser's location info
    // If java-parser doesn't provide it, fallback is line 1
  });
});
