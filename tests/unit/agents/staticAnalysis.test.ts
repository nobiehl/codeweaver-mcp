import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StaticAnalysisAgent } from '../../../src/core/agents/staticAnalysis.js';
import { SpotBugsPlugin } from '../../../src/core/staticAnalysis/plugins/spotbugs/index.js';
import { CheckstylePlugin } from '../../../src/core/staticAnalysis/plugins/checkstyle/index.js';

describe('StaticAnalysisAgent', () => {
  let agent: StaticAnalysisAgent;

  beforeEach(() => {
    agent = new StaticAnalysisAgent('/tmp/test-project');
  });

  describe('Plugin Registration', () => {
    it('should register default plugins (SpotBugs, Checkstyle)', () => {
      const tools = agent.getSupportedTools();
      expect(tools).toContain('spotbugs');
      expect(tools).toContain('checkstyle');
    });

    it('should have 2 default plugins', () => {
      const tools = agent.getSupportedTools();
      expect(tools).toHaveLength(2);
    });

    it('should return plugin by tool name', () => {
      const spotbugsPlugin = agent.getPlugin('spotbugs');
      expect(spotbugsPlugin).toBeDefined();
      expect(spotbugsPlugin?.name).toBe('spotbugs');

      const checkstylePlugin = agent.getPlugin('checkstyle');
      expect(checkstylePlugin).toBeDefined();
      expect(checkstylePlugin?.name).toBe('checkstyle');
    });

    it('should return undefined for unknown plugin', () => {
      const unknownPlugin = agent.getPlugin('unknown' as any);
      expect(unknownPlugin).toBeUndefined();
    });
  });

  describe('Tool Availability', () => {
    it('should check availability of all tools', async () => {
      const availability = await agent.checkAllToolsAvailability();

      expect(availability.has('spotbugs')).toBe(true);
      expect(availability.has('checkstyle')).toBe(true);

      // Each availability result should have the expected structure
      const spotbugsAvail = availability.get('spotbugs');
      expect(spotbugsAvail).toHaveProperty('installed');
    });

    it('should check availability of single tool', async () => {
      const availability = await agent.checkToolAvailability('spotbugs');

      expect(availability).toHaveProperty('installed');
      expect(typeof availability.installed).toBe('boolean');
    });

    it('should return error for unknown tool', async () => {
      const availability = await agent.checkToolAvailability('unknown' as any);

      expect(availability.installed).toBe(false);
      expect(availability.error).toContain('Unknown tool');
    });
  });

  describe('Analysis Execution', () => {
    it('should return error result for unknown tool', async () => {
      const result = await agent.runTool('unknown' as any);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown tool');
      expect(result.findings).toHaveLength(0);
    });

    it('should return error when tool cannot analyze project', async () => {
      // For a non-existent project, canAnalyze should return false
      const result = await agent.runTool('spotbugs');

      expect(result.success).toBe(false);
      expect(result.tool).toBe('spotbugs');
    });
  });

  describe('Result Formatting', () => {
    it('should format empty result report', () => {
      const result = {
        tool: 'spotbugs' as const,
        success: true,
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
          durationMs: 100,
        },
        timestamp: new Date(),
      };

      const report = agent.formatReport(result);

      expect(report).toContain('STATIC ANALYSIS REPORT');
      expect(report).toContain('Total Findings: 0');
      expect(report).toContain('No findings detected');
    });

    it('should format result with findings', () => {
      const result = {
        tool: 'spotbugs' as const,
        success: true,
        findings: [
          {
            ruleId: 'NP_NULL_ON_SOME_PATH',
            ruleName: 'Null Pointer',
            filePath: 'src/main/java/Example.java',
            line: 42,
            severity: 'high' as const,
            category: 'bug' as const,
            message: 'Possible null pointer dereference',
            tool: 'spotbugs' as const,
          },
        ],
        summary: {
          totalFindings: 1,
          bySeverity: { critical: 0, high: 1, medium: 0, low: 0, info: 0 },
          byCategory: {
            bug: 1,
            vulnerability: 0,
            'code-smell': 0,
            style: 0,
            performance: 0,
            'best-practice': 0,
            documentation: 0,
            duplication: 0,
          },
          filesAnalyzed: 1,
          filesWithFindings: 1,
          durationMs: 500,
        },
        timestamp: new Date(),
      };

      const report = agent.formatReport(result);

      expect(report).toContain('Total Findings: 1');
      expect(report).toContain('high: 1');
      expect(report).toContain('bug: 1');
      expect(report).toContain('Example.java');
      expect(report).toContain('Line 42');
      expect(report).toContain('NP_NULL_ON_SOME_PATH');
    });
  });

  describe('Finding Filtering', () => {
    const mockResult = {
      allFindings: [
        {
          ruleId: 'NP_NULL',
          ruleName: 'Null Pointer',
          filePath: 'src/Example.java',
          line: 10,
          severity: 'high' as const,
          category: 'bug' as const,
          message: 'Null pointer',
          tool: 'spotbugs' as const,
        },
        {
          ruleId: 'STYLE_CHECK',
          ruleName: 'Style Check',
          filePath: 'src/Other.java',
          line: 20,
          severity: 'low' as const,
          category: 'style' as const,
          message: 'Style violation',
          tool: 'checkstyle' as const,
        },
      ],
      results: [],
      summary: {
        totalFindings: 2,
        bySeverity: { critical: 0, high: 1, medium: 0, low: 1, info: 0 },
        byCategory: {
          bug: 1,
          vulnerability: 0,
          'code-smell': 0,
          style: 1,
          performance: 0,
          'best-practice': 0,
          documentation: 0,
          duplication: 0,
        },
        filesAnalyzed: 2,
        filesWithFindings: 2,
        durationMs: 1000,
      },
      success: true,
      toolsRun: ['spotbugs' as const, 'checkstyle' as const],
      toolsFailed: [],
    };

    it('should filter findings by file', () => {
      const findings = agent.getFindingsForFile(mockResult, 'Example.java');
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('NP_NULL');
    });

    it('should filter findings by severity', () => {
      const findings = agent.getFindingsBySeverity(mockResult, 'high');
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('high');
    });

    it('should filter findings by category', () => {
      const findings = agent.getFindingsByCategory(mockResult, 'style');
      expect(findings).toHaveLength(1);
      expect(findings[0].category).toBe('style');
    });
  });
});

