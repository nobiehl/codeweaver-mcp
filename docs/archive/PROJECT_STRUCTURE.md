# Projektstruktur

## Übersicht

```
java-analysis-mcp-server/
├── package.json                      # Node.js dependencies & scripts
├── tsconfig.json                     # TypeScript configuration
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── README.md                         # Setup & Usage
├── ARCHITECTURE.md                   # High-level architecture
├── DATA_MODELS.md                    # Data structures & schemas
├── PROJECT_STRUCTURE.md              # This file
├── IMPLEMENTATION_ROADMAP.md         # Phased implementation plan
│
├── src/                              # Source code
│   ├── index.ts                      # MCP Server entry point
│   │
│   ├── mcp/                          # MCP Protocol layer
│   │   ├── server.ts                 # MCP JSON-RPC handler (stdio)
│   │   ├── tools.ts                  # Tool registration & dispatch
│   │   └── types.ts                  # MCP-specific types
│   │
│   ├── agents/                       # Agent implementations
│   │   ├── orchestrator.ts           # Pipeline orchestration & DAG
│   │   ├── discovery.ts              # Project metadata discovery
│   │   ├── index.ts                  # Index agent (fulltext + symbols)
│   │   ├── symbols.ts                # Symbol lookup & references
│   │   ├── search.ts                 # Pattern-based search
│   │   ├── analysis.ts               # Analysis runner & aggregator
│   │   ├── snippets.ts               # Code snippet extraction
│   │   ├── vcs.ts                    # Git operations & diffs
│   │   └── cache.ts                  # Cache management
│   │
│   ├── index/                        # Indexing subsystems
│   │   ├── fulltext.ts               # FlexSearch-based fulltext index
│   │   ├── symbols-indexer.ts        # Symbol index builder
│   │   ├── tree-sitter-parser.ts     # Java AST parser (tree-sitter)
│   │   └── incremental-updater.ts    # File-watch & incremental rebuild
│   │
│   ├── analysis/                     # Analysis tools integration
│   │   ├── gradle-runner.ts          # Gradle command execution
│   │   ├── report-parser.ts          # Parse Gradle outputs
│   │   ├── compiler-parser.ts        # Parse javac errors/warnings
│   │   ├── test-parser.ts            # Parse JUnit XML reports
│   │   └── tools/                    # Static analysis tool wrappers
│   │       ├── spotbugs.ts
│   │       ├── checkstyle.ts
│   │       ├── pmd.ts
│   │       └── error-prone.ts
│   │
│   ├── storage/                      # Persistent storage
│   │   ├── cache.ts                  # Content-addressable cache
│   │   ├── symbol-db.ts              # SQLite symbol database
│   │   └── metadata-store.ts         # Cache metadata (JSON)
│   │
│   ├── types/                        # Type definitions
│   │   ├── project.ts                # ProjectMetadata, ModuleInfo, etc.
│   │   ├── symbols.ts                # SymbolDefinition, Reference, etc.
│   │   ├── analysis.ts               # AnalysisReport, Finding, etc.
│   │   ├── index.ts                  # Index-related types
│   │   ├── cache.ts                  # Cache types
│   │   └── common.ts                 # Shared types (Location, etc.)
│   │
│   └── utils/                        # Utilities
│       ├── token-estimator.ts        # Token counting & limits
│       ├── file-utils.ts             # File I/O helpers
│       ├── hash.ts                   # Content hashing (SHA-256)
│       ├── logger.ts                 # Logging (structured)
│       ├── async-pool.ts             # Parallel task execution
│       └── dag.ts                    # DAG scheduler
│
├── tests/                            # Test suites
│   ├── unit/                         # Unit tests
│   │   ├── agents/
│   │   ├── index/
│   │   ├── analysis/
│   │   └── utils/
│   ├── integration/                  # Integration tests
│   │   ├── mcp-tools.test.ts
│   │   ├── pipeline.test.ts
│   │   └── indexing.test.ts
│   ├── e2e/                          # End-to-end tests
│   │   └── test-projects/            # Sample Java projects
│   │       ├── simple-java/
│   │       ├── multi-module/
│   │       └── with-bugs/
│   └── fixtures/                     # Test data
│       ├── sample-reports/
│       └── sample-gradle-outputs/
│
├── .mcp-cache/                       # Cache directory (gitignored)
│   ├── metadata.json
│   ├── index/
│   ├── reports/
│   ├── snippets/
│   └── vcs/
│
└── docs/                             # Additional documentation
    ├── MCP_TOOLS.md                  # Tool reference
    ├── TOKEN_MANAGEMENT.md           # Token budget guide
    └── TESTING.md                    # Testing guide
```

