# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projekt-Übersicht

**CodeWeaver** ist ein token-effizienter MCP (Model Context Protocol) Server für Multi-Language-Projektanalyse (Java, TypeScript, JavaScript, Markdown, Python) mit semantischer Suche, Multi-Agent-Architektur und Dual-Interface (CLI + MCP Server).

- **Dual-Mode System**: Automatische Erkennung zwischen CLI (Terminal) und MCP Server (stdio) Modus
- **Multi-Agent Architektur**: 11 spezialisierte Agents für verschiedene Aufgaben
- **Multi-Language Support**: Java, TypeScript, JavaScript, Markdown, Python mit Plugin-Architektur (einfach erweiterbar)
- **Zero Native Dependencies**: Pure Node.js/TypeScript ohne native Binaries (Core-Features)
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
- `tests/unit/` - Unit-Tests für alle Agents, Language-Plugins und Core-Logic
  - Agents Tests (symbols, search, analysis, semantic, vcs, watcher)
  - Language Plugin Tests (Java, TypeScript, JavaScript, Markdown, Python)
  - Language System Tests (detector, registry)
- `tests/integration/` - 12 Integration-Tests (5 Smoke-Tests + 12 Multi-Language Tests)
- `tests/fixtures/` - Test-Fixtures (gradle-projects, Java/TypeScript/Markdown/Python-Dateien)
- **Timeout**: 30 Sekunden für Tests (wichtig für Gradle-Tests)
- **Framework**: Vitest mit Node-Environment
- **Total**: 291 Tests passing (100%)

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
│   └── tools.ts                  # 22 MCP Tools
└── core/
    ├── service.ts                # ⭐ Shared Business Logic
    └── agents/                   # 11 spezialisierte Agents
