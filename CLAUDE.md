# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt-Übersicht

**CodeWeaver** ist ein token-effizienter MCP (Model Context Protocol) Server für Java/Gradle-Projektanalyse mit semantischer Suche, Multi-Agent-Architektur und Dual-Interface (CLI + MCP Server).

- **Dual-Mode System**: Automatische Erkennung zwischen CLI (Terminal) und MCP Server (stdio) Modus
- **Multi-Agent Architektur**: 9 spezialisierte Agents für verschiedene Aufgaben
- **Zero Native Dependencies**: Pure Node.js/TypeScript ohne native Binaries
- **Token-Efficiency First**: Niemals ganze Files senden, nur gezielte Snippets

## Build & Development

### Standard-Commands

```bash
# Dependencies installieren
npm install

# TypeScript kompilieren
npm run build

# Build im Watch-Mode
npm run build:watch

# Development-Mode ohne Build (mit tsx)
npm run dev

# Produktions-Build starten
npm start
```

### Testing

```bash
# Alle Tests ausführen (Watch-Mode)
npm test

# Tests in CI-Mode (einmalig)
npm test -- --run

# Nur Unit-Tests
npm test:unit

# Nur Integration-Tests
npm test:integration

# Nur E2E-Tests
npm test:e2e

# Spezifischen Test ausführen
npm test -- tests/unit/agents/symbols.test.ts
```

**Test-Struktur:**
- `tests/unit/` - 73+ Unit-Tests für alle Agents und Core-Logic
- `tests/integration/` - 5 Integration-Tests (Smoke-Tests)
- `tests/fixtures/` - Test-Fixtures (gradle-projects, Java-Dateien)
- **Timeout**: 30 Sekunden für Tests (wichtig für Gradle-Tests)
- **Framework**: Vitest mit Node-Environment

### Linting & Formatting

```bash
# ESLint prüfen
npm run lint

# Prettier formatieren
npm run format

# Aufräumen (dist & cache löschen)
npm run clean
```

### CLI vs MCP Modus

**CLI-Modus (Terminal):**
```bash
# Als CLI nutzen (Auto-Detection via TTY)
npm run dev -- info
npm run dev -- symbols index
npm run dev -- search keyword "TODO"
npm run dev -- analysis project

# Mit gebautem Binary
node dist/index.js info
```

**MCP-Server-Modus (stdio):**
```bash
# Explizit MCP-Modus
npm run dev -- --mcp

# Test mit stdio
echo '{}' | npm run dev -- --mcp

# In MCP-Client-Config (z.B. Claude Desktop)
{
  "mcpServers": {
    "codeweaver": {
      "command": "node",
      "args": ["C:/develop/workspace/codeweaver/dist/index.js", "--mcp"],
      "cwd": "C:/path/to/your/java/project"
    }
  }
}
```

## Architektur

### Entry Point & Mode Detection

- **`src/index.ts`** - Haupteinstiegspunkt mit Auto-Detection
  - Prüft `process.stdin.isTTY` und `--mcp` Flag
  - Leitet an CLI oder MCP Server weiter

### Dual-Interface Pattern

```
src/
├── index.ts                      # Main entry (auto-detection)
├── cli/
│   ├── index.ts                  # CLI entry mit Commander.js
│   └── commands/                 # 7 Command-Gruppen
│       ├── info.ts               # Projekt-Informationen
│       ├── file.ts               # File-Reading-Commands
│       ├── symbols.ts            # Symbol-Indexierung
│       ├── search.ts             # Keyword/Semantic Search
│       ├── analysis.ts           # Code-Qualität & Metriken
│       ├── vcs.ts                # Git-Operationen
│       └── watch.ts              # File-Watcher für Index
├── mcp/
│   ├── index.ts                  # MCP entry mit stdio
│   ├── server.ts                 # MCP Server (SDK v1.0.4)
│   └── tools.ts                  # 19 MCP Tools
└── core/
    ├── service.ts                # ⭐ Shared Business Logic
    └── agents/                   # 9 spezialisierte Agents
```

**Wichtig**: CLI und MCP teilen sich die **exakt gleiche Business Logic** in `CodeWeaverService`!

### Multi-Agent System

**9 Agents** (alle implementiert):

