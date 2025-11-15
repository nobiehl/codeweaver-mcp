# Changelog

All notable changes to CodeWeaver will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-01-15

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

## [1.0.0] - 2025-01-14

### Added
- 🔍 **Semantic Search** - Find code by meaning/intent using LanceDB + Transformers
  - Vector embeddings with Xenova/all-MiniLM-L6-v2
  - LanceDB for efficient vector storage and search
  - Batch processing with 16x parallelization
  - Configurable similarity thresholds
- **Semantic Index Agent** - Core semantic search engine
  - File chunking with configurable sizes
  - Context-aware code chunks
  - Progress tracking during indexing
  - Statistics and index management
- **MCP Tool: search.semantic** - Semantic search via MCP
- **CLI Command: search semantic** - Semantic search via CLI
  - `--index` flag for building index
  - `--limit` for result count
  - Color-coded similarity scores

### Performance
- Batch processing: 30 minutes for 10k files (was 8 hours)
- Automatic batch size based on CPU cores
- Progress display with ETA

### Documentation
- SEMANTIC_SEARCH.md - Complete semantic search guide
- PERFORMANCE_OPTIMIZATION.md - Optimization roadmap

## [0.4.0] - 2025-01-13

### Added
- **VCS Agent** - Git operations
  - Repository status (modified, added, deleted, untracked files)
  - Diff generation (file-level and project-level)
  - Blame information (line-by-line authorship)
  - Commit history with filtering
  - Branch management (list, compare)
- **MCP Tools** - 6 new VCS tools
  - `vcs.status`, `vcs.diff`, `vcs.blame`, `vcs.log`, `vcs.branches`, `vcs.compare`
- **CLI Commands** - VCS command group
- 11 new tests for VCS functionality

### Tests
- Total: 73 tests passing (68 unit + 5 integration)

## [0.3.0] - 2025-01-12

### Added
- **Analysis Agent** - Code quality and complexity metrics
  - Cyclomatic complexity calculation
  - Lines of code metrics (LOC, SLOC, comments, blank lines)
  - Import analysis
  - Method call detection
  - Project-wide statistics
- **MCP Tools** - 2 new analysis tools
  - `analysis.file` - Analyze single file
  - `analysis.project` - Analyze entire project
- **CLI Commands** - Analysis command group
- 11 new tests for analysis functionality

### Tests
- Total: 62 tests passing (57 unit + 5 integration)

## [0.2.0] - 2025-01-11

### Added
- **Symbols Agent** - Java symbol extraction with java-parser
  - Extract classes, methods, fields, constructors
  - Modifiers, return types, parameters
  - Line numbers and source locations
- **Search Agent** - Keyword and pattern search
  - Keyword search with case-insensitive option
  - Context lines (before/after matches)
  - File extension filtering
  - Glob pattern file search
- **Symbol Storage** - JSON Lines persistence
- **MCP Tools** - 6 new tools
  - `symbols.index`, `symbols.find`, `symbols.findByKind`, `symbols.get`
  - `search.keyword`, `search.files`
- **CLI Commands** - Symbols and search command groups
- 19 new tests (symbols + search)

### Tests
- Total: 51 tests passing (46 unit + 5 integration)

## [0.1.0] - 2025-01-10

### Added
- **Initial Release** - Foundation complete
- **Discovery Agent** - Gradle metadata extraction
- **Cache Agent** - Content-addressable caching with SHA-256
- **Snippets Agent** - Token-efficient file reading
- **MCP Server** - stdio transport with 4 tools
  - `project.meta`, `file.read`, `file.readRange`, `file.readWithNumbers`
- **CLI Interface** - Info and file command groups
- **Auto-detection** - stdio = MCP mode, TTY = CLI mode
- **Progress Tracking** - JSON Lines format
- **Test Infrastructure** - Vitest setup
- 32 tests passing (27 unit + 5 integration)

### Infrastructure
- TypeScript strict mode
- ESM modules
- Zero native dependencies
- Node.js 20+ required

---

## Legend

- 🚀 Performance improvements
- 🔍 Search & indexing features
- 🎯 Multi-collection support
- 📖 Documentation
- ✅ Tests

[Unreleased]: https://github.com/nobiehl/codeweaver-mcp/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/nobiehl/codeweaver-mcp/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/nobiehl/codeweaver-mcp/compare/v0.4.0...v1.0.0
[0.4.0]: https://github.com/nobiehl/codeweaver-mcp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/nobiehl/codeweaver-mcp/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/nobiehl/codeweaver-mcp/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/nobiehl/codeweaver-mcp/releases/tag/v0.1.0
