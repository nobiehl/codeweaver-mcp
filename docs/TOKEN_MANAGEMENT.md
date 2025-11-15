# Token-Budget-Management

**Implementierungs-Guide für tokenarme MCP-Responses**

---

## Ziel

Der Java Analysis MCP Server überträgt **niemals komplette Dateien**. Stattdessen nutzen wir:
- **Indizes** (Metadaten, Symbole, Referenzen)
- **Gezielte Ausschnitte** (≤80 Zeilen)
- **Strukturierte Reports** (Findings, keine Rohdaten)
- **Unified Diffs** (nur relevante Hunks)

**Ziel**: Jedes MCP-Tool-Response <10.000 Tokens (~40KB)

---

## Token-Estimation

### Heuristik

```typescript
/**
 * Einfache Token-Schätzung: ~4 Zeichen pro Token
 * (Für genauere Schätzung: tiktoken oder gpt-tokenizer verwenden)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Beispiele:
 * - 1 Zeile Code (~60 Zeichen): ~15 Tokens
 * - 80 Zeilen Snippet (~4800 Zeichen): ~1200 Tokens
 * - 1KB JSON: ~256 Tokens
 */
```

### Genauere Schätzung (Optional)

Für Production: Nutze `tiktoken` (OpenAI) oder `gpt-tokenizer`:

```typescript
import { encode } from 'gpt-tokenizer';

export function estimateTokensAccurate(text: string): number {
  return encode(text).length;
}
```

---

## Token-Policies

### 1. Snippet-Limits

#### Regel
- **Max. 80 Zeilen** pro Ausschnitt
- **Präferiert: ≤40 Zeilen**
- **Max. 3 Snippets** pro Request

#### Implementierung

```typescript
// src/agents/snippets.ts

export class SnippetsAgent {
  private readonly MAX_LINES = 80;
  private readonly PREFERRED_LINES = 40;
  private readonly MAX_TOKENS = 1200;

  async readRange(request: RangeRequest): Promise<CodeSnippet> {
    const { path, startLine, endLine } = request;
    const lineCount = endLine - startLine + 1;

    // Check line limit
    if (lineCount > this.MAX_LINES) {
      throw new Error(
        `Snippet too large: ${lineCount} lines requested, max ${this.MAX_LINES}. ` +
        `Please reduce range to ${this.PREFERRED_LINES} lines or less.`
      );
    }

    // Read file
    const lines = await this.readFileLines(path, startLine, endLine);
    const text = lines.join('\n');

    // Check token limit
    const tokens = estimateTokens(text);
    if (tokens > this.MAX_TOKENS) {
      // Truncate
      const truncatedLines = this.truncateToTokenLimit(lines, this.MAX_TOKENS);
      return {
        path,
        startLine,
        endLine: startLine + truncatedLines.length - 1,
        lines: truncatedLines,
        language: 'java',
        truncated: true
      };
    }

    return {
      path,
      startLine,
      endLine,
      lines,
      language: 'java',
      truncated: false
    };
  }

  private truncateToTokenLimit(lines: string[], maxTokens: number): string[] {
    let tokens = 0;
    const result: string[] = [];

    for (const line of lines) {
      const lineTokens = estimateTokens(line);
      if (tokens + lineTokens > maxTokens) break;
      tokens += lineTokens;
      result.push(line);
    }

    return result;
  }
}
```

---

### 2. Search-Result-Limits

#### Regel
- **Max. 100 Treffer** mit Kontext
- **Kontext: Max. 6 Zeilen** vor/nach
- **Bei >100 Treffern**: Pagination oder "Too many results"-Hinweis

#### Implementierung

```typescript
// src/agents/search.ts

export class SearchAgent {
  private readonly MAX_RESULTS = 100;
  private readonly MAX_CONTEXT_LINES = 6;

  async find(query: SearchQuery): Promise<SearchResult[]> {
    const {
      pattern,
      mode = 'text',
      maxResults = this.MAX_RESULTS,
      contextLines = 3
    } = query;

    // Enforce limits
    const effectiveMaxResults = Math.min(maxResults, this.MAX_RESULTS);
    const effectiveContextLines = Math.min(contextLines, this.MAX_CONTEXT_LINES);

    // Search in fulltext index
    const rawResults = await this.fulltextIndex.search({
      pattern,
      mode,
      limit: effectiveMaxResults + 10 // Slight overfetch for filtering
    });

    // Extract context
    const results: SearchResult[] = [];
    for (const rawResult of rawResults.slice(0, effectiveMaxResults)) {
      const context = await this.extractContext(
        rawResult.path,
        rawResult.line,
        effectiveContextLines
      );
      results.push({
        ...rawResult,
        linesBefore: context.before,
        linesAfter: context.after
      });
    }

    return results;
  }

  private async extractContext(
    path: string,
    line: number,
    contextLines: number
  ): Promise<{ before: string[]; after: string[] }> {
    const startLine = Math.max(1, line - contextLines);
    const endLine = line + contextLines;

    const allLines = await this.readFileLines(path, startLine, endLine);
    const targetIndex = line - startLine;

    return {
      before: allLines.slice(0, targetIndex),
      after: allLines.slice(targetIndex + 1)
    };
  }
}
```

