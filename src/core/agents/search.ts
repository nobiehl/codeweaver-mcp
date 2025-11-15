import fs from 'fs/promises';
import path from 'path';

/**
 * SearchResult - Single search match result
 */
export interface SearchResult {
  file: string;
  line: number;
  column: number;
  content: string;
  beforeContext?: string[];
  afterContext?: string[];
}

/**
 * SearchOptions - Configuration for search operations
 */
export interface SearchOptions {
  caseSensitive?: boolean;
  maxResults?: number;
  contextLines?: number;
  fileExtensions?: string[];
  excludeDirs?: string[];
  searchPath?: string;
}

/**
 * SearchAgent - Keyword and Pattern Search
 *
 * Features:
 * - Keyword search (grep-like)
 * - Regex pattern search
 * - File filtering (extension, directory)
 * - Context lines (before/after matches)
 * - Case-sensitive/insensitive search
 * - Result limiting
 */
export class SearchAgent {
  private projectRoot: string;

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
  }

  /**
   * Search for keyword in files
   */
  async searchKeyword(keyword: string, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      caseSensitive = true,
      maxResults = 100,
      contextLines = 0,
      fileExtensions = [],
      excludeDirs = ['node_modules', '.git', 'dist', 'build', 'target'],
      searchPath = '.'
    } = options;

    const results: SearchResult[] = [];
    const searchQuery = caseSensitive ? keyword : keyword.toLowerCase();
    const fullSearchPath = path.join(this.projectRoot, searchPath);

    const files = await this.findAllFiles(fullSearchPath, fileExtensions, excludeDirs);

    for (const file of files) {
      if (results.length >= maxResults) break;

      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) break;

          const line = lines[i];
          const searchLine = caseSensitive ? line : line.toLowerCase();

          if (searchLine.includes(searchQuery)) {
            const result: SearchResult = {
              file: path.relative(this.projectRoot, file),
              line: i + 1,
              column: searchLine.indexOf(searchQuery) + 1,
              content: line.trim()
            };

            // Add context lines if requested
            if (contextLines > 0) {
              result.beforeContext = [];
              result.afterContext = [];

              for (let j = Math.max(0, i - contextLines); j < i; j++) {
                result.beforeContext.push(lines[j].trim());
              }

              for (let j = i + 1; j < Math.min(lines.length, i + 1 + contextLines); j++) {
                result.afterContext.push(lines[j].trim());
              }
            }

            results.push(result);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * Search with regex pattern
   */
  async searchPattern(pattern: RegExp, options: SearchOptions = {}): Promise<SearchResult[]> {
    const {
      maxResults = 100,
      contextLines = 0,
      fileExtensions = [],
      excludeDirs = ['node_modules', '.git', 'dist', 'build', 'target'],
      searchPath = '.'
    } = options;

    const results: SearchResult[] = [];
    const fullSearchPath = path.join(this.projectRoot, searchPath);

    const files = await this.findAllFiles(fullSearchPath, fileExtensions, excludeDirs);

    for (const file of files) {
      if (results.length >= maxResults) break;

      try {
        const content = await fs.readFile(file, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (results.length >= maxResults) break;

          const line = lines[i];
          const match = line.match(pattern);

          if (match) {
            const result: SearchResult = {
              file: path.relative(this.projectRoot, file),
              line: i + 1,
              column: match.index !== undefined ? match.index + 1 : 0,
              content: line.trim()
            };

            // Add context lines if requested
            if (contextLines > 0) {
              result.beforeContext = [];
              result.afterContext = [];

              for (let j = Math.max(0, i - contextLines); j < i; j++) {
                result.beforeContext.push(lines[j].trim());
              }

              for (let j = i + 1; j < Math.min(lines.length, i + 1 + contextLines); j++) {
                result.afterContext.push(lines[j].trim());
              }
            }

            results.push(result);
          }
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * Find files by name pattern (glob-like)
   */
  async findFiles(pattern: string, excludeDirs: string[] = ['node_modules', '.git', 'dist', 'build', 'target']): Promise<string[]> {
    const results: string[] = [];

    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);

    async function scan(dir: string, baseDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await scan(fullPath, baseDir);
            }
          } else if (entry.isFile()) {
            if (regex.test(entry.name)) {
              const relativePath = path.relative(baseDir, fullPath);
              results.push(relativePath);
            }
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    await scan(this.projectRoot, this.projectRoot);
    return results;
  }

  /**
   * Find all files in directory (recursive)
   */
  private async findAllFiles(
    dir: string,
    extensions: string[] = [],
    excludeDirs: string[] = []
  ): Promise<string[]> {
    const files: string[] = [];

    async function scan(currentDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(currentDir, entry.name);

          if (entry.isDirectory()) {
            if (!excludeDirs.includes(entry.name)) {
              await scan(fullPath);
            }
          } else if (entry.isFile()) {
            // Filter by extension if specified
            if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    await scan(dir);
    return files;
  }
}
