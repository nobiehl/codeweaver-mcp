/**
 * Language Plugin Registry
 *
 * Central registry for managing language plugins.
 * Provides plugin lookup by language or file path.
 */

import type { Language } from '../../types/language.js';
import type { LanguagePlugin } from './plugin.js';
import { LanguageDetector } from './detector.js';

/**
 * Registry for language plugins
 *
 * Maintains a map of languages to their corresponding plugins.
 * Provides convenient methods for plugin lookup and management.
 *
 * @example
 * ```typescript
 * const registry = new LanguagePluginRegistry();
 *
 * // Register plugins
 * registry.register('java', new JavaLanguagePlugin());
 * registry.register('typescript', new TypeScriptLanguagePlugin());
 *
 * // Get plugin for file
 * const plugin = registry.getPluginForFile('Example.java');
 * if (plugin) {
 *   const symbols = await plugin.indexFile('Example.java');
 * }
 * ```
 */
export class LanguagePluginRegistry {
  /**
   * Map of language identifiers to plugin instances
   */
  private plugins: Map<Language, LanguagePlugin> = new Map();

  /**
   * Register a language plugin
   *
   * @param language - Language identifier
   * @param plugin - Plugin instance
   * @throws Error if language is already registered
   *
   * @example
   * ```typescript
   * registry.register('java', new JavaLanguagePlugin());
   * ```
   */
  register(language: Language, plugin: LanguagePlugin): void {
    if (this.plugins.has(language)) {
      throw new Error(`Language plugin already registered: ${language}`);
    }

    // Validate plugin metadata matches language
    if (plugin.metadata.language !== language) {
      throw new Error(
        `Plugin metadata language (${plugin.metadata.language}) does not match registration language (${language})`
      );
    }

    this.plugins.set(language, plugin);
  }

  /**
   * Register a plugin, overwriting any existing plugin for that language
   *
   * @param language - Language identifier
   * @param plugin - Plugin instance
   *
   * @example
   * ```typescript
   * // Replace existing Java plugin with custom one
   * registry.registerOrReplace('java', new CustomJavaPlugin());
   * ```
   */
  registerOrReplace(language: Language, plugin: LanguagePlugin): void {
    if (this.plugins.has(language)) {
      console.warn(`Replacing existing plugin for language: ${language}`);
    }

    // Validate plugin metadata matches language
    if (plugin.metadata.language !== language) {
      throw new Error(
        `Plugin metadata language (${plugin.metadata.language}) does not match registration language (${language})`
      );
    }

    this.plugins.set(language, plugin);
  }

  /**
   * Unregister a language plugin
   *
   * @param language - Language to unregister
   * @returns true if plugin was removed, false if not found
   *
   * @example
   * ```typescript
   * registry.unregister('java'); // Removes Java plugin
   * ```
   */
  unregister(language: Language): boolean {
    return this.plugins.delete(language);
  }

  /**
   * Get plugin for a specific language
   *
   * @param language - Language identifier
   * @returns Plugin instance or undefined if not registered
   *
   * @example
   * ```typescript
   * const javaPlugin = registry.getPlugin('java');
   * if (javaPlugin) {
   *   console.log('Java plugin available');
   * }
   * ```
   */
  getPlugin(language: Language): LanguagePlugin | undefined {
    return this.plugins.get(language);
  }

  /**
   * Get plugin for a file based on its extension
   *
   * Detects language from file path and returns corresponding plugin.
   *
   * @param filePath - Path to source file
   * @returns Plugin instance or undefined if language not supported
   *
   * @example
   * ```typescript
   * const plugin = registry.getPluginForFile('Example.java');
   * if (plugin) {
   *   const symbols = await plugin.indexFile('Example.java');
   * }
   * ```
   */
  getPluginForFile(filePath: string): LanguagePlugin | undefined {
    const language = LanguageDetector.detectLanguage(filePath);
    return this.getPlugin(language);
  }

  /**
   * Check if a language has a registered plugin
   *
   * @param language - Language to check
   * @returns true if plugin is registered
   *
   * @example
   * ```typescript
   * if (registry.hasPlugin('java')) {
   *   console.log('Java is supported');
   * }
   * ```
   */
  hasPlugin(language: Language): boolean {
    return this.plugins.has(language);
  }

  /**
   * Check if a file can be handled by any registered plugin
   *
   * @param filePath - Path to check
   * @returns true if a plugin can handle this file
   *
   * @example
   * ```typescript
   * if (registry.canHandle('Example.java')) {
   *   // Process file
   * }
   * ```
   */
  canHandle(filePath: string): boolean {
    const plugin = this.getPluginForFile(filePath);
    return plugin !== undefined && plugin.canHandle(filePath);
  }