---

### 3. Analysis-Report-Limits

#### Regel
- **Nur strukturierte Findings**, keine Rohdaten (Logs, Outputs)
- **Max. 200 Findings** pro Report
- **Short Context**: Max. 3 Zeilen Code um Finding

#### Implementierung

```typescript
// src/agents/analysis.ts

export class AnalysisAgent {
  private readonly MAX_FINDINGS = 200;
  private readonly SHORT_CONTEXT_LINES = 1; // 1 vor, 1 nach = 3 Zeilen total

  async runAnalysis(types: AnalysisSource[]): Promise<AnalysisReport[]> {
    const reports: AnalysisReport[] = [];

    for (const type of types) {
      const report = await this.runSingleAnalysis(type);
      reports.push(this.limitReportSize(report));
    }

    return reports;
  }

  private limitReportSize(report: AnalysisReport): AnalysisReport {
    // Limit findings count
    if (report.findings.length > this.MAX_FINDINGS) {
      report.findings = report.findings.slice(0, this.MAX_FINDINGS);
      report.summary.totalFindings = this.MAX_FINDINGS;
    }

    // Ensure short context
    for (const finding of report.findings) {
      if (finding.shortContext) {
        const lines = finding.shortContext.split('\n');
        if (lines.length > 3) {
          finding.shortContext = lines.slice(0, 3).join('\n') + '...';
        }
      }
    }

    // Remove raw outputs
    if ('stdout' in report) delete (report as any).stdout;
    if ('stderr' in report) delete (report as any).stderr;

    return report;
  }
}
```

---

### 4. VCS-Diff-Limits

#### Regel
- **Nur relevante Hunks** (keine Whitespace-only)
- **Max. 20 Hunks** pro Diff
- **Bei großen Diffs**: Zusammenfassung statt kompletten Diff

#### Implementierung

```typescript
// src/agents/vcs.ts

export class VCSAgent {
  private readonly MAX_HUNKS = 20;

  async getDiff(scope: DiffScope): Promise<string> {
    const rawDiff = await this.git.diff(this.getDiffOptions(scope));

    // Parse diff & filter hunks
    const hunks = this.parseDiff(rawDiff);
    const relevantHunks = hunks.filter(h => this.isRelevantHunk(h));

    // Limit hunks
    if (relevantHunks.length > this.MAX_HUNKS) {
      return this.createDiffSummary(relevantHunks);
    }

    return this.reconstructDiff(relevantHunks);
  }

  private isRelevantHunk(hunk: DiffHunk): boolean {
    // Filter out whitespace-only changes
    const changes = hunk.lines.filter(l => l.startsWith('+') || l.startsWith('-'));
    const nonWhitespaceChanges = changes.filter(l => l.trim().length > 1);
    return nonWhitespaceChanges.length > 0;
  }

  private createDiffSummary(hunks: DiffHunk[]): string {
    const fileChanges = new Map<string, number>();
    for (const hunk of hunks) {
      fileChanges.set(hunk.file, (fileChanges.get(hunk.file) || 0) + 1);
    }

    let summary = `Too many changes (${hunks.length} hunks). Summary:\n\n`;
    for (const [file, count] of fileChanges) {
      summary += `- ${file}: ${count} hunk(s)\n`;
    }

    summary += `\n(Showing first ${this.MAX_HUNKS} hunks)\n\n`;
    return summary + this.reconstructDiff(hunks.slice(0, this.MAX_HUNKS));
  }
}
```

---

## Response-Größen-Enforcement

### Globaler Response-Wrapper

```typescript
// src/mcp/tools.ts

export class MCPTools {
  private readonly MAX_RESPONSE_TOKENS = 10000; // ~40KB

  async callTool(toolName: string, args: any): Promise<any> {
    const result = await this.routeTool(toolName, args);

    // Serialize & check size
    const serialized = JSON.stringify(result);
    const tokens = estimateTokens(serialized);

    if (tokens > this.MAX_RESPONSE_TOKENS) {
      throw new Error(
        `Response too large: ${tokens} tokens (max ${this.MAX_RESPONSE_TOKENS}). ` +
        `Please refine your query (reduce maxResults, limit contextLines, etc.)`
      );
    }

    return result;
  }
}
```

---

## Token-Budget pro Tool

| Tool | Typische Response-Größe | Max. Tokens | Bemerkung |
|------|------------------------|-------------|-----------|
| `project.meta` | 2-5KB | ~1000 | Projekt-Metadaten, kompakt |
| `search.find` (100 Treffer) | 10-15KB | ~3000 | Mit Kontext |
| `symbols.lookup` (Definition) | 500B | ~100 | Einzelnes Symbol |
| `symbols.lookup` (References, 100x) | 5-10KB | ~2000 | Locations mit Kontext |
| `analysis.getReports` (50 Findings) | 8-12KB | ~2500 | Strukturierte Findings |
| `file.readRange` (80 Zeilen) | 4-5KB | ~1200 | Code-Snippet |
| `vcs.diff` (20 Hunks) | 3-8KB | ~2000 | Unified Diff |
| `index.refresh` | 200B | ~50 | Nur Stats |