```

**Wichtig**: CLI und MCP teilen sich die **exakt gleiche Business Logic** in `CodeWeaverService`!

### Multi-Agent System

**11 Agents** (alle implementiert):

1. **ProjectMetadataAgent** (`agents/projectMetadata.ts`) - Multi-Language Metadaten (Gradle, npm) mit Plugin-Architektur
2. **CacheAgent** (`agents/cache.ts`) - Content-addressable Caching mit SHA-256
3. **SnippetsAgent** (`agents/snippets.ts`) - Token-effizientes File-Reading
4. **SymbolsAgent** (`agents/symbols.ts`) - Multi-Language Symbol-Extraktion mit Plugin-Architektur
   - **Java**: Classes, Interfaces, Enums, Records, Annotation Types, Sealed Classes, Module System (Java 9+)
   - **TypeScript**: Classes, Interfaces, Types, Enums, Functions, Generics, Decorators, Namespaces
   - **JavaScript**: Classes, Functions, Arrow Functions, Async/Await, ES6+
   - **Markdown**: Headers as Sections, Local Links as References, Code Blocks
   - **Python**: Classes, Functions, Methods, Decorators (@decorator), Type Hints, Async/Await
   - Methods/Functions mit Parameters, Generics, Annotations/Decorators
   - Fields/Properties mit Modifiers, Visibility
   - Constructors, Nested Types, Enum Constants
   - Language-tagged symbols (`language` field: 'java' | 'typescript' | 'javascript' | 'markdown' | 'python')
5. **SearchAgent** (`agents/search.ts`) - Keyword/Pattern-Suche (grep-like)
6. **AnalysisAgent** (`agents/analysis.ts`) - Cyclomatic Complexity, LOC, Code Smells
7. **VCSAgent** (`agents/vcs.ts`) - Git-Operationen (Status, Diff, Blame, Log, Branches)
8. **SemanticIndexAgent** (`agents/semantic.ts`) - LanceDB Vector Search mit ONNX Runtime
   - Multi-Collection Support (Code + Docs)
   - @xenova/transformers für Embeddings
   - Incremental Updates
9. **FileWatcherAgent** (`agents/watcher.ts`) - Chokidar File-Watcher für automatische Index-Updates
10. **SystemCheckAgent** (`agents/systemCheck.ts`) - Dependency-Validierung (Node.js, Git, Python, Gradle, Maven)
11. **StaticAnalysisAgent** (`agents/staticAnalysis.ts`) - SpotBugs & Checkstyle Integration mit Plugin-Architektur

**Storage**:
- **JSON Lines** (`.codeweaver/symbols.jsonl`) - Symbol-Index-Persistenz
- **In-Memory Maps** - Performance-kritische Lookups
- **LanceDB** - Vector-Datenbank für semantische Suche (optional)

### MCP Tools (22 total)

**Projekt & Files:**
- `project.meta` - Multi-Language Projekt-Metadaten (auto-detects: Gradle, npm, pip, Maven, etc.)
  - Optional `projectType` parameter for specific extraction
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

**Static Analysis:**
- `staticAnalysis.tools` - Verfügbare Tools und Installation prüfen
- `staticAnalysis.run` - SpotBugs/Checkstyle ausführen
- `staticAnalysis.report` - Formatierter Text-Report

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
- ✅ Pure JavaScript/WASM Parsers für Multi-Language Support:
  - java-parser für Java (AST-basiert, Pure JS)
  - @typescript-eslint/typescript-estree für TypeScript/JavaScript (ESTree-kompatibel, Pure JS)
  - remark/unified für Markdown (MDAST, Pure JS)
  - tree-sitter-wasms + web-tree-sitter für Python (WASM-basiert)
- ✅ JSON Lines für Persistenz
- ✅ In-Memory Maps für Performance
- ✅ Kein SQLite (native Bindings)
- ✅ Keine native Compilation erforderlich (außer Python WASM init)

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

### Multi-Language Plugin Architecture

**Neu in v0.2.0**: Hybrid Plugin-Architektur für Multi-Language-Support

**Design-Pattern:**
- **SymbolsAgent**: Orchestrator für Symbol-Extraktion (zentrale API bleibt unverändert)
- **LanguagePlugin Interface**: Einheitliche API für alle Sprachen (`parse`, `extractSymbols`, `validate`)
- **Plugin Registry**: Zentrale Verwaltung aller Language-Plugins mit File-Extension-basierter Erkennung
- **Language Detector**: Automatische Sprach-Erkennung basierend auf Datei-Endungen

**Plugin-Struktur:**
```
src/core/language/
├── plugin.ts                    # LanguagePlugin Interface + BaseLanguagePlugin
├── detector.ts                  # Language detection from file extensions
├── registry.ts                  # LanguagePluginRegistry (register, get, filter, group)
└── plugins/
    ├── java/
    │   ├── index.ts             # JavaLanguagePlugin
    │   ├── parser.ts            # java-parser Wrapper
    │   └── extractor.ts         # Java AST → SymbolDefinition[]
    └── typescript/
        ├── index.ts             # TypeScriptLanguagePlugin + JavaScriptLanguagePlugin
        ├── parser.ts            # typescript-estree Wrapper
        └── extractor.ts         # TS/JS AST → SymbolDefinition[]