  /**
   * Get all registered language identifiers
   *
   * @returns Array of language identifiers
   *
   * @example
   * ```typescript
   * const languages = registry.getSupportedLanguages();
   * console.log(`Supported: ${languages.join(', ')}`);
   * // Output: Supported: java, typescript
   * ```
   */
  getSupportedLanguages(): Language[] {
    return Array.from(this.plugins.keys()).sort();
  }

  /**
   * Get all registered plugins
   *
   * @returns Array of plugin instances
   *
   * @example
   * ```typescript
   * for (const plugin of registry.getAllPlugins()) {
   *   console.log(`Plugin: ${plugin.metadata.displayName}`);
   * }
   * ```
   */
  getAllPlugins(): LanguagePlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get number of registered plugins
   *
   * @returns Count of plugins
   *
   * @example
   * ```typescript
   * console.log(`${registry.size()} languages supported`);
   * ```
   */
  size(): number {
    return this.plugins.size;
  }

  /**
   * Clear all registered plugins
   *
   * @example
   * ```typescript
   * registry.clear(); // Remove all plugins
   * ```
   */
  clear(): void {
    this.plugins.clear();
  }

  /**
   * Get statistics from all plugins
   *
   * @returns Map of language to statistics
   *
   * @example
   * ```typescript
   * const stats = registry.getAllStats();
   * for (const [lang, stat] of stats) {
   *   console.log(`${lang}: ${stat.filesProcessed} files, ${stat.symbolsExtracted} symbols`);
   * }
   * ```
   */
  getAllStats(): Map<Language, ReturnType<NonNullable<LanguagePlugin['getStats']>>> {
    const stats = new Map();
    for (const [language, plugin] of this.plugins) {
      if (plugin.getStats) {
        stats.set(language, plugin.getStats());
      }
    }
    return stats;
  }

  /**
   * Reset statistics for all plugins
   *
   * @example
   * ```typescript
   * registry.resetAllStats(); // Clear all plugin statistics
   * ```
   */
  resetAllStats(): void {
    for (const plugin of this.plugins.values()) {
      if (plugin.resetStats) {
        plugin.resetStats();
      }
    }
  }

  /**
   * Get information about registered plugins
   *
   * @returns Array of plugin metadata
   *
   * @example
   * ```typescript
   * const info = registry.getPluginInfo();
   * console.table(info);
   * // ┌─────────────┬──────────────┬─────────────────┬──────────┐
   * // │ language    │ displayName  │ fileExtensions  │ ...      │
   * // ├─────────────┼──────────────┼─────────────────┼──────────┤
   * // │ java        │ Java         │ ['.java']       │ ...      │
   * // │ typescript  │ TypeScript   │ ['.ts', '.tsx'] │ ...      │
   * // └─────────────┴──────────────┴─────────────────┴──────────┘
   * ```
   */
  getPluginInfo(): Array<{
    language: Language;
    displayName: string;
    fileExtensions: string[];
    supportsGenerics: boolean;
    supportsDecorators: boolean;
  }> {
    return this.getAllPlugins().map((plugin) => ({
      language: plugin.metadata.language,
      displayName: plugin.metadata.displayName,
      fileExtensions: plugin.metadata.fileExtensions,
      supportsGenerics: plugin.metadata.supportsGenerics,
      supportsDecorators: plugin.metadata.supportsDecorators,
    }));
  }

  /**
   * Filter files by supported languages
   *
   * @param filePaths - Array of file paths
   * @returns Array of file paths that can be handled
   *
   * @example
   * ```typescript
   * const files = ['a.java', 'b.ts', 'c.txt', 'd.py'];
   * const supported = registry.filterSupportedFiles(files);
   * // ['a.java', 'b.ts'] (assuming only Java and TS plugins registered)
   * ```
   */
  filterSupportedFiles(filePaths: string[]): string[] {
    return filePaths.filter((path) => this.canHandle(path));
  }

  /**
   * Group files by language
   *
   * @param filePaths - Array of file paths
   * @returns Map of language to file paths
   *
   * @example
   * ```typescript
   * const files = ['A.java', 'B.ts', 'C.java'];
   * const grouped = registry.groupFilesByLanguage(files);
   * // Map {
   * //   'java' => ['A.java', 'C.java'],
   * //   'typescript' => ['B.ts']
   * // }
   * ```
   */
  groupFilesByLanguage(filePaths: string[]): Map<Language, string[]> {
    const groups = new Map<Language, string[]>();

    for (const filePath of filePaths) {
      const language = LanguageDetector.detectLanguage(filePath);
      if (this.hasPlugin(language)) {
        if (!groups.has(language)) {
          groups.set(language, []);
        }
        groups.get(language)!.push(filePath);
      }
    }

    return groups;
  }
}
