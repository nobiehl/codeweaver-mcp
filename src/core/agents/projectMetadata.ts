/**
 * Project Metadata Agent
 *
 * Multi-language project metadata extraction using plugin architecture.
 * Supports Gradle, npm, pip, Maven, and more through plugins.
 */

import type {
  ProjectMetadataPlugin,
  UnifiedProjectMetadata,
  ProjectType,
} from '../../types/projectMetadata.js';
import { GradleMetadataPlugin } from '../projectMetadata/plugins/gradle/index.js';
import { NpmMetadataPlugin } from '../projectMetadata/plugins/npm/index.js';

export class ProjectMetadataAgent {
  private plugins: Map<ProjectType, ProjectMetadataPlugin> = new Map();

  constructor(private projectRoot: string) {
    this.registerDefaultPlugins();
  }

  /**
   * Register default plugins for common project types
   */
  private registerDefaultPlugins(): void {
    this.registerPlugin(new GradleMetadataPlugin());
    this.registerPlugin(new NpmMetadataPlugin());
    // Future: PipMetadataPlugin, MavenMetadataPlugin, CargoMetadataPlugin, etc.
  }

  /**
   * Register a custom plugin
   * @param plugin - Project metadata plugin
   */
  registerPlugin(plugin: ProjectMetadataPlugin): void {
    this.plugins.set(plugin.projectType, plugin);
  }

  /**
   * Detect project type(s) in the current directory
   * @returns Array of detected project types
   */
  async detectProjectTypes(): Promise<ProjectType[]> {
    const detectedTypes: ProjectType[] = [];

    for (const [projectType, plugin] of this.plugins.entries()) {
      const detected = await plugin.detect(this.projectRoot);
      if (detected) {
        detectedTypes.push(projectType);
      }
    }

    return detectedTypes.length > 0 ? detectedTypes : ['unknown'];
  }

  /**
   * Get project metadata (auto-detect project type)
   * @param config - Optional configuration
   * @returns Unified project metadata
   */
  async getProjectMetadata(): Promise<UnifiedProjectMetadata | null> {
    const projectTypes = await this.detectProjectTypes();

    // If unknown, return null
    if (projectTypes.length === 0 || projectTypes[0] === 'unknown') {
      return null;
    }

    // If single project type, extract metadata
    if (projectTypes.length === 1) {
      const plugin = this.plugins.get(projectTypes[0]);
      if (!plugin) return null;
      return await plugin.extract(this.projectRoot);
    }

    // If multiple project types (e.g., npm + Gradle in monorepo)
    // Extract from primary (first detected)
    const primaryPlugin = this.plugins.get(projectTypes[0]);
    if (!primaryPlugin) return null;

    const metadata = await primaryPlugin.extract(this.projectRoot);

    // Mark as multi-language project
    metadata.projectType = 'multi';
    metadata.metadata = metadata.metadata || {};
    metadata.metadata.detectedTypes = projectTypes;

    return metadata;
  }

  /**
   * Get project metadata for a specific project type
   * @param projectType - Project type to extract
   * @param config - Optional configuration
   * @returns Unified project metadata or null if not supported
   */
  async getMetadataForType(projectType: ProjectType): Promise<UnifiedProjectMetadata | null> {
    const plugin = this.plugins.get(projectType);
    if (!plugin) return null;

    const detected = await plugin.detect(this.projectRoot);
    if (!detected) return null;

    return await plugin.extract(this.projectRoot);
  }

  /**
   * Get available scripts/tasks
   * @param projectType - Optional project type (auto-detect if not provided)
   * @returns Map of script names to commands
   */
  async getScripts(projectType?: ProjectType): Promise<Record<string, string>> {
    let targetType = projectType;

    if (!targetType) {
      const types = await this.detectProjectTypes();
      if (types.length === 0 || types[0] === 'unknown') return {};
      targetType = types[0];
    }

    const plugin = this.plugins.get(targetType);
    if (!plugin || !plugin.getScripts) return {};

    return await plugin.getScripts(this.projectRoot);
  }

  /**
   * Check if a specific project type is supported
   * @param projectType - Project type to check
   * @returns true if plugin is registered
   */
  hasPlugin(projectType: ProjectType): boolean {
    return this.plugins.has(projectType);
  }

  /**
   * Get list of all registered project types
   * @returns Array of supported project types
   */
  getSupportedProjectTypes(): ProjectType[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get plugin for a specific project type
   * @param projectType - Project type
   * @returns Plugin or undefined
   */
  getPlugin(projectType: ProjectType): ProjectMetadataPlugin | undefined {
    return this.plugins.get(projectType);
  }
}
