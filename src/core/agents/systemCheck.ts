import { execSync } from 'child_process';
import type {
  DependencyCheck,
  SystemCheckResult,
  DependencyName,
} from '../../types/system.js';

export class SystemCheckAgent {
  private checks: DependencyCheck[] = [];
  private warnings: string[] = [];
  private errors: string[] = [];

  /**
   * Run full system check (all dependencies)
   */
  async runFullCheck(): Promise<SystemCheckResult> {
    this.reset();

    // Critical dependencies
    await this.checkNode();
    await this.checkGit();

    // Optional dependencies
    await this.checkPython();
    await this.checkGradle();
    await this.checkMaven();

    return this.buildResult();
  }

  /**
   * Run quick check (only critical dependencies)
   * Used for startup validation
   */
  async runQuickCheck(): Promise<SystemCheckResult> {
    this.reset();

    await this.checkNode();
    await this.checkGit();

    return this.buildResult();
  }

  /**
   * Check specific dependency
   */
  async checkDependency(name: DependencyName): Promise<DependencyCheck> {
    this.reset();

    switch (name) {
      case 'node':
        await this.checkNode();
        break;
      case 'git':
        await this.checkGit();
        break;
      case 'python':
        await this.checkPython();
        break;
      case 'gradle':
        await this.checkGradle();
        break;
      case 'maven':
        await this.checkMaven();
        break;
    }

    return this.checks[0];
  }

  /**
   * Check Node.js (CRITICAL - required for CodeWeaver)
   */
  private async checkNode(): Promise<void> {
    const check: DependencyCheck = {
      name: 'Node.js',
      required: true,
      installed: false,
      expectedVersion: '>=18.0.0',
    };

    try {
      const version = process.version; // e.g., "v20.10.0"
      check.version = version.replace('v', '');
      check.installed = true;

      // Check minimum version (Node 18+)
      const major = parseInt(check.version.split('.')[0], 10);
      if (major < 18) {
        check.error = `Node.js ${check.version} is too old. Please upgrade to Node.js 18 or higher.`;
        this.errors.push(check.error);
      }

      // Find Node.js path
      try {
        const nodePath = execSync('where node', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
        check.path = nodePath.split('\n')[0]; // First match on Windows
      } catch {
        // Path lookup failed, but Node.js is running, so it's fine
      }
    } catch (error) {
      check.error = 'Node.js is not installed or not in PATH';
      this.errors.push(check.error);
    }

    this.checks.push(check);
  }

  /**
   * Check Git (REQUIRED for VCS Agent)
   */
  private async checkGit(): Promise<void> {
    const check: DependencyCheck = {
      name: 'Git',
      required: true,
      installed: false,
      expectedVersion: '>=2.0.0',
    };

    try {
      const version = this.exec('git --version'); // e.g., "git version 2.43.0.windows.1"
      const match = version.match(/git version ([\d.]+)/);
      if (match) {
        check.version = match[1];
        check.installed = true;

        // Check minimum version (Git 2.0+)
        const major = parseInt(check.version.split('.')[0], 10);
        if (major < 2) {
          check.error = `Git ${check.version} is too old. Please upgrade to Git 2.0 or higher.`;
          this.warnings.push(check.error);
        }
      }

      // Find Git path
      try {
        const gitPath = this.exec('where git');
        check.path = gitPath.split('\n')[0].trim(); // First match
      } catch {
        // Path lookup might fail on non-Windows
        try {
          check.path = this.exec('which git').trim();
        } catch {
          // Ignore path lookup failures
        }
      }
    } catch (error) {
      check.error = 'Git is not installed or not in PATH. VCS features will not work.';
      this.errors.push(check.error);
    }

    this.checks.push(check);
  }

  /**
   * Check Python (OPTIONAL for future Python-project analysis)
   */
  private async checkPython(): Promise<void> {
    const check: DependencyCheck = {
      name: 'Python',
      required: false,
      installed: false,
      expectedVersion: '>=3.8.0',
    };

    try {
      // Try python3 first (Linux/Mac), then python (Windows)
      let version: string;
      try {
        version = this.exec('python3 --version');
      } catch {
        version = this.exec('python --version');
      }

      const match = version.match(/Python ([\d.]+)/);
      if (match) {
        check.version = match[1];
        check.installed = true;

        // Check minimum version (Python 3.8+)
        const [major, minor] = check.version.split('.').map(v => parseInt(v, 10));
        if (major < 3 || (major === 3 && minor < 8)) {
          check.error = `Python ${check.version} is too old. Recommended: Python 3.8+`;
          this.warnings.push(check.error);
        }

        // Find Python path
        try {
          const pythonPath = this.exec('where python3 || where python || which python3 || which python');
          check.path = pythonPath.split('\n')[0].trim();
        } catch {
          // Ignore path lookup failures
        }
      }
    } catch (error) {
      check.error = 'Python is not installed (optional - needed for future Python project analysis)';
      this.warnings.push(check.error);
    }

    this.checks.push(check);
  }

  /**
   * Check Gradle (OPTIONAL for Gradle projects)
   */
  private async checkGradle(): Promise<void> {
    const check: DependencyCheck = {
      name: 'Gradle',
      required: false,
      installed: false,
      expectedVersion: '>=7.0.0',
    };

    try {
      const version = this.exec('gradle --version');
      const match = version.match(/Gradle ([\d.]+)/);
      if (match) {
        check.version = match[1];
        check.installed = true;

        // Find Gradle path
        try {
          const gradlePath = this.exec('where gradle || which gradle');
          check.path = gradlePath.split('\n')[0].trim();
        } catch {
          // Ignore
        }
      }
    } catch (error) {
      check.error = 'Gradle is not installed (optional - detected via gradle wrapper if present)';
      this.warnings.push(check.error);
    }

    this.checks.push(check);
  }

  /**
   * Check Maven (OPTIONAL for Maven projects)
   */
  private async checkMaven(): Promise<void> {
    const check: DependencyCheck = {
      name: 'Maven',
      required: false,
      installed: false,
      expectedVersion: '>=3.6.0',
    };

    try {
      const version = this.exec('mvn --version');
      const match = version.match(/Apache Maven ([\d.]+)/);
      if (match) {
        check.version = match[1];
        check.installed = true;

        // Find Maven path
        try {
          const mvnPath = this.exec('where mvn || which mvn');
          check.path = mvnPath.split('\n')[0].trim();
        } catch {
          // Ignore
        }
      }
    } catch (error) {
      check.error = 'Maven is not installed (optional - detected via mvnw wrapper if present)';
      this.warnings.push(check.error);
    }

    this.checks.push(check);
  }

  /**
   * Execute shell command and return output
   */
  private exec(command: string): string {
    return execSync(command, {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore'], // Suppress stderr
    }).trim();
  }

  /**
   * Reset check state
   */
  private reset(): void {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Build final result
   */
  private buildResult(): SystemCheckResult {
    const allPassed = this.errors.length === 0;

    return {
      allPassed,
      checks: this.checks,
      warnings: this.warnings,
      errors: this.errors,
      timestamp: new Date(),
    };
  }
}
