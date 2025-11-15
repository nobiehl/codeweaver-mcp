# Dual-Mode Architektur: CLI + MCP Server

**Eine Codebasis, zwei Interfaces: Terminal-CLI & LLM-MCP-Server**

---

## Übersicht

```
┌─────────────────────────────────────────────────────────┐
│                    CodeWeaver                           │
├──────────────────────┬──────────────────────────────────┤
│   CLI Interface      │      MCP Server Interface        │
│   (Terminal)         │      (stdio, JSON-RPC)          │
├──────────────────────┴──────────────────────────────────┤
│              Shared Core Business Logic                 │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐      │
│  │   Agents   │  │   Index    │  │  Analysis   │      │
│  └────────────┘  └────────────┘  └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│              Storage & Cache Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐      │
│  │  LanceDB   │  │   Symbol   │  │   Cache     │      │
│  │            │  │   Store    │  │             │      │
│  └────────────┘  └────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## Projektstruktur

```
codeweaver/
├── package.json
├── tsconfig.json
│
├── src/
│   ├── index.ts                    # Auto-Detection Entry Point
│   │
│   ├── cli/                        # CLI Interface Layer
│   │   ├── index.ts                # CLI Entry Point
│   │   ├── commands/               # Command Implementations
│   │   │   ├── index.ts            # Index-related commands
│   │   │   ├── search.ts           # Search commands
│   │   │   ├── analyze.ts          # Analysis commands
│   │   │   ├── symbols.ts          # Symbol commands
│   │   │   └── info.ts             # Project info
│   │   ├── ui/                     # CLI UI Helpers
│   │   │   ├── spinner.ts
│   │   │   ├── table.ts
│   │   │   └── colors.ts
│   │   └── utils/
│   │       └── args-parser.ts
│   │
│   ├── mcp/                        # MCP Server Interface Layer
│   │   ├── index.ts                # MCP Entry Point
│   │   ├── server.ts               # MCP JSON-RPC Handler
│   │   ├── tools.ts                # Tool Registry
│   │   └── types.ts                # MCP Types
│   │
│   ├── core/                       # Shared Business Logic
│   │   ├── service.ts              # Main Service Orchestrator
│   │   ├── agents/                 # All 9 Agents
│   │   │   ├── orchestrator.ts
│   │   │   ├── discovery.ts
│   │   │   ├── index.ts
│   │   │   ├── symbols.ts
│   │   │   ├── search.ts
│   │   │   ├── analysis.ts
│   │   │   ├── snippets.ts
│   │   │   ├── vcs.ts
│   │   │   └── cache.ts
│   │   ├── index/                  # Indexing
│   │   │   ├── lancedb-indexer.ts
│   │   │   ├── symbol-indexer.ts
│   │   │   └── java-parser.ts
│   │   ├── analysis/               # Analysis Tools
│   │   │   ├── gradle-runner.ts
│   │   │   ├── spotbugs.ts
│   │   │   └── checkstyle.ts
│   │   ├── storage/                # Storage Layer
│   │   │   ├── lancedb-store.ts
│   │   │   ├── json-symbol-store.ts
│   │   │   └── cache-store.ts
│   │   └── types/                  # Shared Types
│   │       ├── project.ts
│   │       ├── symbols.ts
│   │       └── analysis.ts
│   │
│   └── utils/                      # Utilities
│       ├── progress-writer.ts
│       ├── checkpoint-manager.ts
│       ├── token-estimator.ts
│       └── logger.ts
│
├── bin/
│   ├── codeweaver                  # CLI Executable
│   └── codeweaver-mcp              # MCP Server Executable
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## Entry Points

### 1. Auto-Detection Entry Point

**Datei**: `src/index.ts`

```typescript
#!/usr/bin/env node

import { isMCPMode } from './utils/mode-detector.js';
import { startCLI } from './cli/index.js';
import { startMCPServer } from './mcp/index.js';

async function main() {
  if (isMCPMode()) {
    // MCP Server Mode (stdio)
    await startMCPServer();
  } else {
    // CLI Mode (Terminal)
    await startCLI();
  }
}

main().catch(console.error);
```

### 2. Mode Detection

**Datei**: `src/utils/mode-detector.ts`

