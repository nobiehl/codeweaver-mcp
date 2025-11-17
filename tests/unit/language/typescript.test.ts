/**
 * Tests for TypeScript Language Plugin
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TypeScriptLanguagePlugin, JavaScriptLanguagePlugin } from '../../../src/core/language/plugins/typescript/index.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TypeScriptLanguagePlugin', () => {
  let plugin: TypeScriptLanguagePlugin;

  beforeEach(() => {
    plugin = new TypeScriptLanguagePlugin();
  });

  describe('Metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.metadata.language).toBe('typescript');
      expect(plugin.metadata.displayName).toBe('TypeScript');
      expect(plugin.metadata.fileExtensions).toContain('.ts');
      expect(plugin.metadata.fileExtensions).toContain('.tsx');
      expect(plugin.metadata.supportsGenerics).toBe(true);
      expect(plugin.metadata.supportsDecorators).toBe(true);
      expect(plugin.metadata.supportsClasses).toBe(true);
    });

    it('should handle TypeScript file extensions', () => {
      expect(plugin.canHandle('test.ts')).toBe(true);
      expect(plugin.canHandle('test.tsx')).toBe(true);
      expect(plugin.canHandle('test.mts')).toBe(true);
      expect(plugin.canHandle('test.cts')).toBe(true);
      expect(plugin.canHandle('test.js')).toBe(false);
      expect(plugin.canHandle('test.java')).toBe(false);
    });
  });

  describe('Simple TypeScript Fixture', () => {
    let source: string;
    const fixturePath = path.resolve(__dirname, '../../fixtures/typescript/simple.ts');

    beforeEach(async () => {
      source = await fs.readFile(fixturePath, 'utf-8');
    });

    it('should parse simple TypeScript file', async () => {
      const result = await plugin.parse(source, fixturePath);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    it('should extract all symbols from simple TypeScript file', async () => {
      const result = await plugin.parse(source, fixturePath);
      expect(result.success).toBe(true);

      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      // Count symbols by kind
      const byKind = symbols.reduce((acc, s) => {
        acc[s.kind] = (acc[s.kind] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Should have:
      // - 1 interface (User)
      // - 1 type (UserId)
      // - 1 enum (Status)
      // - 3 enum constants (Active, Inactive, Pending)
      // - 1 class (UserService)
      // - 1 field (users)
      // - 1 constructor
      // - 2 methods (getUser, validateEmail)
      // - 3 functions (formatUser, isAdult, fetchUsers)

      expect(symbols.length).toBeGreaterThanOrEqual(10);
      expect(byKind['interface']).toBe(1);
      expect(byKind['type']).toBe(1);
      expect(byKind['enum']).toBe(1);
      expect(byKind['enum-constant']).toBe(3);
      expect(byKind['class']).toBe(1);
      expect(byKind['function']).toBeGreaterThanOrEqual(3);
    });

    it('should extract interface correctly', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const userInterface = symbols.find(s => s.name === 'User' && s.kind === 'interface');
      expect(userInterface).toBeDefined();
      expect(userInterface?.qualifiedName).toBe('User');

      // Interface should have properties
      const interfaceMembers = symbols.filter(s => s.qualifiedName.startsWith('User#'));
      expect(interfaceMembers.length).toBeGreaterThanOrEqual(2); // id, name, email (optional)
    });

    it('should extract type alias correctly', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const userIdType = symbols.find(s => s.name === 'UserId' && s.kind === 'type');
      expect(userIdType).toBeDefined();
      expect(userIdType?.signature).toContain('type UserId');
    });

    it('should extract enum with constants', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const statusEnum = symbols.find(s => s.name === 'Status' && s.kind === 'enum');
      expect(statusEnum).toBeDefined();

      const enumConstants = symbols.filter(s => s.kind === 'enum-constant' && s.qualifiedName.startsWith('Status#'));
      expect(enumConstants).toHaveLength(3);
      expect(enumConstants.map(c => c.name)).toContain('Active');
      expect(enumConstants.map(c => c.name)).toContain('Inactive');
      expect(enumConstants.map(c => c.name)).toContain('Pending');
    });

    it('should extract class with members', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const userServiceClass = symbols.find(s => s.name === 'UserService' && s.kind === 'class');
      expect(userServiceClass).toBeDefined();

      // Class should have constructor
      const constructor = symbols.find(s => s.qualifiedName === 'UserService#constructor');
      expect(constructor).toBeDefined();

      // Class should have methods
      const getUserMethod = symbols.find(s => s.name === 'getUser' && s.qualifiedName.startsWith('UserService#'));
      expect(getUserMethod).toBeDefined();
      expect(getUserMethod?.kind).toBe('method');
      expect(getUserMethod?.modifiers).toContain('async');

      const validateMethod = symbols.find(s => s.name === 'validateEmail');
      expect(validateMethod).toBeDefined();
      expect(validateMethod?.modifiers).toContain('static');
    });

    it('should extract functions', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const formatUserFn = symbols.find(s => s.name === 'formatUser' && s.kind === 'function');
      expect(formatUserFn).toBeDefined();
      expect(formatUserFn?.parameters).toHaveLength(1);
      expect(formatUserFn?.parameters?.[0].name).toBe('user');

      const isAdultFn = symbols.find(s => s.name === 'isAdult' && s.kind === 'function');
      expect(isAdultFn).toBeDefined();

      const fetchUsersFn = symbols.find(s => s.name === 'fetchUsers' && s.kind === 'function');
      expect(fetchUsersFn).toBeDefined();
      expect(fetchUsersFn?.modifiers).toContain('async');
    });
  });

  describe('Complex TypeScript Fixture (TSX)', () => {
    let source: string;
    const fixturePath = path.resolve(__dirname, '../../fixtures/typescript/complex.tsx');

    beforeEach(async () => {
      source = await fs.readFile(fixturePath, 'utf-8');
    });

    it('should parse TSX file with JSX', async () => {
      const result = await plugin.parse(source, fixturePath);

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.ast).toBeDefined();
    });

    it('should extract generic interface', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const repository = symbols.find(s => s.name === 'Repository' && s.kind === 'interface');
      expect(repository).toBeDefined();

      // Should have methods
      const findByIdMethod = symbols.find(s => s.name === 'findById' && s.qualifiedName.startsWith('Repository#'));
      expect(findByIdMethod).toBeDefined();
    });

    it('should extract abstract class', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const baseService = symbols.find(s => s.name === 'BaseService' && s.kind === 'class');
      expect(baseService).toBeDefined();
      expect(baseService?.modifiers).toContain('abstract');

      // Should have at least one method (getById)
      const getByIdMethod = symbols.find(s => s.name === 'getById' && s.qualifiedName.startsWith('BaseService#'));
      expect(getByIdMethod).toBeDefined();
      expect(getByIdMethod?.modifiers).toContain('async');

      // Note: Abstract method signatures without implementation may not be extracted yet
      // This is a future enhancement
    });

    it('should extract class with decorators', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const todoComponent = symbols.find(s => s.name === 'TodoComponent' && s.kind === 'class');
      expect(todoComponent).toBeDefined();
      expect(todoComponent?.annotations).toBeDefined();
      expect(todoComponent?.annotations?.length).toBeGreaterThan(0);

      // Check for decorated property
      const serviceProperty = symbols.find(s => s.name === 'service' && s.qualifiedName.startsWith('TodoComponent#'));
      expect(serviceProperty).toBeDefined();
      // Note: decorators on properties may not be extracted depending on implementation
    });

    it('should extract class inheritance', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const todoService = symbols.find(s => s.name === 'TodoService' && s.kind === 'class');
      expect(todoService).toBeDefined();

      // Should have methods from base class and own methods
      const toggleMethod = symbols.find(s => s.name === 'toggle' && s.qualifiedName.startsWith('TodoService#'));
      expect(toggleMethod).toBeDefined();
    });

    it('should extract generic functions', async () => {
      const result = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(result.ast, fixturePath);

      const toArrayFn = symbols.find(s => s.name === 'toArray' && s.kind === 'function');
      expect(toArrayFn).toBeDefined();
      expect(toArrayFn?.parameters).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const invalidSource = 'class Foo { invalid syntax }}}';
      const result = await plugin.parse(invalidSource, 'test.ts');

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].severity).toBe('error');
    });

    it('should validate source code', async () => {
      const validSource = 'export class Foo { }';
      const errors = await plugin.validate(validSource, 'test.ts');
      expect(errors).toHaveLength(0);

      const invalidSource = 'class Foo { invalid }}}';
      const errors2 = await plugin.validate(invalidSource, 'test.ts');
      expect(errors2.length).toBeGreaterThan(0);
    });
  });
});

describe('JavaScriptLanguagePlugin', () => {
  let plugin: JavaScriptLanguagePlugin;

  beforeEach(() => {
    plugin = new JavaScriptLanguagePlugin();
  });

  describe('Metadata', () => {
    it('should have correct metadata', () => {
      expect(plugin.metadata.language).toBe('javascript');
      expect(plugin.metadata.displayName).toBe('JavaScript');
      expect(plugin.metadata.fileExtensions).toContain('.js');
      expect(plugin.metadata.fileExtensions).toContain('.jsx');
      expect(plugin.metadata.supportsGenerics).toBe(false); // JS doesn't have generics
      expect(plugin.metadata.supportsClasses).toBe(true);
    });

    it('should handle JavaScript file extensions', () => {
      expect(plugin.canHandle('test.js')).toBe(true);
      expect(plugin.canHandle('test.jsx')).toBe(true);
      expect(plugin.canHandle('test.mjs')).toBe(true);
      expect(plugin.canHandle('test.cjs')).toBe(true);
      expect(plugin.canHandle('test.ts')).toBe(false);
      expect(plugin.canHandle('test.java')).toBe(false);
    });
  });

  describe('JavaScript Parsing', () => {
    it('should parse simple JavaScript class', async () => {
      const source = `
        export class Calculator {
          add(a, b) {
            return a + b;
          }
        }
      `;

      const result = await plugin.parse(source, 'test.js');
      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();

      const symbols = await plugin.extractSymbols(result.ast, 'test.js');
      const calcClass = symbols.find(s => s.name === 'Calculator' && s.kind === 'class');
      expect(calcClass).toBeDefined();

      const addMethod = symbols.find(s => s.name === 'add' && s.kind === 'method');
      expect(addMethod).toBeDefined();
    });

    it('should parse arrow functions', async () => {
      const source = `
        export const double = (x) => x * 2;
        export const greet = (name) => {
          return \`Hello, \${name}\`;
        };
      `;

      const result = await plugin.parse(source, 'test.js');
      expect(result.success).toBe(true);

      const symbols = await plugin.extractSymbols(result.ast, 'test.js');
      const doubleFn = symbols.find(s => s.name === 'double');
      expect(doubleFn).toBeDefined();
      expect(doubleFn?.kind).toBe('function');

      const greetFn = symbols.find(s => s.name === 'greet');
      expect(greetFn).toBeDefined();
    });
  });
});
