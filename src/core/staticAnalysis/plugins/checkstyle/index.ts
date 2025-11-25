/**
 * Checkstyle Static Analysis Plugin
 *
 * Integrates Checkstyle for Java code style checking.
 * Checkstyle enforces coding standards and best practices.
 *
 * @see https://checkstyle.sourceforge.io/
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
 * Checkstyle severity to our severity mapping
 */
const SEVERITY_MAP: Record<string, FindingSeverity> = {
  error: 'high',
  warning: 'medium',
  info: 'low',
  ignore: 'info',
};

/**
 * Checkstyle check categories
 */
const CHECK_CATEGORIES: Record<string, FindingCategory> = {
  // Naming conventions
  AbstractClassName: 'style',
  ClassTypeParameterName: 'style',
  ConstantName: 'style',
  LocalFinalVariableName: 'style',
  LocalVariableName: 'style',
  MemberName: 'style',
  MethodName: 'style',
  MethodTypeParameterName: 'style',
  PackageName: 'style',
  ParameterName: 'style',
  StaticVariableName: 'style',
  TypeName: 'style',

  // Imports
  AvoidStarImport: 'best-practice',
  IllegalImport: 'best-practice',
  RedundantImport: 'code-smell',
  UnusedImports: 'code-smell',

  // Javadoc
  JavadocMethod: 'documentation',
  JavadocType: 'documentation',
  JavadocVariable: 'documentation',
  JavadocStyle: 'documentation',
  MissingJavadocMethod: 'documentation',
  MissingJavadocType: 'documentation',

  // Size violations
  FileLength: 'code-smell',
  LineLength: 'style',
  MethodLength: 'code-smell',
  ParameterNumber: 'code-smell',
  AnonInnerLength: 'code-smell',

  // Whitespace
  EmptyForIteratorPad: 'style',
  GenericWhitespace: 'style',
  MethodParamPad: 'style',
  NoWhitespaceAfter: 'style',
  NoWhitespaceBefore: 'style',
  OperatorWrap: 'style',
  ParenPad: 'style',
  TypecastParenPad: 'style',
  WhitespaceAfter: 'style',
  WhitespaceAround: 'style',

  // Modifiers
  ModifierOrder: 'style',
  RedundantModifier: 'code-smell',

  // Blocks
  AvoidNestedBlocks: 'best-practice',
  EmptyBlock: 'code-smell',
  LeftCurly: 'style',
  NeedBraces: 'best-practice',
  RightCurly: 'style',

  // Coding
  AvoidInlineConditionals: 'best-practice',
  CovariantEquals: 'bug',
  EmptyStatement: 'code-smell',
  EqualsAvoidNull: 'bug',
  EqualsHashCode: 'bug',
  HiddenField: 'code-smell',
  IllegalInstantiation: 'best-practice',
  InnerAssignment: 'code-smell',
  MagicNumber: 'code-smell',
  MissingSwitchDefault: 'best-practice',
  SimplifyBooleanExpression: 'code-smell',
  SimplifyBooleanReturn: 'code-smell',
  StringLiteralEquality: 'bug',
  NestedForDepth: 'code-smell',
  NestedIfDepth: 'code-smell',
  NestedTryDepth: 'code-smell',
  NoClone: 'best-practice',
  NoFinalizer: 'best-practice',
  SuperClone: 'bug',
  SuperFinalize: 'bug',
  IllegalCatch: 'best-practice',
  IllegalThrows: 'best-practice',
  PackageDeclaration: 'best-practice',
  ReturnCount: 'code-smell',
  IllegalType: 'best-practice',
  DeclarationOrder: 'style',
  ParameterAssignment: 'code-smell',
  ExplicitInitialization: 'code-smell',
  DefaultComesLast: 'best-practice',
  FallThrough: 'bug',
  MultipleStringLiterals: 'code-smell',
  MultipleVariableDeclarations: 'style',
  UnnecessaryParentheses: 'code-smell',

  // Class design
  DesignForExtension: 'best-practice',
  FinalClass: 'best-practice',
  HideUtilityClassConstructor: 'best-practice',
  InterfaceIsType: 'best-practice',
  MutableException: 'bug',
  ThrowsCount: 'code-smell',
  VisibilityModifier: 'best-practice',
};

