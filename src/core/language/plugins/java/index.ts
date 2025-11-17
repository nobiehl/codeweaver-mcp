/**
 * Java Language Plugin
 *
 * Implements LanguagePlugin interface for Java language support.
 * Provides parsing and symbol extraction for all Java features (Java 8-23).
 *
 * Features:
 * - Classes, Interfaces, Enums, Records, Annotation Types
 * - Methods, Fields, Constructors
 * - Generics, Annotations, Modifiers
 * - Nested Types, Sealed Classes
 * - Module System (Java 9+)
 */

import { BaseLanguagePlugin } from '../../plugin.js';
import type { LanguageMetadata, ParseResult, PluginConfig } from '../../../../types/language.js';
import type { SymbolDefinition } from '../../../../types/symbols.js';
import { parseJavaSource, validateJavaSource } from './parser.js';
import { extractSymbols } from './extractor.js';

/**
 * Java Language Plugin
 *
 * Complete implementation of Java parsing and symbol extraction.
 *
 * @example
 * ```typescript
 * const plugin = new JavaLanguagePlugin();
 * const symbols = await plugin.indexFile('Example.java');
 * console.log(`Found ${symbols.length} symbols`);
 * ```
 */
export class JavaLanguagePlugin extends BaseLanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'java',
    fileExtensions: ['.java'],
    displayName: 'Java',
    supportsGenerics: true,
    supportsDecorators: true, // Java annotations
    supportsModules: true,    // Java 9+ module system
    supportsClasses: true,
    supportsFunctions: true,  // Methods
  };

  /**
   * Parse Java source code into AST
   *
   * @param source - Java source code content
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Parse result with AST and any errors
   */
  async parse(source: string, filePath: string, _config?: PluginConfig): Promise<ParseResult> {
    return parseJavaSource(source, filePath);
  }

  /**
   * Extract symbols from Java AST
   *
   * @param ast - Java AST from parser
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Array of extracted symbols
   */
  async extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    const mergedConfig = { ...this.config, ...config };

    // Extract all symbols
    const symbols = extractSymbols(ast, filePath);

    // Filter by configuration
    if (!mergedConfig.includePrivate) {
      // Filter out private symbols
      return symbols.filter(symbol => symbol.visibility !== 'private');
    }

    return symbols;
  }

  /**
   * Validate Java source code without full parsing
   *
   * @param source - Java source code
   * @param filePath - Path to file
   * @returns Array of syntax errors (empty if valid)
   */
  async validate(source: string, filePath: string): Promise<ParseResult['errors']> {
    return validateJavaSource(source, filePath);
  }

  /**
   * Override stats to set correct language
   */
  resetStats(): void {
    super.resetStats();
    this.stats.language = 'java';
  }
}
