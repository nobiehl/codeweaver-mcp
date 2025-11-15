import fs from 'fs/promises';
import path from 'path';

/**
 * SnippetsAgent - Token-efficient file reading
 *
 * Features:
 * - Read specific line ranges
 * - Token counting and truncation
 * - Line numbering
 * - Ensure responses stay under token limits
 */
export class SnippetsAgent {
  private projectRoot: string;

  // Simple token estimation: ~4 characters per token
  private readonly CHARS_PER_TOKEN = 4;
  private readonly DEFAULT_MAX_TOKENS = 10000;

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
  }

  /**
   * Read entire file content
   */
  async readFile(filePath: string): Promise<string | null> {
    const fullPath = path.join(this.projectRoot, filePath);

    try {
      return await fs.readFile(fullPath, 'utf-8');
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Read specific line range from file (1-indexed, inclusive)
   */
  async readLines(filePath: string, startLine: number, endLine: number): Promise<string> {
    const content = await this.readFile(filePath);
    if (!content) return '';

    const lines = content.split('\n');

    // Handle out-of-bounds ranges
    if (startLine > lines.length) {
      return '';
    }

    // Adjust to 0-indexed, clamp to valid range
    const start = Math.max(0, startLine - 1);
    const end = Math.min(lines.length, endLine);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Read file with line numbers (1-indexed)
   */
  async readFileWithLineNumbers(filePath: string): Promise<string> {
    const content = await this.readFile(filePath);
    if (!content) return '';

    const lines = content.split('\n');
    const maxLineNumWidth = String(lines.length).length;

    return lines
      .map((line, idx) => {
        const lineNum = String(idx + 1).padStart(maxLineNumWidth, ' ');
        return `${lineNum}: ${line}`;
      })
      .join('\n');
  }

  /**
   * Count estimated tokens in text
   *
   * Simple heuristic: ~4 characters per token
   * This is a rough approximation for quick checks
   */
  countTokens(text: string): number {
    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  /**
   * Truncate text to fit within token limit
   *
   * Cuts at word boundaries when possible
   */
  truncateToTokens(text: string, maxTokens: number = this.DEFAULT_MAX_TOKENS): string {
    const currentTokens = this.countTokens(text);

    if (currentTokens <= maxTokens) {
      return text;
    }

    // Account for "..." suffix (3 chars = ~1 token)
    const suffix = '...';
    const targetChars = (maxTokens * this.CHARS_PER_TOKEN) - suffix.length;

    // Try to cut at word boundary
    const truncated = text.substring(0, targetChars);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > targetChars * 0.9) {
      // Found a space near the end
      return truncated.substring(0, lastSpace) + suffix;
    }

    // No good word boundary, hard cut
    return truncated + suffix;
  }

  /**
   * Read file with automatic truncation to token limit
   */
  async readFileWithLimit(filePath: string, maxTokens: number = this.DEFAULT_MAX_TOKENS): Promise<string | null> {
    const content = await this.readFile(filePath);
    if (!content) return null;

    return this.truncateToTokens(content, maxTokens);
  }

  /**
   * Read multiple files and combine into response, respecting token limit
   *
   * Distributes tokens evenly across files
   */
  async readMultipleFiles(filePaths: string[], maxTokens: number = this.DEFAULT_MAX_TOKENS): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    const tokensPerFile = Math.floor(maxTokens / filePaths.length);

    for (const filePath of filePaths) {
      const content = await this.readFileWithLimit(filePath, tokensPerFile);
      if (content) {
        result.set(filePath, content);
      }
    }

    return result;
  }

  /**
   * Extract context around a specific line (e.g., for error context)
   */
  async getContextAroundLine(
    filePath: string,
    lineNumber: number,
    contextLines: number = 5
  ): Promise<string> {
    const startLine = Math.max(1, lineNumber - contextLines);
    const endLine = lineNumber + contextLines;

    return this.readLines(filePath, startLine, endLine);
  }
}
