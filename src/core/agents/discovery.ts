import fs from 'fs/promises';
import path from 'path';
import type { ProjectMetadata, ModuleInfo, DependencyInfo } from '../../types/project.js';

export class DiscoveryAgent {
  constructor(private projectRoot: string) {}

  async detectGradleProject(): Promise<boolean> {
    try {
      const settingsExists = await this.fileExists('settings.gradle');
      const buildExists = await this.fileExists('build.gradle');
      return settingsExists || buildExists;
    } catch {
      return false;
    }
  }

  async analyze(): Promise<ProjectMetadata> {
    const settingsContent = await this.readFile('settings.gradle');
    const buildContent = await this.readFile('build.gradle');

    const name = this.extractProjectName(settingsContent);
    const version = this.extractVersion(buildContent);
    const javaVersion = this.extractJavaVersion(buildContent);
    const dependencies = this.extractDependencies(buildContent);
    const plugins = this.extractPlugins(buildContent);

    const module: ModuleInfo = {
      name,
      path: '.',
      type: 'root',
      sourceSets: {
        main: {
          name: 'main',
          srcDirs: ['src/main/java'],
          resourceDirs: ['src/main/resources'],
          outputDir: 'build/classes/java/main'
        },
        test: {
          name: 'test',
          srcDirs: ['src/test/java'],
          resourceDirs: ['src/test/resources'],
          outputDir: 'build/classes/java/test'
        }
      },
      dependencies,
      plugins,
      tasks: [],
      javaFileCount: 0,
      testFileCount: 0
    };

    const metadata: ProjectMetadata = {
      root: this.projectRoot,
      name,
      version,
      buildSystem: 'gradle',
      gradleVersion: '8.5',
      gradleWrapperPresent: await this.fileExists('gradlew'),
      javaVersion,
      modules: [module],
      moduleCount: 1,
      dependencies,
      availableTasks: [],
      discoveredAt: new Date(),
      lastModified: new Date()
    };

    return metadata;
  }

  private extractProjectName(settingsContent: string): string {
    const match = settingsContent.match(/rootProject\.name\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown';
  }

  private extractVersion(buildContent: string): string {
    const match = buildContent.match(/version\s*=\s*['"]([^'"]+)['"]/);
    return match ? match[1] : '0.0.0';
  }

  private extractJavaVersion(buildContent: string): string {
    const match = buildContent.match(/languageVersion\s*=\s*JavaLanguageVersion\.of\((\d+)\)/);
    if (match) return match[1];

    const sourceMatch = buildContent.match(/sourceCompatibility\s*=\s*['"]?(\d+)/);
    if (sourceMatch) return sourceMatch[1];

    return '21';
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

  private extractDependencies(buildContent: string): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];
    const depRegex = /(implementation|testImplementation|compileOnly|runtimeOnly)\s+['"]([^:'"]+):([^:'"]+):([^'"]+)['"]/g;
    let match;

    while ((match = depRegex.exec(buildContent)) !== null) {
      dependencies.push({
        group: match[2],
        artifact: match[3],
        version: match[4],
        configuration: match[1],
        scope: match[1].includes('test') ? 'test' : 'compile'
      });
    }

    return dependencies;
  }

  private async fileExists(relativePath: string): Promise<boolean> {
    try {
      await fs.access(path.join(this.projectRoot, relativePath));
      return true;
    } catch {
      return false;
    }
  }

  private async readFile(relativePath: string): Promise<string> {
    try {
      return await fs.readFile(path.join(this.projectRoot, relativePath), 'utf-8');
    } catch {
      return '';
    }
  }
}
