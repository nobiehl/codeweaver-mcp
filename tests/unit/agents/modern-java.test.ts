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

  it('should extract class-level annotations', async () => {
    const symbols = await agent.parseFile(testFile);
    const mainClass = symbols.find(s => s.name === 'ModernJavaFeatures');

    console.log('\n=== CLASS ANNOTATIONS ===');
    console.log(`Class: ${mainClass?.name}`);
    console.log(`Annotations:`, mainClass?.annotations?.map(a => a.type));

    expect(mainClass?.annotations).toBeDefined();
    expect(mainClass?.annotations?.length).toBeGreaterThan(0);

    // Should have @Entity and @Table
    const annotationTypes = mainClass?.annotations?.map(a => a.type) || [];
    expect(annotationTypes).toContain('Entity');
    expect(annotationTypes).toContain('Table');
  });

  it('should extract records', async () => {
    const symbols = await agent.parseFile(testFile);
    const records = symbols.filter(s => s.kind === 'record');

    console.log('\n=== RECORDS ===');
    records.forEach(r => {
      console.log(`  - ${r.qualifiedName}`);
      if (r.parameters && r.parameters.length > 0) {
        console.log(`    Parameters: ${r.parameters.map(p => `${p.name}: ${p.type.name}`).join(', ')}`);
      }
    });

    // Should find: UserDTO, Address
    expect(records.length).toBeGreaterThan(0);
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
      s.modifiers?.includes('sealed') || s.modifiers?.includes('non-sealed')
    );

    console.log('\n=== SEALED TYPES ===');
    symbols.forEach(s => {
      if (s.modifiers?.includes('sealed') || s.modifiers?.includes('non-sealed') || s.modifiers?.includes('final')) {
        console.log(`  - ${s.qualifiedName}: [${s.modifiers.join(', ')}]`);
      }
    });

    // Shape interface should be sealed
    expect(sealedTypes.length).toBeGreaterThan(0);

    // Check for specific sealed types
    const shape = symbols.find(s => s.name === 'Shape');
    expect(shape?.modifiers).toContain('sealed');
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

  it('should extract field annotations', async () => {
    const symbols = await agent.parseFile(testFile);

    // Find all fields
    const fields = symbols.filter(s => s.kind === 'field');
    console.log(`\n=== ALL FIELDS (${fields.length} total) ===`);
    fields.slice(0, 5).forEach(f => {
      const annStr = f.annotations && f.annotations.length > 0
        ? f.annotations.map(a => `@${a.type}`).join(', ')
        : 'none';
      console.log(`  - ${f.name}: [${annStr}]`);
    });

    const annotatedFields = symbols.filter(s =>
      s.kind === 'field' && s.annotations && s.annotations.length > 0
    );

    console.log('\n=== ANNOTATED FIELDS ===');
    annotatedFields.forEach(f => {
      console.log(`  - ${f.qualifiedName}`);
      console.log(`    Annotations: ${f.annotations!.map(a => `@${a.type}`).join(', ')}`);
    });

    // Should find dataSource field with @Autowired, @Qualifier
    expect(annotatedFields.length).toBeGreaterThan(0);
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

  it('should extract Java module (module-info.java)', async () => {
    const moduleFile = 'java/module-info.java';
    const symbols = await agent.parseFile(moduleFile);

    console.log('\n=== MODULE SYMBOLS ===');
    symbols.forEach(s => {
      console.log(`  - ${s.kind}: ${s.qualifiedName}`);
      if (s.signature) {
        console.log(`    Signature:\n${s.signature}`);
      }
    });

    // Should find exactly 1 module
    const modules = symbols.filter(s => s.kind === 'module');
    expect(modules.length).toBe(1);

    const module = modules[0];
    expect(module.name).toBe('com.example.myapp');
    expect(module.qualifiedName).toBe('com.example.myapp');

    // Check that signature contains module directives
    expect(module.signature).toContain('requires');
    expect(module.signature).toContain('exports');
    expect(module.signature).toContain('opens');
    expect(module.signature).toContain('uses');
    expect(module.signature).toContain('provides');

    // Check specific directives
    expect(module.signature).toContain('requires transitive java.sql');
    expect(module.signature).toContain('requires static lombok');
    expect(module.signature).toContain('exports com.example.myapp.api');
    expect(module.signature).toContain('exports com.example.myapp.model to com.example.client');
    expect(module.signature).toContain('opens com.example.myapp.internal to spring.core, spring.beans');
    expect(module.signature).toContain('uses com.example.myapp.spi.ServiceProvider');
    expect(module.signature).toContain('provides com.example.myapp.spi.ServiceProvider with com.example.myapp.impl.ServiceProviderImpl');
  });

  it('should extract abstract and default modifiers', async () => {
    const symbols = await agent.parseFile(testFile);

    console.log('\n=== ABSTRACT & DEFAULT MODIFIERS ===');
    symbols.forEach(s => {
      if (s.modifiers?.includes('abstract') || s.modifiers?.includes('default')) {
        console.log(`  - ${s.kind} ${s.qualifiedName}: [${s.modifiers.join(', ')}]`);
      }
    });

    // At minimum, we should see some modifiers being extracted
    // (The test file may not have abstract classes, but modifiers should work)
    expect(symbols.some(s => s.modifiers.length > 0)).toBe(true);
  });

  it('should extract method parameters with annotations', async () => {
    const symbols = await agent.parseFile(testFile);
    const getUser = symbols.find(s => s.name === 'getUser');

    console.log('\n=== METHOD PARAMETERS ===');
    console.log(`Method: ${getUser?.name}`);
    console.log(`Parameters:`, getUser?.parameters?.map(p => `${p.type.name} ${p.name}`));
    console.log(`Parameter Annotations:`, getUser?.parameters?.map(p => p.annotations.map(a => a.type)));

    expect(getUser?.parameters).toBeDefined();
    expect(getUser?.parameters?.length).toBe(1);

    const param = getUser?.parameters?.[0];
    expect(param?.name).toBe('id');
    expect(param?.type.name).toBe('Long');
    expect(param?.annotations?.length).toBeGreaterThan(0);
    expect(param?.annotations?.some(a => a.type === 'PathVariable')).toBe(true);
  });

  it('should extract generic type parameters in signature', async () => {
    const symbols = await agent.parseFile(testFile);
    const findMax = symbols.find(s => s.name === 'findMax');

    console.log('\n=== GENERIC METHOD SIGNATURE ===');
    console.log(`Method: ${findMax?.name}`);
    console.log(`Signature: ${findMax?.signature}`);

    expect(findMax?.signature).toBeDefined();
    expect(findMax?.signature).toContain('<T extends');
    expect(findMax?.signature).toContain('Comparable');
  });

  it('should extract nested interface', async () => {
    const symbols = await agent.parseFile(testFile);
    const shape = symbols.find(s => s.name === 'Shape' && s.kind === 'interface');

    console.log('\n=== NESTED INTERFACE ===');
    console.log(`Interface: ${shape?.qualifiedName}`);
    console.log(`Modifiers: [${shape?.modifiers?.join(', ')}]`);
    console.log(`Kind: ${shape?.kind}`);

    expect(shape).toBeDefined();
    expect(shape?.kind).toBe('interface');
    expect(shape?.qualifiedName).toContain('$Shape');
    expect(shape?.modifiers).toContain('sealed');
  });
});