---

## Modul-Beschreibungen

### `src/index.ts`
**Entry Point**: Startet den MCP-Server über stdio, initialisiert alle Agents

```typescript
import { MCPServer } from './mcp/server.js';
import { Orchestrator } from './agents/orchestrator.js';
// ... other imports

async function main() {
  const server = new MCPServer();
  const orchestrator = new Orchestrator();

  // Register tools
  registerTools(server, orchestrator);

  // Start server
  await server.start();
}

main().catch(console.error);
```

---

### `src/mcp/`
**MCP Protocol Layer**: Implementiert JSON-RPC 2.0 über stdio

#### `server.ts`
- `MCPServer` class
- Methoden: `start()`, `stop()`, `registerTool()`, `handleRequest()`
- Nutzt `@modelcontextprotocol/sdk`

#### `tools.ts`
- Tool-Registrierung für alle 7 MCP-Tools
- Routing zu entsprechenden Agents
- Input-Validierung (Zod)

---

### `src/agents/`
**Agent-Implementierungen**: Alle 9 spezialisierten Agents

#### `orchestrator.ts`
- `OrchestratorAgent` class
- Methoden:
  - `executeAnalysisPipeline(config: PipelineConfig): Promise<PipelineResult>`
  - `executeParallelTasks(tasks: Task[]): Promise<TaskResult[]>`
  - `savePipelineState()`, `resumePipeline()`
- Nutzt `DAGScheduler` aus `utils/dag.ts`

#### `discovery.ts`
- `DiscoveryAgent` class
- Methoden:
  - `analyze(): Promise<ProjectMetadata>`
  - `detectGradleProject(root: string): boolean`
  - `parseGradleSettings()`, `parseGradleBuild()`

#### `index.ts`
- `IndexAgent` class
- Methoden:
  - `buildIndex(scope?: IndexScope): Promise<IndexStats>`
  - `buildFulltextIndex()`, `buildSymbolIndex()`
  - `updateIncrementally(changedFiles: string[])`

#### `symbols.ts`
- `SymbolsAgent` class
- Methoden:
  - `findDefinition(query: SymbolQuery): Promise<SymbolDefinition | null>`
  - `findReferences(symbolId: SymbolId): Promise<Reference[]>`
  - `getTypeHierarchy()`, `getCallGraph()`, `getSignatureInfo()`

#### `search.ts`
- `SearchAgent` class
- Methoden:
  - `find(query: SearchQuery): Promise<SearchResult[]>`
  - Regex & plain-text search mit Kontext

#### `analysis.ts`
- `AnalysisAgent` class
- Methoden:
  - `runAnalysis(types: AnalysisSource[]): Promise<AnalysisReport[]>`
  - `runCompileCheck()`, `runTests()`, `runStaticAnalysis()`

#### `snippets.ts`
- `SnippetsAgent` class
- Methoden:
  - `readRange(request: RangeRequest): Promise<CodeSnippet>`
  - `readSymbol(symbolId: SymbolId): Promise<CodeSnippet>`
  - Token-Limit-Enforcement

