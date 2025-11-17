/**
 * Language Plugin Interface for CodeWeaver Multi-Language System
 *
 * Defines the contract that all language plugins must implement.
 * Each language plugin is responsible for parsing source files and
 * extracting symbols in its language.
 */

import type {
  LanguageMetadata,
  ParseResult,
  PluginConfig,
  LanguageStats,
} from '../../types/language.js';
import type { SymbolDefinition } from '../../types/symbols.js';

/**
 * Base interface for all language plugins
 *
 * A language plugin is responsible for:
 * 1. Parsing source code files into an Abstract Syntax Tree (AST)
 * 2. Extracting symbols (classes, functions, types, etc.) from the AST
 * 3. Converting language-specific symbols into the common SymbolDefinition format
 *
 * @example
 * ```typescript
 * export class JavaLanguagePlugin implements LanguagePlugin {
 *   readonly metadata: LanguageMetadata = {
 *     language: 'java',
 *     fileExtensions: ['.java'],
 *     displayName: 'Java',
 *     supportsGenerics: true,
 *     supportsDecorators: true,
 *     supportsModules: true,
 *     supportsClasses: true,
 *     supportsFunctions: true,
 *   };
 *
 *   async parse(source: string, filePath: string): Promise<ParseResult> {
 *     // Parse Java code using java-parser
 *   }
 *
 *   async extractSymbols(ast: any, filePath: string): Promise<SymbolDefinition[]> {
 *     // Extract symbols from Java AST
 *   }
 *
 *   async indexFile(filePath: string): Promise<SymbolDefinition[]> {
 *     // Read file, parse, extract symbols
 *   }
 * }
 * ```
 */
export interface LanguagePlugin {
  /**
   * Metadata about this language plugin
   */
  readonly metadata: LanguageMetadata;

  /**
   * Parse source code into an Abstract Syntax Tree
   *
   * @param source - Source code content
   * @param filePath - Path to the source file
   * @param config - Optional plugin configuration
   * @returns Parse result with AST and any errors
   *
   * @example
   * ```typescript
   * const result = await plugin.parse(sourceCode, 'Example.java');
   * if (result.success) {
   *   console.log('AST:', result.ast);
   * } else {
   *   console.error('Errors:', result.errors);
   * }
   * ```
   */
  parse(source: string, filePath: string, config?: PluginConfig): Promise<ParseResult>;

  /**
   * Extract symbols from a parsed AST
   *
   * @param ast - Abstract Syntax Tree (from parse method)
   * @param filePath - Path to the source file
   * @param config - Optional plugin configuration
   * @returns Array of extracted symbols
   *
   * @example
   * ```typescript
   * const parseResult = await plugin.parse(sourceCode, 'Example.java');
   * const symbols = await plugin.extractSymbols(parseResult.ast, 'Example.java');
   * console.log(`Found ${symbols.length} symbols`);
   * ```
   */
  extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]>;

  /**
   * Index a single file (convenience method that combines parse + extractSymbols)
   *
   * This is the primary method used by the SymbolsAgent to process files.
   * It should:
   * 1. Read the file from disk
   * 2. Parse it to AST
   * 3. Extract symbols
   * 4. Return the symbols
   *
   * @param filePath - Absolute path to the source file
   * @param config - Optional plugin configuration
   * @returns Array of extracted symbols
   *
   * @example
   * ```typescript
   * const symbols = await plugin.indexFile('/path/to/Example.java');
   * for (const symbol of symbols) {
   *   console.log(`${symbol.kind}: ${symbol.name}`);
   * }
   * ```
   */
  indexFile(filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]>;

  /**
   * Check if this plugin can handle a given file
   *
   * @param filePath - Path to check
   * @returns true if this plugin can parse the file
   *
   * @example
   * ```typescript
   * if (plugin.canHandle('Example.java')) {
   *   const symbols = await plugin.indexFile('Example.java');
   * }
   * ```
   */
  canHandle(filePath: string): boolean;

  /**
   * Get plugin configuration (optional)
   *
   * @returns Current plugin configuration
   */
  getConfig?(): PluginConfig;

  /**
   * Set plugin configuration (optional)
   *
   * @param config - New configuration
   */
  setConfig?(config: Partial<PluginConfig>): void;

  /**
   * Get statistics about parsing operations (optional)
   *
   * @returns Language-specific statistics
   */
  getStats?(): LanguageStats;

  /**
   * Reset statistics (optional)
   */
  resetStats?(): void;

  /**
   * Validate source code without full parsing (optional)
   *
   * Lightweight validation to check if file is syntactically correct
   * without building full AST.
   *
   * @param source - Source code content
   * @param filePath - Path to the source file
   * @returns Array of syntax errors (empty if valid)
   */
  validate?(source: string, filePath: string): Promise<ParseResult['errors']>;
}

/**
 * Abstract base class for language plugins
 *
 * Provides common functionality that all plugins can use.
 * Plugins can extend this class instead of implementing LanguagePlugin directly.
 */
export abstract class BaseLanguagePlugin implements LanguagePlugin {
  abstract readonly metadata: LanguageMetadata;

  protected config: PluginConfig = {
    includePrivate: true,
    includeLocals: false,
    extractDocs: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };

  protected stats: LanguageStats = {
    language: 'unknown',
    filesProcessed: 0,
    symbolsExtracted: 0,
    parseErrors: 0,
    processingTime: 0,
    avgSymbolsPerFile: 0,
  };

  abstract parse(source: string, filePath: string, config?: PluginConfig): Promise<ParseResult>;
  abstract extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]>;

  /**
   * Default implementation of indexFile
   * Reads file, parses, extracts symbols, updates stats
   */
  async indexFile(filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    const fs = await import('fs/promises');
    const startTime = Date.now();

    try {
      // Read file
      const source = await fs.readFile(filePath, 'utf-8');

      // Check file size
      const maxSize = config?.maxFileSize ?? this.config.maxFileSize ?? 10 * 1024 * 1024;
      if (source.length > maxSize) {
        throw new Error(`File too large: ${source.length} bytes (max: ${maxSize})`);
      }

      // Parse
      const parseResult = await this.parse(source, filePath, config);

      // Track parse errors
      if (parseResult.errors.length > 0) {
        this.stats.parseErrors += parseResult.errors.length;
      }

      // Extract symbols
      const symbols = await this.extractSymbols(parseResult.ast, filePath, config);

      // Update stats
      this.stats.filesProcessed++;
      this.stats.symbolsExtracted += symbols.length;
      this.stats.processingTime += Date.now() - startTime;
      this.stats.avgSymbolsPerFile = this.stats.symbolsExtracted / this.stats.filesProcessed;

      return symbols;
    } catch (error) {
      this.stats.parseErrors++;
      console.error(`Error indexing ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Default implementation of canHandle
   * Checks if file extension matches plugin's supported extensions
   */
  canHandle(filePath: string): boolean {
    const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
    return this.metadata.fileExtensions.includes(ext);
  }

  getConfig(): PluginConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<PluginConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getStats(): LanguageStats {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = {
      language: this.metadata.language,
      filesProcessed: 0,
      symbolsExtracted: 0,
      parseErrors: 0,
      processingTime: 0,
      avgSymbolsPerFile: 0,
    };
  }
}
