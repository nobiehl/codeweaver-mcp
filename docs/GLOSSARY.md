# 📖 Glossary - CodeWeaver Terms & Concepts

**Comprehensive glossary of terms, acronyms, and concepts used in CodeWeaver documentation.**

---

## A

### Agent
A specialized module in CodeWeaver's multi-agent architecture that handles a specific domain. Each agent has focused responsibilities and communicates through the CodeWeaverService.

**9 Agents:**
- **Project Metadata Agent** - Multi-language project metadata extraction (Gradle, npm, etc.)
- **Symbols Agent** - Multi-language symbol extraction (Java, TypeScript, JavaScript, Markdown, Python)
- **Search Agent** - Keyword and pattern search
- **Analysis Agent** - Code quality metrics
- **VCS Agent** - Git operations
- **Semantic Index Agent** - Vector search with LanceDB
- **File Watcher Agent** - Automatic index updates
- **Snippets Agent** - Token-efficient file reading
- **Cache Agent** - Content-addressable caching

**Related:** [Multi-Agent Architecture](#multi-agent-architecture)

### Analysis Agent
Agent responsible for code quality metrics including cyclomatic complexity, lines of code (LOC), and code smell detection.

**Location:** `src/core/agents/analysis.ts`

### Annotation (Java)
Java metadata attached to classes, methods, or fields (e.g., `@Service`, `@Override`, `@Transactional`). CodeWeaver extracts annotations for Spring, JPA, and Jakarta EE frameworks.

**TypeScript equivalent:** [Decorator](#decorator-typescript)

### AST (Abstract Syntax Tree)
Tree representation of source code structure. CodeWeaver uses language-specific parsers to generate ASTs for symbol extraction:
- **Java:** java-parser
- **TypeScript/JavaScript:** @typescript-eslint/typescript-estree
- **Python:** tree-sitter-wasms
- **Markdown:** remark/unified

**Related:** [Parser](#parser)

---

## C

### Cache Agent
Content-addressable caching agent using SHA-256 hashing for fast file content lookups. Avoids re-reading unchanged files.

**Location:** `src/core/agents/cache.ts`

### CLI (Command Line Interface)
Terminal-based interface for CodeWeaver. Automatically detected when `process.stdin.isTTY` is true.

**Commands:** `info`, `symbols`, `search`, `analysis`, `vcs`, `watch`

**Related:** [MCP Server](#mcp-server)

### Claude Code
Anthropic's CLI tool that can connect to MCP servers like CodeWeaver for enhanced code analysis capabilities.

**Related:** [MCP](#mcp-model-context-protocol)

### Collection
In semantic search, a separate index for different document types. CodeWeaver supports:
- **Code Collection:** Source code files (.java, .ts, .js, .py)
- **Docs Collection:** Documentation files (.md)

**Related:** [Semantic Search](#semantic-search)

### Context Window
The amount of text/tokens an AI model can process at once. CodeWeaver is optimized for token-efficiency to fit within AI context limits.

**Example:** Claude 3.5 Sonnet has a 200k token context window.

**Related:** [Token](#token)

### Cyclomatic Complexity
Metric measuring code complexity by counting independent paths through code. CodeWeaver calculates this for methods/functions.

**Example:**
- Complexity 1-5: Simple
- Complexity 6-10: Moderate
- Complexity 11+: High (refactoring recommended)

**Related:** [Analysis Agent](#analysis-agent)

---

## D

### Decorator (TypeScript)
TypeScript/JavaScript metadata syntax for classes and methods (e.g., `@Component`, `@Injectable`). Similar to Java annotations.

**Related:** [Annotation](#annotation-java)

### Dual Interface
CodeWeaver's design supporting both CLI and MCP Server modes from the same codebase, with automatic mode detection.

**Entry point:** `src/index.ts`

---

## E

### Embedding
Vector representation of text/code used for semantic search. CodeWeaver uses ONNX Runtime with transformer models to generate embeddings.

**Model:** All-MiniLM-L6-v2 (384 dimensions)

**Related:** [Semantic Search](#semantic-search), [Vector Search](#vector-search)

### ESM (ECMAScript Modules)
Modern JavaScript module system. CodeWeaver is built with ESM (requires `.js` extensions in TypeScript imports).

**tsconfig.json:** `"module": "Node16"`

---

## F

### File Watcher Agent
Experimental agent using Chokidar to watch file changes and automatically update indexes.

**Status:** 🧪 Experimental

**Location:** `src/core/agents/watcher.ts`

---

## G

### Generics
Type parameters in Java/TypeScript (e.g., `List<String>`, `Array<T>`). CodeWeaver extracts generic signatures for methods and classes.

**Example:** `public <T> List<T> findAll(Class<T> type)`

### Git Integration
VCS Agent features for Git operations: status, diff, blame, log, branches, compare.

**Library:** simple-git

**Related:** [VCS Agent](#vcs-agent)

### Gradle
Java build tool. CodeWeaver's Project Metadata Agent extracts metadata from `build.gradle` and `settings.gradle` via GradleMetadataPlugin.

**Related:** [Project Metadata Agent](#project-metadata-agent)

---

## J

### JSON Lines (JSONL)
File format where each line is a valid JSON object. CodeWeaver uses `.codeweaver/symbols.jsonl` for persisting the symbol index.

**Example:**
```jsonl
{"name":"UserService","kind":"class","line":15}
{"name":"createUser","kind":"method","line":45}
```

---

## L

### LanceDB
Vector database for storing and querying embeddings in semantic search. Native component (optional dependency).

**Related:** [Semantic Search](#semantic-search), [Vector Search](#vector-search)

### Language Plugin
Pluggable module for multi-language support. Each plugin implements `LanguagePlugin` interface with `parse()` and `extractSymbols()` methods.

**Supported languages:** Java, TypeScript, JavaScript, Markdown, Python

**Location:** `src/core/language/plugins/`

**Related:** [Plugin Architecture](#plugin-architecture)

### LOC (Lines of Code)
Metric counting lines of source code (excluding comments/blanks). Used by Analysis Agent.

---

## M

### MCP (Model Context Protocol)
Anthropic's protocol for connecting AI assistants to external data sources and tools. CodeWeaver implements MCP v1.0.

**Specification:** https://modelcontextprotocol.io/

**Related:** [MCP Server](#mcp-server)

### MCP Server
CodeWeaver's stdio-based server mode for AI integration. Provides 19 MCP tools for Claude and other AI assistants.

**Mode detection:** `--mcp` flag or non-TTY stdin

**Location:** `src/mcp/server.ts`

### Multi-Agent Architecture
CodeWeaver's design pattern with 10 specialized agents, each handling a specific domain (project metadata, symbols, search, analysis, VCS, semantic, watcher, snippets, cache, discovery).

**Benefits:** Separation of concerns, testability, extensibility

**Central Service:** CodeWeaverService coordinates all agents

**Related:** [Agent](#agent)

### Multi-Collection
Feature for separate semantic search indexes for Code and Docs. Allows targeted searches.

**Commands:**
```bash
npm run dev -- semantic index --collection code
npm run dev -- semantic search "auth" --collection docs
```

**Related:** [Collection](#collection)

### npm
Node.js package manager. CodeWeaver's Project Metadata Agent extracts metadata from `package.json` via NpmMetadataPlugin. Supports npm, yarn, pnpm, and bun detection.

**Related:** [Project Metadata Agent](#project-metadata-agent), [Package Manager](#package-manager)

---

## O

### ONNX Runtime
Cross-platform ML inference engine. CodeWeaver uses it for generating embeddings in semantic search.

**Optimizations:** Multi-threading, SIMD, batch processing

**Related:** [Embedding](#embedding)

---

## P

### Package Manager
Tool for managing project dependencies. CodeWeaver's NpmMetadataPlugin auto-detects: npm (package-lock.json), yarn (yarn.lock), pnpm (pnpm-lock.yaml), bun (bun.lockb).

**Related:** [npm](#npm), [Project Metadata Agent](#project-metadata-agent)

### Parser
Tool for converting source code into an AST. CodeWeaver uses language-specific parsers:
- **Java:** java-parser (pure JS)
- **TypeScript/JavaScript:** typescript-estree
- **Python:** tree-sitter-wasms
- **Markdown:** remark

**Related:** [AST](#ast-abstract-syntax-tree)

### Plugin Architecture
Design allowing easy addition of new language support through the `LanguagePlugin` interface.

**Components:** Plugin Registry, Language Detector, BaseLanguagePlugin

**Related:** [Language Plugin](#language-plugin)

### Production-Ready
Status indicating a feature is stable and tested for production use. Core features (Discovery, Symbols, Search, Analysis, VCS) are production-ready.

**Beta features:** Semantic Search, Multi-Collection

**Experimental:** File Watcher

### Project Metadata Agent
Multi-language agent for extracting project metadata with plugin architecture. Supports Gradle, npm, and extensible for pip, Maven, Cargo, etc.

**Features:**
- Auto-detection of project types
- Unified schema for all languages
- Plugin-based extensibility

**Location:** `src/core/agents/projectMetadata.ts`

**Plugins:** `src/core/projectMetadata/plugins/`

**Related:** [Plugin Architecture](#plugin-architecture)

---

## Q

### Qualified Name
Fully qualified identifier for a symbol including package/module path.

**Examples:**
- Java: `com.example.services.UserService`
- TypeScript: `@myapp/services/UserService`
- Method: `com.example.services.UserService#createUser`

---

## R

### Registry (Language Plugin)
Central registry managing all language plugins. Provides methods like `register()`, `getPluginForFile()`, `getSupportedLanguages()`.

**Location:** `src/core/language/registry.ts`

---

## S

### Search Agent
Agent for keyword and pattern search (grep-like functionality) with regex support.

**Location:** `src/core/agents/search.ts`

### Semantic Index Agent
Agent for AI-powered semantic search using LanceDB + ONNX embeddings. Understands code meaning beyond keywords.

**Status:** ⚠️ Beta

**Location:** `src/core/agents/semantic.ts`

**Related:** [Semantic Search](#semantic-search)

### Semantic Search
AI-powered search that understands meaning/intent rather than just keywords. Uses vector embeddings and similarity search.

**Example:** Search for "authentication logic" finds auth-related code even if it doesn't contain those exact words.

**Performance:** ~10 minutes for 10k files (initial index), <1.2s per query

**Related:** [Embedding](#embedding), [Vector Search](#vector-search)

### Snippets Agent
Agent for token-efficient file reading with line ranges and token limits. Avoids sending entire files to AI.

**Location:** `src/core/agents/snippets.ts`

**Related:** [Token Management](#token-management)

### Symbol
Named entity in source code: class, interface, method, function, field, property, enum, constructor, etc.

**Example Symbol:**
```typescript
{
  name: "UserService",
  qualifiedName: "com.example.UserService",
  kind: "class",
  language: "java",
  filePath: "src/UserService.java",
  line: 15
}
```

### Symbols Agent
Core agent for multi-language symbol extraction. Uses language plugins to parse files and extract symbols.

**Location:** `src/core/agents/symbols.ts`

**Related:** [Symbol](#symbol), [Language Plugin](#language-plugin)

---

## T

### Token
Unit of text for AI models. Roughly 4 characters = 1 token. CodeWeaver optimizes for token-efficiency.

**Example:** "Hello World" ≈ 2-3 tokens

**Claude limits:**
- Claude 3.5 Sonnet: 200k input tokens
- Claude 3 Opus: 200k input tokens

**Related:** [Token Management](#token-management)

### Token Management
Strategy for minimizing tokens sent to AI models. CodeWeaver techniques:
- Line ranges (only relevant lines)
- Token limits (auto-truncation)
- Smart truncation (word boundaries)
- Symbol summaries (not full code)

**Guide:** [docs/architecture/TOKEN_MANAGEMENT.md](./architecture/TOKEN_MANAGEMENT.md)

### Tree-sitter
Parser generator tool and parsing library. CodeWeaver uses tree-sitter-wasms for Python parsing (WASM-based, zero native deps).

**Related:** [WASM](#wasm-webassembly)

---

## V

### VCS Agent
Version Control System agent for Git operations: status, diff, blame, log, branches, compare.

**Location:** `src/core/agents/vcs.ts`

**Library:** simple-git

### Vector Search
Search technique using vector similarity (cosine distance) instead of keywords. Core of semantic search.

**Process:**
1. Convert text to vector (embedding)
2. Store in vector database (LanceDB)
3. Query with vector similarity

**Related:** [Semantic Search](#semantic-search), [Embedding](#embedding)

---

## W

### WASM (WebAssembly)
Portable binary format for fast execution. CodeWeaver uses WASM-based parsers (tree-sitter) for zero native dependencies.

**Benefit:** Cross-platform, no compilation required

---

## Z

### Zero Native Dependencies
Design principle where core features work without native binaries/compilation. Only semantic search requires native components (LanceDB + ONNX).

**Core features:**
- ✅ Pure JS/WASM parsers
- ✅ JSON Lines storage
- ✅ In-memory indexes

**Optional (native):**
- ⚠️ Semantic Search (LanceDB + ONNX Runtime)

---

## Acronyms

| Acronym | Full Name | Description |
|---------|-----------|-------------|
| **AI** | Artificial Intelligence | Machine learning systems like Claude |
| **API** | Application Programming Interface | Interface for interacting with CodeWeaver |
| **AST** | Abstract Syntax Tree | Tree representation of code structure |
| **CLI** | Command Line Interface | Terminal-based interface |
| **ESM** | ECMAScript Modules | Modern JavaScript module system |
| **JSONL** | JSON Lines | File format (one JSON per line) |
| **LOC** | Lines of Code | Code size metric |
| **MCP** | Model Context Protocol | Anthropic's protocol for AI tools |
| **ONNX** | Open Neural Network Exchange | ML model format/runtime |
| **SIMD** | Single Instruction Multiple Data | CPU optimization for parallel ops |
| **VCS** | Version Control System | Git/source control |
| **WASM** | WebAssembly | Portable binary format |

---

## Common File Extensions

| Extension | Language | Parser |
|-----------|----------|--------|
| `.java` | Java | java-parser |
| `.ts`, `.tsx` | TypeScript | typescript-estree |
| `.js`, `.jsx` | JavaScript | typescript-estree |
| `.mjs`, `.cjs` | JavaScript (ESM/CommonJS) | typescript-estree |
| `.py`, `.pyi` | Python | tree-sitter-wasms |
| `.md`, `.markdown` | Markdown | remark |
| `.jsonl` | JSON Lines | Native JSON |

---

## Symbol Kinds

| Kind | Description | Example |
|------|-------------|---------|
| `class` | Class definition | `class UserService` |
| `interface` | Interface (Java/TS) | `interface IService` |
| `method` | Method/function in class | `public void save()` |
| `function` | Standalone function | `function handleRequest()` |
| `field` | Class field/property | `private String name` |
| `constructor` | Constructor method | `public UserService()` |
| `enum` | Enum definition | `enum Status` |
| `type` | Type alias (TS) | `type User = { ... }` |
| `namespace` | Namespace (TS) | `namespace Utils` |
| `section` | Markdown header | `## Getting Started` |
| `reference` | Markdown link | `[link](https://example.com)` |

---

## Performance Metrics Reference

| Operation | Small (<1k files) | Medium (1k-5k) | Large (5k-10k) |
|-----------|-------------------|----------------|----------------|
| **Symbol Indexing** | ~2s | ~8s | ~15s |
| **Keyword Search** | <50ms | <100ms | <200ms |
| **Semantic Index (initial)** | ~60s | ~5min | ~10min |
| **Semantic Query** | <500ms | <800ms | <1.2s |
| **File Read** | <10ms | <10ms | <10ms |
| **Git Operations** | <100ms | <200ms | <300ms |

**Hardware:** Intel i7-12700K, 32GB RAM, NVMe SSD

**Related:** [docs/reference/PERFORMANCE.md](./reference/PERFORMANCE.md)

---

## Feature Status Icons

| Icon | Status | Meaning |
|------|--------|---------|
| ✅ | Production-Ready | Stable, tested, recommended for production |
| ⚠️ | Beta | Functional but needs more testing/optimization |
| 🧪 | Experimental | Early stage, may have issues |
| 🆕 | New | Recently added feature |
| ❌ | Not Available | Not implemented or deprecated |

---

## Related Documentation

- **Main Index:** [INDEX.md](./INDEX.md) - Complete documentation navigation
- **Quick Start:** [getting-started/QUICKSTART.md](./getting-started/QUICKSTART.md)
- **API Reference:** [reference/API.md](./reference/API.md)
- **Architecture:** [architecture/ARCHITECTURE.md](./architecture/ARCHITECTURE.md)

---

**Last Updated:** 2025-11-17 (v0.3.0)

**Questions?** If a term is missing, please [open an issue](https://github.com/nobiehl/codeweaver-mcp/issues) or submit a PR!
