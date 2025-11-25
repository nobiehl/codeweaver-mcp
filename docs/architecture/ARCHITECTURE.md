# CodeWeaver Architecture

**Version 2.0 - Konsolidiert 2025-11-14**

---

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Dual-Mode Architektur](#dual-mode-architektur)
3. [Multi-Agent System](#multi-agent-system)
4. [Zero Native Dependencies](#zero-native-dependencies)
5. [Directory Structure](#directory-structure)

---

<a id="übersicht"></a>
## 🎯 Übersicht

CodeWeaver ist ein leichtgewichtiger **Model Context Protocol (MCP) Server** für Java/Gradle-Projekte.

### Design-Prinzipien

1. **Token Efficiency First** - Niemals ganze Files, nur geziel Snippets
2. **Zero Native Dependencies** - Pure Node.js/TypeScript
3. **Dual Interface** - CLI + MCP Server aus gleicher Codebasis
4. **Multi-Agent System** - 9 spezialisierte Agents
5. **Test-Driven** - 73 Tests, 100% passing

### High-Level Architektur

```
┌─────────────────────────────────────────────────────────┐
│                    CodeWeaver                           │
├──────────────────────┬──────────────────────────────────┤
│   CLI Interface      │      MCP Server Interface        │
│   (Terminal)         │      (stdio, JSON-RPC)          │
├──────────────────────┴──────────────────────────────────┤
│              Shared Core Business Logic                 │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐      │
│  │   Agents   │  │   Search   │  │  Analysis   │      │
│  └────────────┘  └────────────┘  └─────────────┘      │
├─────────────────────────────────────────────────────────┤
│              Storage & Cache Layer                      │
│  ┌────────────┐  ┌────────────┐  ┌─────────────┐      │
│  │JSON Lines  │  │   Symbol   │  │   Cache     │      │
│  └────────────┘  └────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

---

## 🔀 Dual-Mode Architektur

### Entry Points

| Binary | Mode | Transport | Use Case |
|--------|------|-----------|----------|
| `codeweaver` | Auto-Detect | TTY / stdio | CLI oder MCP |
| `codeweaver --mcp` | MCP | stdio | Explizit MCP |
| `codeweaver <cmd>` | CLI | Terminal | Direkte Nutzung |

### Auto-Detection

**Mode Detection Logic**:
```typescript
export function isMCPMode(): boolean {
  if (!process.stdin.isTTY) return true;  // stdio = MCP
  if (process.argv.includes('--mcp')) return true;
  return false;  // Default: CLI
}
```

---

## 🤖 Multi-Agent System

### 9 Implementierte Agents

| # | Agent | Zweck | Status |
|---|-------|-------|--------|
| 1 | **Project Metadata** | Multi-Language Metadaten (Gradle, npm, etc.) | ✅ Phase 1 |
| 2 | **Cache** | Content-addressable Caching | ✅ Phase 1 |
| 3 | **Snippets** | Token-effizientes File-Reading | ✅ Phase 1 |
| 4 | **Symbols** | Multi-Language Symbol-Extraktion | ✅ Phase 2 |
| 5 | **Search** | Keyword/Pattern-Suche | ✅ Phase 2 |
| 6 | **Analysis** | Complexity & Metrics | ✅ Phase 3 |
| 7 | **VCS** | Git-Operationen | ✅ Phase 4 |
| 8 | **Semantic Index** | LanceDB Vector Search | ✅ Phase 4 |
| 9 | **File Watcher** | Automatic Index Updates | ✅ Phase 4 |

### Shared Core Service

**Zentrale Business Logic** (`src/core/service.ts`):
```typescript
export class CodeWeaverService {
  private projectMetadataAgent: ProjectMetadataAgent;
  private cacheAgent: CacheAgent;
  private snippetsAgent: SnippetsAgent;
  private symbolsAgent: SymbolsAgent;
  private searchAgent: SearchAgent;
  private analysisAgent: AnalysisAgent;
  private vcsAgent: VCSAgent;
  private semanticAgent: SemanticIndexAgent;

  // Beide Interfaces (CLI + MCP) nutzen diese Methoden:
  async getUnifiedProjectMetadata(): Promise<UnifiedProjectMetadata | null> { ... }
  async buildIndex(): Promise<IndexStats> { ... }
  async searchKeyword(query: string): Promise<SearchResult[]> { ... }
  async analyzeFile(path: string): Promise<AnalysisReport> { ... }
  async getGitStatus(): Promise<FileStatus[]> { ... }
}
```

---

## 🪶 Zero Native Dependencies

### Philosophie

**Keine Installation nativer Bibliotheken erforderlich**:
- ❌ **KEIN** SQLite (native Binaries)
- ❌ **KEIN** tree-sitter (native Compilation)
- ✅ **NUR** Pure JavaScript/TypeScript
- ✅ **JSON-basierte** Persistenz
- ✅ **In-Memory** für Performance

### Gewählte Alternativen

| Feature | Native Option | Unsere Lösung |
|---------|---------------|---------------|
| **Symbol Index** | SQLite | JSON Lines + In-Memory Maps |
| **Java Parsing** | tree-sitter | java-parser (Pure JS) |
| **Vector DB** | LanceDB (optional) | Deferred für später |

### Storage: JSON Lines

**Format** (`.mcp-cache/symbols.jsonl`):
```json
{"type":"symbol","id":"com.example.MyClass","kind":"class","name":"MyClass",...}
{"type":"symbol","id":"com.example.MyClass#myMethod","kind":"method",...}
{"type":"reference","from":{"path":"...","line":42},"to":"com.example.MyClass#myMethod"}
```

**Vorteile**:
- ✅ Streaming-fähig (große Dateien zeilenweise lesen)
- ✅ Human-readable
- ✅ Keine Compilation nötig
- ✅ Cross-Platform ohne Probleme

---

## 📁 Directory Structure

```
src/
├── index.ts                      # Main entry (auto-detection)
├── cli/
│   ├── index.ts                  # CLI entry point
│   └── commands/
│       ├── info.ts               # Info command
│       ├── file.ts               # File commands
│       ├── symbols.ts            # Symbols commands
│       ├── search.ts             # Search commands
│       ├── analysis.ts           # Analysis commands
│       └── vcs.ts                # VCS commands
├── mcp/
│   ├── index.ts                  # MCP entry point
│   ├── server.ts                 # MCPServer class
│   └── tools.ts                  # Tool registration (19 tools)
├── core/
│   ├── service.ts                # Shared business logic
│   ├── agents/
│   │   ├── projectMetadata.ts    # Multi-language project metadata
│   │   ├── cache.ts              # Caching
│   │   ├── snippets.ts           # File reading
│   │   ├── symbols.ts            # Multi-language symbol extraction
│   │   ├── search.ts             # Keyword/pattern search
│   │   ├── analysis.ts           # Complexity analysis
│   │   ├── vcs.ts                # Git operations
│   │   ├── semantic.ts           # LanceDB vector search
│   │   └── watcher.ts            # File watcher
│   └── storage/
│       └── json-symbol-store.ts  # Symbol index
├── types/
│   ├── mcp.ts
│   ├── progress.ts
│   ├── project.ts
│   ├── cache.ts
│   ├── symbols.ts
│   ├── analysis.ts
│   └── vcs.ts
└── utils/
    ├── progress-writer.ts        # Progress tracking
    └── mode-detector.ts          # CLI vs MCP detection

tests/
├── unit/                         # 68 tests
│   ├── mcp/
│   ├── agents/
│   └── storage/
└── integration/                  # 5 tests
    └── smoke.test.ts
```

---

## 🔄 Data Flow

### CLI-Modus

```
User → CLI Command → Commander.js → CodeWeaverService → Agents → Storage
                                                              ↓
User ← Pretty Output ← CLI Formatter ← Results ← ← ← ← ← ← ←
```

### MCP-Modus

```
LLM → MCP Tool Call → JSON-RPC → CodeWeaverService → Agents → Storage
                                                           ↓
LLM ← JSON Response ← MCP Handler ← Results ← ← ← ← ← ← ←
```

**Wichtig**: Beide Modi nutzen **exakt dieselbe Business Logic** (`CodeWeaverService`)!

---

## 📊 Statistiken

- **Total Files**: 30+ TypeScript files
- **Lines of Code**: ~5.000
- **Tests**: 73 (68 unit + 5 integration)
- **Test Success Rate**: 100% ✅
- **MCP Tools**: 19
- **CLI Commands**: 7 Groups, 20+ Commands
- **Agents**: 9 implementiert (Project Metadata, Cache, Snippets, Symbols, Search, Analysis, VCS, Semantic Index, File Watcher)
- **Dependencies**: 100% Pure Node.js

---

**Mehr Details**:
- Fehlende Features: [STATUS_AND_ROADMAP.md](./../development/STATUS_AND_ROADMAP.md)
- Testing: [TESTING.md](./../development/TESTING.md)
- Usage: [USAGE.md](./../reference/USAGE.md)
