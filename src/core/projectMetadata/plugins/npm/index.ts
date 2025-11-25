/**
 * npm Project Metadata Plugin
 *
 * Extracts project metadata from npm-based JavaScript/TypeScript projects.
 * Supports package.json, workspaces, and various package managers (npm, yarn, pnpm).
 */

import fs from 'fs/promises';
import path from 'path';
import type {
  ProjectMetadataPlugin,
  UnifiedProjectMetadata,
  UnifiedDependency,
  UnifiedModule,
} from '../../../../types/projectMetadata.js';
import type { Language } from '../../../../types/language.js';

interface PackageJson {
  name?: string;
  version?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  workspaces?: string[] | { packages: string[] };
  engines?: { node?: string; npm?: string };
  type?: 'module' | 'commonjs';
}

export class NpmMetadataPlugin implements ProjectMetadataPlugin {
  readonly name = 'npm';
  readonly projectType = 'npm' as const;
  readonly languages: Language[] = ['typescript', 'javascript'];

  async detect(projectRoot: string): Promise<boolean> {
    try {
      await fs.access(path.join(projectRoot, 'package.json'));
      return true;
    } catch {
      return false;
    }
  }

  async extract(projectRoot: string): Promise<UnifiedProjectMetadata> {
    const packageJson = await this.readPackageJson(projectRoot);

    const name = packageJson.name || 'unknown';
    const version = packageJson.version || '0.0.0';
    const dependencies = this.extractDependencies(packageJson);
    const devDependencies = this.extractDevDependencies(packageJson);
    const scripts = packageJson.scripts || {};
    const modules = await this.extractWorkspaces(projectRoot, packageJson);

    // Detect TypeScript usage
    const hasTypeScript =
      (await this.fileExists(projectRoot, 'tsconfig.json')) ||
      !!packageJson.devDependencies?.typescript ||
      !!packageJson.dependencies?.typescript;

    const languages: Language[] = hasTypeScript ? ['typescript', 'javascript'] : ['javascript'];

    // Detect package manager
    const packageManager = await this.detectPackageManager(projectRoot);

    const metadata: UnifiedProjectMetadata = {
      root: projectRoot,
      name,
      version,
      projectType: 'npm',
      languages,
      buildTool: packageManager,
      dependencies,
      devDependencies: devDependencies.length > 0 ? devDependencies : undefined,
      scripts,
      modules: modules.length > 1 ? modules : undefined,
      metadata: {
        nodeVersion: packageJson.engines?.node,
        npmVersion: packageJson.engines?.npm,
        moduleType: packageJson.type || 'commonjs',
        hasTypeScript,
        packageManager,
      },
      discoveredAt: new Date(),
      lastModified: await this.getLastModified(projectRoot, 'package.json'),
    };

    return metadata;
  }

  async getScripts(projectRoot: string): Promise<Record<string, string>> {
    const packageJson = await this.readPackageJson(projectRoot);
    const packageManager = await this.detectPackageManager(projectRoot);

    const scripts: Record<string, string> = {};

    if (packageJson.scripts) {
      for (const name of Object.keys(packageJson.scripts)) {
        scripts[name] = `${packageManager} run ${name}`;
      }
    }

    // Add common built-in scripts
    scripts.install = `${packageManager} install`;
    scripts.update = `${packageManager} update`;

    return scripts;
  }

  // Private helper methods

  private async readPackageJson(projectRoot: string): Promise<PackageJson> {
    try {
      const content = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8');
      return JSON.parse(content) as PackageJson;
    } catch {
      return {};
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

  private async detectPackageManager(projectRoot: string): Promise<string> {
    // Check for lock files
    if (await this.fileExists(projectRoot, 'pnpm-lock.yaml')) return 'pnpm';
    if (await this.fileExists(projectRoot, 'yarn.lock')) return 'yarn';
    if (await this.fileExists(projectRoot, 'package-lock.json')) return 'npm';
    if (await this.fileExists(projectRoot, 'bun.lockb')) return 'bun';

    return 'npm'; // Default
  }

  private extractDependencies(packageJson: PackageJson): UnifiedDependency[] {
    const deps: UnifiedDependency[] = [];

    // Runtime dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        deps.push({
          name,
          version: this.normalizeVersion(version),
          scope: 'runtime',
        });
      }
    }

    // Peer dependencies
    if (packageJson.peerDependencies) {
      for (const [name, version] of Object.entries(packageJson.peerDependencies)) {
        deps.push({
          name,
          version: this.normalizeVersion(version),
          scope: 'peer',
        });
      }
    }

    // Optional dependencies
    if (packageJson.optionalDependencies) {
      for (const [name, version] of Object.entries(packageJson.optionalDependencies)) {
        deps.push({
          name,
          version: this.normalizeVersion(version),
          scope: 'optional',
        });
      }
    }

    return deps;
  }

  private extractDevDependencies(packageJson: PackageJson): UnifiedDependency[] {
    if (!packageJson.devDependencies) return [];

    const devDeps: UnifiedDependency[] = [];

    for (const [name, version] of Object.entries(packageJson.devDependencies)) {
      devDeps.push({
        name,
        version: this.normalizeVersion(version),
        scope: 'dev',
      });
    }

    return devDeps;
  }

  private async extractWorkspaces(_projectRoot: string, packageJson: PackageJson): Promise<UnifiedModule[]> {
    const modules: UnifiedModule[] = [];

    // Root module
    modules.push({
      name: packageJson.name || 'root',
      path: '.',
      type: 'root',
      dependencies: this.extractDependencies(packageJson),
      scripts: packageJson.scripts,
    });

    // Workspaces
    if (packageJson.workspaces) {
      const workspacePatterns = Array.isArray(packageJson.workspaces)
        ? packageJson.workspaces
        : packageJson.workspaces.packages;

      // Note: In production, you'd use glob patterns to find actual workspace directories
      // For now, just list the patterns
      for (const pattern of workspacePatterns) {
        modules.push({
          name: pattern,
          path: pattern,
          type: 'workspace',
          dependencies: [], // Would need to read workspace's package.json
        });
      }
    }

    return modules;
  }

  private normalizeVersion(version: string): string {
    // Remove npm version prefixes (^, ~, >=, etc.)
    return version.replace(/^[\^~>=<]+/, '');
  }
}
