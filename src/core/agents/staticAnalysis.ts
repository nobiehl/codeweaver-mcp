/**
 * Static Analysis Agent
 *
 * Coordinates multiple static analysis tools (SpotBugs, Checkstyle, PMD, etc.)
 * through a unified plugin architecture.
 *
 * This agent provides:
 * - Plugin registration and management
 * - Tool availability checking
 * - Parallel analysis execution
 * - Result aggregation and deduplication
 */

import type {
  StaticAnalysisPlugin,
  StaticAnalysisResult,
  StaticAnalysisFinding,
  StaticAnalysisSummary,
  StaticAnalysisOptions,
  StaticAnalysisTool,
  CombinedAnalysisResult,
  ToolAvailability,
  FindingSeverity,
  FindingCategory,
} from '../../types/staticAnalysis.js';
import { SpotBugsPlugin } from '../staticAnalysis/plugins/spotbugs/index.js';
import { CheckstylePlugin } from '../staticAnalysis/plugins/checkstyle/index.js';

export class StaticAnalysisAgent {
  private plugins: Map<StaticAnalysisTool, StaticAnalysisPlugin> = new Map();

  constructor(private projectRoot: string) {
    this.registerDefaultPlugins();
  }

  /**
   * Register default plugins for supported tools
   */
  private registerDefaultPlugins(): void {
    this.registerPlugin(new SpotBugsPlugin());
    this.registerPlugin(new CheckstylePlugin());
    // Future: PMDPlugin, SonarLintPlugin
  }

  /**
   * Register a custom plugin
   * @param plugin - Static analysis plugin
   */
  registerPlugin(plugin: StaticAnalysisPlugin): void {
    this.plugins.set(plugin.tool, plugin);
  }