1. **DiscoveryAgent** (`agents/discovery.ts`) - Gradle-Metadaten (build.gradle, settings.gradle)
2. **CacheAgent** (`agents/cache.ts`) - Content-addressable Caching mit SHA-256
3. **SnippetsAgent** (`agents/snippets.ts`) - Token-effizientes File-Reading
4. **SymbolsAgent** (`agents/symbols.ts`) - Java Symbol-Extraktion (java-parser)
   - Classes, Interfaces, Enums, Records, Annotation Types
   - Methods mit Parameters, Generics, Annotations
   - Fields mit Annotations, Modifiers
   - Constructors, Nested Types, Sealed Classes, Module System (Java 9+)
5. **SearchAgent** (`agents/search.ts`) - Keyword/Pattern-Suche (grep-like)
6. **AnalysisAgent** (`agents/analysis.ts`) - Cyclomatic Complexity, LOC, Code Smells
7. **VCSAgent** (`agents/vcs.ts`) - Git-Operationen (Status, Diff, Blame, Log, Branches)
8. **SemanticIndexAgent** (`agents/semantic.ts`) - LanceDB Vector Search mit ONNX Runtime
   - Multi-Collection Support (Code + Docs)
   - @xenova/transformers für Embeddings
   - Incremental Updates
9. **FileWatcherAgent** (`agents/watcher.ts`) - Chokidar File-Watcher für automatische Index-Updates

**Storage**:
- **JSON Lines** (`.codeweaver/symbols.jsonl`) - Symbol-Index-Persistenz
- **In-Memory Maps** - Performance-kritische Lookups
- **LanceDB** - Vector-Datenbank für semantische Suche (optional)

### MCP Tools (19 total)

**Projekt & Files:**
- `project.meta` - Projekt-Metadaten (Java-Version, Module, Dependencies)
- `file.read` - File mit Token-Limit (default: 10k tokens)
- `file.readRange` - Spezifische Zeilen (1-indexed, inclusive)
- `file.readWithNumbers` - File mit Zeilennummern

**Symbols:**
- `symbols.index` - Gesamtes Projekt indexieren
- `symbols.find` - Symbole nach Name suchen
- `symbols.findByKind` - Nach Symbol-Art filtern
- `symbols.get` - Symbol via Qualified Name

**Search:**
- `search.keyword` - Keyword-Suche (grep-like)
- `search.files` - Files nach Pattern finden
- `search.semantic` - Semantische Suche (Vector Search)

**Analysis:**
- `analysis.file` - File-Complexity & Metriken
- `analysis.project` - Projekt-Statistiken

**Version Control:**
- `vcs.status` - Git Status
- `vcs.diff` - Git Diff
- `vcs.blame` - Git Blame
- `vcs.log` - Commit History
- `vcs.branches` - Branch-Liste
- `vcs.compare` - Branch-Vergleich

## Wichtige Konzepte

### Token-Efficiency

**Nie ganze Files senden!** CodeWeaver ist darauf optimiert, nur relevante Snippets zu senden:

- **Line Ranges**: Nur angeforderte Zeilen senden
- **Token Limits**: Auto-Truncation (default: 10k tokens)
- **Smart Truncation**: Wortgrenzen respektieren
- **Context Windows**: Minimal Context um spezifische Zeilen

**Token-Estimation**: ~4 Zeichen = 1 Token

### Native Dependencies: Core vs Optional

**Core-Features (Zero Native Dependencies):**
- ✅ Pure JavaScript java-parser für Symbol-Extraktion
- ✅ JSON Lines für Persistenz
- ✅ In-Memory Maps für Performance
- ✅ Kein SQLite (native Bindings)
- ✅ Kein tree-sitter (native Compilation)

**Optional Features (Native Dependencies):**
- ⚠️ **Semantic Search**: Benötigt LanceDB + ONNX Runtime (Native Components)
  - LanceDB für Vector-Datenbank
  - ONNX Runtime für ML-Embeddings
  - Nur erforderlich wenn `search.semantic` genutzt wird

**Warum diese Trennung?**
- Core-Features funktionieren **überall** (Cross-Platform, keine Compilation)
- Semantic Search ist **opt-in** - nur installieren wenn benötigt
- Einfache Installation für Standard-Use-Cases (Symbols, Analysis, VCS)

