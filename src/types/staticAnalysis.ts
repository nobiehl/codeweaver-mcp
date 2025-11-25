/**
 * Static Analysis Types for External Tools Integration
 *
 * This module defines types for the StaticAnalysisAgent, which provides
 * a plugin-based architecture for integrating external static analysis tools
 * like SpotBugs, Checkstyle, PMD, and SonarLint.
 */

/**
 * Supported static analysis tool types
 */
export type StaticAnalysisTool =
  | 'spotbugs' // Java bug detection
  | 'checkstyle' // Java code style
  | 'pmd' // Multi-language static analysis
  | 'sonarlint'; // SonarQube local analysis

/**
 * Severity levels for static analysis findings
 */
export type FindingSeverity =
  | 'critical' // Security vulnerabilities, data corruption risks
  | 'high' // Major bugs, likely runtime errors
  | 'medium' // Code smells, potential issues
  | 'low' // Minor issues, style violations
  | 'info'; // Informational findings

/**
 * Finding category (what type of issue was found)
 */
export type FindingCategory =
  | 'bug' // Likely bugs (null pointer, resource leak, etc.)
  | 'vulnerability' // Security vulnerabilities
  | 'code-smell' // Code that works but is hard to maintain
  | 'style' // Style/formatting issues
  | 'performance' // Performance concerns
  | 'best-practice' // Violations of best practices
  | 'documentation' // Missing or incorrect documentation
  | 'duplication'; // Code duplication (PMD CPD)

/**
 * A single finding from static analysis
 */
export interface StaticAnalysisFinding {
  /** Unique rule ID (e.g., 'NP_NULL_ON_SOME_PATH' for SpotBugs) */
  ruleId: string;

  /** Human-readable rule name */
  ruleName: string;

  /** File where the issue was found */
  filePath: string;

  /** Line number (1-based) */
  line: number;

  /** Column number (1-based, optional) */
  column?: number;

  /** End line (for multi-line issues) */
  endLine?: number;

  /** End column */
  endColumn?: number;

  /** Severity of the finding */
  severity: FindingSeverity;

  /** Category of the finding */
  category: FindingCategory;

  /** Short description of the issue */
  message: string;

  /** Detailed explanation (optional) */
  description?: string;

  /** Suggested fix (optional) */
  suggestion?: string;

  /** Link to documentation about this rule */
  documentationUrl?: string;

  /** Tool that found this issue */
  tool: StaticAnalysisTool;

  /** Code snippet around the issue (optional) */
  snippet?: string;
}

/**
 * Summary statistics for a static analysis run
 */
export interface StaticAnalysisSummary {
  /** Total number of findings */
  totalFindings: number;

  /** Findings by severity */
  bySeverity: Record<FindingSeverity, number>;

  /** Findings by category */
  byCategory: Record<FindingCategory, number>;

  /** Number of files analyzed */
  filesAnalyzed: number;

  /** Number of files with findings */
  filesWithFindings: number;

  /** Analysis duration in milliseconds */
  durationMs: number;
}

/**
 * Result of a static analysis run
 */
export interface StaticAnalysisResult {
  /** Tool that performed the analysis */
  tool: StaticAnalysisTool;

  /** Whether the analysis was successful */
  success: boolean;

  /** Error message if analysis failed */
  error?: string;

  /** List of findings */
  findings: StaticAnalysisFinding[];

  /** Summary statistics */
  summary: StaticAnalysisSummary;

  /** Timestamp when analysis was performed */
  timestamp: Date;

  /** Tool version used */
  toolVersion?: string;

  /** Configuration file used (if any) */
  configFile?: string;
}

/**
 * Combined result from multiple tools
 */
export interface CombinedAnalysisResult {
  /** Results from each tool */
  results: StaticAnalysisResult[];

  /** All findings combined and deduplicated */
  allFindings: StaticAnalysisFinding[];

  /** Combined summary */
  summary: StaticAnalysisSummary;

  /** Overall success (all tools succeeded) */
  success: boolean;

  /** Tools that were run */
  toolsRun: StaticAnalysisTool[];

  /** Tools that failed */
  toolsFailed: StaticAnalysisTool[];
}

/**
 * Static Analysis Plugin Interface
 *
 * Each static analysis tool (SpotBugs, Checkstyle, PMD, etc.) implements
 * this interface to provide analysis capabilities.
 */
export interface StaticAnalysisPlugin {
  /** Plugin name (e.g., 'spotbugs', 'checkstyle') */
  readonly name: string;

  /** Tool type this plugin handles */
  readonly tool: StaticAnalysisTool;

  /** Human-readable display name */
  readonly displayName: string;

  /** Description of what this tool analyzes */
  readonly description: string;

  /** Languages supported by this tool */
  readonly supportedLanguages: string[];

  /**
   * Check if the tool is installed and available
   * @returns Tool availability info
   */
  checkAvailability(): Promise<ToolAvailability>;

  /**
   * Detect if this tool can analyze the given project
   * @param projectRoot - Absolute path to project root
   * @returns true if tool can analyze this project
   */
  canAnalyze(projectRoot: string): Promise<boolean>;

  /**
   * Run analysis on the project
   * @param projectRoot - Absolute path to project root
   * @param options - Analysis options
   * @returns Analysis result
   */
  analyze(projectRoot: string, options?: StaticAnalysisOptions): Promise<StaticAnalysisResult>;

  /**
   * Get default configuration for this tool
   * @returns Default configuration content
   */
  getDefaultConfig?(): string;

  /**
   * Get documentation URL for a specific rule
   * @param ruleId - Rule identifier
   * @returns URL to documentation
   */
  getRuleDocumentation?(ruleId: string): string;
}

/**
 * Tool availability information
 */
export interface ToolAvailability {
  /** Is the tool installed? */
  installed: boolean;

  /** Tool version (if installed) */
  version?: string;

  /** Path to the tool executable */
  path?: string;

  /** Error message if not available */
  error?: string;

  /** Installation instructions */
  installInstructions?: string;
}

/**
 * Options for running static analysis
 */
export interface StaticAnalysisOptions {
  /** Path to custom configuration file */
  configFile?: string;

  /** Specific files/directories to analyze (relative to project root) */
  include?: string[];

  /** Files/directories to exclude */
  exclude?: string[];

  /** Minimum severity to report */
  minSeverity?: FindingSeverity;

  /** Specific rules to enable */
  enableRules?: string[];

  /** Specific rules to disable */
  disableRules?: string[];

  /** Maximum number of findings to report */
  maxFindings?: number;

  /** Output format for raw results */
  outputFormat?: 'xml' | 'json' | 'html';

  /** Additional tool-specific options */
  toolOptions?: Record<string, unknown>;
}

/**
 * Plugin configuration for registration
 */
export interface StaticAnalysisPluginConfig {
  /** Enable this plugin */
  enabled: boolean;

  /** Default options for this plugin */
  defaultOptions?: StaticAnalysisOptions;

  /** Path to configuration file */
  configPath?: string;
}
