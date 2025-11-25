/**
 * SpotBugs Static Analysis Plugin
 *
 * Integrates SpotBugs (formerly FindBugs) for Java bug detection.
 * SpotBugs finds bugs in Java programs using static analysis.
 *
 * @see https://spotbugs.github.io/
 */

import { spawnSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import type {
  StaticAnalysisPlugin,
  StaticAnalysisResult,
  StaticAnalysisFinding,
  StaticAnalysisSummary,
  StaticAnalysisOptions,
  ToolAvailability,
  FindingSeverity,
  FindingCategory,
} from '../../../../types/staticAnalysis.js';

/**
 * SpotBugs bug pattern priorities mapped to severity
 */
const PRIORITY_TO_SEVERITY: Record<string, FindingSeverity> = {
  '1': 'high', // High priority
  '2': 'medium', // Normal priority
  '3': 'low', // Low priority
};

/**
 * SpotBugs category to finding category mapping
 */
const CATEGORY_MAP: Record<string, FindingCategory> = {
  CORRECTNESS: 'bug',
  BAD_PRACTICE: 'best-practice',
  PERFORMANCE: 'performance',
  SECURITY: 'vulnerability',
  STYLE: 'style',
  MALICIOUS_CODE: 'vulnerability',
  MT_CORRECTNESS: 'bug', // Multithreaded correctness
  I18N: 'best-practice', // Internationalization
  EXPERIMENTAL: 'code-smell',
};

export class SpotBugsPlugin implements StaticAnalysisPlugin {
  readonly name = 'spotbugs';
  readonly tool = 'spotbugs' as const;
  readonly displayName = 'SpotBugs';
  readonly description = 'Find bugs in Java programs using static analysis';
  readonly supportedLanguages = ['java'];

  async checkAvailability(): Promise<ToolAvailability> {
    // Check for SpotBugs in PATH
    try {
      const result = spawnSync('spotbugs', ['-version'], {
        encoding: 'utf-8',
        timeout: 10000,
        shell: true,
      });

      if (result.status === 0) {
        const version = result.stdout?.trim() || result.stderr?.trim() || 'unknown';
        return {
          installed: true,
          version,
          path: 'spotbugs',
        };
      }
    } catch {
      // spotbugs not in PATH
    }

    // Check for Gradle SpotBugs plugin (more common in projects)
    try {
      const gradlewPath = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      const result = spawnSync(gradlewPath, ['tasks', '--all'], {
        encoding: 'utf-8',
        timeout: 30000,
        shell: true,
      });

      if (result.stdout?.includes('spotbugs')) {
        return {
          installed: true,
          version: 'gradle-plugin',
          path: gradlewPath,
          installInstructions: 'SpotBugs available via Gradle plugin',
        };
      }
    } catch {
      // No Gradle wrapper
    }

    return {
      installed: false,
      error: 'SpotBugs not found',
      installInstructions: `Install SpotBugs:
1. Via Gradle: Add 'id "com.github.spotbugs" version "6.0.0"' to plugins block
2. Standalone: Download from https://spotbugs.github.io/
3. Via package manager: brew install spotbugs (macOS)`,
    };
  }

  async canAnalyze(projectRoot: string): Promise<boolean> {
    // Check for Java source files
    try {
      const srcMain = path.join(projectRoot, 'src', 'main', 'java');
      const srcDir = path.join(projectRoot, 'src');

      const mainExists = await this.pathExists(srcMain);
      const srcExists = await this.pathExists(srcDir);

      if (!mainExists && !srcExists) return false;

      // Check for compiled classes or build file
      const buildGradle = path.join(projectRoot, 'build.gradle');
      const buildGradleKts = path.join(projectRoot, 'build.gradle.kts');
      const pomXml = path.join(projectRoot, 'pom.xml');

      return (
        (await this.pathExists(buildGradle)) ||
        (await this.pathExists(buildGradleKts)) ||
        (await this.pathExists(pomXml))
      );
    } catch {
      return false;
    }
  }

  async analyze(
    projectRoot: string,
    _options?: StaticAnalysisOptions,
  ): Promise<StaticAnalysisResult> {
    const startTime = Date.now();

    try {
      // Try Gradle plugin first (most common)
      const gradleResult = await this.runGradleSpotBugs(projectRoot);
      if (gradleResult.success) {
        return gradleResult;
      }

      // Try standalone SpotBugs
      const standaloneResult = await this.runStandaloneSpotBugs(projectRoot);
      if (standaloneResult.success) {
        return standaloneResult;
      }

      // Neither worked
      return this.createErrorResult(
        'SpotBugs analysis failed. Ensure SpotBugs is installed via Gradle plugin or standalone.',
        startTime,
      );
    } catch (error) {
      return this.createErrorResult(
        `SpotBugs analysis error: ${error instanceof Error ? error.message : String(error)}`,
        startTime,
      );
    }
  }

  private async runGradleSpotBugs(
    projectRoot: string,
  ): Promise<StaticAnalysisResult> {
    const startTime = Date.now();

    try {
      // Check if SpotBugs task exists
      const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      const gradlewPath = path.join(projectRoot, gradlew);

      if (!(await this.pathExists(gradlewPath))) {
        return this.createErrorResult('Gradle wrapper not found', startTime);
      }

      // Run SpotBugs
      const result = spawnSync(gradlew, ['spotbugsMain', '--no-daemon'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 300000, // 5 minutes
        shell: true,
      });

      // Look for SpotBugs XML report
      const reportPath = path.join(projectRoot, 'build', 'reports', 'spotbugs', 'main.xml');
      if (await this.pathExists(reportPath)) {
        const findings = await this.parseSpotBugsXml(reportPath);
        return this.createSuccessResult(findings, startTime, 'gradle-plugin');
      }

      // Check for HTML report as fallback
      const htmlReportPath = path.join(projectRoot, 'build', 'reports', 'spotbugs', 'main.html');
      if (await this.pathExists(htmlReportPath)) {
        // HTML exists but no XML - suggest enabling XML output
        return this.createErrorResult(
          'SpotBugs HTML report found but XML report required. Add spotbugs { reportLevel = "low"; reports { xml { enabled = true } } } to build.gradle',
          startTime,
        );
      }

      // Task might not exist or failed
      if (result.stderr?.includes('Task spotbugsMain not found')) {
        return this.createErrorResult('SpotBugs Gradle plugin not configured', startTime);
      }

      return this.createErrorResult(
        `Gradle SpotBugs failed: ${result.stderr || result.stdout || 'Unknown error'}`,
        startTime,
      );
    } catch (error) {
      return this.createErrorResult(
        `Gradle SpotBugs error: ${error instanceof Error ? error.message : String(error)}`,
        startTime,
      );
    }
  }

  private async runStandaloneSpotBugs(
    projectRoot: string,
  ): Promise<StaticAnalysisResult> {
    const startTime = Date.now();

    try {
      // Find compiled classes
      const classesDir = path.join(projectRoot, 'build', 'classes', 'java', 'main');
      const targetClasses = path.join(projectRoot, 'target', 'classes');

      let classPath = '';
      if (await this.pathExists(classesDir)) {
        classPath = classesDir;
      } else if (await this.pathExists(targetClasses)) {
        classPath = targetClasses;
      } else {
        return this.createErrorResult(
          'No compiled classes found. Run "gradle build" or "mvn compile" first.',
          startTime,
        );
      }

      // Create temp output file
      const outputFile = path.join(projectRoot, '.spotbugs-report.xml');

      // Run standalone SpotBugs
      const result = spawnSync('spotbugs', ['-xml', '-output', outputFile, classPath], {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 300000,
        shell: true,
      });

      if (await this.pathExists(outputFile)) {
        const findings = await this.parseSpotBugsXml(outputFile);
        // Clean up temp file
        await fs.unlink(outputFile).catch(() => {});
        return this.createSuccessResult(findings, startTime);
      }

      return this.createErrorResult(
        `Standalone SpotBugs failed: ${result.stderr || 'No output generated'}`,
        startTime,
      );
    } catch (error) {
      return this.createErrorResult(
        `Standalone SpotBugs error: ${error instanceof Error ? error.message : String(error)}`,
        startTime,
      );
    }
  }

  private async parseSpotBugsXml(xmlPath: string): Promise<StaticAnalysisFinding[]> {
    const content = await fs.readFile(xmlPath, 'utf-8');
    const findings: StaticAnalysisFinding[] = [];

    // Simple XML parsing for SpotBugs format
    const sourceLineRegex =
      /<SourceLine[^>]*classname="([^"]*)"[^>]*start="(\d+)"[^>]*end="(\d+)"[^>]*sourcefile="([^"]*)"/;
    const longMessageRegex = /<LongMessage>([^<]*)<\/LongMessage>/;

    // Split into bug instances
    const bugInstances = content.split('</BugInstance>');

    for (const instance of bugInstances) {
      const typeMatch = instance.match(/type="([^"]*)"/);
      const priorityMatch = instance.match(/priority="([^"]*)"/);
      const categoryMatch = instance.match(/category="([^"]*)"/);
      const sourceMatch = instance.match(sourceLineRegex);
      const messageMatch = instance.match(longMessageRegex);

      if (typeMatch && sourceMatch) {
        const ruleId = typeMatch[1];
        const priority = priorityMatch?.[1] || '2';
        const category = categoryMatch?.[1] || 'CORRECTNESS';
        const line = parseInt(sourceMatch[2], 10);
        const endLine = parseInt(sourceMatch[3], 10);
        const sourceFile = sourceMatch[4];
        const message = messageMatch?.[1] || `SpotBugs: ${ruleId}`;

        findings.push({
          ruleId,
          ruleName: this.formatRuleName(ruleId),
          filePath: sourceFile,
          line,
          endLine: endLine !== line ? endLine : undefined,
          severity: PRIORITY_TO_SEVERITY[priority] || 'medium',
          category: CATEGORY_MAP[category] || 'bug',
          message: message.trim(),
          tool: 'spotbugs',
          documentationUrl: this.getRuleDocumentation(ruleId),
        });
      }
    }

    return findings;
  }

  getRuleDocumentation(ruleId: string): string {
    return `https://spotbugs.readthedocs.io/en/latest/bugDescriptions.html#${ruleId.toLowerCase()}`;
  }

  getDefaultConfig(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<FindBugsFilter>
  <!-- Exclude generated code -->
  <Match>
    <Source name="~.*generated.*"/>
  </Match>

  <!-- Exclude test code from certain checks -->
  <Match>
    <Class name="~.*Test"/>
    <Bug category="STYLE"/>
  </Match>
</FindBugsFilter>`;
  }

  private formatRuleName(ruleId: string): string {
    // Convert SNAKE_CASE to Title Case
    return ruleId
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  }

  private createSuccessResult(
    findings: StaticAnalysisFinding[],
    startTime: number,
    version?: string,
  ): StaticAnalysisResult {
    const filesWithFindings = new Set(findings.map((f) => f.filePath)).size;

    const summary: StaticAnalysisSummary = {
      totalFindings: findings.length,
      bySeverity: this.countBySeverity(findings),
      byCategory: this.countByCategory(findings),
      filesAnalyzed: 0, // Would need to count from report
      filesWithFindings,
      durationMs: Date.now() - startTime,
    };

    return {
      tool: 'spotbugs',
      success: true,
      findings,
      summary,
      timestamp: new Date(),
      toolVersion: version,
    };
  }

  private createErrorResult(error: string, startTime: number): StaticAnalysisResult {
    return {
      tool: 'spotbugs',
      success: false,
      error,
      findings: [],
      summary: {
        totalFindings: 0,
        bySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
        byCategory: {
          bug: 0,
          vulnerability: 0,
          'code-smell': 0,
          style: 0,
          performance: 0,
          'best-practice': 0,
          documentation: 0,
          duplication: 0,
        },
        filesAnalyzed: 0,
        filesWithFindings: 0,
        durationMs: Date.now() - startTime,
      },
      timestamp: new Date(),
    };
  }

  private countBySeverity(
    findings: StaticAnalysisFinding[],
  ): Record<FindingSeverity, number> {
    const counts: Record<FindingSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };
    for (const f of findings) {
      counts[f.severity]++;
    }
    return counts;
  }

  private countByCategory(
    findings: StaticAnalysisFinding[],
  ): Record<FindingCategory, number> {
    const counts: Record<FindingCategory, number> = {
      bug: 0,
      vulnerability: 0,
      'code-smell': 0,
      style: 0,
      performance: 0,
      'best-practice': 0,
      documentation: 0,
      duplication: 0,
    };
    for (const f of findings) {
      counts[f.category]++;
    }
    return counts;
  }

  private async pathExists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
}