**Batch-Request** (mehrere Tools): Max. 25.000 Tokens total

---

## Best Practices

### 1. Lazy Loading

Niemals proaktiv alle Daten senden. Nur auf explizite Anfrage:

```typescript
// ❌ BAD: Sendet alle Referenzen automatisch
interface SymbolDefinition {
  id: string;
  references: Reference[]; // Kann 1000+ sein!
}

// ✅ GOOD: Referenzen on-demand via separatem Tool-Call
interface SymbolDefinition {
  id: string;
  referenceCount: number; // Nur Anzahl
}
// LLM ruft bei Bedarf: symbols.lookup({ operation: 'references' })
```

### 2. Pagination

Bei großen Resultsets: Pagination statt kompletter Daten

```typescript
interface SearchQuery {
  pattern: string;
  offset?: number;    // Default: 0
  limit?: number;     // Default: 100, max: 100
}

// LLM kann mehrmals callen:
// 1) search.find({ pattern: "foo", offset: 0, limit: 100 })
// 2) search.find({ pattern: "foo", offset: 100, limit: 100 })
```

### 3. Summary-First

Bei vielen Findings: Erst Zusammenfassung, dann Details on-demand

```typescript
interface ReportSummary {
  totalFindings: number;
  bySeverity: { error: number; warning: number; info: number };
  topCategories: Array<{ category: string; count: number }>;
}

// LLM kann dann gezielt nach Kategorie filtern:
// analysis.getReports({ types: ['spotbugs'], category: 'CORRECTNESS' })
```

---

## Testing

### Token-Budget-Tests

```typescript
// tests/unit/utils/token-estimator.test.ts

describe('Token Estimator', () => {
  it('should estimate tokens for code snippet', () => {
    const snippet = 'public class Foo {\n  void bar() {}\n}';
    const tokens = estimateTokens(snippet);
    expect(tokens).toBeGreaterThan(5);
    expect(tokens).toBeLessThan(20);
  });

  it('should truncate snippet to token limit', () => {
    const lines = Array(100).fill('x'.repeat(60)); // 100 Zeilen à 60 Zeichen
    const truncated = truncateToTokenLimit(lines, 500); // Max 500 Tokens
    expect(truncated.length).toBeLessThan(100);
    expect(estimateTokens(truncated.join('\n'))).toBeLessThanOrEqual(500);
  });
});
```

### Integration-Tests mit Response-Größen

```typescript
// tests/integration/mcp-tools.test.ts

describe('MCP Tools Response Sizes', () => {
  it('search.find should respect token limit', async () => {
    const result = await mcpServer.call('search.find', {
      pattern: 'class',
      maxResults: 1000 // Versucht >100
    });

    const tokens = estimateTokens(JSON.stringify(result));
    expect(tokens).toBeLessThan(10000); // Globales Limit
    expect(result.length).toBeLessThanOrEqual(100); // Max Results
  });

  it('file.readRange should reject oversized snippet', async () => {
    await expect(
      mcpServer.call('file.readRange', {
        path: 'LargeFile.java',
        startLine: 1,
        endLine: 200 // >80 Zeilen
      })
    ).rejects.toThrow(/Snippet too large/);
  });
});
```

---

## Monitoring & Debugging

### Logging

Logge Token-Counts für alle Responses:

```typescript
// src/mcp/server.ts

async handleToolCall(toolName: string, args: any): Promise<any> {
  const result = await this.tools.call(toolName, args);
  const tokens = estimateTokens(JSON.stringify(result));

  this.logger.info('Tool call completed', {
    tool: toolName,
    tokens,
    sizeKB: Math.round(JSON.stringify(result).length / 1024)
  });

  return result;
}
```

### Metrics

Sammle Metriken für Optimierung:

```typescript
interface TokenMetrics {
  toolName: string;
  avgTokens: number;
  maxTokens: number;
  p95Tokens: number;
  callCount: number;
}
```

---

## Zusammenfassung

### Token-Budget-Regeln

1. **Snippet**: ≤80 Zeilen, ≤1200 Tokens
2. **Search**: ≤100 Treffer, ≤6 Zeilen Kontext
3. **Reports**: ≤200 Findings, 3 Zeilen Short-Context
4. **Diffs**: ≤20 Hunks, nur relevante Änderungen
5. **Response**: ≤10.000 Tokens total

### Implementierungs-Checklist

- [x] Token-Estimator (`src/utils/token-estimator.ts`)
- [ ] Snippet-Limits in SnippetsAgent
- [ ] Search-Limits in SearchAgent
- [ ] Report-Limits in AnalysisAgent
- [ ] Diff-Limits in VCSAgent
- [ ] Globaler Response-Wrapper in MCPTools
- [ ] Tests für alle Limits
- [ ] Logging & Metrics

**Ziel erreicht**: Niemals komplette Dateien, immer <10.000 Tokens pro Response! ✅