```typescript
export function isMCPMode(): boolean {
  // MCP-Server wird über stdio aufgerufen
  // CLI wird mit Terminal-TTY aufgerufen

  // 1. Check: Ist stdin ein TTY? (Terminal = true, Pipe = false)
  if (!process.stdin.isTTY) {
    return true; // stdio → MCP Mode
  }

  // 2. Check: Wurde explizit --mcp Flag gesetzt?
  if (process.argv.includes('--mcp')) {
    return true;
  }

  // 3. Check: Wurde über MCP-Binary aufgerufen?
  const scriptName = process.argv[1];
  if (scriptName?.includes('codeweaver-mcp')) {
    return true;
  }

  // Default: CLI Mode
  return false;
}
```

---

## Shared Core Service

**Datei**: `src/core/service.ts`

```typescript
/**
 * CodeWeaverService - Zentrale Business Logic
 * Wird von CLI UND MCP Server genutzt
 */
export class CodeWeaverService {
  private projectRoot: string;
  private discoveryAgent: DiscoveryAgent;
  private indexAgent: IndexAgent;
  private searchAgent: SearchAgent;
  private symbolsAgent: SymbolsAgent;
  private analysisAgent: AnalysisAgent;
  private snippetsAgent: SnippetsAgent;
  private vcsAgent: VCSAgent;
  private cacheAgent: CacheAgent;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;

    // Initialize Agents
    this.discoveryAgent = new DiscoveryAgent(projectRoot);
    this.cacheAgent = new CacheAgent(projectRoot);
    this.indexAgent = new IndexAgent(projectRoot, this.cacheAgent);
    this.searchAgent = new SearchAgent(this.indexAgent);
    this.symbolsAgent = new SymbolsAgent(this.indexAgent);
    this.analysisAgent = new AnalysisAgent(projectRoot);
    this.snippetsAgent = new SnippetsAgent(projectRoot);
    this.vcsAgent = new VCSAgent(projectRoot);
  }

  // === Project Discovery ===

  async getProjectMetadata(): Promise<ProjectMetadata> {
    return this.discoveryAgent.analyze();
  }

  // === Indexing ===

  async buildIndex(options?: IndexOptions): Promise<IndexStats> {
    return this.indexAgent.buildIndex(options?.scope);
  }

  async getIndexStatus(): Promise<IndexStatus> {
    return this.indexAgent.getStatus();
  }

  // === Search ===

  async searchKeyword(query: SearchQuery): Promise<SearchResult[]> {
    return this.searchAgent.find(query);
  }

  async searchSemantic(query: SemanticQuery): Promise<SearchResult[]> {
    return this.searchAgent.findSemantic(query);
  }

  // === Symbols ===

  async findSymbolDefinition(query: SymbolQuery): Promise<SymbolDefinition | null> {
    return this.symbolsAgent.findDefinition(query);
  }

  async findSymbolReferences(symbolId: SymbolId): Promise<Reference[]> {
    return this.symbolsAgent.findReferences(symbolId);
  }

  async getTypeHierarchy(symbolId: SymbolId): Promise<TypeHierarchy> {
    return this.symbolsAgent.getTypeHierarchy(symbolId);
  }

  // === Analysis ===

  async runAnalysis(types: AnalysisSource[]): Promise<AnalysisReport[]> {
    return this.analysisAgent.runAnalysis(types);
  }

  async getReports(filter?: ReportFilter): Promise<AnalysisReport[]> {
    return this.analysisAgent.getReports(filter);
  }

  // === Snippets ===

  async readCodeSnippet(request: RangeRequest): Promise<CodeSnippet> {
    return this.snippetsAgent.readRange(request);
  }

  // === VCS ===

  async getGitStatus(): Promise<VCSStatus> {
    return this.vcsAgent.getStatus();
  }

  async getGitDiff(scope: DiffScope): Promise<string> {
    return this.vcsAgent.getDiff(scope);
  }
}
```

---

## CLI Interface

### CLI Commands

**Datei**: `src/cli/index.ts`

```typescript
#!/usr/bin/env node

import { Command } from 'commander';
import { CodeWeaverService } from '../core/service.js';
import { indexCommands } from './commands/index.js';
import { searchCommands } from './commands/search.js';
import { symbolsCommands } from './commands/symbols.js';
import { analyzeCommands } from './commands/analyze.js';
import { infoCommands } from './commands/info.js';

export async function startCLI() {
  const program = new Command();

  program
    .name('codeweaver')
    .description('🕸️  CodeWeaver - Weaving Java Code Intelligence')
    .version('0.1.0');

  // Initialize Service
  const service = new CodeWeaverService(process.cwd());

  // Register Command Groups
  indexCommands(program, service);
  searchCommands(program, service);
  symbolsCommands(program, service);
  analyzeCommands(program, service);
  infoCommands(program, service);

  // Parse & Execute
  await program.parseAsync(process.argv);
}
```

