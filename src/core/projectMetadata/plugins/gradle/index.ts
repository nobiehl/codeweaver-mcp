/**
 * Gradle Project Metadata Plugin
 *
 * Extracts project metadata from Gradle-based Java/Kotlin projects.
 * Supports both single-module and multi-module Gradle projects.
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  ProjectMetadataPlugin,
  UnifiedProjectMetadata,
  UnifiedDependency,
  UnifiedModule,
  DependencyScope,
} from '../../../../types/projectMetadata.js';
import type { Language } from '../../../../types/language.js';

export class GradleMetadataPlugin implements ProjectMetadataPlugin {
  readonly name = 'gradle';
  readonly projectType = 'gradle' as const;
  readonly languages: Language[] = ['java'];

  async detect(projectRoot: string): Promise<boolean> {
    try {
      const settingsExists = await this.fileExists(projectRoot, 'settings.gradle');
      const settingsKtsExists = await this.fileExists(projectRoot, 'settings.gradle.kts');
      const buildExists = await this.fileExists(projectRoot, 'build.gradle');
      const buildKtsExists = await this.fileExists(projectRoot, 'build.gradle.kts');

      return settingsExists || settingsKtsExists || buildExists || buildKtsExists;
    } catch {
      return false;
    }
  }

  async extract(projectRoot: string): Promise<UnifiedProjectMetadata> {
    const [settingsContent, buildContent] = await Promise.all([
      this.readGradleFile(projectRoot, 'settings'),
      this.readGradleFile(projectRoot, 'build'),
    ]);

    const name = this.extractProjectName(settingsContent);
    const version = this.extractVersion(buildContent);
    const javaVersion = this.extractJavaVersion(buildContent);
    const dependencies = this.extractDependencies(buildContent);
    const devDependencies = this.extractDevDependencies(buildContent);
    const plugins = this.extractPlugins(buildContent);
    const gradleWrapperPresent = await this.fileExists(projectRoot, 'gradlew');

    const modules = await this.extractModules(projectRoot, settingsContent, buildContent);

    const metadata: UnifiedProjectMetadata = {
      root: projectRoot,
      name,
      version,
      projectType: 'gradle',
      languages: ['java'],
      buildTool: 'Gradle',
      dependencies,
      devDependencies: devDependencies.length > 0 ? devDependencies : undefined,
      modules: modules.length > 1 ? modules : undefined,
      metadata: {
        gradleVersion: '8.5', // Could be extracted from gradle-wrapper.properties
        gradleWrapperPresent,
        javaVersion,
        plugins,
      },
      discoveredAt: new Date(),
      lastModified: await this.getLastModified(projectRoot, 'build.gradle'),
    };

    return metadata;
  }

  async getScripts(projectRoot: string): Promise<Record<string, string>> {
    const buildContent = await this.readGradleFile(projectRoot, 'build');

    const tasks: Record<string, string> = {
      build: './gradlew build',
      test: './gradlew test',
      clean: './gradlew clean',
      assemble: './gradlew assemble',
    };

    // Extract custom tasks
    const taskRegex = /tasks\.register\(['"]([^'"]+)['"]\)/g;
    let match;
    while ((match = taskRegex.exec(buildContent)) !== null) {
      tasks[match[1]] = `./gradlew ${match[1]}`;
    }

    return tasks;
  }

  // Private helper methods

  private async readGradleFile(projectRoot: string, type: 'settings' | 'build'): Promise<string> {
    const groovyFile = `${type}.gradle`;
    const kotlinFile = `${type}.gradle.kts`;

    // Try Groovy first, then Kotlin
    const groovyPath = path.join(projectRoot, groovyFile);
    const kotlinPath = path.join(projectRoot, kotlinFile);

    try {
      return await fs.readFile(groovyPath, 'utf-8');
    } catch {
      try {
        return await fs.readFile(kotlinPath, 'utf-8');
      } catch {
        return '';
      }
    }
  }

  private async fileExists(projectRoot: string, filename: string): Promise<boolean> {
    try {
      await fs.access(path.join(projectRoot, filename));
      return true;
    } catch {
      return false;
    }
  }

  private async getLastModified(projectRoot: string, filename: string): Promise<Date> {
    try {
      const stats = await fs.stat(path.join(projectRoot, filename));
      return stats.mtime;
    } catch {
      return new Date();
    }
  }

  private extractProjectName(settingsContent: string): string {
    // Groovy: rootProject.name = 'my-project'
    const groovyMatch = settingsContent.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
    if (groovyMatch) return groovyMatch[1];

    // Kotlin: rootProject.name = "my-project"
    const kotlinMatch = settingsContent.match(/rootProject\.name\s*=\s*"([^"]+)"/);
    if (kotlinMatch) return kotlinMatch[1];

    return 'unknown';
  }

  private extractVersion(buildContent: string): string {
    const match = buildContent.match(/version\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '0.0.0';
  }

  private extractJavaVersion(buildContent: string): string {
    // languageVersion = JavaLanguageVersion.of(21)
    const langMatch = buildContent.match(/languageVersion\s*=\s*JavaLanguageVersion\.of\((\d+)\)/);
    if (langMatch) return langMatch[1];

    // sourceCompatibility = '21' or sourceCompatibility = JavaVersion.VERSION_21
    const sourceMatch = buildContent.match(/sourceCompatibility\s*=\s*['"]?(\d+)/);
    if (sourceMatch) return sourceMatch[1];

    const versionMatch = buildContent.match(/VERSION_(\d+)/);
    if (versionMatch) return versionMatch[1];

    return '21'; // Default
  }

  private extractPlugins(buildContent: string): string[] {
    const plugins: string[] = [];
    const pluginRegex = /id\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = pluginRegex.exec(buildContent)) !== null) {
      plugins.push(match[1]);
    }

    return plugins;
  }

  private extractDependencies(buildContent: string): UnifiedDependency[] {
    const dependencies: UnifiedDependency[] = [];

    // Match: implementation 'group:artifact:version'
    const singleQuoteRegex = /(?:implementation|api|compileOnly|runtimeOnly)\s+['"]([^:'"]+):([^:'"]+):([^'"]+)['"]/g;
    let match;

    while ((match = singleQuoteRegex.exec(buildContent)) !== null) {
      const [, group, artifact, version] = match;
      dependencies.push({
        name: artifact,
        version,
        scope: this.mapConfigurationToScope(match[0]),
        group,
      });
    }

    // Match: implementation('group:artifact:version')
    const functionRegex = /(?:implementation|api|compileOnly|runtimeOnly)\(['"]([^:'"]+):([^:'"]+):([^'"]+)['"]\)/g;
    while ((match = functionRegex.exec(buildContent)) !== null) {
      const [, group, artifact, version] = match;
      dependencies.push({
        name: artifact,
        version,
        scope: this.mapConfigurationToScope(match[0]),
        group,
      });
    }

    return dependencies;
  }

  private extractDevDependencies(buildContent: string): UnifiedDependency[] {
    const devDeps: UnifiedDependency[] = [];

    // testImplementation, testRuntimeOnly, etc.
    const testRegex = /test(?:Implementation|RuntimeOnly|CompileOnly)\s+['"]([^:'"]+):([^:'"]+):([^'"]+)['"]/g;
    let match;

    while ((match = testRegex.exec(buildContent)) !== null) {
      const [, group, artifact, version] = match;
      devDeps.push({
        name: artifact,
        version,
        scope: 'test',
        group,
      });
    }

    return devDeps;
  }

  private async extractModules(
    projectRoot: string,
    settingsContent: string,
    buildContent: string,
  ): Promise<UnifiedModule[]> {
    const modules: UnifiedModule[] = [];

    // Root module
    modules.push({
      name: this.extractProjectName(settingsContent),
      path: '.',
      type: 'root',
      dependencies: this.extractDependencies(buildContent),
      scripts: await this.getScripts(projectRoot),
    });

    // Extract subprojects from settings.gradle
    const includeRegex = /include\s+['"]([^'"]+)['"]/g;
    let match;

    while ((match = includeRegex.exec(settingsContent)) !== null) {
      const moduleName = match[1].replace(/^:/, ''); // Remove leading colon
      modules.push({
        name: moduleName,
        path: moduleName.replace(':', '/'),
        type: 'subproject',
        dependencies: [], // Would need to read module's build.gradle
      });
    }

    return modules;
  }

  private mapConfigurationToScope(configuration: string): DependencyScope {
    if (configuration.includes('test')) return 'test';
    if (configuration.includes('compileOnly')) return 'compile';
    if (configuration.includes('runtimeOnly')) return 'runtime';
    if (configuration.includes('api')) return 'runtime';
    if (configuration.includes('implementation')) return 'runtime';
    return 'runtime';
  }
}
