/**
 * Markdown Symbol Extractor
 *
 * Extracts symbols from Markdown AST (MDAST format).
 * Treats Markdown documentation structure as analyzable symbols:
 * - Headers (h1-h6) as "sections"
 * - Links as "references"
 * - Code blocks as "examples"
 */

import type { Root, Heading, Link, Code, Content } from 'mdast';
import { visit } from 'unist-util-visit';
import type { SymbolDefinition, SymbolKind } from '../../../../types/symbols.js';

/**
 * Extract symbols from Markdown AST
 *
 * @param ast - Markdown AST (MDAST Root node)
 * @param filePath - Path to source file
 * @returns Array of extracted symbols
 */
export function extractSymbols(ast: Root, filePath: string): SymbolDefinition[] {
  const symbols: SymbolDefinition[] = [];

  // Track heading hierarchy for qualified names
  const headingStack: Array<{ level: number; name: string }> = [];

  visit(ast, (node) => {
    // Extract Headings as Sections
    if (node.type === 'heading') {
      const heading = node as Heading;
      const headingText = extractTextFromNode(heading).trim();
      const level = (heading as any).depth || 1; // MDAST uses 'depth' not 'level'

      // Update heading stack (maintain hierarchy)
      while (headingStack.length > 0 && headingStack[headingStack.length - 1].level >= level) {
        headingStack.pop();
      }

      // Build qualified name from heading hierarchy
      const qualifiedName = headingStack.length > 0
        ? `${headingStack.map(h => h.name).join('.')}${headingText}`
        : headingText;

      headingStack.push({ level, name: headingText });

      symbols.push({
        id: qualifiedName,
        name: headingText,
        qualifiedName,
        kind: 'section' as SymbolKind,
        location: {
          path: filePath,
          startLine: heading.position?.start.line || 1,
          startColumn: heading.position?.start.column || 0,
          endLine: heading.position?.end.line || 1,
          endColumn: heading.position?.end.column || 0,
        },
        modifiers: [],
        signature: `${'#'.repeat(level)} ${headingText}`,
        annotations: [],
        visibility: 'public',
        language: 'markdown',
      });
    }

    // Extract Links as References
    if (node.type === 'link') {
      const link = node as Link;
      const linkText = extractTextFromNode(link).trim();
      const url = link.url;

      // Only track links to local files (not external URLs)
      const isLocalLink = !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:');

      if (isLocalLink) {
        const qualifiedName = `link:${url}`;

        symbols.push({
          id: qualifiedName,
          name: linkText || url,
          qualifiedName,
          kind: 'reference' as SymbolKind,
          location: {
            path: filePath,
            startLine: link.position?.start.line || 1,
            startColumn: link.position?.start.column || 0,
            endLine: link.position?.end.line || 1,
            endColumn: link.position?.end.column || 0,
          },
          modifiers: [],
          signature: `[${linkText}](${url})`,
          annotations: [],
          visibility: 'public',
          language: 'markdown',
        });
      }
    }

    // Extract Code Blocks as Examples
    if (node.type === 'code') {
      const codeBlock = node as Code;
      const lang = codeBlock.lang || 'unknown';
      const value = codeBlock.value;

      // Create a unique ID based on position and language
      const qualifiedName = `code-block:${lang}:${codeBlock.position?.start.line || 0}`;

      symbols.push({
        id: qualifiedName,
        name: `Code Block (${lang})`,
        qualifiedName,
        kind: 'code-block' as SymbolKind,
        location: {
          path: filePath,
          startLine: codeBlock.position?.start.line || 1,
          startColumn: codeBlock.position?.start.column || 0,
          endLine: codeBlock.position?.end.line || 1,
          endColumn: codeBlock.position?.end.column || 0,
        },
        modifiers: [],
        signature: `\`\`\`${lang}\n${value.substring(0, 50)}${value.length > 50 ? '...' : ''}\n\`\`\``,
        annotations: [{ type: `language:${lang}` }],
        visibility: 'public',
        language: 'markdown',
      });
    }
  });

  return symbols;
}

/**
 * Extract text content from Markdown node (recursively)
 */
function extractTextFromNode(node: Content): string {
  if ('value' in node && typeof node.value === 'string') {
    return node.value;
  }

  if ('children' in node && Array.isArray(node.children)) {
    return node.children.map(extractTextFromNode).join('');
  }

  return '';
}