### Command: Index

**Datei**: `src/cli/commands/index.ts`

```typescript
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { CodeWeaverService } from '../../core/service.js';

export function indexCommands(program: Command, service: CodeWeaverService) {
  const indexCmd = program
    .command('index')
    .description('Index management commands');

  // codeweaver index build
  indexCmd
    .command('build')
    .description('Build or rebuild the index')
    .option('--semantic', 'Build semantic index (LanceDB)')
    .option('--symbols', 'Build symbol index')
    .option('--all', 'Build all indexes (default)', true)
    .action(async (options) => {
      const spinner = ora('Building index...').start();

      try {
        const scope = options.semantic ? 'semantic' : options.symbols ? 'symbols' : 'all';
        const stats = await service.buildIndex({ scope });

        spinner.succeed(chalk.green('Index built successfully!'));

        console.log(chalk.cyan('\nIndex Statistics:'));
        console.log(`  Files indexed:   ${stats.filesIndexed}`);
        console.log(`  Symbols indexed: ${stats.symbolsIndexed}`);
        console.log(`  Duration:        ${(stats.durationMs / 1000).toFixed(2)}s`);

      } catch (error) {
        spinner.fail(chalk.red('Index build failed'));
        console.error(error);
        process.exit(1);
      }
    });

  // codeweaver index status
  indexCmd
    .command('status')
    .description('Show index status')
    .action(async () => {
      const status = await service.getIndexStatus();

      console.log(chalk.cyan('Index Status:'));
      console.log(`  Indexed:     ${status.isIndexed ? '✓' : '✗'}`);
      console.log(`  Files:       ${status.filesIndexed}`);
      console.log(`  Symbols:     ${status.symbolsIndexed}`);
      console.log(`  Last Update: ${status.lastUpdated?.toLocaleString() || 'Never'}`);
    });
}
```

### Command: Search

**Datei**: `src/cli/commands/search.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { CodeWeaverService } from '../../core/service.js';

export function searchCommands(program: Command, service: CodeWeaverService) {
  // codeweaver search <pattern>
  program
    .command('search <pattern>')
    .description('Search for code patterns')
    .option('-s, --semantic', 'Use semantic search')
    .option('-l, --limit <n>', 'Max results', '20')
    .option('-c, --context <n>', 'Context lines', '3')
    .action(async (pattern, options) => {
      const results = options.semantic
        ? await service.searchSemantic({ query: pattern, limit: parseInt(options.limit) })
        : await service.searchKeyword({
            pattern,
            maxResults: parseInt(options.limit),
            contextLines: parseInt(options.context)
          });

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      console.log(chalk.cyan(`\nFound ${results.length} results:\n`));

      for (const result of results) {
        console.log(chalk.bold(`${result.path}:${result.line}`));
        console.log(chalk.gray(result.lineText));
        console.log();
      }
    });

  // codeweaver search semantic <query>
  program
    .command('search-semantic <query>')
    .alias('ss')
    .description('Semantic code search (concept-based)')
    .option('-l, --limit <n>', 'Max results', '10')
    .action(async (query, options) => {
      console.log(chalk.cyan(`Searching for: "${query}"\n`));

      const results = await service.searchSemantic({
        query,
        limit: parseInt(options.limit)
      });

      if (results.length === 0) {
        console.log(chalk.yellow('No results found.'));
        return;
      }

      const table = new Table({
        head: ['File', 'Line', 'Similarity', 'Code'],
        colWidths: [40, 8, 12, 60]
      });

      for (const result of results) {
        table.push([
          result.path,
          result.line,
          `${(result.similarity * 100).toFixed(1)}%`,
          result.lineText.substring(0, 57) + '...'
        ]);
      }

      console.log(table.toString());
    });
}
```

### Command: Symbols

