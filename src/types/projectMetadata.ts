/**
 * Unified Project Metadata Types for Multi-Language Support
 *
 * This module defines types for the ProjectMetadataAgent, which provides
 * a language-agnostic way to extract project metadata (dependencies, versions,
 * build configuration) across different ecosystems (Gradle, npm, pip, Maven, etc.)
 */

import type { Language } from './language.js';

/**
 * Supported project types across different language ecosystems
 */
export type ProjectType =
  | 'gradle' // Java/Kotlin (Gradle)
  | 'maven' // Java/Kotlin (Maven)
  | 'npm' // JavaScript/TypeScript (npm/yarn/pnpm)
  | 'pip' // Python (pip/setuptools/poetry)
  | 'cargo' // Rust (Cargo)
  | 'composer' // PHP (Composer)
  | 'nuget' // C# (.NET/NuGet)
  | 'go-mod' // Go (go.mod)
  | 'ruby-gem' // Ruby (Bundler/gem)
  | 'multi' // Multi-language project (e.g., npm + Gradle)
  | 'unknown'; // No recognizable project structure

/**
 * Unified Project Metadata (language-agnostic)
 *
 * This interface provides a common structure for all project types,
 * regardless of language or build tool.
 */
export interface UnifiedProjectMetadata {
  /** Project root directory (absolute path) */
  root: string;

  /** Project name */
  name: string;

  /** Project version (semver or other) */
  version?: string;

  /** Primary project type (if multiple, use 'multi') */
  projectType: ProjectType;

  /** Languages detected in the project */
  languages: Language[];

  /** Build tool/package manager used */
  buildTool: string;

  /** Main project dependencies */
  dependencies: UnifiedDependency[];

  /** Development-only dependencies */
  devDependencies?: UnifiedDependency[];

  /** Scripts/tasks available (npm scripts, gradle tasks, etc.) */
  scripts?: Record<string, string>;

  /** Sub-modules or workspaces (mono-repo support) */
  modules?: UnifiedModule[];

  /** Additional metadata specific to project type */
  metadata?: Record<string, unknown>;

  /** Timestamp when metadata was extracted */
  discoveredAt: Date;

  /** Last modification time of project files */
  lastModified: Date;
}

/**
 * Unified Dependency (works for npm, pip, Gradle, Maven, etc.)
 */
export interface UnifiedDependency {
  /** Package/artifact name */
  name: string;

  /** Version or version range */
  version: string;

  /** Scope (production, dev, test, etc.) */
  scope: DependencyScope;

  /** Group/namespace (for Maven/Gradle) */
  group?: string;

  /** Type/packaging (jar, aar, etc.) */
  type?: string;

  /** Is this a transitive dependency? */
  transitive?: boolean;

  /** Source repository/registry */
  source?: string;
}

/**
 * Dependency scope (standardized across ecosystems)
 */
export type DependencyScope =
  | 'runtime' // Production runtime dependency
  | 'compile' // Compile-time only
  | 'dev' // Development only
  | 'test' // Test only
  | 'optional' // Optional dependency
  | 'peer' // Peer dependency (npm)
  | 'provided'; // Provided by runtime (Java)

/**
 * Unified Module/Subproject (for mono-repos)
 */
export interface UnifiedModule {
  /** Module name */
  name: string;

  /** Relative path from project root */
  path: string;

  /** Module type */
  type: 'root' | 'subproject' | 'workspace';

  /** Module-specific dependencies */
  dependencies: UnifiedDependency[];

  /** Scripts/tasks for this module */
  scripts?: Record<string, string>;

  /** Additional module metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Project Metadata Plugin Interface
 *
 * Each project type (Gradle, npm, pip) implements this interface
 * to provide metadata extraction capabilities.
 */
export interface ProjectMetadataPlugin {
  /** Plugin name (e.g., 'gradle', 'npm', 'pip') */
  readonly name: string;

  /** Project type this plugin handles */
  readonly projectType: ProjectType;

  /** Languages this plugin typically works with */
  readonly languages: Language[];

  /**
   * Detect if this project type is present in the given directory
   * @param projectRoot - Absolute path to project root
   * @returns true if this project type is detected
   */
  detect(projectRoot: string): Promise<boolean>;

  /**
   * Extract project metadata
   * @param projectRoot - Absolute path to project root
   * @returns Unified project metadata
   */
  extract(projectRoot: string): Promise<UnifiedProjectMetadata>;

  /**
   * Get list of available scripts/tasks
   * @param projectRoot - Absolute path to project root
   * @returns Map of script names to commands
   */
  getScripts?(projectRoot: string): Promise<Record<string, string>>;

  /**
   * Get dependency tree (with transitives)
   * @param projectRoot - Absolute path to project root
   * @returns Dependency tree
   */
  getDependencyTree?(projectRoot: string): Promise<DependencyTree>;
}

/**
 * Dependency Tree (for analyzing transitive dependencies)
 */
export interface DependencyTree {
  /** Root dependencies */
  direct: UnifiedDependency[];

  /** Transitive dependencies (nested) */
  transitive: Map<string, UnifiedDependency[]>;

  /** Total count of all dependencies (direct + transitive) */
  totalCount: number;

  /** Conflicts detected (version mismatches) */
  conflicts?: DependencyConflict[];
}

/**
 * Dependency Conflict
 */
export interface DependencyConflict {
  /** Dependency name */
  name: string;

  /** Requested versions */
  requestedVersions: string[];

  /** Resolved version */
  resolvedVersion: string;
}

/**
 * Plugin Configuration
 */
export interface ProjectMetadataPluginConfig {
  /** Enable dependency resolution */
  resolveDependencies?: boolean;

  /** Include dev dependencies */
  includeDevDependencies?: boolean;

  /** Include transitive dependencies */
  includeTransitives?: boolean;

  /** Maximum depth for transitive dependencies */
  maxDepth?: number;

  /** Custom configuration per plugin */
  pluginSpecific?: Record<string, unknown>;
}
