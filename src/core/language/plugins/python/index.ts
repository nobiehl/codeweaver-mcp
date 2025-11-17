/**
 * Python Language Plugin
 *
 * Implements LanguagePlugin interface for Python support.
 * Uses Tree-Sitter WASM (zero native dependencies) for parsing.
 *
 * Features:
 * - Classes, Methods, Functions
 * - Decorators (@decorator syntax)
 * - Type Hints (Python 3.5+)
 * - Async functions
 * - Static/class methods
 * - Private/protected naming conventions
 */

import { BaseLanguagePlugin } from '../../plugin.js';
import type { LanguageMetadata, ParseResult, PluginConfig } from '../../../../types/language.js';
import type { SymbolDefinition } from '../../../../types/symbols.js';
import { parsePythonSource, validatePythonSource } from './parser.js';
import { extractSymbols } from './extractor.js';

/**
 * Python Language Plugin
 *
 * Complete implementation of Python parsing and symbol extraction.
 *
 * @example
 * ```typescript
 * const plugin = new PythonLanguagePlugin();
 * const symbols = await plugin.indexFile('app.py');
 * console.log(`Found ${symbols.length} Python symbols`);
 * ```
 */
export class PythonLanguagePlugin extends BaseLanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'python',
    fileExtensions: ['.py', '.pyi', '.pyw'],
    displayName: 'Python',
    supportsGenerics: true, // Type hints with generics (List[str], etc.)
    supportsDecorators: true, // @decorator syntax
    supportsModules: true,
    supportsClasses: true,
    supportsFunctions: true,
  };

  /**
   * Parse Python source code into Tree-Sitter AST
   *
   * @param source - Python source code content
   * @param filePath - Path to source file
   * @param _config - Optional plugin configuration
   * @returns Parse result with Tree-Sitter tree
   */
  async parse(source: string, filePath: string, _config?: PluginConfig): Promise<ParseResult> {
    return parsePythonSource(source, filePath);
  }

  /**
   * Extract symbols from Python AST
   *
   * Extracts:
   * - Classes (with decorators)
   * - Methods (constructor, instance, static, class methods)
   * - Functions (module-level, with decorators)
   * - Type hints and parameters
   *
   * @param ast - Tree-Sitter parse tree
   * @param filePath - Path to source file
   * @param _config - Optional plugin configuration
   * @returns Array of extracted symbols
   */
  async extractSymbols(ast: any, filePath: string, _config?: PluginConfig): Promise<SymbolDefinition[]> {
    return extractSymbols(ast, filePath);
  }

  /**
   * Validate Python source code without full parsing
   *
   * @param source - Python source code
   * @param filePath - Path to file
   * @returns Array of syntax errors (empty if valid)
   */
  async validate(source: string, filePath: string): Promise<ParseResult['errors']> {
    return validatePythonSource(source, filePath);
  }

  /**
   * Override stats to set correct language
   */
  resetStats(): void {
    super.resetStats();
    this.stats.language = 'python';
  }
}
