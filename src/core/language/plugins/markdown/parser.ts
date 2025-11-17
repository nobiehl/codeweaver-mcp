/**
 * Markdown Parser
 *
 * Uses remark (unified ecosystem) for Markdown parsing into AST.
 * Supports GitHub Flavored Markdown (GFM) with tables, task lists, etc.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import type { ParseResult } from '../../../../types/language.js';
import type { Root } from 'mdast';

/**
 * Parse Markdown source into AST (MDAST format)
 *
 * @param source - Markdown source content
 * @param filePath - Path to Markdown file
 * @returns Parse result with MDAST root node
 */
export async function parseMarkdownSource(source: string, filePath: string): Promise<ParseResult> {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm); // GitHub Flavored Markdown support

    const ast = processor.parse(source) as Root;

    return {
      ast,
      errors: [],
      success: true,
      filePath,
    };
  } catch (error) {
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
 * Validate Markdown source without full parsing
 *
 * @param source - Markdown source code
 * @param filePath - Path to file
 * @returns Array of validation errors (empty if valid)
 */
export async function validateMarkdownSource(source: string, filePath: string): Promise<ParseResult['errors']> {
  try {
    const result = await parseMarkdownSource(source, filePath);
    return result.errors;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return [
      {
        message: errorMessage,
        line: 0,
        column: 0,
        severity: 'error',
      },
    ];
  }
}