export class CheckstylePlugin implements StaticAnalysisPlugin {
  readonly name = 'checkstyle';
  readonly tool = 'checkstyle' as const;
  readonly displayName = 'Checkstyle';
  readonly description = 'Check Java source code against coding standards';
  readonly supportedLanguages = ['java'];

  async checkAvailability(): Promise<ToolAvailability> {
    // Check for Checkstyle in PATH
    try {
      const result = spawnSync('checkstyle', ['--version'], {
        encoding: 'utf-8',
        timeout: 10000,
        shell: true,
      });

      if (result.status === 0) {
        const version = result.stdout?.trim() || result.stderr?.trim() || 'unknown';
        return {
          installed: true,
          version: version.replace('Checkstyle version: ', ''),
          path: 'checkstyle',
        };
      }
    } catch {
      // checkstyle not in PATH
    }

    // Check for Gradle Checkstyle plugin
    try {
      const gradlewPath = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      const result = spawnSync(gradlewPath, ['tasks', '--all'], {
        encoding: 'utf-8',
        timeout: 30000,
        shell: true,
      });

      if (result.stdout?.includes('checkstyle')) {
        return {
          installed: true,
          version: 'gradle-plugin',
          path: gradlewPath,
          installInstructions: 'Checkstyle available via Gradle plugin',
        };
      }
    } catch {
      // No Gradle wrapper
    }

    return {
      installed: false,
      error: 'Checkstyle not found',
      installInstructions: `Install Checkstyle:
1. Via Gradle: Add 'id "checkstyle"' to plugins block
2. Standalone: Download from https://checkstyle.sourceforge.io/
3. Via package manager: brew install checkstyle (macOS)`,
    };
  }

  async canAnalyze(projectRoot: string): Promise<boolean> {
    // Check for Java source files
    try {
      const srcMain = path.join(projectRoot, 'src', 'main', 'java');
      const srcDir = path.join(projectRoot, 'src');

      return (await this.pathExists(srcMain)) || (await this.pathExists(srcDir));
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
      // Try Gradle plugin first
      const gradleResult = await this.runGradleCheckstyle(projectRoot);
      if (gradleResult.success) {
        return gradleResult;
      }

      // Try standalone Checkstyle
      const standaloneResult = await this.runStandaloneCheckstyle(projectRoot);
      if (standaloneResult.success) {
        return standaloneResult;
      }

      return this.createErrorResult(
        'Checkstyle analysis failed. Ensure Checkstyle is installed via Gradle plugin or standalone.',
        startTime,
      );
    } catch (error) {
      return this.createErrorResult(
        `Checkstyle analysis error: ${error instanceof Error ? error.message : String(error)}`,
        startTime,
      );
    }
  }

