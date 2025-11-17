/**
 * Markdown Language Plugin Tests
 *
 * Tests Markdown parsing and symbol extraction:
 * - Headers as sections
 * - Links as references
 * - Code blocks as examples
 */

import { describe, it, expect } from 'vitest';
import { MarkdownLanguagePlugin } from '../../../src/core/language/plugins/markdown/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('MarkdownLanguagePlugin', () => {
  describe('Plugin Metadata', () => {
    it('should have correct metadata', () => {
      const plugin = new MarkdownLanguagePlugin();

      expect(plugin.metadata.language).toBe('markdown');
      expect(plugin.metadata.displayName).toBe('Markdown');
      expect(plugin.metadata.fileExtensions).toContain('.md');
      expect(plugin.metadata.fileExtensions).toContain('.markdown');
      expect(plugin.metadata.supportsClasses).toBe(false);
      expect(plugin.metadata.supportsFunctions).toBe(false);
    });
  });

  describe('Parsing', () => {
    it('should parse simple Markdown file', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'simple.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const result = await plugin.parse(content, fixturePath);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should parse complex README file', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'README.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const result = await plugin.parse(content, fixturePath);

      expect(result.success).toBe(true);
      expect(result.ast).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Symbol Extraction - Headers', () => {
    it('should extract headers as sections', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'simple.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Filter to only sections
      const sections = symbols.filter(s => s.kind === 'section');
      expect(sections.length).toBeGreaterThan(0);

      // Should have "Simple Document" as H1
      const h1 = sections.find(s => s.name === 'Simple Document');
      expect(h1).toBeDefined();
      expect(h1?.signature).toBe('# Simple Document');
      expect(h1?.language).toBe('markdown');

      // Should have "Section 1" as H2
      const section1 = sections.find(s => s.name === 'Section 1');
      expect(section1).toBeDefined();
      expect(section1?.signature).toBe('## Section 1');
    });

    it('should handle nested headers with hierarchy', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'simple.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const sections = symbols.filter(s => s.kind === 'section');

      // Should have nested subsection
      const subsection = sections.find(s => s.name === 'Subsection 1.1');
      expect(subsection).toBeDefined();
      expect(subsection?.signature).toBe('### Subsection 1.1');
    });

    it('should extract all headers from README', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'README.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const sections = symbols.filter(s => s.kind === 'section');

      // Should have main title
      const title = sections.find(s => s.name === 'CodeWeaver Documentation');
      expect(title).toBeDefined();

      // Should have Features section
      const features = sections.find(s => s.name === 'Features');
      expect(features).toBeDefined();

      // Should have nested subsections
      const coreFeatures = sections.find(s => s.name === 'Core Features');
      expect(coreFeatures).toBeDefined();

      const languageSupport = sections.find(s => s.name === 'Language Support');
      expect(languageSupport).toBeDefined();
    });
  });

  describe('Symbol Extraction - Links', () => {
    it('should extract local links as references', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'simple.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const references = symbols.filter(s => s.kind === 'reference');
      expect(references.length).toBeGreaterThan(0);

      // Should have link to README.md
      const readmeLink = references.find(s => s.signature.includes('./README.md'));
      expect(readmeLink).toBeDefined();
      expect(readmeLink?.language).toBe('markdown');
    });

    it('should NOT extract external HTTP links', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'simple.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const references = symbols.filter(s => s.kind === 'reference');

      // Should NOT have external link to Google
      const googleLink = references.find(s => s.signature.includes('https://google.com'));
      expect(googleLink).toBeUndefined();
    });

    it('should extract multiple links from README', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'README.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const references = symbols.filter(s => s.kind === 'reference');

      // Should have multiple local links
      expect(references.length).toBeGreaterThan(2);

      // Check for specific links
      const installLink = references.find(s => s.signature.includes('./installation.md'));
      expect(installLink).toBeDefined();

      const apiLink = references.find(s => s.signature.includes('./api/index.md'));
      expect(apiLink).toBeDefined();
    });
  });

  describe('Symbol Extraction - Code Blocks', () => {
    it('should extract code blocks with language tags', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'simple.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const codeBlocks = symbols.filter(s => s.kind === 'code-block');
      expect(codeBlocks.length).toBeGreaterThan(0);

      // Should have JavaScript code block
      const jsBlock = codeBlocks.find(s => s.name.includes('javascript'));
      expect(jsBlock).toBeDefined();
      expect(jsBlock?.language).toBe('markdown');
      expect(jsBlock?.annotations).toContainEqual({ type: 'language:javascript' });
    });

    it('should extract multiple code blocks from README', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'README.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      const codeBlocks = symbols.filter(s => s.kind === 'code-block');

      // Should have multiple code blocks
      expect(codeBlocks.length).toBeGreaterThanOrEqual(2);

      // Should have TypeScript block
      const tsBlock = codeBlocks.find(s => s.name.includes('typescript'));
      expect(tsBlock).toBeDefined();

      // Should have Java block
      const javaBlock = codeBlocks.find(s => s.name.includes('java'));
      expect(javaBlock).toBeDefined();
    });
  });

  describe('Symbol Language Field', () => {
    it('should tag all symbols with language=markdown', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'README.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // All symbols should have language field
      for (const symbol of symbols) {
        expect(symbol.language).toBe('markdown');
      }
    });
  });

  describe('Symbol Counts', () => {
    it('should extract correct number of symbols from README', async () => {
      const plugin = new MarkdownLanguagePlugin();
      const fixtureDir = path.resolve(__dirname, '../../fixtures/markdown');
      const fixturePath = path.join(fixtureDir, 'README.md');
      const content = await fs.readFile(fixturePath, 'utf-8');

      const parseResult = await plugin.parse(content, fixturePath);
      const symbols = await plugin.extractSymbols(parseResult.ast, fixturePath);

      // Should have sections, references, and code blocks
      expect(symbols.length).toBeGreaterThan(10);

      const sections = symbols.filter(s => s.kind === 'section');
      const references = symbols.filter(s => s.kind === 'reference');
      const codeBlocks = symbols.filter(s => s.kind === 'code-block');

      expect(sections.length).toBeGreaterThan(5);
      expect(references.length).toBeGreaterThan(2);
      expect(codeBlocks.length).toBeGreaterThan(1);
    });
  });
});
