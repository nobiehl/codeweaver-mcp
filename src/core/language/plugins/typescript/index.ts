/**
 * TypeScript Language Plugin
 *
 * Implements LanguagePlugin interface for TypeScript/JavaScript language support.
 * Provides parsing and symbol extraction for all TypeScript and modern JavaScript features.
 *
 * Features:
 * - Classes, Interfaces, Types, Enums
 * - Functions, Methods, Properties
 * - Generics, Decorators, Modifiers
 * - Arrow Functions, Async/Await
 * - Modules (import/export)
 * - JSX/TSX Support
 */

import { BaseLanguagePlugin } from '../../plugin.js';
import type { LanguageMetadata, ParseResult, PluginConfig } from '../../../../types/language.js';
import type { SymbolDefinition } from '../../../../types/symbols.js';
import { parseTypeScriptSource, validateTypeScriptSource } from './parser.js';
import { extractSymbols } from './extractor.js';

/**
 * TypeScript Language Plugin
 *
 * Complete implementation of TypeScript/JavaScript parsing and symbol extraction.
 *
 * @example
 * ```typescript
 * const plugin = new TypeScriptLanguagePlugin();
 * const symbols = await plugin.indexFile('App.tsx');
 * console.log(`Found ${symbols.length} symbols`);
 * ```
 */
export class TypeScriptLanguagePlugin extends BaseLanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'typescript',
    fileExtensions: ['.ts', '.tsx', '.mts', '.cts'],
    displayName: 'TypeScript',
    supportsGenerics: true,
    supportsDecorators: true,
    supportsModules: true,
    supportsClasses: true,
    supportsFunctions: true,
  };

  /**
   * Parse TypeScript source code into AST
   *
   * @param source - TypeScript source code content
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Parse result with AST and any errors
   */
  async parse(source: string, filePath: string, _config?: PluginConfig): Promise<ParseResult> {
    return parseTypeScriptSource(source, filePath, false);
  }

  /**
   * Extract symbols from TypeScript AST
   *
   * @param ast - TypeScript AST from parser
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Array of extracted symbols
   */
  async extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    const mergedConfig = { ...this.config, ...config };

    // Extract all symbols (pass false for isJavaScript)
    const symbols = extractSymbols(ast, filePath, false);

    // Filter by configuration
    if (!mergedConfig.includePrivate) {
      // Filter out private symbols
      return symbols.filter(symbol => symbol.visibility !== 'private');
    }

    return symbols;
  }

  /**
   * Validate TypeScript source code without full parsing
   *
   * @param source - TypeScript source code
   * @param filePath - Path to file
   * @returns Array of syntax errors (empty if valid)
   */
  async validate(source: string, filePath: string): Promise<ParseResult['errors']> {
    return validateTypeScriptSource(source, filePath, false);
  }

  /**
   * Override stats to set correct language
   */
  resetStats(): void {
    super.resetStats();
    this.stats.language = 'typescript';
  }
}

/**
 * JavaScript Language Plugin
 *
 * Uses the same parser as TypeScript but for JavaScript files.
 *
 * @example
 * ```typescript
 * const plugin = new JavaScriptLanguagePlugin();
 * const symbols = await plugin.indexFile('app.js');
 * console.log(`Found ${symbols.length} symbols`);
 * ```
 */
export class JavaScriptLanguagePlugin extends BaseLanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'javascript',
    fileExtensions: ['.js', '.jsx', '.mjs', '.cjs'],
    displayName: 'JavaScript',
    supportsGenerics: false, // JavaScript doesn't have generics
    supportsDecorators: true, // Stage 3 decorators
    supportsModules: true,
    supportsClasses: true,
    supportsFunctions: true,
  };

  /**
   * Parse JavaScript source code into AST
   *
   * @param source - JavaScript source code content
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Parse result with AST and any errors
   */
  async parse(source: string, filePath: string, _config?: PluginConfig): Promise<ParseResult> {
    return parseTypeScriptSource(source, filePath, true);
  }

  /**
   * Extract symbols from JavaScript AST
   *
   * @param ast - JavaScript AST from parser
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Array of extracted symbols
   */
  async extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    const mergedConfig = { ...this.config, ...config };

    // Extract all symbols (pass true for isJavaScript)
    const symbols = extractSymbols(ast, filePath, true);

    // Filter by configuration
    if (!mergedConfig.includePrivate) {
      // Filter out private symbols (though JS doesn't have true private in older versions)
      return symbols.filter(symbol => symbol.visibility !== 'private');
    }

    return symbols;
  }

  /**
   * Validate JavaScript source code without full parsing
   *
   * @param source - JavaScript source code
   * @param filePath - Path to file
   * @returns Array of syntax errors (empty if valid)
   */
  async validate(source: string, filePath: string): Promise<ParseResult['errors']> {
    return validateTypeScriptSource(source, filePath, true);
  }

  /**
   * Override stats to set correct language
   */
  resetStats(): void {
    super.resetStats();
    this.stats.language = 'javascript';
  }
}
