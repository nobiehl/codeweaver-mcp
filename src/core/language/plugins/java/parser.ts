/**
 * Java Parser
 *
 * Parses Java source code into Abstract Syntax Tree using java-parser.
 * Extracted from SymbolsAgent for multi-language plugin architecture.
 */

import * as javaParser from 'java-parser';
import type { ParseResult } from '../../../../types/language.js';

/**
 * Parse Java source code into AST
 *
 * @param source - Java source code content
 * @param filePath - Path to the source file (for error reporting)
 * @returns ParseResult with AST and any parse errors
 *
 * @example
 * ```typescript
 * const result = await parseJavaSource(sourceCode, 'Example.java');
 * if (result.success) {
 *   console.log('Parsed successfully');
 * } else {
 *   console.error('Parse errors:', result.errors);
 * }
 * ```
 */
export async function parseJavaSource(source: string, filePath: string): Promise<ParseResult> {
  try {
    // Parse Java source using java-parser
    const cst = javaParser.parse(source);

    return {
      ast: cst,
      errors: [],
      success: true,
      filePath,
    };
  } catch (error) {
    // Parse failed
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      ast: null,
      errors: [
        {
          message: errorMessage,
          line: 0,
          column: 0,
          severity: 'error',
        },
      ],
      success: false,
      filePath,
    };
  }
}

/**
 * Validate Java source code without full parsing
 *
 * Lightweight validation to check if file is syntactically correct.
 *
 * @param source - Java source code
 * @param filePath - Path to file
 * @returns Array of syntax errors (empty if valid)
 */
export async function validateJavaSource(
  source: string,
  filePath: string
): Promise<ParseResult['errors']> {
  const result = await parseJavaSource(source, filePath);
  return result.errors;
}
