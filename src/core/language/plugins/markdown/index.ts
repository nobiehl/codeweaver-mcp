/**
 * Markdown Language Plugin
 *
 * Implements LanguagePlugin interface for Markdown documentation support.
 * Treats Markdown as a structured document with extractable symbols:
 * - Headers (h1-h6) → sections
 * - Links → references
 * - Code blocks → examples
 *
 * Features:
 * - GitHub Flavored Markdown support (tables, task lists, etc.)
 * - Hierarchical section extraction
 * - Local file reference tracking
 * - Code block language detection
 */

import { BaseLanguagePlugin } from '../../plugin.js';
import type { LanguageMetadata, ParseResult, PluginConfig } from '../../../../types/language.js';
import type { SymbolDefinition } from '../../../../types/symbols.js';
import { parseMarkdownSource, validateMarkdownSource } from './parser.js';
import { extractSymbols } from './extractor.js';

/**
 * Markdown Language Plugin
 *
 * Complete implementation of Markdown parsing and symbol extraction.
 *
 * @example
 * ```typescript
 * const plugin = new MarkdownLanguagePlugin();
 * const symbols = await plugin.indexFile('README.md');
 * console.log(`Found ${symbols.length} sections and references`);
 * ```
 */
export class MarkdownLanguagePlugin extends BaseLanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'markdown',
    fileExtensions: ['.md', '.markdown', '.mdown', '.mkd'],
    displayName: 'Markdown',
    supportsGenerics: false,
    supportsDecorators: false,
    supportsModules: false,
    supportsClasses: false,
    supportsFunctions: false,
  };

  /**
   * Parse Markdown source code into AST
   *
   * @param source - Markdown source code content
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Parse result with MDAST
   */
  async parse(source: string, filePath: string, _config?: PluginConfig): Promise<ParseResult> {
    return parseMarkdownSource(source, filePath);
  }

  /**
   * Extract symbols from Markdown AST
   *
   * Extracts:
   * - Headers as "sections"
   * - Local links as "references"
   * - Code blocks as "code-block" symbols
   *
   * @param ast - Markdown AST (MDAST Root node)
   * @param filePath - Path to source file
   * @param config - Optional plugin configuration
   * @returns Array of extracted symbols
   */
  async extractSymbols(ast: any, filePath: string, _config?: PluginConfig): Promise<SymbolDefinition[]> {
    // No filtering for Markdown - all symbols are public documentation
    return extractSymbols(ast, filePath);
  }

  /**
   * Validate Markdown source code without full parsing
   *
   * @param source - Markdown source code
   * @param filePath - Path to file
   * @returns Array of syntax errors (empty if valid)
   */
  async validate(source: string, filePath: string): Promise<ParseResult['errors']> {
    return validateMarkdownSource(source, filePath);
  }

  /**
   * Override stats to set correct language
   */
  resetStats(): void {
    super.resetStats();
    this.stats.language = 'markdown';
  }
}