#### `vcs.ts`
- `VCSAgent` class
- Methoden:
  - `getStatus()`, `getDiff()`, `getCommits()`, `getBlame()`
- Nutzt `simple-git`

#### `cache.ts`
- `CacheAgent` class
- Methoden:
  - `store(key: CacheKey, data: any)`
  - `load(key: CacheKey): Promise<any | null>`
  - `invalidate(pattern: string)`
  - `getStats()`

---

### `src/index/`
**Indexing-Subsystem**: Fulltext & Symbol-Index

#### `fulltext.ts`
- `FulltextIndexer` class
- Nutzt `flexsearch` oder `lunr.js`
- Methoden:
  - `build(files: string[]): Promise<void>`
  - `search(query: FulltextQuery): Promise<FulltextResult[]>`
  - `export()`, `import()`

#### `symbols-indexer.ts`
- `SymbolIndexer` class
- Nutzt `tree-sitter-parser.ts` für AST
- Methoden:
  - `buildIndex(files: string[]): Promise<SymbolIndex>`
  - `updateFile(file: string)`
  - `persist(dbPath: string)`

#### `tree-sitter-parser.ts`
- `JavaParser` class
- Methoden:
  - `parse(content: string): Tree`
  - `extractSymbols(tree: Tree): SymbolDefinition[]`
  - `extractReferences(tree: Tree): Reference[]`

#### `incremental-updater.ts`
- `IncrementalUpdater` class
- File-Watching mit `chokidar`
- Methoden:
  - `watch(dirs: string[])`
  - `onFileChanged(path: string)`

---

### `src/analysis/`
**Analysis-Tools-Integration**: Gradle, Compiler, Tests, Static Analysis

#### `gradle-runner.ts`
- `GradleRunner` class
- Methoden:
  - `run(task: string, args?: string[]): Promise<GradleResult>`
  - `compile()`, `test()`, `check()`
- Nutzt `child_process.spawn`

#### `report-parser.ts`
- Basis-Parser für Gradle-Outputs
- Methoden:
  - `parseCompilerOutput(stdout: string): Finding[]`
  - `parseTestResults(xmlPath: string): TestReport`

#### `tools/spotbugs.ts`
- `SpotBugsAnalyzer` class
- Methoden:
  - `analyze(): Promise<AnalysisReport>`
  - `parseXML(xmlPath: string): Finding[]`

---

### `src/storage/`
**Persistent Storage**: Cache, SQLite, JSON

#### `cache.ts`
- `CacheStore` class
- Methoden:
  - `save(key: CacheKey, data: any)`
  - `load(key: CacheKey): Promise<any | null>`
  - `cleanup()` (TTL-basierte Löschung)

#### `symbol-db.ts`
- `SymbolDatabase` class
- Nutzt `better-sqlite3`
- Methoden:
  - `open(path: string)`
  - `insertSymbol(symbol: SymbolDefinition)`
  - `querySymbol(id: SymbolId): Promise<SymbolDefinition | null>`
  - `queryReferences(symbolId: SymbolId): Promise<Reference[]>`

#### `metadata-store.ts`
- Verwaltet `.mcp-cache/metadata.json`
- Methoden:
  - `loadMetadata()`, `saveMetadata()`

---

### `src/types/`
**Type Definitions**: Alle TypeScript-Interfaces (siehe DATA_MODELS.md)

#### `project.ts`
- `ProjectMetadata`, `ModuleInfo`, `SourceSetInfo`, `DependencyInfo`

#### `symbols.ts`
- `SymbolDefinition`, `Reference`, `SymbolIndex`, `SymbolKind`, etc.

#### `analysis.ts`
- `AnalysisReport`, `Finding`, `ReportSummary`, `AnalysisSource`

#### `index.ts`
- `IndexStats`, `IndexStatus`, `IndexScope`

#### `cache.ts`
- `CacheKey`, `CacheEntry`, `CacheMetadata`

