/**
 * Tests for Python Language Plugin
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { PythonLanguagePlugin } from '../../../src/core/language/plugins/python/index.js';
import { Parser } from 'web-tree-sitter';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('PythonLanguagePlugin', () => {
  // Initialize Parser ONCE before all tests
  beforeAll(async () => {
    await Parser.init();
  });

  describe('Metadata', () => {
    it('should have correct metadata', () => {
      const plugin = new PythonLanguagePlugin();

      expect(plugin.metadata.language).toBe('python');
      expect(plugin.metadata.displayName).toBe('Python');
      expect(plugin.metadata.fileExtensions).toContain('.py');
      expect(plugin.metadata.fileExtensions).toContain('.pyi');
      expect(plugin.metadata.fileExtensions).toContain('.pyw');
      expect(plugin.metadata.supportsGenerics).toBe(true);
      expect(plugin.metadata.supportsDecorators).toBe(true);
      expect(plugin.metadata.supportsClasses).toBe(true);
      expect(plugin.metadata.supportsFunctions).toBe(true);
    });
  });

  describe('Simple Python Parsing', () => {
    it('should parse simple Python file', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/simple.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const result = await plugin.parse(source, fixturePath);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should extract class from simple Python file', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/simple.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find Calculator class
      const classSymbol = symbols.find(s => s.kind === 'class' && s.name === 'Calculator');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.qualifiedName).toBe('Calculator');
      expect(classSymbol?.language).toBe('python');
    });

    it('should extract methods from class', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/simple.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find add and subtract methods
      const addMethod = symbols.find(s => s.kind === 'method' && s.name === 'add');
      const subtractMethod = symbols.find(s => s.kind === 'method' && s.name === 'subtract');

      expect(addMethod).toBeDefined();
      expect(addMethod?.qualifiedName).toBe('Calculator#add');
      expect(addMethod?.parameters).toHaveLength(3); // self, a, b

      expect(subtractMethod).toBeDefined();
      expect(subtractMethod?.qualifiedName).toBe('Calculator#subtract');
    });

    it('should extract module-level function', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/simple.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find greet function
      const greetFunc = symbols.find(s => s.kind === 'function' && s.name === 'greet');
      expect(greetFunc).toBeDefined();
      expect(greetFunc?.qualifiedName).toBe('greet');
      expect(greetFunc?.parameters).toHaveLength(1); // name
    });
  });

  describe('Complex Python Features', () => {
    it('should parse complex Python file', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const result = await plugin.parse(source, fixturePath);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
    });

    it('should extract dataclass', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find User dataclass
      const userClass = symbols.find(s => s.kind === 'class' && s.name === 'User');
      expect(userClass).toBeDefined();
      expect(userClass?.language).toBe('python');

      // Should have @dataclass decorator
      // Note: decorators are on decorated_definition parent, not on class itself in AST
    });

    it('should extract abstract class', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find UserService abstract class
      const serviceClass = symbols.find(s => s.kind === 'class' && s.name === 'UserService');
      expect(serviceClass).toBeDefined();
    });

    it('should extract class with inheritance', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find DatabaseUserService class
      const dbServiceClass = symbols.find(s => s.kind === 'class' && s.name === 'DatabaseUserService');
      expect(dbServiceClass).toBeDefined();
    });

    it('should extract constructor method', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find __init__ as constructor
      const constructor = symbols.find(s => s.kind === 'constructor' && s.name === '__init__');
      expect(constructor).toBeDefined();
      expect(constructor?.qualifiedName).toContain('DatabaseUserService#__init__');
    });

    it('should extract async methods', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find async get_user method
      const getUserMethod = symbols.find(s => s.kind === 'method' && s.name === 'get_user');
      expect(getUserMethod).toBeDefined();
      expect(getUserMethod?.modifiers).toContain('async');
    });

    it('should extract static method', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find hash_password static method
      const staticMethod = symbols.find(s => s.name === 'hash_password');
      expect(staticMethod).toBeDefined();
      expect(staticMethod?.annotations.some(a => a.type === 'staticmethod')).toBe(true);
      expect(staticMethod?.modifiers).toContain('static');
    });

    it('should extract class method', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find from_config class method
      const classMethod = symbols.find(s => s.name === 'from_config');
      expect(classMethod).toBeDefined();
      expect(classMethod?.annotations.some(a => a.type === 'classmethod')).toBe(true);
      expect(classMethod?.modifiers).toContain('classmethod');
    });

    it('should detect private methods', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // __connect_to_database should be private
      const privateMethod = symbols.find(s => s.name === '__connect_to_database');
      expect(privateMethod).toBeDefined();
      expect(privateMethod?.visibility).toBe('private');
    });

    it('should detect protected methods', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // _validate_email should be protected
      const protectedMethod = symbols.find(s => s.name === '_validate_email');
      expect(protectedMethod).toBeDefined();
      expect(protectedMethod?.visibility).toBe('protected');
    });

    it('should extract function with decorator', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find create_user_account with @validate_username decorator
      const decoratedFunc = symbols.find(s => s.name === 'create_user_account');
      expect(decoratedFunc).toBeDefined();
      expect(decoratedFunc?.annotations).toHaveLength(1);
      expect(decoratedFunc?.annotations[0].type).toBe('validate_username');
    });

    it('should extract async function', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should find async_fetch_users async function
      const asyncFunc = symbols.find(s => s.name === 'async_fetch_users');
      expect(asyncFunc).toBeDefined();
      expect(asyncFunc?.modifiers).toContain('async');
    });

    it('should set language field on all symbols', async () => {
      const plugin = new PythonLanguagePlugin();
      const fixturePath = path.resolve(__dirname, '../../fixtures/python/user_service.py');
      const source = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(source, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // All symbols should have language = 'python'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('python');
      }
    });
  });
});
