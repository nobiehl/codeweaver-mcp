/**
 * Multi-Language Integration Tests
 *
 * Tests that Java and TypeScript work together in the same project.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SymbolsAgent } from '../../src/core/agents/symbols.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Multi-Language Integration', () => {
  describe('SymbolsAgent with Java, TypeScript, Markdown, and Python', () => {
    it('should support multiple languages in registry', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      expect(registry.hasPlugin('java')).toBe(true);
      expect(registry.hasPlugin('typescript')).toBe(true);
      expect(registry.hasPlugin('javascript')).toBe(true);
      expect(registry.hasPlugin('markdown')).toBe(true);
      expect(registry.hasPlugin('python')).toBe(true);

      const languages = registry.getSupportedLanguages();
      expect(languages).toContain('java');
      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('markdown');
      expect(languages).toContain('python');
    });

    it('should detect correct plugin for Java files', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const plugin = registry.getPluginForFile('Example.java');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.language).toBe('java');
    });

    it('should detect correct plugin for TypeScript files', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const tsPlugin = registry.getPluginForFile('App.ts');
      expect(tsPlugin).toBeDefined();
      expect(tsPlugin?.metadata.language).toBe('typescript');

      const tsxPlugin = registry.getPluginForFile('Component.tsx');
      expect(tsxPlugin).toBeDefined();
      expect(tsxPlugin?.metadata.language).toBe('typescript');
    });

    it('should detect correct plugin for JavaScript files', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const jsPlugin = registry.getPluginForFile('app.js');
      expect(jsPlugin).toBeDefined();
      expect(jsPlugin?.metadata.language).toBe('javascript');
    });

    it('should detect correct plugin for Python files', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const pyPlugin = registry.getPluginForFile('app.py');
      expect(pyPlugin).toBeDefined();
      expect(pyPlugin?.metadata.language).toBe('python');

      const pyiPlugin = registry.getPluginForFile('types.pyi');
      expect(pyiPlugin).toBeDefined();
      expect(pyiPlugin?.metadata.language).toBe('python');
    });

    it('should extract symbols from Java file with language field', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('java/ModernJavaFeatures.java');

      expect(symbols.length).toBeGreaterThan(0);

      // All symbols should have language field set to 'java'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('java');
      }

      const classSymbol = symbols.find(s => s.kind === 'class');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.language).toBe('java');
    });

    it('should extract symbols from TypeScript file with language field', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('typescript/simple.ts');

      expect(symbols.length).toBeGreaterThan(0);

      // All symbols should have language field set to 'typescript'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('typescript');
      }

      const interfaceSymbol = symbols.find(s => s.kind === 'interface');
      expect(interfaceSymbol).toBeDefined();
      expect(interfaceSymbol?.language).toBe('typescript');
    });

    it('should extract symbols from Python file with language field', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('python/simple.py');

      expect(symbols.length).toBeGreaterThan(0);

      // All symbols should have language field set to 'python'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('python');
      }

      const classSymbol = symbols.find(s => s.kind === 'class');
      expect(classSymbol).toBeDefined();
      expect(classSymbol?.language).toBe('python');
    });

    it('should filter files by supported languages', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const files = [
        'Example.java',
        'App.ts',
        'Component.tsx',
        'app.js',
        'README.md',
        'app.py',
        'config.json',
      ];

      const supported = registry.filterSupportedFiles(files);
      expect(supported).toHaveLength(6);
      expect(supported).toContain('Example.java');
      expect(supported).toContain('App.ts');
      expect(supported).toContain('Component.tsx');
      expect(supported).toContain('app.js');
      expect(supported).toContain('README.md');
      expect(supported).toContain('app.py');
      expect(supported).not.toContain('config.json');
    });

    it('should group files by language', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const files = [
        'A.java',
        'B.ts',
        'C.java',
        'D.tsx',
        'E.js',
        'F.jsx',
        'README.md',
        'app.py',
        'types.pyi',
      ];

      const grouped = registry.groupFilesByLanguage(files);

      expect(grouped.size).toBe(5);
      expect(grouped.get('java')).toEqual(['A.java', 'C.java']);
      expect(grouped.get('typescript')).toEqual(['B.ts', 'D.tsx']);
      expect(grouped.get('javascript')).toEqual(['E.js', 'F.jsx']);
      expect(grouped.get('markdown')).toEqual(['README.md']);
      expect(grouped.get('python')).toEqual(['app.py', 'types.pyi']);
      expect(grouped.has('unknown')).toBe(false);
    });

    it('should get stats by language', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));

      // Parse Java file
      const javaSymbols = await agent.parseFile('java/ModernJavaFeatures.java');

      // Parse TypeScript file
      const tsSymbols = await agent.parseFile('typescript/simple.ts');

      // Check that we got symbols from both
      expect(javaSymbols.length).toBeGreaterThan(0);
      expect(tsSymbols.length).toBeGreaterThan(0);

      const javaLanguages = new Set(javaSymbols.map(s => s.language));
      const tsLanguages = new Set(tsSymbols.map(s => s.language));

      expect(javaLanguages.has('java')).toBe(true);
      expect(tsLanguages.has('typescript')).toBe(true);
    });
  });

  describe('Symbol Language Field Verification', () => {
    it('should set language field correctly for Java symbols', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('java/ModernJavaFeatures.java');

      expect(symbols.length).toBeGreaterThan(0);

      // Verify ALL symbols have language = 'java'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('java');
      }
    });

    it('should set language field correctly for TypeScript symbols', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('typescript/simple.ts');

      expect(symbols.length).toBeGreaterThan(0);

      // Verify ALL symbols have language = 'typescript'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('typescript');
      }
    });

    it('should extract different symbol kinds from different languages', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));

      const javaSymbols = await agent.parseFile('java/ModernJavaFeatures.java');
      const tsSymbols = await agent.parseFile('typescript/simple.ts');

      // Java should have classes
      const javaClasses = javaSymbols.filter(s => s.kind === 'class');
      expect(javaClasses.length).toBeGreaterThan(0);

      // TypeScript should have interfaces and types
      const tsInterfaces = tsSymbols.filter(s => s.kind === 'interface');
      const tsTypes = tsSymbols.filter(s => s.kind === 'type');

      expect(tsInterfaces.length).toBeGreaterThan(0);
      expect(tsTypes.length).toBeGreaterThan(0);
    });
  });

  describe('Markdown Support', () => {
    it('should detect Markdown files', () => {
      const agent = new SymbolsAgent();
      const registry = agent.getRegistry();

      const plugin = registry.getPluginForFile('README.md');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.language).toBe('markdown');
    });

    it('should extract symbols from Markdown file with language field', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('markdown/README.md');

      expect(symbols.length).toBeGreaterThan(0);

      // All symbols should have language field set to 'markdown'
      for (const symbol of symbols) {
        expect(symbol.language).toBe('markdown');
      }

      // Should have sections (headers)
      const sections = symbols.filter(s => s.kind === 'section');
      expect(sections.length).toBeGreaterThan(0);

      // Should have references (local links)
      const references = symbols.filter(s => s.kind === 'reference');
      expect(references.length).toBeGreaterThan(0);

      // Should have code blocks
      const codeBlocks = symbols.filter(s => s.kind === 'code-block');
      expect(codeBlocks.length).toBeGreaterThan(0);
    });

    it('should extract different symbol kinds from Markdown', async () => {
      const agent = new SymbolsAgent(path.resolve(__dirname, '../fixtures'));
      const symbols = await agent.parseFile('markdown/simple.md');

      // Markdown should have sections
      const sections = symbols.filter(s => s.kind === 'section');
      expect(sections.length).toBeGreaterThan(0);

      // Markdown should have references (local links)
      const references = symbols.filter(s => s.kind === 'reference');
      expect(references.length).toBeGreaterThan(0);

      // Markdown should have code blocks
      const codeBlocks = symbols.filter(s => s.kind === 'code-block');
      expect(codeBlocks.length).toBeGreaterThan(0);
    });
  });
});
