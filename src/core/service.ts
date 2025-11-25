import { ProjectMetadataAgent } from './agents/projectMetadata.js';
import { CacheAgent } from './agents/cache.js';
import { SnippetsAgent } from './agents/snippets.js';
import { SymbolsAgent } from './agents/symbols.js';
import { SearchAgent, type SearchResult, type SearchOptions } from './agents/search.js';
import { AnalysisAgent } from './agents/analysis.js';
import { VCSAgent, type LogOptions } from './agents/vcs.js';
import { SemanticIndexAgent } from './agents/semantic.js';
import type { UnifiedProjectMetadata, ProjectType } from '../types/projectMetadata.js';
import type { SymbolDefinition, SymbolKind } from '../types/symbols.js';
import type { FileAnalysis, ProjectAnalysis } from '../types/analysis.js';
import type { BlameLine, CommitInfo, BranchInfo, FileStatus, DiffSummary } from '../types/vcs.js';
import type { SemanticSearchResult, CollectionType, IndexOptions, SemanticIndexStats } from '../types/semantic.js';

/**
 * CodeWeaverService - Zentrale Business Logic
 * Wird von CLI UND MCP Server genutzt
 */
export class CodeWeaverService {
  private projectRoot: string;
  private projectMetadataAgent: ProjectMetadataAgent;
  private cacheAgent: CacheAgent;
  private snippetsAgent: SnippetsAgent;
  private symbolsAgent: SymbolsAgent;
  private searchAgent: SearchAgent;
  private analysisAgent: AnalysisAgent;
  private vcsAgent: VCSAgent;
  private semanticAgent: SemanticIndexAgent;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.projectMetadataAgent = new ProjectMetadataAgent(projectRoot);
    this.cacheAgent = new CacheAgent(projectRoot);
    this.snippetsAgent = new SnippetsAgent(projectRoot);
    this.symbolsAgent = new SymbolsAgent(projectRoot);
    this.searchAgent = new SearchAgent(projectRoot);
    this.analysisAgent = new AnalysisAgent(projectRoot);
    this.vcsAgent = new VCSAgent(projectRoot);
    this.semanticAgent = new SemanticIndexAgent(projectRoot);
  }

  getProjectRoot(): string {
    return this.projectRoot;
  }

  // === Project Metadata (Multi-Language) ===

  /**
   * Get unified project metadata (auto-detects project type)
   * Supports: Gradle, npm, pip, Maven, Cargo, etc.
   */
  async getUnifiedProjectMetadata(): Promise<UnifiedProjectMetadata | null> {
    return this.projectMetadataAgent.getProjectMetadata();
  }

  /**
   * Detect all project types in current directory
   * @returns Array of detected project types (e.g., ['gradle'], ['npm', 'gradle'])
   */
  async detectProjectTypes(): Promise<ProjectType[]> {
    return this.projectMetadataAgent.detectProjectTypes();
  }

  /**
   * Get metadata for a specific project type
   * @param projectType - Project type to extract (e.g., 'gradle', 'npm')
   */
  async getMetadataForType(projectType: ProjectType): Promise<UnifiedProjectMetadata | null> {
    return this.projectMetadataAgent.getMetadataForType(projectType);
  }

  /**
   * Get available scripts/tasks for detected project type
   * @param projectType - Optional specific project type
   * @returns Map of script names to commands
   */
  async getProjectScripts(projectType?: ProjectType): Promise<Record<string, string>> {
    return this.projectMetadataAgent.getScripts(projectType);
  }

  /**
   * Get supported project types
   */
  getSupportedProjectTypes(): ProjectType[] {
    return this.projectMetadataAgent.getSupportedProjectTypes();
  }

  // === Cache Operations ===

  getCacheAgent(): CacheAgent {
    return this.cacheAgent;
  }

  // === Symbol Indexing ===

  /**
   * Index entire project (parse all Java files)
   */
  async buildIndex(): Promise<{ files: string[]; symbols: SymbolDefinition[]; classes: string[] }> {
    return this.symbolsAgent.indexProject();
  }

  /**
   * Parse a single file and extract symbols
   */
  async parseFile(filePath: string): Promise<SymbolDefinition[]> {
    return this.symbolsAgent.parseFile(filePath);
  }

  /**
   * Find symbols by name (case-insensitive substring match)
   */
  findSymbolsByName(name: string): SymbolDefinition[] {
    return this.symbolsAgent.findSymbolsByName(name);
  }

  /**
   * Find symbols by kind (class, method, field, constructor)
   */
  findSymbolsByKind(kind: SymbolKind): SymbolDefinition[] {
    return this.symbolsAgent.findSymbolsByKind(kind);
  }

  /**
   * Get symbol by qualified name
   */
  getSymbol(qualifiedName: string): SymbolDefinition | undefined {
    return this.symbolsAgent.getSymbol(qualifiedName);
  }

  /**
   * Clear symbol index
   */
  clearSymbolIndex(): void {
    this.symbolsAgent.clearIndex();
  }

  getSymbolsAgent(): SymbolsAgent {
    return this.symbolsAgent;
  }

  // === Search Operations ===

  /**
   * Search for keyword in files
   */
  async searchKeyword(keyword: string, options?: SearchOptions): Promise<SearchResult[]> {
    return this.searchAgent.searchKeyword(keyword, options);
  }

  /**
   * Search with regex pattern
   */
  async searchPattern(pattern: RegExp, options?: SearchOptions): Promise<SearchResult[]> {
    return this.searchAgent.searchPattern(pattern, options);
  }

  /**
   * Find files by name pattern (glob-like)
   */
  async findFiles(pattern: string): Promise<string[]> {
    return this.searchAgent.findFiles(pattern);
  }

  getSearchAgent(): SearchAgent {
    return this.searchAgent;
  }

  // === Code Analysis ===

  /**
   * Analyze a single file for complexity and metrics
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    return this.analysisAgent.analyzeFile(filePath);
  }

  /**
   * Analyze entire project
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    return this.analysisAgent.analyzeProject();
  }

  getAnalysisAgent(): AnalysisAgent {
    return this.analysisAgent;
  }

  // === Semantic Search ===

  /**
   * Build semantic index for code and/or docs
   */
  async buildSemanticIndex(options: IndexOptions = {}): Promise<{ indexed: number; chunks: number }> {
    const files: string[] = [];

    // Determine which file types to index based on collection
    if (!options.collection || options.collection === 'all' || options.collection === 'code') {
      // Index code files
      const codePatterns = ['*.java', '*.ts', '*.js', '*.py', '*.go', '*.rs', '*.kt', '*.cs', '*.cpp', '*.c', '*.h'];
      for (const pattern of codePatterns) {
        const foundFiles = await this.searchAgent.findFiles(pattern);
        files.push(...foundFiles);
      }
    }

    if (!options.collection || options.collection === 'all' || options.collection === 'docs') {
      // Index documentation files
      const docsPatterns = ['*.md', '*.markdown', '*.txt', '*.rst', '*.adoc'];
      for (const pattern of docsPatterns) {
        const foundFiles = await this.searchAgent.findFiles(pattern);
        files.push(...foundFiles);
      }
    }

    // Remove duplicates
    const uniqueFiles = Array.from(new Set(files));

    return this.semanticAgent.indexFiles(uniqueFiles, options);
  }

  /**
   * Search code/docs semantically by meaning/intent
   */
  async searchSemantic(query: string, limit: number = 10, collection: CollectionType = 'all'): Promise<SemanticSearchResult[]> {
    return this.semanticAgent.search(query, limit, collection);
  }

  /**
   * Get semantic index statistics (multi-collection)
   */
  async getSemanticStats(): Promise<SemanticIndexStats> {
    return this.semanticAgent.getStats();
  }

  /**
   * Clear semantic index (one or all collections)
   */
  async clearSemanticIndex(collection: CollectionType = 'all'): Promise<void> {
    return this.semanticAgent.clearIndex(collection);
  }

  // === Symbol References (Deferred) ===

  async findSymbolReferences(_symbolId: string): Promise<any[]> {
    throw new Error('Not implemented yet - Reference finding coming in later phase');
  }

  // === Code Snippets ===

  async readFile(filePath: string): Promise<string | null> {
    return this.snippetsAgent.readFile(filePath);
  }

  async readFileWithLineNumbers(filePath: string): Promise<string> {
    return this.snippetsAgent.readFileWithLineNumbers(filePath);
  }

  async readLines(filePath: string, startLine: number, endLine: number): Promise<string> {
    return this.snippetsAgent.readLines(filePath, startLine, endLine);
  }

  async readFileWithLimit(filePath: string, maxTokens?: number): Promise<string | null> {
    return this.snippetsAgent.readFileWithLimit(filePath, maxTokens);
  }

  async getContextAroundLine(filePath: string, lineNumber: number, contextLines?: number): Promise<string> {
    return this.snippetsAgent.getContextAroundLine(filePath, lineNumber, contextLines);
  }

  getSnippetsAgent(): SnippetsAgent {
    return this.snippetsAgent;
  }

  // === Version Control ===

  /**
   * Check if project is a Git repository
   */
  async isGitRepository(): Promise<boolean> {
    return this.vcsAgent.isGitRepository();
  }

  /**
   * Get current Git branch
   */
  async getCurrentBranch(): Promise<string> {
    return this.vcsAgent.getCurrentBranch();
  }

  /**
   * Get repository status (modified, added, deleted, untracked files)
   */
  async getGitStatus(): Promise<FileStatus[]> {
    return this.vcsAgent.getStatus();
  }

  /**
   * Get diff for file(s)
   */
  async getGitDiff(filePath?: string): Promise<DiffSummary> {
    return this.vcsAgent.getDiff(filePath);
  }

  /**
   * Get blame information for a file
   */
  async getGitBlame(filePath: string, startLine?: number, endLine?: number): Promise<BlameLine[]> {
    return this.vcsAgent.getBlame(filePath, startLine, endLine);
  }

  /**
   * Get commit history
   */
  async getGitLog(options?: LogOptions): Promise<{ commits: CommitInfo[]; total: number }> {
    return this.vcsAgent.getLog(options);
  }

  /**
   * Get all branches
   */
  async getGitBranches(): Promise<BranchInfo[]> {
    return this.vcsAgent.getBranches();
  }

  /**
   * Compare two branches
   */
  async compareGitBranches(baseBranch: string, compareBranch: string): Promise<DiffSummary> {
    return this.vcsAgent.compareBranches(baseBranch, compareBranch);
  }

  getVCSAgent(): VCSAgent {
    return this.vcsAgent;
  }
}
