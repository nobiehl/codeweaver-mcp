/**
 * TypeScript Parser
 *
 * Parses TypeScript/JavaScript source code into Abstract Syntax Tree using @typescript-eslint/typescript-estree.
 * Supports all TypeScript and modern JavaScript features.
 */

import { parse } from '@typescript-eslint/typescript-estree';
import type { ParseResult } from '../../../../types/language.js';
import type { TSESTree } from '@typescript-eslint/typescript-estree';

/**
 * Parse TypeScript/JavaScript source code into AST
 *
 * @param source - TypeScript/JavaScript source code content
 * @param filePath - Path to the source file (for error reporting)
 * @param isJavaScript - Whether this is JavaScript (not TypeScript)
 * @returns ParseResult with AST and any parse errors
 *
 * @example
 * ```typescript
 * const result = await parseTypeScriptSource(sourceCode, 'App.tsx');
 * if (result.success) {
 *   console.log('Parsed successfully');
 * } else {
 *   console.error('Parse errors:', result.errors);
 * }
 * ```
 */
export async function parseTypeScriptSource(
  source: string,
  filePath: string,
  _isJavaScript: boolean = false
): Promise<ParseResult> {
  try {
    // Determine file extension for parser
    const jsx = filePath.endsWith('.tsx') || filePath.endsWith('.jsx');

    // Parse TypeScript/JavaScript source using @typescript-eslint/typescript-estree
    const ast: TSESTree.Program = parse(source, {
      // Use latest ECMAScript version
      ecmaVersion: 'latest',

      // Detect source type automatically (module or script)
      sourceType: 'module',

      // File path for better error messages
      filePath,

      // Enable JSX/TSX support
      ecmaFeatures: {
        jsx,
        globalReturn: false,
      },

      // Include location info
      loc: true,
      range: true,

      // Don't include tokens (not needed for symbol extraction)
      tokens: false,

      // Don't include comments (not needed for symbol extraction)
      comment: false,

      // Don't check types (we only need syntax)
      // This makes parsing much faster
    });

    return {
      ast,
      errors: [],
      success: true,
      filePath,
    };
  } catch (error) {
    // Parse failed
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Extract line/column if available
    let line = 0;
    let column = 0;
    if (error instanceof Error && 'lineNumber' in error) {
      line = (error as any).lineNumber;
    }
    if (error instanceof Error && 'column' in error) {
      column = (error as any).column;
    }

    return {
      ast: null,
      errors: [
        {
          message: errorMessage,
          line,
          column,
          severity: 'error',
        },
      ],
      success: false,
      filePath,
    };
  }
}

/**
 * Validate TypeScript/JavaScript source code without full parsing
 *
 * Lightweight validation to check if file is syntactically correct.
 *
 * @param source - TypeScript/JavaScript source code
 * @param filePath - Path to file
 * @param isJavaScript - Whether this is JavaScript (not TypeScript)
 * @returns Array of syntax errors (empty if valid)
 */
export async function validateTypeScriptSource(
  source: string,
  filePath: string,
  isJavaScript: boolean = false
): Promise<ParseResult['errors']> {
  const result = await parseTypeScriptSource(source, filePath, isJavaScript);
  return result.errors;
}
