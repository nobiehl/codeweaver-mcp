# Changelog

All notable changes to CodeWeaver will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2025-11-25

**Static Analysis + Code Cleanup** 🧹

Plugin-based static analysis integration for Java code quality (SpotBugs, Checkstyle) combined with comprehensive codebase cleanup - all packages updated, TODOs resolved, deprecated code removed.

### Added

#### 🔬 Static Analysis Agent (NEW)
- **StaticAnalysisAgent** - Orchestrates multiple static analysis tools
  - Plugin-based architecture for easy extension
  - Parallel execution of multiple tools
  - Result aggregation and deduplication
  - Severity and category filtering
  - Human-readable report formatting

#### 🐛 SpotBugs Plugin
- **SpotBugsPlugin** - Java bug detection
  - Finds NullPointerExceptions, Resource Leaks, SQL Injections
  - Supports Gradle plugin and standalone mode
  - XML report parsing with source location mapping
  - Severity mapping: High, Medium, Low
  - Category mapping: Bug, Vulnerability, Performance, Best-Practice

#### ✅ Checkstyle Plugin
- **CheckstylePlugin** - Java code style checking
  - Naming conventions, formatting rules, imports
  - Supports Gradle plugin and standalone mode
  - Default config (Google Style) included
  - 100+ check categories mapped
  - Documentation URLs for each rule

#### 🔧 MCP Tools (3 new tools, 22 total)
- `staticAnalysis.tools` - List available tools and check availability
- `staticAnalysis.run` - Run analysis with SpotBugs and/or Checkstyle
- `staticAnalysis.report` - Get formatted human-readable report

#### 📝 Type Definitions
- `src/types/staticAnalysis.ts` - Comprehensive type system
  - `StaticAnalysisFinding` - Individual findings with location
  - `StaticAnalysisResult` - Tool results with summary
  - `CombinedAnalysisResult` - Multi-tool aggregated results
  - `StaticAnalysisPlugin` - Plugin interface for extensions
  - `ToolAvailability` - Installation status and instructions

#### 🧪 Tests
- **24 new tests** for StaticAnalysisAgent, SpotBugs, and Checkstyle
- Total: **291 tests passing** (100%)

### Changed
- **CodeWeaverService** - Added static analysis methods
  - `runStaticAnalysisTool()` - Run single tool
  - `runAllStaticAnalysisTools()` - Run all available tools
  - `runStaticAnalysisTools()` - Run specific tools
  - `formatStaticAnalysisReport()` - Generate report
  - `checkStaticAnalysisToolsAvailability()` - Check installations
- **Documentation** - Updated STATUS_AND_ROADMAP.md with implementation status
- **npm Packages** - Updated all dependencies to latest compatible versions

### Removed
- **All TODOs** - Resolved or converted to clean implementation notes
  - `cache.ts` - Metadata tracking TODO removed
  - `typescript/extractor.ts` - Namespace and argument TODOs resolved
  - `java/extractor.ts` - Parameter extraction TODO resolved
  - `python/extractor.ts` - Argument extraction TODO resolved
- **Deprecated comments** - Cleaned up all references to removed code
  - Removed DiscoveryAgent reference from projectMetadata.ts
  - Updated enum extraction comment in typescript/extractor.ts

### Architecture
- **Plugin Architecture** - Same pattern as ProjectMetadataAgent
  - Easy to add PMD, SonarLint later
  - Each plugin is self-contained
  - Central agent coordinates execution

---

## [0.4.0] - 2025-11-25

**System Health Checks + Dependency Validation + Discovery Agent Removal** 🔍

Complete system dependency validation with doctor command and automatic startup checks. Removed deprecated Discovery Agent for cleaner codebase.

### Added

#### 🏥 System Check Agent (NEW)
- **SystemCheckAgent** - Comprehensive dependency validation
  - Checks Node.js (>=18.0.0), Git (>=2.0.0) - **required**
  - Checks Python (>=3.8.0), Gradle (>=7.0.0), Maven (>=3.6.0) - **optional**
  - Version detection and path resolution
  - Detailed error messages and installation recommendations
- **CLI Command: `codeweaver doctor`** - Full system diagnostic
  - Colored output with icons (✓/✗/⚠)
  - Shows installed versions and file paths
  - Installation/upgrade recommendations
  - `--quick` flag for fast critical-only check
- **Automatic Startup Check** - Validates critical dependencies on CLI launch
  - Silent when all dependencies are met
  - Warning display with `CODEWEAVER_VERBOSE=1`
  - Skipped in MCP mode (stdio)
- **11 new tests** for SystemCheckAgent (267 total tests passing)

#### 📋 Documentation Improvements
- **Test Status Corrections** - Fixed incorrect test counts (256 passing, not 218)
- **Python Status Update** - Marked Python support as fully functional (no longer beta)
- **Link Validation Tool** - Created `scripts/validate-links.ts` for markdown link checking
- **LINK_VALIDATION.md** - Documentation for link validation workflows

### Changed
- **Mode Detection** - Improved CLI vs MCP detection
  - Now recognizes CLI commands explicitly
  - Works reliably on Windows without TTY
  - Priority: `--mcp` flag > CLI command > TTY status
- **CodeWeaverService** - Added unified project metadata methods
  - `getUnifiedProjectMetadata()` - Auto-detects project type
  - `getMetadataForType(type)` - Specific project type extraction
- **CLI `info` command** - Migrated to unified metadata API
- **MCP `project.meta` tool** - Removed legacy flag, unified schema only
- **Documentation** - Updated all agent counts from 10 to 9 agents

### Removed
- **Discovery Agent** - Deprecated agent removed (replaced by ProjectMetadataAgent in v0.3.0)
  - `src/core/agents/discovery.ts` - Agent implementation
  - `tests/unit/agents/discovery.test.ts` - Tests
  - All references in documentation and code
- **Legacy API** - Removed backward-compatibility methods
  - `service.getProjectMetadata()` - Use `getUnifiedProjectMetadata()` instead
  - `service.isGradleProject()` - Detection now handled by plugins

### Fixed
- **Broken Documentation Links** - Fixed 28 broken internal links in docs
- **Test Count Documentation** - Corrected from 218+19 skipped to 256 passing
- **Python WASM Status** - Removed incorrect "pending" status (fully working)

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
