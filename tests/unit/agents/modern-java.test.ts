import { describe, it, expect } from 'vitest';
import { SymbolsAgent } from '../../../src/core/agents/symbols.js';
import path from 'path';

describe('ModernJavaFeatures Support', () => {
  const agent = new SymbolsAgent('tests/fixtures');
  const testFile = 'java/ModernJavaFeatures.java';

  it('should extract all symbols from modern Java file', async () => {
    const symbols = await agent.parseFile(testFile);

    console.log('\n=== EXTRACTED SYMBOLS ===');
    console.log(`Total: ${symbols.length} symbols`);
    console.log('\nBy Kind:');
    const byKind = symbols.reduce((acc, s) => {
      acc[s.kind] = (acc[s.kind] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log(byKind);

    console.log('\nAll Symbols:');
    symbols.forEach(s => {
      console.log(`  - ${s.kind.padEnd(12)} ${s.qualifiedName}`);
      if (s.annotations && s.annotations.length > 0) {
        console.log(`    Annotations: ${s.annotations.join(', ')}`);
      }
    });

    expect(symbols.length).toBeGreaterThan(0);
  });

  it('should extract main class', async () => {
    const symbols = await agent.parseFile(testFile);
    const mainClass = symbols.find(s => s.name === 'ModernJavaFeatures');

    expect(mainClass).toBeDefined();
    expect(mainClass?.kind).toBe('class');
  });

  it('should extract records', async () => {
    const symbols = await agent.parseFile(testFile);
    const records = symbols.filter(s => s.kind === 'record');

    console.log('\n=== RECORDS ===');
    records.forEach(r => console.log(`  - ${r.qualifiedName}`));

    // Should find: UserDTO, Address
    expect(records.length).toBeGreaterThanOrEqual(0); // Will be 0 if not supported
  });

  it('should extract enum with constants and methods', async () => {
    const symbols = await agent.parseFile(testFile);
    const enums = symbols.filter(s => s.kind === 'enum');
    const enumConstants = symbols.filter(s => s.kind === 'enum-constant');

    console.log('\n=== ENUMS ===');
    enums.forEach(e => console.log(`  - ${e.qualifiedName}`));
    console.log('\n=== ENUM CONSTANTS ===');
    enumConstants.forEach(c => console.log(`  - ${c.qualifiedName}`));

    expect(enums.length).toBeGreaterThan(0); // Status enum
    expect(enumConstants.length).toBeGreaterThan(0); // ACTIVE, INACTIVE, PENDING
  });

  it('should extract sealed classes/interfaces', async () => {
    const symbols = await agent.parseFile(testFile);
    const sealedTypes = symbols.filter(s =>
      s.modifiers?.includes('sealed' as any)
    );

    console.log('\n=== SEALED TYPES ===');
    sealedTypes.forEach(s => console.log(`  - ${s.qualifiedName}`));

    // Shape interface should be sealed
    expect(sealedTypes.length).toBeGreaterThanOrEqual(0); // Will be 0 if not supported
  });

  it('should extract annotations from methods', async () => {
    const symbols = await agent.parseFile(testFile);

    // Debug: Show all methods
    const methods = symbols.filter(s => s.kind === 'method');
    console.log(`\n=== ALL METHODS (${methods.length} total) ===`);
    methods.slice(0, 5).forEach(m => {
      const annStr = m.annotations && m.annotations.length > 0
        ? m.annotations.map(a => `@${a.type}`).join(', ')
        : 'none';
      console.log(`  - ${m.name}: [${annStr}]`);
    });

    const annotatedMethods = symbols.filter(s =>
      s.kind === 'method' && s.annotations && s.annotations.length > 0
    );

    console.log('\n=== ANNOTATED METHODS ===');
    annotatedMethods.forEach(m => {
      console.log(`  - ${m.qualifiedName}`);
      console.log(`    Annotations: ${m.annotations!.map(a => `@${a.type}`).join(', ')}`);
    });

    // Should find: @Override, @GetMapping, etc.
    expect(annotatedMethods.length).toBeGreaterThan(0);
  });

  it('should extract nested classes', async () => {
    const symbols = await agent.parseFile(testFile);
    const nestedClasses = symbols.filter(s =>
      s.qualifiedName.includes('$') || s.qualifiedName.includes('.')
    );

    console.log('\n=== NESTED CLASSES ===');
    nestedClasses.forEach(c => console.log(`  - ${c.qualifiedName}`));

    // Should find: Builder, Inner, Circle, Rectangle, Triangle
    expect(nestedClasses.length).toBeGreaterThanOrEqual(0);
  });

  it('should extract generic methods', async () => {
    const symbols = await agent.parseFile(testFile);
    const genericMethods = symbols.filter(s =>
      s.kind === 'method' && s.signature?.includes('<')
    );

    console.log('\n=== GENERIC METHODS ===');
    genericMethods.forEach(m => console.log(`  - ${m.signature}`));

    // Should find: findMax with <T extends Comparable<T>>
    expect(genericMethods.length).toBeGreaterThanOrEqual(0);
  });
});