  private async runGradleCheckstyle(
    projectRoot: string,
  ): Promise<StaticAnalysisResult> {
    const startTime = Date.now();

    try {
      const gradlew = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      const gradlewPath = path.join(projectRoot, gradlew);

      if (!(await this.pathExists(gradlewPath))) {
        return this.createErrorResult('Gradle wrapper not found', startTime);
      }

      // Run Checkstyle
      const result = spawnSync(gradlew, ['checkstyleMain', '--no-daemon'], {
        cwd: projectRoot,
        encoding: 'utf-8',
        timeout: 300000,
        shell: true,
      });

      // Look for Checkstyle XML report
      const reportPath = path.join(projectRoot, 'build', 'reports', 'checkstyle', 'main.xml');
      if (await this.pathExists(reportPath)) {
        const findings = await this.parseCheckstyleXml(reportPath, projectRoot);
        return this.createSuccessResult(findings, startTime, 'gradle-plugin');
      }

      if (result.stderr?.includes('Task checkstyleMain not found')) {
        return this.createErrorResult('Checkstyle Gradle plugin not configured', startTime);
      }

      // Checkstyle might fail with violations - check for report anyway
      const altReportPath = path.join(
        projectRoot,
        'build',
        'reports',
        'checkstyle',
        'checkstyleMain.xml',
      );
      if (await this.pathExists(altReportPath)) {
        const findings = await this.parseCheckstyleXml(altReportPath, projectRoot);
        return this.createSuccessResult(findings, startTime, 'gradle-plugin');
      }

      return this.createErrorResult(
        `Gradle Checkstyle failed: ${result.stderr || result.stdout || 'Unknown error'}`,
        startTime,
      );
    } catch (error) {
      return this.createErrorResult(
        `Gradle Checkstyle error: ${error instanceof Error ? error.message : String(error)}`,
        startTime,
      );
    }
  }

  private async runStandaloneCheckstyle(
    projectRoot: string,
  ): Promise<StaticAnalysisResult> {
    const startTime = Date.now();

    try {
      // Find or create config file
      let configPath: string | undefined;
      if (!configPath) {
        // Look for existing config
        const defaultConfigs = [
          'checkstyle.xml',
          'config/checkstyle/checkstyle.xml',
          '.checkstyle.xml',
        ];

        for (const cfg of defaultConfigs) {
          const fullPath = path.join(projectRoot, cfg);
          if (await this.pathExists(fullPath)) {
            configPath = fullPath;
            break;
          }
        }

        // Use built-in Google style if no config found
        if (!configPath) {
          configPath = '/google_checks.xml'; // Built-in config
        }
      }

      // Find Java source directory
      const srcDir = path.join(projectRoot, 'src', 'main', 'java');
      const altSrcDir = path.join(projectRoot, 'src');

      const sourceDir = (await this.pathExists(srcDir)) ? srcDir : altSrcDir;

      // Create temp output file
      const outputFile = path.join(projectRoot, '.checkstyle-report.xml');

      // Run standalone Checkstyle
      const result = spawnSync(
        'checkstyle',
        ['-c', configPath, '-f', 'xml', '-o', outputFile, sourceDir],
        {
          cwd: projectRoot,
          encoding: 'utf-8',
          timeout: 300000,
          shell: true,
        },
      );

      if (await this.pathExists(outputFile)) {
        const findings = await this.parseCheckstyleXml(outputFile, projectRoot);
        // Clean up temp file
        await fs.unlink(outputFile).catch(() => {});
        return this.createSuccessResult(findings, startTime);
      }

      return this.createErrorResult(
        `Standalone Checkstyle failed: ${result.stderr || 'No output generated'}`,
        startTime,
      );
    } catch (error) {
      return this.createErrorResult(
        `Standalone Checkstyle error: ${error instanceof Error ? error.message : String(error)}`,
        startTime,
      );
    }
  }

