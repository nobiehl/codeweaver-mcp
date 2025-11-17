/**
 * Python Parser using Tree-Sitter WASM
 *
 * Uses web-tree-sitter (WASM) for zero native dependencies.
 * Parses Python source code into a Tree-Sitter syntax tree.
 */

import { Parser, Language } from 'web-tree-sitter';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import type { ParseResult } from '../../../../types/language.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Singleton parser instance
let parserInstance: Parser | null = null;
let isParserInitialized = false;

/**
 * Initialize Tree-Sitter WASM (once globally)
 */
async function initWASM(): Promise<void> {
  if (!isParserInitialized) {
    await Parser.init();
    isParserInitialized = true;
  }
}

/**
 * Get or create Python parser instance
 */
async function getParser(): Promise<Parser> {
  if (parserInstance) {
    return parserInstance;
  }

  // Ensure WASM is initialized
  await initWASM();

  // Create parser
  const parser = new Parser();

  // Load Python WASM grammar
  const wasmPath = path.resolve(
    __dirname,
    '../../../../../node_modules/tree-sitter-wasms/out/tree-sitter-python.wasm'
  );

  if (!fs.existsSync(wasmPath)) {
    throw new Error(
      `Python WASM grammar not found at ${wasmPath}. Please install tree-sitter-wasms: npm install tree-sitter-wasms`
    );
  }

  const Python = await Language.load(wasmPath);
  parser.setLanguage(Python);

  parserInstance = parser;
  return parser;
}

/**
 * Parse Python source code into Tree-Sitter AST
 *
 * @param source - Python source code
 * @param filePath - Path to source file
 * @returns Parse result with tree-sitter tree
 */
export async function parsePythonSource(source: string, filePath: string): Promise<ParseResult> {
  try {
    const parser = await getParser();
    const tree = parser.parse(source);

    if (!tree || !tree.rootNode) {
      return {
        ast: null,
        errors: [
          {
            message: 'Failed to parse Python source - no root node',
            line: 0,
            column: 0,
            severity: 'error',
          },
        ],
        success: false,
        filePath,
      };
    }

    // Check for syntax errors
    const errors: ParseResult['errors'] = [];
    if (tree.rootNode.hasError) {
      errors.push({
        message: 'Python source contains syntax errors',
        line: tree.rootNode.startPosition.row + 1,
        column: tree.rootNode.startPosition.column,
        severity: 'error',
      });
    }

    return {
      ast: tree,
      errors,
      success: errors.length === 0,
      filePath,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      ast: null,
      errors: [
        {
          message: `Python parsing failed: ${errorMessage}`,
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
 * Validate Python source without full parsing
 *
 * @param source - Python source code
 * @param filePath - Path to file
 * @returns Array of syntax errors (empty if valid)
 */
export async function validatePythonSource(source: string, filePath: string): Promise<ParseResult['errors']> {
  const result = await parsePythonSource(source, filePath);
  return result.errors;
}
