/**
 * Language Detection Utility
 *
 * Automatically detects programming language from file extensions.
 * Used by SymbolsAgent and PluginRegistry to route files to appropriate plugins.
 */

import type { Language } from '../../types/language.js';
import * as path from 'path';

/**
 * Language Detector
 *
 * Provides static methods for detecting programming languages from file paths.
 */
export class LanguageDetector {
  /**
   * Mapping of file extensions to languages
   */
  private static readonly EXTENSION_MAP: Record<string, Language> = {
    // Java
    '.java': 'java',

    // TypeScript
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.mts': 'typescript', // ES Module TypeScript
    '.cts': 'typescript', // CommonJS TypeScript

    // JavaScript
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.mjs': 'javascript', // ES Module JavaScript
    '.cjs': 'javascript', // CommonJS JavaScript

    // Markdown
    '.md': 'markdown',
    '.markdown': 'markdown',
    '.mdown': 'markdown',
    '.mkd': 'markdown',

    // Python (NOW SUPPORTED!)
    '.py': 'python',
    '.pyi': 'python', // Python stub files
    '.pyw': 'python', // Python Windows

    // Go
    '.go': 'go',

    // Rust
    '.rs': 'rust',
  };

  /**
   * Detect language from file path
   *
   * @param filePath - Path to source file
   * @returns Detected language or 'unknown'
   *
   * @example
   * ```typescript
   * LanguageDetector.detectLanguage('Example.java') // 'java'
   * LanguageDetector.detectLanguage('App.tsx')      // 'typescript'
   * LanguageDetector.detectLanguage('main.go')      // 'go'
   * LanguageDetector.detectLanguage('README.md')    // 'unknown'
   * ```
   */
  static detectLanguage(filePath: string): Language {
    const ext = path.extname(filePath).toLowerCase();
    return this.EXTENSION_MAP[ext] || 'unknown';
  }

  /**
   * Check if a file path represents a supported language
   *
   * @param filePath - Path to check
   * @returns true if language is supported (not 'unknown')
   *
   * @example
   * ```typescript
   * LanguageDetector.isSupported('Example.java')  // true
   * LanguageDetector.isSupported('README.md')     // false
   * ```
   */
  static isSupported(filePath: string): boolean {
    const language = this.detectLanguage(filePath);
    return language !== 'unknown';
  }

  /**
   * Check if a specific language is supported
   *
   * @param language - Language to check
   * @returns true if language is in extension map
   *
   * @example
   * ```typescript
   * LanguageDetector.isSupportedLanguage('java')       // true
   * LanguageDetector.isSupportedLanguage('typescript') // true
   * LanguageDetector.isSupportedLanguage('ruby')       // false
   * ```
   */
  static isSupportedLanguage(language: Language): boolean {
    if (language === 'unknown') return false;
    return Object.values(this.EXTENSION_MAP).includes(language);
  }

  /**
   * Get all file extensions for a language
   *
   * @param language - Language to query
   * @returns Array of file extensions (e.g., ['.java'] or ['.ts', '.tsx'])
   *
   * @example
   * ```typescript
   * LanguageDetector.getExtensions('java')       // ['.java']
   * LanguageDetector.getExtensions('typescript') // ['.ts', '.tsx', '.mts', '.cts']
   * LanguageDetector.getExtensions('unknown')    // []
   * ```
   */
  static getExtensions(language: Language): string[] {
    if (language === 'unknown') return [];

    return Object.entries(this.EXTENSION_MAP)
      .filter(([_, lang]) => lang === language)
      .map(([ext]) => ext);
  }

  /**
   * Get all supported languages
   *
   * @returns Array of supported language identifiers
   *
   * @example
   * ```typescript
   * LanguageDetector.getSupportedLanguages()
   * // ['java', 'typescript', 'javascript', 'python', 'go', 'rust']
   * ```
   */
  static getSupportedLanguages(): Language[] {
    const languages = new Set(Object.values(this.EXTENSION_MAP));
    return Array.from(languages).sort();
  }

  /**
   * Get all supported file extensions
   *
   * @returns Array of supported file extensions
   *
   * @example
   * ```typescript
   * LanguageDetector.getSupportedExtensions()
   * // ['.java', '.ts', '.tsx', '.js', '.jsx', ...]
   * ```
   */
  static getSupportedExtensions(): string[] {
    return Object.keys(this.EXTENSION_MAP).sort();
  }

  /**
   * Check if file extension is for a specific language
   *
   * @param filePath - File path to check
   * @param language - Expected language
   * @returns true if file is of given language
   *
   * @example
   * ```typescript
   * LanguageDetector.isLanguage('Example.java', 'java')       // true
   * LanguageDetector.isLanguage('App.tsx', 'typescript')      // true
   * LanguageDetector.isLanguage('Example.java', 'typescript') // false
   * ```
   */
  static isLanguage(filePath: string, language: Language): boolean {
    return this.detectLanguage(filePath) === language;
  }

  /**
   * Check if file is Java source
   *
   * @param filePath - File path to check
   * @returns true if file is Java
   */
  static isJava(filePath: string): boolean {
    return this.isLanguage(filePath, 'java');
  }

  /**
   * Check if file is TypeScript source
   *
   * @param filePath - File path to check
   * @returns true if file is TypeScript
   */
  static isTypeScript(filePath: string): boolean {
    return this.isLanguage(filePath, 'typescript');
  }

  /**
   * Check if file is JavaScript source
   *
   * @param filePath - File path to check
   * @returns true if file is JavaScript
   */
  static isJavaScript(filePath: string): boolean {
    return this.isLanguage(filePath, 'javascript');
  }

  /**
   * Get display-friendly language name
   *
   * @param language - Language identifier
   * @returns Human-readable language name
   *
   * @example
   * ```typescript
   * LanguageDetector.getDisplayName('java')       // 'Java'
   * LanguageDetector.getDisplayName('typescript') // 'TypeScript'
   * LanguageDetector.getDisplayName('unknown')    // 'Unknown'
   * ```
   */
  static getDisplayName(language: Language): string {
    const displayNames: Record<Language, string> = {
      java: 'Java',
      typescript: 'TypeScript',
      javascript: 'JavaScript',
      markdown: 'Markdown',
      python: 'Python',
      go: 'Go',
      rust: 'Rust',
      unknown: 'Unknown',
    };
    return displayNames[language];
  }

  /**
   * Register additional file extension (for testing or custom extensions)
   *
   * @param extension - File extension (e.g., '.customjava')
   * @param language - Language to associate with extension
   *
   * @example
   * ```typescript
   * // Support .jav as Java for legacy codebases
   * LanguageDetector.registerExtension('.jav', 'java');
   * LanguageDetector.detectLanguage('old.jav') // 'java'
   * ```
   */
  static registerExtension(extension: string, language: Language): void {
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    this.EXTENSION_MAP[extension.toLowerCase()] = language;
  }

  /**
   * Unregister a file extension
   *
   * @param extension - File extension to remove
   */
  static unregisterExtension(extension: string): void {
    if (!extension.startsWith('.')) {
      extension = '.' + extension;
    }
    delete this.EXTENSION_MAP[extension.toLowerCase()];
  }
}