```

**Supported Languages:**
- ✅ **Java** (.java) - java-parser
  - Alle Java 8-23 Features (Records, Sealed Classes, Module System)
- ✅ **TypeScript** (.ts, .tsx, .mts, .cts) - @typescript-eslint/typescript-estree
  - Alle TypeScript Features (Generics, Decorators, Interfaces, Types, Enums)
- ✅ **JavaScript** (.js, .jsx, .mjs, .cjs) - @typescript-eslint/typescript-estree
  - Modern ES6+ Features (Arrow Functions, Async/Await, Classes)
- ✅ **Markdown** (.md, .markdown, .mdown, .mkd) - remark/unified
  - Headers as Sections, Local Links as References, Code Blocks
- ⚠️ **Python** (.py, .pyi, .pyw) - tree-sitter-wasms + web-tree-sitter
  - Classes, Functions, Methods, Decorators, Type Hints, Async/Await
  - Fully functional with tree-sitter WASM

**Backward Compatibility:**
- ✅ SymbolsAgent API bleibt unverändert (`parseFile`, `indexProject`, `findSymbolsByName`, etc.)
- ✅ Alle 163 bestehenden Tests bleiben grün
- ✅ `language` field ist optional in SymbolDefinition (Abwärtskompatibilität)
- ✅ Zero Breaking Changes

**Neue Funktionalität:**
- `registry.hasPlugin(language)` - Prüft ob Language-Plugin verfügbar
- `registry.getPluginForFile(filePath)` - Ermittelt Plugin anhand File-Extension
- `registry.getSupportedLanguages()` - Liste aller unterstützten Sprachen
- `registry.filterSupportedFiles(files)` - Filtert Files nach unterstützten Extensions
- `registry.groupFilesByLanguage(files)` - Gruppiert Files nach Sprache

**Extensibility:**
- Neue Language-Plugins einfach hinzufügen durch:
  1. Neues Plugin in `src/core/language/plugins/<language>/` erstellen
  2. `LanguagePlugin` Interface implementieren
  3. In `SymbolsAgent.registerDefaultPlugins()` registrieren
- Siehe `src/core/language/plugins/java/` oder `typescript/` als Beispiele

**Tests:**
- 23 Tests für Java-Plugin
- 21 Tests für TypeScript/JavaScript-Plugin
- 13 Tests für Markdown-Plugin
- 18 Tests für Python-Plugin
- 12 Multi-Language Integration Tests
- **Total: 291 Tests passing (100%)**

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

### Neues Language Plugin hinzufügen

**Beispiel: Python Support hinzufügen**

1. **Plugin-Verzeichnis erstellen**:
   ```bash
   mkdir -p src/core/language/plugins/python
   ```

2. **Parser implementieren** (`src/core/language/plugins/python/parser.ts`):
   ```typescript
   import type { ParseResult } from '../../../../types/language.js';

   export async function parsePythonSource(source: string, filePath: string): Promise<ParseResult> {
     try {
       // TODO: Use python-parser oder andere AST-Library
       const ast = parse(source);
       return { ast, errors: [], success: true, filePath };
     } catch (error) {
       return { ast: null, errors: [/* ... */], success: false, filePath };
     }
   }
   ```

3. **Extractor implementieren** (`src/core/language/plugins/python/extractor.ts`):
   ```typescript
   import type { SymbolDefinition } from '../../../../types/symbols.js';

   export function extractSymbols(ast: any, filePath: string): SymbolDefinition[] {
     const symbols: SymbolDefinition[] = [];
     // TODO: AST traversieren und Symbole extrahieren
     return symbols.map(s => ({ ...s, language: 'python' })); // Language field hinzufügen!
   }
   ```

4. **Plugin-Klasse erstellen** (`src/core/language/plugins/python/index.ts`):
   ```typescript
   import { BaseLanguagePlugin } from '../../plugin.js';
   import type { LanguageMetadata, ParseResult, PluginConfig } from '../../../../types/language.js';
   import type { SymbolDefinition } from '../../../../types/symbols.js';
   import { parsePythonSource } from './parser.js';
   import { extractSymbols } from './extractor.js';

   export class PythonLanguagePlugin extends BaseLanguagePlugin {
     readonly metadata: LanguageMetadata = {
       language: 'python',
       fileExtensions: ['.py', '.pyi'],
       displayName: 'Python',
       supportsGenerics: true,
       supportsDecorators: true,
       supportsModules: true,
       supportsClasses: true,
       supportsFunctions: true,
     };

     async parse(source: string, filePath: string, config?: PluginConfig): Promise<ParseResult> {
       return parsePythonSource(source, filePath);
     }

     async extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
       return extractSymbols(ast, filePath);
     }
   }
   ```

5. **Plugin registrieren** (`src/core/agents/symbols.ts`):
   ```typescript
   import { PythonLanguagePlugin } from '../language/plugins/python/index.js';

   private registerDefaultPlugins(): void {
     this.registry.register('java', new JavaLanguagePlugin());
     this.registry.register('typescript', new TypeScriptLanguagePlugin());
     this.registry.register('javascript', new JavaScriptLanguagePlugin());
     this.registry.register('python', new PythonLanguagePlugin()); // NEU!
   }
   ```

6. **Language-Typ erweitern** (`src/types/language.ts`):
   ```typescript
   export type Language = 'java' | 'typescript' | 'javascript' | 'python';
   ```

7. **Tests schreiben** (`tests/unit/language/python.test.ts`):
   ```typescript
   import { describe, it, expect } from 'vitest';
   import { PythonLanguagePlugin } from '../../../src/core/language/plugins/python/index.js';

   describe('PythonLanguagePlugin', () => {
     it('should extract Python symbols', async () => {
       const plugin = new PythonLanguagePlugin();
       const source = 'def hello(): pass';
       const result = await plugin.parse(source, 'test.py');
       expect(result.success).toBe(true);

       const symbols = await plugin.extractSymbols(result.ast!, 'test.py');
       expect(symbols.length).toBeGreaterThan(0);
       expect(symbols[0].language).toBe('python');
     });
   });
   ```

8. **Test Fixtures erstellen** (`tests/fixtures/python/simple.py`):
   ```python
   def hello(name: str) -> str:
       return f"Hello, {name}!"

   class Greeter:
       def greet(self) -> None:
           print(hello("World"))
   ```

9. **Alle Tests ausführen**:
   ```bash
   npm test -- --run
   ```

**Best Practices:**
- Alle Symbole mit `language` field taggen
- Backward-kompatibel bleiben (keine Breaking Changes)
- Comprehensive Tests schreiben (Fixtures + Unit Tests)
- Alle bestehenden Tests müssen grün bleiben!

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

**Version**: v0.6.0 (Beta)
**Status**: Multi-Language Support + Static Analysis + Code Cleanup

**Features:**
- ✅ 22 MCP Tools
- ✅ 8 CLI Command-Gruppen (inkl. `doctor`)
- ✅ **11 Agents** (Project Metadata, Cache, Snippets, Symbols, Search, Analysis, VCS, Semantic Index, File Watcher, System Check, Static Analysis)
- ✅ **Multi-Language Plugin Architecture** (Java, TypeScript, JavaScript, Markdown, Python)
- ✅ **Static Analysis** (SpotBugs, Checkstyle) mit Plugin-Architektur
- ✅ Semantic Search mit ONNX Runtime
- ✅ Multi-Collection Support
- ✅ File-Watcher für Auto-Updates
- ✅ 291 Tests passing (100%)

**Known Limitations:**
- Performance-Issues bei >10k Files
- Semantic Search hat hohen Memory-Verbrauch
- Breaking Changes möglich in zukünftigen Releases

**Roadmap**: PMD und SonarLint Integration geplant.

## Production-Readiness Matrix

**Klare Einordnung welche Features production-ready sind:**

| Feature-Kategorie | Status | Verwendung | Einschränkungen |
|-------------------|--------|------------|-----------------|
| **Core Features** | | | |
| ├─ Project Metadata (Multi-Language) | ✅ Production-Ready | MCP + CLI | Gradle, npm - vollständig getestet |
| ├─ Symbols (Multi-Language) | ✅ Production-Ready | MCP + CLI | Java, TypeScript, JavaScript, Markdown - vollständig getestet |
| ├─ Symbols (Python) | ✅ Production-Ready | MCP + CLI | Fully functional |
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
