/**
 * Language Support Types for CodeWeaver Multi-Language System
 *
 * Defines core types for language detection, plugin system, and multi-language
 * symbol extraction.
 */

/**
 * Supported programming languages
 */
export type Language =
  | 'java'
  | 'typescript'
  | 'javascript'
  | 'markdown'
  | 'python'
  | 'go'
  | 'rust'
  | 'unknown';

/**
 * Metadata about a language and its capabilities
 */
export interface LanguageMetadata {
  /** Language identifier */
  language: Language;

  /** Language version (e.g., "21" for Java 21, "5.0" for TypeScript 5.0) */
  version?: string;

  /** File extensions this language uses (e.g., ['.java'] or ['.ts', '.tsx']) */
  fileExtensions: string[];

  /** Display name for UI/logging */
  displayName: string;

  /** Whether language supports generic types */
  supportsGenerics: boolean;

  /** Whether language supports decorators/annotations */
  supportsDecorators: boolean;

  /** Whether language has module system */
  supportsModules: boolean;

  /** Whether language is object-oriented */
  supportsClasses: boolean;

  /** Whether language has first-class functions */
  supportsFunctions: boolean;
}

/**
 * Result of parsing source code
 */
export interface ParseResult {
  /** Abstract Syntax Tree (language-specific format) */
  ast: any;

  /** Parse errors encountered */
  errors: ParseError[];

  /** Whether parsing was successful (no errors) */
  success: boolean;

  /** Source file path */
  filePath: string;
}

/**
 * Parse error details
 */
export interface ParseError {
  /** Error message */
  message: string;

  /** Line number (1-indexed) */
  line: number;

  /** Column number (1-indexed) */
  column: number;

  /** Error severity */
  severity: 'error' | 'warning' | 'info';

  /** Error code (optional, language-specific) */
  code?: string;
}

/**
 * Plugin configuration options
 */
export interface PluginConfig {
  /** Whether to include private symbols */
  includePrivate?: boolean;

  /** Whether to include local variables */
  includeLocals?: boolean;

  /** Whether to extract JSDoc/JavaDoc comments */
  extractDocs?: boolean;

  /** Maximum file size to parse (bytes) */
  maxFileSize?: number;

  /** Parser-specific options */
  parserOptions?: Record<string, any>;
}

/**
 * Statistics about parsing/indexing operation
 */
export interface LanguageStats {
  /** Language processed */
  language: Language;

  /** Number of files processed */
  filesProcessed: number;

  /** Number of symbols extracted */
  symbolsExtracted: number;

  /** Number of parse errors */
  parseErrors: number;

  /** Processing time in milliseconds */
  processingTime: number;

  /** Average symbols per file */
  avgSymbolsPerFile: number;
}