**Datei**: `src/cli/commands/symbols.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { CodeWeaverService } from '../../core/service.js';

export function symbolsCommands(program: Command, service: CodeWeaverService) {
  const symbolsCmd = program
    .command('symbols')
    .description('Symbol navigation commands');

  // codeweaver symbols find <name>
  symbolsCmd
    .command('find <name>')
    .description('Find symbol definition')
    .action(async (name) => {
      const symbol = await service.findSymbolDefinition({ qualifiedName: name });

      if (!symbol) {
        console.log(chalk.yellow(`Symbol "${name}" not found.`));
        return;
      }

      console.log(chalk.cyan('Symbol Definition:'));
      console.log(`  Kind:       ${symbol.kind}`);
      console.log(`  Name:       ${symbol.qualifiedName}`);
      console.log(`  Location:   ${symbol.location.path}:${symbol.location.startLine}`);
      console.log(`  Visibility: ${symbol.visibility}`);
      if (symbol.signature) {
        console.log(`  Signature:  ${symbol.signature}`);
      }
    });

  // codeweaver symbols refs <name>
  symbolsCmd
    .command('refs <name>')
    .alias('references')
    .description('Find all references to a symbol')
    .option('-l, --limit <n>', 'Max results', '50')
    .action(async (name, options) => {
      const refs = await service.findSymbolReferences(name);

      console.log(chalk.cyan(`Found ${refs.length} references:\n`));

      const limited = refs.slice(0, parseInt(options.limit));
      for (const ref of limited) {
        console.log(`  ${ref.from.path}:${ref.from.line} (${ref.kind})`);
      }

      if (refs.length > limited.length) {
        console.log(chalk.gray(`\n... and ${refs.length - limited.length} more`));
      }
    });
}
```

### Command: Analyze

**Datei**: `src/cli/commands/analyze.ts`

```typescript
import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import Table from 'cli-table3';
import { CodeWeaverService } from '../../core/service.js';

export function analyzeCommands(program: Command, service: CodeWeaverService) {
  // codeweaver analyze
  program
    .command('analyze')
    .description('Run static analysis')
    .option('--compile', 'Run compile check')
    .option('--test', 'Run tests')
    .option('--spotbugs', 'Run SpotBugs')
    .option('--checkstyle', 'Run Checkstyle')
    .option('--all', 'Run all analyzers (default)', true)
    .action(async (options) => {
      const types: AnalysisSource[] = [];
      if (options.compile || options.all) types.push('compile');
      if (options.test || options.all) types.push('test');
      if (options.spotbugs || options.all) types.push('spotbugs');
      if (options.checkstyle || options.all) types.push('checkstyle');

      const spinner = ora('Running analysis...').start();

      try {
        const reports = await service.runAnalysis(types);
        spinner.succeed(chalk.green('Analysis complete!'));

        // Summary Table
        const table = new Table({
          head: ['Analyzer', 'Errors', 'Warnings', 'Infos'],
          colWidths: [20, 10, 10, 10]
        });

        for (const report of reports) {
          table.push([
            report.source,
            report.summary.bySeverity.error,
            report.summary.bySeverity.warning,
            report.summary.bySeverity.info
          ]);
        }

        console.log('\n' + table.toString());

        // Top Findings
        const allFindings = reports.flatMap(r => r.findings);
        const topFindings = allFindings
          .filter(f => f.severity === 'error')
          .slice(0, 10);

        if (topFindings.length > 0) {
          console.log(chalk.red('\nTop Errors:'));
          for (const finding of topFindings) {
            console.log(`  ${finding.location.path}:${finding.location.startLine}`);
            console.log(`    ${finding.message}`);
          }
        }

      } catch (error) {
        spinner.fail(chalk.red('Analysis failed'));
        console.error(error);
        process.exit(1);
      }
    });
}
```

### Command: Info

**Datei**: `src/cli/commands/info.ts`

```typescript
import { Command } from 'commander';
import chalk from 'chalk';
import { CodeWeaverService } from '../../core/service.js';

export function infoCommands(program: Command, service: CodeWeaverService) {
  // codeweaver info
  program
    .command('info')
    .description('Show project information')
    .action(async () => {
      const meta = await service.getProjectMetadata();

      console.log(chalk.cyan('Project Information:'));
      console.log(`  Name:         ${meta.name}`);
      console.log(`  Root:         ${meta.root}`);
      console.log(`  Build System: ${meta.buildSystem}`);
      console.log(`  Java Version: ${meta.javaVersion}`);
      console.log(`  Gradle:       ${meta.gradleVersion}`);
      console.log(`  Modules:      ${meta.moduleCount}`);
      console.log(`  Dependencies: ${meta.dependencies.length}`);
    });
}
```

---

## MCP Server Interface

### MCP Server

**Datei**: `src/mcp/index.ts`