  private async parseCheckstyleXml(
    xmlPath: string,
    projectRoot: string,
  ): Promise<StaticAnalysisFinding[]> {
    const content = await fs.readFile(xmlPath, 'utf-8');
    const findings: StaticAnalysisFinding[] = [];

    // Parse Checkstyle XML format
    // <file name="path/to/File.java">
    //   <error line="10" column="5" severity="warning" message="..." source="...CheckName"/>
    // </file>

    const fileRegex = /<file name="([^"]+)">([\s\S]*?)<\/file>/g;
    const errorRegex =
      /<error\s+line="(\d+)"(?:\s+column="(\d+)")?(?:\s+severity="([^"]+)")?\s+message="([^"]+)"\s+source="([^"]+)"/g;

    let fileMatch;
    while ((fileMatch = fileRegex.exec(content)) !== null) {
      const filePath = fileMatch[1];
      const fileContent = fileMatch[2];

      // Make path relative if it's absolute
      const relativePath = filePath.startsWith(projectRoot)
        ? path.relative(projectRoot, filePath)
        : filePath;

      let errorMatch;
      while ((errorMatch = errorRegex.exec(fileContent)) !== null) {
        const line = parseInt(errorMatch[1], 10);
        const column = errorMatch[2] ? parseInt(errorMatch[2], 10) : undefined;
        const severity = errorMatch[3] || 'warning';
        const message = this.decodeXmlEntities(errorMatch[4]);
        const source = errorMatch[5];

        // Extract check name from source (e.g., "com.puppycrawl.tools.checkstyle.checks.naming.MemberNameCheck")
        const checkName = source.split('.').pop()?.replace('Check', '') || source;

        findings.push({
          ruleId: checkName,
          ruleName: this.formatRuleName(checkName),
          filePath: relativePath,
          line,
          column,
          severity: SEVERITY_MAP[severity] || 'medium',
          category: CHECK_CATEGORIES[checkName] || 'style',
          message,
          tool: 'checkstyle',
          documentationUrl: this.getRuleDocumentation(checkName),
        });
      }
    }

    return findings;
  }

  getRuleDocumentation(ruleId: string): string {
    // Convert CamelCase to lowercase-with-dashes for URL
    const urlName = ruleId.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    return `https://checkstyle.sourceforge.io/checks/${urlName}.html`;
  }

  getDefaultConfig(): string {
    return `<?xml version="1.0"?>
<!DOCTYPE module PUBLIC
  "-//Checkstyle//DTD Checkstyle Configuration 1.3//EN"
  "https://checkstyle.org/dtds/configuration_1_3.dtd">

<module name="Checker">
  <property name="severity" value="warning"/>
  <property name="fileExtensions" value="java"/>

  <module name="TreeWalker">
    <!-- Naming Conventions -->
    <module name="ConstantName"/>
    <module name="LocalFinalVariableName"/>
    <module name="LocalVariableName"/>
    <module name="MemberName"/>
    <module name="MethodName"/>
    <module name="PackageName"/>
    <module name="ParameterName"/>
    <module name="TypeName"/>

    <!-- Imports -->
    <module name="AvoidStarImport"/>
    <module name="UnusedImports"/>
    <module name="RedundantImport"/>

    <!-- Size Violations -->
    <module name="LineLength">
      <property name="max" value="120"/>
    </module>
    <module name="MethodLength">
      <property name="max" value="150"/>
    </module>

    <!-- Whitespace -->
    <module name="WhitespaceAfter"/>
    <module name="WhitespaceAround"/>
    <module name="GenericWhitespace"/>

    <!-- Coding -->
    <module name="EmptyStatement"/>
    <module name="EqualsHashCode"/>
    <module name="MissingSwitchDefault"/>
    <module name="SimplifyBooleanExpression"/>
    <module name="SimplifyBooleanReturn"/>

    <!-- Design -->
    <module name="HideUtilityClassConstructor"/>
    <module name="InterfaceIsType"/>
  </module>

  <!-- File-level checks -->
  <module name="FileLength">
    <property name="max" value="2000"/>
  </module>
</module>`;
  }

  private formatRuleName(ruleId: string): string {
    // Convert CamelCase to spaced words
    return ruleId.replace(/([a-z])([A-Z])/g, '$1 $2');
  }

  private decodeXmlEntities(str: string): string {
    return str
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
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
      filesAnalyzed: 0,
      filesWithFindings,
      durationMs: Date.now() - startTime,
    };

    return {
      tool: 'checkstyle',
      success: true,
      findings,
      summary,
      timestamp: new Date(),
      toolVersion: version,
    };
  }

  private createErrorResult(error: string, startTime: number): StaticAnalysisResult {
    return {
      tool: 'checkstyle',
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