describe('SpotBugsPlugin', () => {
  let plugin: SpotBugsPlugin;

  beforeEach(() => {
    plugin = new SpotBugsPlugin();
  });

  it('should have correct properties', () => {
    expect(plugin.name).toBe('spotbugs');
    expect(plugin.tool).toBe('spotbugs');
    expect(plugin.displayName).toBe('SpotBugs');
    expect(plugin.supportedLanguages).toContain('java');
  });

  it('should check availability', async () => {
    const availability = await plugin.checkAvailability();

    expect(availability).toHaveProperty('installed');
    expect(typeof availability.installed).toBe('boolean');

    if (!availability.installed) {
      expect(availability.installInstructions).toBeDefined();
    }
  });

  it('should return false for canAnalyze on non-Java project', async () => {
    const canAnalyze = await plugin.canAnalyze('/tmp/non-existent-project');
    expect(canAnalyze).toBe(false);
  });

  it('should provide rule documentation URL', () => {
    const url = plugin.getRuleDocumentation('NP_NULL_ON_SOME_PATH');
    expect(url).toContain('spotbugs.readthedocs.io');
    expect(url).toContain('np_null_on_some_path');
  });

  it('should provide default config', () => {
    const config = plugin.getDefaultConfig();
    expect(config).toContain('FindBugsFilter');
    expect(config).toContain('xml');
  });
});

describe('CheckstylePlugin', () => {
  let plugin: CheckstylePlugin;

  beforeEach(() => {
    plugin = new CheckstylePlugin();
  });

  it('should have correct properties', () => {
    expect(plugin.name).toBe('checkstyle');
    expect(plugin.tool).toBe('checkstyle');
    expect(plugin.displayName).toBe('Checkstyle');
    expect(plugin.supportedLanguages).toContain('java');
  });

  it('should check availability', async () => {
    const availability = await plugin.checkAvailability();

    expect(availability).toHaveProperty('installed');
    expect(typeof availability.installed).toBe('boolean');

    if (!availability.installed) {
      expect(availability.installInstructions).toBeDefined();
    }
  });

  it('should return false for canAnalyze on non-Java project', async () => {
    const canAnalyze = await plugin.canAnalyze('/tmp/non-existent-project');
    expect(canAnalyze).toBe(false);
  });

  it('should provide rule documentation URL', () => {
    const url = plugin.getRuleDocumentation('MethodName');
    expect(url).toContain('checkstyle.sourceforge.io');
    expect(url).toContain('method-name');
  });

  it('should provide default config', () => {
    const config = plugin.getDefaultConfig();
    expect(config).toContain('Checker');
    expect(config).toContain('TreeWalker');
    expect(config).toContain('MethodName');
  });
});