```typescript
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CodeWeaverService } from '../core/service.js';
import { registerTools } from './tools.js';

export async function startMCPServer() {
  // Initialize Service
  const service = new CodeWeaverService(process.cwd());

  // Create MCP Server
  const server = new Server(
    {
      name: 'codeweaver',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register Tools
  registerTools(server, service);

  // Start Server (stdio)
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('CodeWeaver MCP Server running on stdio');
}
```

### MCP Tools Registration

**Datei**: `src/mcp/tools.ts`

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CodeWeaverService } from '../core/service.js';
import { z } from 'zod';

export function registerTools(server: Server, service: CodeWeaverService) {
  // Tool: project.meta
  server.setRequestHandler('tools/list', async () => ({
    tools: [
      {
        name: 'project.meta',
        description: 'Get project metadata',
        inputSchema: { type: 'object', properties: {} }
      },
      {
        name: 'search.find',
        description: 'Search for code patterns',
        inputSchema: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            maxResults: { type: 'number', default: 20 }
          },
          required: ['pattern']
        }
      },
      {
        name: 'search.semantic',
        description: 'Semantic code search',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            limit: { type: 'number', default: 10 }
          },
          required: ['query']
        }
      },
      {
        name: 'symbols.lookup',
        description: 'Lookup symbol definition or references',
        inputSchema: {
          type: 'object',
          properties: {
            qualifiedName: { type: 'string' },
            operation: { type: 'string', enum: ['definition', 'references'] }
          },
          required: ['qualifiedName', 'operation']
        }
      },
      {
        name: 'analysis.getReports',
        description: 'Get analysis reports',
        inputSchema: {
          type: 'object',
          properties: {
            types: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'file.readRange',
        description: 'Read code snippet',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string' },
            startLine: { type: 'number' },
            endLine: { type: 'number' }
          },
          required: ['path', 'startLine', 'endLine']
        }
      },
      {
        name: 'vcs.diff',
        description: 'Get git diff',
        inputSchema: {
          type: 'object',
          properties: {
            scope: { type: 'string', enum: ['worktree', 'staged'] }
          },
          required: ['scope']
        }
      }
    ]
  }));

  // Tool Call Handler
  server.setRequestHandler('tools/call', async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'project.meta':
        return { content: [{ type: 'text', text: JSON.stringify(await service.getProjectMetadata()) }] };

      case 'search.find':
        return { content: [{ type: 'text', text: JSON.stringify(await service.searchKeyword(args)) }] };

      case 'search.semantic':
        return { content: [{ type: 'text', text: JSON.stringify(await service.searchSemantic(args)) }] };

      case 'symbols.lookup':
        if (args.operation === 'definition') {
          return { content: [{ type: 'text', text: JSON.stringify(await service.findSymbolDefinition(args)) }] };
        } else {
          return { content: [{ type: 'text', text: JSON.stringify(await service.findSymbolReferences(args.qualifiedName)) }] };
        }

      case 'analysis.getReports':
        return { content: [{ type: 'text', text: JSON.stringify(await service.runAnalysis(args.types || [])) }] };

      case 'file.readRange':
        return { content: [{ type: 'text', text: JSON.stringify(await service.readCodeSnippet(args)) }] };

      case 'vcs.diff':
        return { content: [{ type: 'text', text: await service.getGitDiff({ type: args.scope }) }] };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });
}
```

---

## package.json Updates

```json
{
  "name": "@codeweaver/mcp-server",
  "version": "0.1.0",
  "description": "🕸️ CodeWeaver - Weaving Java Code Intelligence for LLMs",
  "type": "module",
  "main": "dist/index.js",

  "bin": {
    "codeweaver": "dist/index.js",
    "codeweaver-mcp": "dist/mcp/index.js"
  },

  "scripts": {
    "build": "tsc",
    "dev": "tsx src/index.ts",
    "dev:cli": "tsx src/cli/index.ts",
    "dev:mcp": "tsx src/mcp/index.ts",
    "test": "vitest"
  },

  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "vectordb": "^0.4.0",
    "@xenova/transformers": "^2.17.0",
    "commander": "^12.0.0",
    "ora": "^8.0.1",
    "chalk": "^5.3.0",
    "cli-table3": "^0.6.3",
    "chokidar": "^4.0.3",
    "simple-git": "^3.27.0",
    "java-parser": "^2.3.0",
    "fast-xml-parser": "^4.5.0",
    "zod": "^3.24.1"
  },

  "devDependencies": {
    "@types/node": "^20.17.10",
    "@types/cli-table3": "^0.6.3",
    "typescript": "^5.7.2",
    "tsx": "^4.19.2",
    "vitest": "^2.1.8"
  }
}
```

---

## Usage-Beispiele

### CLI Usage

```bash
# 1. Project Info
codeweaver info