### Semantic Search (Beta Feature)

**Neu in v0.2.0**: LanceDB + ONNX Runtime für AI-powered Code-Suche

**⚠️ Status: Beta** - Memory-intensiv, Performance-Testing empfohlen

**Features:**
- **Embeddings**: @xenova/transformers mit ONNX Runtime
- **Performance**: Multi-threading + SIMD für 3x schnellere Embeddings
- **Batch-Processing**: 16x schneller (10k Files in ~10 min statt 8h)
- **Multi-Collection**: Separate Indizes für Code UND Docs
- **File-Watcher**: Automatische Incremental Updates

**Realistische Performance-Erwartungen:**
- **Initiales Indexing**: ~1 Min pro 1000 Dateien (10k Files = ~10 Min)
- **Memory-Verbrauch**: ~500 MB - 2 GB (abhängig von Projektgröße)
- **Empfohlene Limits**:
  - ✅ Optimal: < 5k Dateien
  - ⚠️ Akzeptabel: 5k-10k Dateien (langsam, aber nutzbar)
  - ❌ Nicht empfohlen: > 10k Dateien (sehr langsam, hoher Memory-Verbrauch)

**Guides**:
- `SEMANTIC_SEARCH.md` - Workflows & Best Practices
- `MULTI_COLLECTION_GUIDE.md` - Code + Docs indexieren
- `FILE_WATCHER_GUIDE.md` - Automatische Index-Updates

**Tipp**: Für große Projekte besser **Keyword-Search** (`search.keyword`) verwenden - deutlich schneller!

## Code-Konventionen

### TypeScript Strict Mode

- **Strict**: `true` in tsconfig.json
- **Module**: `Node16` (ESM mit `.js` Extensions in Imports!)
- **Target**: `ES2022`
- **No Unused**: Locals, Parameters aktiviert
- **No Implicit Returns**: Aktiviert

**Wichtig**: Alle Imports müssen `.js` Extension haben (ESM-Standard):
```typescript
// ✅ Richtig
import { DiscoveryAgent } from './agents/discovery.js';

// ❌ Falsch
import { DiscoveryAgent } from './agents/discovery';
```

### Test-Driven Development

- **Tests vor Implementation** schreiben
- Jeder Agent hat eigene Test-Suite
- **100% Test Success Rate** beibehalten
- Vitest für Unit & Integration Tests
- Fixtures in `tests/fixtures/`

### Code-Style

- **ESLint**: TypeScript-ESLint Config
- **Prettier**: Standard-Config
- **Keine Unused Variables**: Build schlägt fehl
- **Explizite Return-Types**: Bei Public-Methoden

## Häufige Entwicklungs-Tasks

### Neuen Agent hinzufügen

1. Agent-Klasse in `src/core/agents/<name>.ts` erstellen
2. Types in `src/types/<name>.ts` definieren
3. In `CodeWeaverService` integrieren (`src/core/service.ts`)
4. CLI-Commands in `src/cli/commands/<name>.ts` hinzufügen
5. MCP-Tools in `src/mcp/tools.ts` registrieren
6. Tests in `tests/unit/agents/<name>.test.ts` schreiben

### Neues MCP Tool hinzufügen

1. Tool in `src/mcp/tools.ts` registrieren (ListToolsRequestSchema)
2. Tool-Handler implementieren (CallToolRequestSchema)
3. In `CodeWeaverService` integrieren falls nötig
4. Test in `tests/unit/mcp/server.test.ts` hinzufügen

### Test schreiben

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('MyAgent', () => {
  beforeEach(() => {
    // Setup
  });

  it('should do something', async () => {
    // Arrange
    const agent = new MyAgent('/test/path');

    // Act
    const result = await agent.doSomething();

    // Assert
    expect(result).toBeDefined();
  });
});
```

## Troubleshooting

### Build-Fehler

```bash
# Clean & Rebuild
npm run clean
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Test-Fehler

```bash
# Tests mit verbose output
npm test -- --run --reporter=verbose

# Einzelnen Test debuggen
npm test -- tests/unit/agents/symbols.test.ts --run
```

### MCP Server antwortet nicht

```bash
# Check stdio
echo '{}' | npm run dev -- --mcp

# Logs prüfen (MCP Server schreibt nach stderr)
npm run dev -- --mcp 2>mcp-errors.log
```

