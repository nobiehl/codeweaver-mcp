# Changelog

All notable changes to CodeWeaver will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