# 2. Build Index
codeweaver index build

# 3. Search (Keyword)
codeweaver search "NullPointerException"

# 4. Semantic Search
codeweaver search-semantic "authentication logic"
codeweaver ss "database operations"

# 5. Symbol Lookup
codeweaver symbols find com.example.UserService
codeweaver symbols refs com.example.UserService#save

# 6. Analysis
codeweaver analyze --all
codeweaver analyze --spotbugs --checkstyle

# 7. Index Status
codeweaver index status
```

### MCP Server Usage

```bash
# Start MCP Server (von Claude Code automatisch gestartet)
codeweaver-mcp

# Oder mit Auto-Detection über stdio:
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | codeweaver
```

**In Claude Code Config**:
```json
{
  "mcpServers": {
    "codeweaver": {
      "command": "npx",
      "args": ["@codeweaver/mcp-server"],
      "cwd": "/path/to/java/project"
    }
  }
}
```

---

## Vorteile dieser Architektur

### ✅ Geteilte Codebasis
- **Core Business Logic** nur einmal geschrieben
- **Beide Interfaces** nutzen gleiche Agents
- **Konsistente Ergebnisse** (CLI = MCP)
- **Wartbarkeit**: Änderungen nur an einer Stelle

### ✅ Flexible Nutzung
- **CLI**: Direkt im Terminal arbeiten
- **MCP**: Integration in Claude Code / LLMs
- **Auto-Detection**: Intelligente Mode-Erkennung
- **Beide gleichzeitig**: CLI für Testing, MCP für Production

### ✅ Developer Experience
- **CLI**: Schnelles Feedback während Development
- **MCP**: Production-Integration
- **TDD**: Tests gegen Core Service (unabhängig von Interface)

---

## Testing-Strategie

### Unit-Tests (Core Services)

```typescript
// tests/unit/core/service.test.ts

describe('CodeWeaverService', () => {
  let service: CodeWeaverService;

  beforeEach(() => {
    service = new CodeWeaverService('/path/to/test/project');
  });

  it('should get project metadata', async () => {
    const meta = await service.getProjectMetadata();
    expect(meta.javaVersion).toBe('21');
  });

  it('should search keyword', async () => {
    const results = await service.searchKeyword({ pattern: 'class' });
    expect(results.length).toBeGreaterThan(0);
  });
});
```

### Integration-Tests (CLI)

```typescript
// tests/integration/cli.test.ts

describe('CLI Integration', () => {
  it('should execute search command', async () => {
    const result = await exec('codeweaver search "MyClass"');
    expect(result.stdout).toContain('Found');
  });
});
```

### Integration-Tests (MCP)

```typescript
// tests/integration/mcp.test.ts

describe('MCP Integration', () => {
  it('should handle search.find tool call', async () => {
    const server = await startMCPServer();
    const result = await server.callTool('search.find', { pattern: 'MyClass' });
    expect(result).toHaveProperty('content');
  });
});
```

---

## Zusammenfassung

### Architektur

```
┌──────────────┐  ┌──────────────┐
│  CLI Entry   │  │  MCP Entry   │
└──────┬───────┘  └──────┬───────┘
       │                 │
       └────────┬────────┘
                │
        ┌───────▼────────┐
        │  Core Service  │
        │  (Business     │
        │   Logic)       │
        └───────┬────────┘
                │
    ┌───────────┼───────────┐
    │           │           │
┌───▼────┐ ┌───▼────┐ ┌───▼────┐
│ Agents │ │ Index  │ │Storage │
└────────┘ └────────┘ └────────┘
```

### Entry Points

| Binary | Mode | Transport | Use Case |
|--------|------|-----------|----------|
| `codeweaver` | Auto-Detect | TTY / stdio | CLI oder MCP |
| `codeweaver-mcp` | MCP | stdio | Explizit MCP |
| `codeweaver <cmd>` | CLI | Terminal | Direkte Nutzung |

### Befehle

**CLI**: 15+ Commands über 5 Gruppen
- `index`: build, status
- `search`, `search-semantic`
- `symbols`: find, refs
- `analyze`
- `info`

**MCP**: 7 Tools (gleiche Features!)
- `project.meta`
- `search.find`, `search.semantic`
- `symbols.lookup`
- `analysis.getReports`
- `file.readRange`
- `vcs.diff`

---

**Bereit für Implementation?** 🚀
