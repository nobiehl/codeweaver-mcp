# Changelog

All notable changes to CodeWeaver will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2025-11-17

**Multi-Language Plugin Architecture + Python Support + Documentation Audit** 🎉

Complete multi-language support with unified plugin architecture and comprehensive documentation overhaul.

### Added

#### 🐍 Python Language Support
- **Complete Python Symbol Extraction**
  - Classes, Functions, Methods with full parameter extraction
  - Decorators (`@decorator`, `@staticmethod`, `@classmethod`, `@property`)
  - Type Hints (Python 3.5+: `def func(x: int) -> str`)
  - Async/Await support (`async def`, `await`)
  - Visibility detection (`_protected`, `__private`, `public`)
  - Constructors (`__init__`) and special methods
  - Language field tagging (`'python'`)
- **WASM-based Parser** - tree-sitter-wasms + web-tree-sitter (zero native deps)
- **18 Python Tests** - All passing, comprehensive fixtures

#### 🏗️ Multi-Language Plugin Architecture
- **Plugin System** - Unified interface for all language parsers
  - `LanguagePlugin` base class with `parse()`, `extractSymbols()`, `validate()`
  - `LanguagePluginRegistry` - Central management of all plugins
  - `LanguageDetector` - File extension-based language detection
- **5 Language Plugins** (13 new files, 3,606 LOC)
  - Java Plugin (1,383 LOC) - Refactored from SymbolsAgent
  - TypeScript/JavaScript Plugin (964 LOC) - Unified TS/JS support
  - Markdown Plugin (316 LOC) - Headers as sections, links as references
  - Python Plugin (643 LOC) - Complete Python 3.x support
  - Easy extensibility for new languages
- **Backward Compatible** - `language` field optional, all existing code works

#### 📋 Documentation Audit & Improvements
- **AUDIT_REPORT.md** (349 lines) - Complete documentation audit
  - 102 files analyzed (20 docs, 49 source, 19 tests, 3 configs)
  - 8 parallel checks (Links, Markdown, Version, Content, Sync, JSDoc, Secrets, Cross-Refs)
  - Grade: **B+ (Very Good)** - All critical issues fixed
  - 88% valid production links (broken links were test fixtures)
- **PRODUCTION_READINESS.md** (373 lines) - Production-readiness matrix
  - Clear feature status (Production-Ready vs Beta vs Experimental)
  - Performance expectations for different project sizes
  - Native dependencies breakdown (Core vs Optional)
- **CLAUDE.md** (664 lines) - Comprehensive developer documentation
  - Complete build & development guide
  - Multi-language plugin architecture documentation
  - Test-driven development guidelines
  - Troubleshooting section

#### 🧪 Test Suite Expansion
- **+135 New Tests** (102 → 237 tests, +132% increase!)
  - 18 Python unit tests
  - 35 Language Detector tests
  - 31 Registry tests
  - 21 TypeScript tests
  - 13 Markdown tests
  - 17 Multi-language integration tests
- **5 New Test Files** - Comprehensive coverage
- **237/237 Tests Passing** ✅

### Changed
- **Refactored SymbolsAgent** - Extracted 1,271 LOC into plugin architecture
  - Now orchestrates plugins instead of direct parsing
  - Cleaner separation of concerns
  - Easier to maintain and extend