  /**
   * Get list of all registered tools
   * @returns Array of tool names
   */
  getSupportedTools(): StaticAnalysisTool[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Get plugin for a specific tool
   * @param tool - Tool name
   * @returns Plugin or undefined
   */
  getPlugin(tool: StaticAnalysisTool): StaticAnalysisPlugin | undefined {
    return this.plugins.get(tool);
  }

  /**
   * Check availability of all registered tools
   * @returns Map of tool availability
   */
  async checkAllToolsAvailability(): Promise<Map<StaticAnalysisTool, ToolAvailability>> {
    const results = new Map<StaticAnalysisTool, ToolAvailability>();

    const checks = Array.from(this.plugins.entries()).map(async ([tool, plugin]) => {
      const availability = await plugin.checkAvailability();
      results.set(tool, availability);
    });

    await Promise.all(checks);
    return results;
  }

  /**
   * Check availability of a specific tool
   * @param tool - Tool name
   * @returns Tool availability info
   */
  async checkToolAvailability(tool: StaticAnalysisTool): Promise<ToolAvailability> {
    const plugin = this.plugins.get(tool);
    if (!plugin) {
      return {
        installed: false,
        error: `Unknown tool: ${tool}`,
      };
    }
    return plugin.checkAvailability();
  }

  /**
   * Run analysis with a single tool
   * @param tool - Tool to run
   * @param options - Analysis options
   * @returns Analysis result
   */
  async runTool(
    tool: StaticAnalysisTool,
    options?: StaticAnalysisOptions,
  ): Promise<StaticAnalysisResult> {
    const plugin = this.plugins.get(tool);
    if (!plugin) {
      return this.createErrorResult(tool, `Unknown tool: ${tool}`);
    }

    // Check if tool can analyze this project
    const canAnalyze = await plugin.canAnalyze(this.projectRoot);
    if (!canAnalyze) {
      return this.createErrorResult(
        tool,
        `${plugin.displayName} cannot analyze this project. Ensure Java source files exist.`,
      );
    }

    // Check availability
    const availability = await plugin.checkAvailability();
    if (!availability.installed) {
      return this.createErrorResult(
        tool,
        `${plugin.displayName} is not installed. ${availability.installInstructions || ''}`,
      );
    }

    // Run analysis
    return plugin.analyze(this.projectRoot, options);
  }

  /**
   * Run analysis with all available tools
   * @param options - Analysis options
   * @returns Combined analysis result
   */
  async runAllTools(options?: StaticAnalysisOptions): Promise<CombinedAnalysisResult> {
    const toolsRun: StaticAnalysisTool[] = [];
    const toolsFailed: StaticAnalysisTool[] = [];
    const results: StaticAnalysisResult[] = [];

    // Run all tools in parallel
    const analysisPromises = Array.from(this.plugins.entries()).map(
      async ([tool, plugin]) => {
        // Check if tool can analyze
        const canAnalyze = await plugin.canAnalyze(this.projectRoot);
        if (!canAnalyze) {
          return null;
        }

        // Check availability
        const availability = await plugin.checkAvailability();
        if (!availability.installed) {
          return null;
        }

        toolsRun.push(tool);

        try {
          const result = await plugin.analyze(this.projectRoot, options);
          if (!result.success) {
            toolsFailed.push(tool);
          }
          return result;
        } catch (error) {
          toolsFailed.push(tool);
          return this.createErrorResult(
            tool,
            `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      },
    );

    const analysisResults = await Promise.all(analysisPromises);

    // Filter out null results (tools that couldn't analyze)
    for (const result of analysisResults) {
      if (result) {
        results.push(result);
      }
    }

    // Combine all findings
    const allFindings = this.combineFindings(results);

    // Calculate combined summary
    const summary = this.calculateCombinedSummary(allFindings, results);

    return {
      results,
      allFindings,
      summary,
      success: toolsFailed.length === 0 && toolsRun.length > 0,
      toolsRun,
      toolsFailed,
    };
  }

  /**
   * Run analysis with specific tools
   * @param tools - Tools to run
   * @param options - Analysis options
   * @returns Combined analysis result
   */
  async runTools(
    tools: StaticAnalysisTool[],
    options?: StaticAnalysisOptions,
  ): Promise<CombinedAnalysisResult> {
    const toolsRun: StaticAnalysisTool[] = [];
    const toolsFailed: StaticAnalysisTool[] = [];
    const results: StaticAnalysisResult[] = [];

    // Run specified tools in parallel
    const analysisPromises = tools.map(async (tool) => {
      const result = await this.runTool(tool, options);
      toolsRun.push(tool);
      if (!result.success) {
        toolsFailed.push(tool);
      }
      return result;
    });

    results.push(...(await Promise.all(analysisPromises)));

    // Combine all findings
    const allFindings = this.combineFindings(results);

    // Calculate combined summary
    const summary = this.calculateCombinedSummary(allFindings, results);

    return {
      results,
      allFindings,
      summary,
      success: toolsFailed.length === 0,
      toolsRun,
      toolsFailed,
    };
  }

  /**
   * Get findings for a specific file
   * @param result - Analysis result
   * @param filePath - File path to filter by
   * @returns Findings for the file
   */
  getFindingsForFile(
    result: CombinedAnalysisResult | StaticAnalysisResult,
    filePath: string,
  ): StaticAnalysisFinding[] {
    const findings =
      'allFindings' in result ? result.allFindings : result.findings;
    return findings.filter(
      (f) => f.filePath === filePath || f.filePath.endsWith(filePath),
    );
  }

  /**
   * Get findings by severity
   * @param result - Analysis result
   * @param severity - Severity to filter by
   * @returns Findings with the specified severity
   */
  getFindingsBySeverity(
    result: CombinedAnalysisResult | StaticAnalysisResult,
    severity: FindingSeverity,
  ): StaticAnalysisFinding[] {
    const findings =
      'allFindings' in result ? result.allFindings : result.findings;
    return findings.filter((f) => f.severity === severity);
  }

  /**
   * Get findings by category
   * @param result - Analysis result
   * @param category - Category to filter by
   * @returns Findings with the specified category
   */
  getFindingsByCategory(
    result: CombinedAnalysisResult | StaticAnalysisResult,
    category: FindingCategory,
  ): StaticAnalysisFinding[] {
    const findings =
      'allFindings' in result ? result.allFindings : result.findings;
    return findings.filter((f) => f.category === category);
  }

  /**
   * Format findings as a human-readable report
   * @param result - Analysis result
   * @returns Formatted report string
   */
  formatReport(result: CombinedAnalysisResult | StaticAnalysisResult): string {
    const lines: string[] = [];
    const findings =
      'allFindings' in result ? result.allFindings : result.findings;
    const summary = result.summary;

    lines.push('='.repeat(60));
    lines.push('STATIC ANALYSIS REPORT');
    lines.push('='.repeat(60));
    lines.push('');

    // Summary
    lines.push('SUMMARY');
    lines.push('-'.repeat(40));
    lines.push(`Total Findings: ${summary.totalFindings}`);
    lines.push(`Files with Findings: ${summary.filesWithFindings}`);
    lines.push(`Analysis Duration: ${summary.durationMs}ms`);
    lines.push('');

    // By Severity
    lines.push('By Severity:');
    for (const [severity, count] of Object.entries(summary.bySeverity)) {
      if (count > 0) {
        lines.push(`  ${severity}: ${count}`);
      }
    }
    lines.push('');

    // By Category
    lines.push('By Category:');
    for (const [category, count] of Object.entries(summary.byCategory)) {
      if (count > 0) {
        lines.push(`  ${category}: ${count}`);
      }
    }
    lines.push('');

    // Tools run (for combined results)
    if ('toolsRun' in result) {
      lines.push('Tools Run: ' + result.toolsRun.join(', '));
      if (result.toolsFailed.length > 0) {
        lines.push('Tools Failed: ' + result.toolsFailed.join(', '));
      }
      lines.push('');
    }

    // Findings grouped by file
    if (findings.length > 0) {
      lines.push('FINDINGS');
      lines.push('-'.repeat(40));

      const byFile = new Map<string, StaticAnalysisFinding[]>();
      for (const finding of findings) {
        const existing = byFile.get(finding.filePath) || [];
        existing.push(finding);
        byFile.set(finding.filePath, existing);
      }

      for (const [file, fileFindings] of byFile.entries()) {
        lines.push('');
        lines.push(`File: ${file}`);
        for (const f of fileFindings.sort((a, b) => a.line - b.line)) {
          lines.push(
            `  Line ${f.line}: [${f.severity.toUpperCase()}] ${f.message}`,
          );
          lines.push(`    Rule: ${f.ruleId} (${f.tool})`);
        }
      }
    } else {
      lines.push('No findings detected.');
    }

    lines.push('');
    lines.push('='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Combine findings from multiple tools, removing duplicates
   */
  private combineFindings(results: StaticAnalysisResult[]): StaticAnalysisFinding[] {
    const allFindings: StaticAnalysisFinding[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      for (const finding of result.findings) {
        // Create a unique key for deduplication
        const key = `${finding.filePath}:${finding.line}:${finding.ruleId}`;
        if (!seen.has(key)) {
          seen.add(key);
          allFindings.push(finding);
        }
      }
    }

    // Sort by file, then by line
    return allFindings.sort((a, b) => {
      const fileCompare = a.filePath.localeCompare(b.filePath);
      if (fileCompare !== 0) return fileCompare;
      return a.line - b.line;
    });
  }

  /**
   * Calculate combined summary from multiple results
   */
  private calculateCombinedSummary(
    findings: StaticAnalysisFinding[],
    results: StaticAnalysisResult[],
  ): StaticAnalysisSummary {
    const bySeverity: Record<FindingSeverity, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      info: 0,
    };

    const byCategory: Record<FindingCategory, number> = {
      bug: 0,
      vulnerability: 0,
      'code-smell': 0,
      style: 0,
      performance: 0,
      'best-practice': 0,
      documentation: 0,
      duplication: 0,
    };

    for (const finding of findings) {
      bySeverity[finding.severity]++;
      byCategory[finding.category]++;
    }

    const filesWithFindings = new Set(findings.map((f) => f.filePath)).size;
    const totalDuration = results.reduce((sum, r) => sum + r.summary.durationMs, 0);

    return {
      totalFindings: findings.length,
      bySeverity,
      byCategory,
      filesAnalyzed: 0, // Would need to aggregate from individual results
      filesWithFindings,
      durationMs: totalDuration,
    };
  }

  /**
   * Create an error result for a tool
   */
  private createErrorResult(tool: StaticAnalysisTool, error: string): StaticAnalysisResult {
    return {
      tool,
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
        durationMs: 0,
      },
      timestamp: new Date(),
    };
  }
}