#### `common.ts`
- `Location`, `TypeReference`, `Parameter`, `Annotation`

---

### `src/utils/`
**Utilities**: Helper-Funktionen

#### `token-estimator.ts`
- `estimateTokens(text: string): number`
- `enforceTokenLimit(snippet: CodeSnippet, maxTokens: number): CodeSnippet`

#### `file-utils.ts`
- `readFile()`, `writeFile()`, `findFiles()`, `getFileHash()`

#### `hash.ts`
- `sha256(content: string): string`
- `hashFiles(files: string[]): Promise<string>`

#### `logger.ts`
- Strukturiertes Logging (JSON)
- Log-Levels: DEBUG, INFO, WARN, ERROR

#### `async-pool.ts`
- `AsyncPool` class: Parallele Task-Ausführung mit Limit
- Methoden:
  - `add(task: () => Promise<T>)`
  - `run(): Promise<T[]>`

#### `dag.ts`
- `DAGScheduler` class: DAG-basierte Task-Ausführung
- Methoden:
  - `addTask(task: DAGTask)`
  - `execute(): Promise<DAGResult>`

---

## Tests

### `tests/unit/`
**Unit-Tests**: Isolierte Tests für einzelne Klassen/Methoden

Beispiele:
- `agents/discovery.test.ts`: Discovery Agent Tests
- `index/tree-sitter-parser.test.ts`: Java-Parser Tests
- `utils/token-estimator.test.ts`: Token-Counting Tests

### `tests/integration/`
**Integration-Tests**: Tests für MCP-Tools und Pipelines

Beispiele:
- `mcp-tools.test.ts`: Testet alle 7 MCP-Tools
- `pipeline.test.ts`: Testet vollständige Analysis-Pipeline
- `indexing.test.ts`: Testet Index-Build & Update

### `tests/e2e/`
**End-to-End-Tests**: Tests mit echten Java-Projekten

Beispiele:
- `simple-java.test.ts`: Test mit Single-Module-Projekt
- `multi-module.test.ts`: Test mit Multi-Module-Projekt
- `with-bugs.test.ts`: Test mit absichtlichen Bugs (SpotBugs-Findings)

### `tests/e2e/test-projects/`
**Test-Projekte**: Kleine Java-Projekte für E2E-Tests

- `simple-java/`: Single-Module, 5 Klassen
- `multi-module/`: 3 Subprojects, 20 Klassen
- `with-bugs/`: Absichtliche Compiler-Fehler, SpotBugs-Findings

---

## Cache-Verzeichnis (`.mcp-cache/`)

Wird automatisch erstellt beim ersten Index-Build:

```
.mcp-cache/
├── metadata.json                     # Cache-Index
├── index/
│   ├── fulltext-abc123.json          # FlexSearch export
│   └── symbols-abc123.db             # SQLite database
├── reports/
│   ├── compile-def456.json
│   ├── test-def456.json
│   └── spotbugs-ghi789.json
├── snippets/
│   └── file123-L10-50.txt
└── vcs/
    └── diff-jkl012.patch
```

**Gitignored**: `.mcp-cache/` sollte nicht committed werden

---

## Konfiguration

### `.gitignore`
```
node_modules/
dist/
.mcp-cache/
*.log
.DS_Store
.env
```

### `.eslintrc.json`
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "root": true
}
```

### `.prettierrc`
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2
}
```

---

## Zusammenfassung

Diese Struktur ist:
- **Modular**: Klare Trennung von Agents, Indexing, Analysis, Storage
- **Testbar**: Unit/Integration/E2E-Tests mit Fixtures
- **Skalierbar**: Einfach neue Agents oder Analysis-Tools hinzufügen
- **Wartbar**: Klare Verantwortlichkeiten, Type-Safety (TypeScript)

**Nächster Schritt**: Siehe IMPLEMENTATION_ROADMAP.md für phased implementation plan.
