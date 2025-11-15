import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JsonSymbolStore } from '../../../src/core/storage/json-symbol-store.js';
import fs from 'fs/promises';
import path from 'path';
import type { SymbolDefinition, Reference } from '../../../src/types/symbols.js';

describe('JsonSymbolStore', () => {
  let store: JsonSymbolStore;
  const testCacheDir = '.test-cache';

  beforeEach(() => {
    store = new JsonSymbolStore();
  });

  afterEach(async () => {
    try {
      await fs.rm(testCacheDir, { recursive: true, force: true });
    } catch {}
  });

  it('should add and retrieve symbol', () => {
    const symbol: SymbolDefinition = {
      id: 'com.example.MyClass',
      kind: 'class',
      name: 'MyClass',
      qualifiedName: 'com.example.MyClass',
      location: { path: 'MyClass.java', startLine: 1, startColumn: 0, endLine: 10, endColumn: 0 },
      modifiers: ['public'],
      annotations: [],
      visibility: 'public'
    };

    store.addSymbol(symbol);

    const retrieved = store.getSymbol('com.example.MyClass');
    expect(retrieved).toEqual(symbol);
  });

  it('should find symbols by kind', () => {
    const class1: SymbolDefinition = {
      id: 'Class1',
      kind: 'class',
      name: 'Class1',
      qualifiedName: 'Class1',
      location: { path: 'Class1.java', startLine: 1, startColumn: 0, endLine: 10, endColumn: 0 },
      modifiers: [],
      annotations: [],
      visibility: 'public'
    };

    const interface1: SymbolDefinition = {
      id: 'Interface1',
      kind: 'interface',
      name: 'Interface1',
      qualifiedName: 'Interface1',
      location: { path: 'Interface1.java', startLine: 1, startColumn: 0, endLine: 10, endColumn: 0 },
      modifiers: [],
      annotations: [],
      visibility: 'public'
    };

    store.addSymbol(class1);
    store.addSymbol(interface1);

    const classes = store.findByKind('class');
    expect(classes).toHaveLength(1);
    expect(classes[0].name).toBe('Class1');
  });

  it('should add and retrieve references', () => {
    const ref: Reference = {
      from: { path: 'Caller.java', startLine: 5, startColumn: 10, endLine: 5, endColumn: 20 },
      to: 'com.example.MyClass#myMethod',
      kind: 'call'
    };

    store.addReference(ref);

    const refs = store.getReferences('com.example.MyClass#myMethod');
    expect(refs).toHaveLength(1);
    expect(refs[0].kind).toBe('call');
  });

  it('should save and load from JSON Lines', async () => {
    const symbol: SymbolDefinition = {
      id: 'TestClass',
      kind: 'class',
      name: 'TestClass',
      qualifiedName: 'com.example.TestClass',
      location: { path: 'TestClass.java', startLine: 1, startColumn: 0, endLine: 10, endColumn: 0 },
      modifiers: ['public'],
      annotations: [],
      visibility: 'public'
    };

    const ref: Reference = {
      from: { path: 'Caller.java', startLine: 5, startColumn: 10, endLine: 5, endColumn: 20 },
      to: 'TestClass',
      kind: 'call'
    };

    store.addSymbol(symbol);
    store.addReference(ref);

    const filePath = path.join(testCacheDir, 'symbols.jsonl');
    await store.save(filePath);

    const newStore = new JsonSymbolStore();
    await newStore.load(filePath);

    expect(newStore.getSymbol('TestClass')).toEqual(symbol);
    expect(newStore.getReferences('TestClass')).toHaveLength(1);
  });

  it('should return empty array for unknown symbol references', () => {
    const refs = store.getReferences('UnknownSymbol');
    expect(refs).toEqual([]);
  });
});
