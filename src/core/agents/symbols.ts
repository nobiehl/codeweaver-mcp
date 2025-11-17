import fs from 'fs/promises';
import path from 'path';
import type { SymbolDefinition, SymbolKind } from '../../types/symbols.js';
import { LanguagePluginRegistry } from '../language/registry.js';
import { JavaLanguagePlugin } from '../language/plugins/java/index.js';
import { TypeScriptLanguagePlugin, JavaScriptLanguagePlugin } from '../language/plugins/typescript/index.js';
import { MarkdownLanguagePlugin } from '../language/plugins/markdown/index.js';
import { PythonLanguagePlugin } from '../language/plugins/python/index.js';
import { LanguageDetector } from '../language/detector.js';

/**
 * SymbolsAgent - Multi-Language Symbol Extraction
 *
 * Now supports multiple languages through plugin architecture.
 * Currently supports: Java, TypeScript, JavaScript, Markdown, Python
 *
 * Features:
 * - Parse source files and extract symbols (classes, methods, fields, constructors)
 * - Build symbol index for entire project
 * - Find symbols by name, kind, or qualified name
 * - Extract method signatures, field types, modifiers
 * - Multi-language support via plugin system
 */
export class SymbolsAgent {
  private projectRoot: string;
  private symbolIndex: Map<string, SymbolDefinition> = new Map();
  private registry: LanguagePluginRegistry;

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
    this.registry = new LanguagePluginRegistry();

    // Register default plugins
    this.registerDefaultPlugins();
  }

  /**
   * Register default language plugins
   */
  private registerDefaultPlugins(): void {
    // Register Java plugin
    this.registry.register('java', new JavaLanguagePlugin());

    // Register TypeScript plugin
    this.registry.register('typescript', new TypeScriptLanguagePlugin());

    // Register JavaScript plugin
    this.registry.register('javascript', new JavaScriptLanguagePlugin());

    // Register Markdown plugin
    this.registry.register('markdown', new MarkdownLanguagePlugin());

    // Register Python plugin
    this.registry.register('python', new PythonLanguagePlugin());
  }

  /**
   * Get the plugin registry (for advanced use cases)
   */
  getRegistry(): LanguagePluginRegistry {
    return this.registry;
  }

  /**
   * Parse a file and extract all symbols
   *
   * Automatically detects language from file extension and uses appropriate plugin.
   */
  async parseFile(filePath: string): Promise<SymbolDefinition[]> {
    const fullPath = path.join(this.projectRoot, filePath);

    try {
      // Detect language from file extension
      const plugin = this.registry.getPluginForFile(filePath);

      if (!plugin) {
        // Unsupported language - return empty array
        return [];
      }

      // Read file content
      const content = await fs.readFile(fullPath, 'utf-8');

      // Parse using plugin
      const parseResult = await plugin.parse(content, filePath);

      if (!parseResult.success || !parseResult.ast) {
        // Parse failed
        console.error(`Failed to parse ${filePath}:`, parseResult.errors);
        return [];
      }

      // Extract symbols using plugin
      const symbols = await plugin.extractSymbols(parseResult.ast, filePath);

      return symbols;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  /**
   * Index entire project (find all source files and parse them)
   */
  async indexProject(): Promise<{
    files: string[];
    symbols: SymbolDefinition[];
    classes: string[];
  }> {
    const sourceFiles = await this.findSourceFiles();
    const allSymbols: SymbolDefinition[] = [];

    for (const file of sourceFiles) {
      const symbols = await this.parseFile(file);
      allSymbols.push(...symbols);

      // Store in index
      for (const symbol of symbols) {
        this.symbolIndex.set(symbol.id, symbol);
      }
    }

    const classes = allSymbols.filter(s => s.kind === 'class').map(s => s.qualifiedName);

    return {
      files: sourceFiles,
      symbols: allSymbols,
      classes
    };
  }

  /**
   * Find all source files in project (for all registered languages)
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string, baseDir: string, registry: LanguagePluginRegistry): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            // Skip common non-source directories
            if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
              await scan(fullPath, baseDir, registry);
            }
          } else if (entry.isFile() && registry.canHandle(entry.name)) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    await scan(this.projectRoot, this.projectRoot, this.registry);
    return files;
  }

  /**
   * Find symbols by name (case-insensitive substring match)
   */
  findSymbolsByName(name: string): SymbolDefinition[] {
    const searchTerm = name.toLowerCase();
    return Array.from(this.symbolIndex.values()).filter(symbol =>
      symbol.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Find symbols by kind
   */
  findSymbolsByKind(kind: SymbolKind): SymbolDefinition[] {
    return Array.from(this.symbolIndex.values()).filter(symbol =>
      symbol.kind === kind
    );
  }

  /**
   * Get symbol by qualified name
   */
  getSymbol(qualifiedName: string): SymbolDefinition | undefined {
    return this.symbolIndex.get(qualifiedName);
  }

  /**
   * Clear symbol index
   */
  clearIndex(): void {
    this.symbolIndex.clear();
  }

  /**
   * Get all indexed symbols
   */
  getAllSymbols(): SymbolDefinition[] {
    return Array.from(this.symbolIndex.values());
  }

  /**
   * Get statistics about indexed symbols
   */
  getStats(): {
    totalSymbols: number;
    byKind: Record<SymbolKind, number>;
    byLanguage: Record<string, number>;
  } {
    const symbols = this.getAllSymbols();
    const byKind: Record<SymbolKind, number> = {} as any;
    const byLanguage: Record<string, number> = {};

    for (const symbol of symbols) {
      // Count by kind
      byKind[symbol.kind] = (byKind[symbol.kind] || 0) + 1;

      // Count by language (detect from file extension)
      const language = LanguageDetector.detectLanguage(symbol.location.path);
      if (language !== 'unknown') {
        byLanguage[language] = (byLanguage[language] || 0) + 1;
      }
    }

    return {
      totalSymbols: symbols.length,
      byKind,
      byLanguage
    };
  }
}
