import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { CodeWeaverService } from '../core/service.js';

export function registerTools(server: Server, service: CodeWeaverService) {
  // List Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'project.meta',
        description: 'Get project metadata (Java version, modules, dependencies)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'file.read',
        description: 'Read entire file content with optional token limit',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Relative path to file (from project root)',
            },
            maxTokens: {
              type: 'number',
              description: 'Optional max tokens (default: 10000)',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'file.readRange',
        description: 'Read specific line range from file (1-indexed, inclusive)',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Relative path to file (from project root)',
            },
            startLine: {
              type: 'number',
              description: 'Start line number (1-indexed)',
            },
            endLine: {
              type: 'number',
              description: 'End line number (1-indexed, inclusive)',
            },
          },
          required: ['filePath', 'startLine', 'endLine'],
        },
      },
      {
        name: 'file.readWithNumbers',
        description: 'Read file with line numbers (for reference)',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Relative path to file (from project root)',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'symbols.index',
        description: 'Index entire project and extract symbols (classes, methods, fields)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'symbols.find',
        description: 'Find symbols by name (case-insensitive substring match)',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Symbol name to search for (substring match)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'symbols.findByKind',
        description: 'Find symbols by kind (class, method, field, constructor)',
        inputSchema: {
          type: 'object',
          properties: {
            kind: {
              type: 'string',
              description: 'Symbol kind: class, method, field, or constructor',
              enum: ['class', 'method', 'field', 'constructor'],
            },
          },
          required: ['kind'],
        },
      },
      {
        name: 'symbols.get',
        description: 'Get symbol by qualified name (e.g., com.example.MyClass or com.example.MyClass#myMethod)',
        inputSchema: {
          type: 'object',
          properties: {
            qualifiedName: {
              type: 'string',
              description: 'Fully qualified symbol name',
            },
          },
          required: ['qualifiedName'],
        },
      },
      {
        name: 'search.keyword',
        description: 'Search for keyword in files (grep-like)',
        inputSchema: {
          type: 'object',
          properties: {
            keyword: {
              type: 'string',
              description: 'Keyword to search for',
            },
            caseSensitive: {
              type: 'boolean',
              description: 'Case-sensitive search (default: true)',
            },
            maxResults: {
              type: 'number',
              description: 'Maximum number of results (default: 100)',
            },
            contextLines: {
              type: 'number',
              description: 'Number of context lines before/after match (default: 0)',
            },
            fileExtensions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by file extensions (e.g., [".java", ".ts"])',
            },
          },
          required: ['keyword'],
        },
      },
      {
        name: 'search.semantic',
        description: 'Search code/docs semantically by meaning/intent (uses AI embeddings). Supports multiple collections: code (Java, TS, etc.) and docs (Markdown, etc.). Returns code chunks ranked by similarity.',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Natural language query describing what code you are looking for (e.g., "find user by id", "authentication logic", "error handling")',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results (default: 10)',
            },
            collection: {
              type: 'string',
              enum: ['code', 'docs', 'all'],
              description: 'Which collection to search: "code" (source code), "docs" (documentation), or "all" (both). Default: "all"',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'search.files',
        description: 'Find files by name pattern (glob-like: *.java, *Test.ts)',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: {
              type: 'string',
              description: 'File name pattern (supports * and ?)',
            },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'analysis.file',
        description: 'Analyze a single file for complexity metrics and code quality',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Relative path to file (from project root)',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'analysis.project',
        description: 'Analyze entire project for complexity metrics and statistics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'vcs.status',
        description: 'Get Git repository status (modified, added, deleted, untracked files)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'vcs.diff',
        description: 'Get diff for file(s) in Git repository',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Optional file path to get diff for specific file (omit for all changes)',
            },
          },
        },
      },
      {
        name: 'vcs.blame',
        description: 'Get Git blame information for a file',
        inputSchema: {
          type: 'object',
          properties: {
            filePath: {
              type: 'string',
              description: 'Relative path to file (from project root)',
            },
            startLine: {
              type: 'number',
              description: 'Optional start line (1-indexed)',
            },
            endLine: {
              type: 'number',
              description: 'Optional end line (1-indexed)',
            },
          },
          required: ['filePath'],
        },
      },
      {
        name: 'vcs.log',
        description: 'Get Git commit history',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Optional limit number of commits (default: 100)',
            },
            since: {
              type: 'string',
              description: 'Optional date/time to start from (e.g., "2 weeks ago")',
            },
            until: {
              type: 'string',
              description: 'Optional date/time to end at',
            },
            author: {
              type: 'string',
              description: 'Optional filter by author name',
            },
          },
        },
      },
      {
        name: 'vcs.branches',
        description: 'Get list of all Git branches',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'vcs.compare',
        description: 'Compare two Git branches',
        inputSchema: {
          type: 'object',
          properties: {
            baseBranch: {
              type: 'string',
              description: 'Base branch name',
            },
            compareBranch: {
              type: 'string',
              description: 'Branch to compare against base',
            },
          },
          required: ['baseBranch', 'compareBranch'],
        },
      },
    ],
  }));

  // Call Tool
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'project.meta': {
          const metadata = await service.getProjectMetadata();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(metadata, null, 2),
              },
            ],
          };
        }

        case 'file.read': {
          const { filePath, maxTokens } = args as { filePath: string; maxTokens?: number };
          const content = await service.readFileWithLimit(filePath, maxTokens);

          if (content === null) {
            throw new Error(`File not found: ${filePath}`);
          }

          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        }

        case 'file.readRange': {
          const { filePath, startLine, endLine } = args as { filePath: string; startLine: number; endLine: number };
          const snippet = await service.readLines(filePath, startLine, endLine);

          return {
            content: [
              {
                type: 'text',
                text: snippet,
              },
            ],
          };
        }

        case 'file.readWithNumbers': {
          const { filePath } = args as { filePath: string };
          const content = await service.readFileWithLineNumbers(filePath);

          return {
            content: [
              {
                type: 'text',
                text: content,
              },
            ],
          };
        }

        case 'symbols.index': {
          const index = await service.buildIndex();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    files: index.files.length,
                    symbols: index.symbols.length,
                    classes: index.classes.length,
                    classList: index.classes,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'symbols.find': {
          const { name: symbolName } = args as { name: string };
          const symbols = service.findSymbolsByName(symbolName);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(symbols, null, 2),
              },
            ],
          };
        }

        case 'symbols.findByKind': {
          const { kind } = args as { kind: 'class' | 'method' | 'field' | 'constructor' };
          const symbols = service.findSymbolsByKind(kind);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(symbols, null, 2),
              },
            ],
          };
        }

        case 'symbols.get': {
          const { qualifiedName } = args as { qualifiedName: string };
          const symbol = service.getSymbol(qualifiedName);

          if (!symbol) {
            throw new Error(`Symbol not found: ${qualifiedName}`);
          }

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(symbol, null, 2),
              },
            ],
          };
        }

        case 'search.keyword': {
          const { keyword, caseSensitive, maxResults, contextLines, fileExtensions } = args as {
            keyword: string;
            caseSensitive?: boolean;
            maxResults?: number;
            contextLines?: number;
            fileExtensions?: string[];
          };

          const results = await service.searchKeyword(keyword, {
            caseSensitive,
            maxResults,
            contextLines,
            fileExtensions,
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(results, null, 2),
              },
            ],
          };
        }

        case 'search.semantic': {
          const { query, limit, collection } = args as {
            query: string;
            limit?: number;
            collection?: 'code' | 'docs' | 'all';
          };

          const results = await service.searchSemantic(query, limit || 10, collection || 'all');

          // Format results with similarity scores and collection
          const formatted = results.map(r => ({
            collection: r.collection.toUpperCase(),
            file: r.file,
            lines: `${r.startLine}-${r.endLine}`,
            similarity: `${(r.similarity * 100).toFixed(1)}%`,
            preview: r.content.substring(0, 100) + (r.content.length > 100 ? '...' : '')
          }));

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(formatted, null, 2),
              },
            ],
          };
        }

        case 'search.files': {
          const { pattern } = args as { pattern: string };
          const files = await service.findFiles(pattern);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(files, null, 2),
              },
            ],
          };
        }

        case 'analysis.file': {
          const { filePath } = args as { filePath: string };
          const analysis = await service.analyzeFile(filePath);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(analysis, null, 2),
              },
            ],
          };
        }

        case 'analysis.project': {
          const analysis = await service.analyzeProject();

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    totalFiles: analysis.totalFiles,
                    totalComplexity: analysis.totalComplexity,
                    averageComplexity: analysis.averageComplexity,
                    totalMethods: analysis.totalMethods,
                    totalLines: analysis.totalLines,
                    mostComplexFiles: analysis.mostComplexFiles,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case 'vcs.status': {
          const status = await service.getGitStatus();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(status, null, 2),
              },
            ],
          };
        }

        case 'vcs.diff': {
          const { filePath } = args as { filePath?: string };
          const diff = await service.getGitDiff(filePath);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(diff, null, 2),
              },
            ],
          };
        }

        case 'vcs.blame': {
          const { filePath, startLine, endLine } = args as {
            filePath: string;
            startLine?: number;
            endLine?: number;
          };
          const blame = await service.getGitBlame(filePath, startLine, endLine);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(blame, null, 2),
              },
            ],
          };
        }

        case 'vcs.log': {
          const { limit, since, until, author } = args as {
            limit?: number;
            since?: string;
            until?: string;
            author?: string;
          };
          const log = await service.getGitLog({ limit, since, until, author });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(log, null, 2),
              },
            ],
          };
        }

        case 'vcs.branches': {
          const branches = await service.getGitBranches();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(branches, null, 2),
              },
            ],
          };
        }

        case 'vcs.compare': {
          const { baseBranch, compareBranch } = args as {
            baseBranch: string;
            compareBranch: string;
          };
          const diff = await service.compareGitBranches(baseBranch, compareBranch);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(diff, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: (error as Error).message,
            }),
          },
        ],
        isError: true,
      };
    }
  });
}