### Mode-Detection Probleme

```bash
# Explizit CLI-Modus erzwingen (TTY)
npm run dev info

# Explizit MCP-Modus erzwingen
npm run dev -- --mcp

# Mode-Detection prüfen
node -e "console.log('isTTY:', process.stdin.isTTY)"
```

## Wichtige Dateien

### Documentation

- `README.md` - Hauptdokumentation mit Quick-Start
- `DEVELOPER_WORKFLOW.md` - End-to-End Developer Guide (alle 19 Tools in Aktion)
- `docs/ARCHITECTURE.md` - System-Architektur Details
- `docs/USAGE.md` - CLI & MCP Usage Guide
- `docs/TESTING.md` - Test-Strategie & Coverage
- `docs/STATUS_AND_ROADMAP.md` - Feature-Status & Roadmap

### Configuration

- `package.json` - Dependencies & Scripts
- `tsconfig.json` - TypeScript Config (Strict, ESM)
- `vitest.config.ts` - Test Config (30s Timeout)
- `.eslintrc.json` - ESLint Rules

### Core Files

- `src/index.ts` - Main Entry (Auto-Detection)
- `src/core/service.ts` - Shared Business Logic (⭐ wichtigste Datei)
- `src/mcp/tools.ts` - MCP Tool Definitions
- `src/cli/index.ts` - CLI Entry mit Commander.js

## Aktuelle Version & Status

**Version**: v0.2.0 (Beta)
**Status**: Complete Modern Java Support (Java 8-23)

**Features:**
- ✅ 19 MCP Tools
- ✅ 7 CLI Command-Gruppen
- ✅ 9 Agents (alle implementiert)
- ✅ Semantic Search mit ONNX Runtime
- ✅ Multi-Collection Support
- ✅ File-Watcher für Auto-Updates
- ✅ 102 Tests passing

**Known Limitations:**
- Performance-Issues bei >10k Files
- Semantic Search hat hohen Memory-Verbrauch
- Breaking Changes möglich in zukünftigen Releases

**Roadmap**: Phase 5 (Orchestration) geplant mit DAG-based Pipeline und paralleler Ausführung.

## Production-Readiness Matrix

**Klare Einordnung welche Features production-ready sind:**

| Feature-Kategorie | Status | Verwendung | Einschränkungen |
|-------------------|--------|------------|-----------------|
| **Core Features** | | | |
| ├─ Discovery (Gradle) | ✅ Production-Ready | MCP + CLI | Nur Gradle-Projekte |
| ├─ Symbols (Java) | ✅ Production-Ready | MCP + CLI | Java 8-23, vollständig getestet |
| ├─ Search (Keyword) | ✅ Production-Ready | MCP + CLI | Grep-like, zuverlässig |
| ├─ Analysis (Complexity) | ✅ Production-Ready | MCP + CLI | Cyclomatic Complexity, LOC |
| └─ VCS (Git) | ✅ Production-Ready | MCP + CLI | Git-Operationen, stabil |
| **Beta Features** | | | |
| ├─ Semantic Search | ⚠️ Beta | MCP + CLI | Memory-intensiv, ~10 Min für 10k Files |
| └─ Multi-Collection | ⚠️ Beta | CLI | Code + Docs, noch in Entwicklung |
| **Experimental** | | | |
| └─ File Watcher | 🧪 Experimental | CLI only | Kann schnelle Änderungen verpassen |

**Empfehlungen:**
- ✅ **Production**: Core-Features (Discovery, Symbols, Search, Analysis, VCS)
- ⚠️ **Vorsicht**: Semantic Search - erst in Dev-Umgebung testen (Memory + Performance)
- 🧪 **Testing only**: File Watcher - noch nicht für kritische Workflows

**Performance-Erwartungen:**
- **Kleine Projekte** (<1k Dateien): Alle Features gut nutzbar
- **Mittlere Projekte** (1k-5k Dateien): Core-Features ⚡, Semantic Search langsamer ⏱️
- **Große Projekte** (5k-10k Dateien): Core-Features ⚡, Semantic Search sehr langsam 🐌
- **Sehr große Projekte** (>10k Dateien): Core-Features ⚡, Semantic Search **nicht empfohlen** ❌