- **Enhanced README.md** - Python support details, updated highlights
- **Updated docs/** - ARCHITECTURE.md, USAGE.md with plugin system info

### Fixed
- **Version Consistency** - Updated `src/mcp/server.ts` from 0.1.0 to 0.2.0
- **Broken Anchor Links** - Fixed 2 links in `docs/README.md`
  - Removed emoji prefixes from markdown anchor slugs
  - `#-übersicht-was-fehlt` → `#übersicht-was-fehlt`
- **Documentation Accuracy** - Aligned docs with code reality
  - Production-readiness transparency
  - Native dependencies clarification
  - Feature status accuracy

### Technical Details

**Dependencies Added:**
```json
"tree-sitter-wasms": "^0.1.13",
"web-tree-sitter": "^0.25.10",
"@types/mdast": "^4.0.4"
```

**Code Statistics:**
- +11,244 lines added
- -1,281 lines removed
- 45 files changed
- Net: +9,963 lines

**Architecture:**
```
src/core/language/
├── detector.ts (266 LOC)     # Language detection
├── plugin.ts (276 LOC)       # Plugin interface
├── registry.ts (360 LOC)     # Plugin management
└── plugins/
    ├── java/ (1,383 LOC)
    ├── typescript/ (964 LOC)
    ├── markdown/ (316 LOC)
    └── python/ (643 LOC)
```

### Supported Languages

| Language   | Status | Tests | Features |
|------------|--------|-------|----------|
| Java       | ✅ Production | 23 | Java 8-23, Annotations, Sealed Classes, Records, Module System |
| TypeScript | ✅ Production | 21 | Generics, Decorators, Interfaces, Types, Enums |
| JavaScript | ✅ Production | 21 | Modern ES6+, JSX, Arrow Functions, Async/Await |
| Markdown   | ✅ Production | 13 | Headers as Sections, Links, Code Blocks |
| Python     | ✅ Production | 18 | Classes, Functions, Decorators, Type Hints, Async/Await |

### Tests
- **Test Files:** 18 passing (was 13, +38%)
- **Tests:** 237 passing (was 102, +132%)
- **Duration:** ~25 seconds
- **Coverage:** Multi-language, Integration, Unit

### Breaking Changes
**None!** All changes are backward-compatible.

### Migration Guide
No migration needed - all existing code continues to work.
The `language` field in `SymbolDefinition` is optional for backward compatibility.

## [0.2.0] - 2025-11-16

**Major Java Support Release** 🎉

Complete modern Java support with comprehensive symbol extraction for Java 21 LTS and beyond.

### Added
- 🚀 **Complete Modern Java Support (Java 8-23)**
  - Class-level annotations (`@Entity`, `@Table`, `@Controller`, etc.)
  - Sealed classes and interfaces (Java 17+)
  - Nested interface extraction with proper qualified names
  - Method parameter extraction with names, types, and annotations
  - Generic type parameters in signatures (`<T extends Comparable<T>>`)
  - Records (Java 14+) with components and methods
  - Java Module System (module-info.java) with all directives
  - Enum support with constants and methods
  - Abstract and default modifiers
- ✅ **15 New Tests** - All 102 tests passing (was 87)
- 📖 **Updated Documentation** - Java support status and features

### Changed
- Enhanced symbol extraction to support modern Java features
- Improved AST navigation for annotations and modifiers
- Better type extraction for method parameters and return types

### Fixed
- Class/interface annotation extraction (corrected AST paths)
- Parameter type extraction (Long instead of Object)
- Generic type bounds extraction (Comparable<T> fully recognized)

### Java Coverage
- **Before:** ~44% (only basic features)
- **Now:** ~100% (all production features for Java 21 LTS)

### Tests
- All 102 tests passing (15 new Java-specific tests)
- Test coverage for all modern Java features
- Parameter extraction with annotations validated
- Generic type signatures verified
- Sealed types and nested interfaces tested

## [0.1.0] - 2025-01-15

**Initial Public Release** 🎉

CodeWeaver is an experimental MCP server for code analysis. This is an early alpha release to gather feedback and iterate on features.

### Added
- 🚀 **ONNX Runtime Optimizations** - Multi-threading + SIMD for 3x faster embeddings
  - Automatic CPU core detection and utilization
  - SIMD instructions (AVX2/AVX512) support
  - Console output shows ONNX status
- 🔍 **File Watcher with Incremental Updates** - Automatic index updates on file changes
  - Cross-platform file watching with chokidar
  - Debouncing support (default: 2 seconds)
  - Graceful shutdown with Ctrl+C
  - 300x speedup for single file updates (2s vs 10min)
- 🎯 **Multi-Collection Support** - Separate indexes for Code and Documentation
  - Auto-detection of file types (10+ programming languages + markdown)
  - Different chunking strategies per collection
  - Collection-specific search with `--collection` flag
  - Separate LanceDB tables per collection
- 📖 **Comprehensive Documentation**
  - FILE_WATCHER_GUIDE.md - Complete file watcher guide
  - MULTI_COLLECTION_GUIDE.md - Multi-collection usage guide
  - Updated PERFORMANCE_OPTIMIZATION.md with implemented features
  - Extended SEMANTIC_SEARCH.md with workflow integration

### Changed
- Updated README.md with new features and architecture diagram
- Enhanced CLI with `watch` command and collection options
- Improved SemanticIndexAgent with incremental reindex capability

### Performance
- Initial indexing (10k files): **10 minutes** (was 8 hours) - 48x speedup
- File updates: **2 seconds** (was 10 minutes) - 300x speedup
- Batch processing: 16x parallel embedding generation
- ONNX Runtime: 3x faster than pure JavaScript

### Tests
- All 87 tests passing
- ONNX Runtime integration tested
- Multi-collection functionality tested

### Core Features
- **MCP Server** - stdio transport with 18 tools
  - Project metadata, file operations, symbol extraction
  - Keyword & semantic search
  - Code quality analysis
  - Git operations
- **CLI Interface** - 6 command groups (info, file, symbols, search, analysis, vcs, watch)
- **Semantic Search** - Find code by meaning/intent
  - LanceDB vector search with Xenova/all-MiniLM-L6-v2
  - ONNX Runtime optimizations (multi-threading + SIMD)
  - Multi-collection support (Code + Docs)
  - File watcher with incremental updates
- **Java/Gradle Analysis** - Symbol extraction, complexity metrics
- **Git Integration** - Status, diff, blame, log, branches
- **Token-Efficient** - Smart file reading with token limits

### Infrastructure
- TypeScript strict mode, ESM modules
- Zero native dependencies (pure Node.js)
- 87 tests passing
- Node.js 20+ required

### Known Limitations
⚠️ **This is an alpha release. Expect bugs and breaking changes.**
- Performance may vary on large codebases
- Some features are experimental
- Documentation is work in progress

---

## Legend

- 🚀 Performance improvements
- 🔍 Search & indexing features
- 🎯 Multi-collection support
- 📖 Documentation
- ✅ Tests

[Unreleased]: https://github.com/nobiehl/codeweaver-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/nobiehl/codeweaver-mcp/releases/tag/v0.1.0
