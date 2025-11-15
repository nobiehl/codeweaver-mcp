import fs from 'fs/promises';
import path from 'path';
import { parse } from 'java-parser';
import type { FileAnalysis, MethodAnalysis, CodeMetrics, ProjectAnalysis } from '../../types/analysis.js';

/**
 * AnalysisAgent - Code Quality and Complexity Analysis
 *
 * Features:
 * - Cyclomatic Complexity calculation
 * - Lines of Code metrics (LOC, SLOC, comments)
 * - Import analysis
 * - Method call detection
 * - Project-wide statistics
 */
export class AnalysisAgent {
  private projectRoot: string;

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
  }

  /**
   * Analyze a single Java file
   */
  async analyzeFile(filePath: string): Promise<FileAnalysis> {
    const fullPath = path.join(this.projectRoot, filePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      return this.analyzeSource(content, filePath);
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return {
          filePath,
          imports: [],
          methods: [],
          classComplexity: 0,
          metrics: {
            totalLines: 0,
            codeLines: 0,
            commentLines: 0,
            blankLines: 0
          }
        };
      }
      throw error;
    }
  }

  /**
   * Analyze Java source code
   */
  private analyzeSource(source: string, filePath: string): FileAnalysis {
    const metrics = this.calculateMetrics(source);
    const imports = this.extractImports(source);

    let className: string | undefined;
    let packageName: string | undefined;
    let methods: MethodAnalysis[] = [];
    let classComplexity = 0;

    try {
      const ast = parse(source);

      // Extract package
      packageName = this.extractPackageName(ast);

      // Extract class name and methods
      const compilationUnit = (ast as any).children?.ordinaryCompilationUnit?.[0];
      if (compilationUnit) {
        const typeDeclarations = compilationUnit.children?.typeDeclaration;
        if (typeDeclarations && Array.isArray(typeDeclarations)) {
          for (const typeDecl of typeDeclarations) {
            const classDecl = typeDecl.children?.classDeclaration?.[0];
            if (classDecl) {
              className = this.extractClassName(classDecl);
              methods = this.extractMethods(classDecl, source);
              classComplexity = methods.reduce((sum, m) => sum + m.complexity, 0);
            }
          }
        }
      }
    } catch (error) {
      // Parser error - return metrics without AST analysis
      console.error(`Failed to parse ${filePath}:`, error);
    }

    return {
      filePath,
      className,
      packageName,
      imports,
      methods,
      classComplexity,
      metrics
    };
  }

  /**
   * Calculate code metrics (LOC, SLOC, comments)
   */
  private calculateMetrics(source: string): CodeMetrics {
    const lines = source.split('\n');
    let codeLines = 0;
    let commentLines = 0;
    let blankLines = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        blankLines++;
      } else if (trimmed.startsWith('/*')) {
        inBlockComment = true;
        commentLines++;
      } else if (trimmed.endsWith('*/')) {
        inBlockComment = false;
        commentLines++;
      } else if (inBlockComment) {
        commentLines++;
      } else if (trimmed.startsWith('//')) {
        commentLines++;
      } else {
        codeLines++;
      }
    }

    return {
      totalLines: lines.length,
      codeLines,
      commentLines,
      blankLines
    };
  }

  /**
   * Extract import statements
   */
  private extractImports(source: string): string[] {
    const imports: string[] = [];
    const importRegex = /import\s+(?:static\s+)?([a-zA-Z0-9_.]+(?:\.\*)?)\s*;/g;

    let match;
    while ((match = importRegex.exec(source)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  /**
   * Extract package name from AST
   */
  private extractPackageName(ast: any): string | undefined {
    try {
      const packageDecl = ast.children?.ordinaryCompilationUnit?.[0]?.children?.packageDeclaration?.[0];
      if (packageDecl?.children?.Identifier) {
        return packageDecl.children.Identifier.map((id: any) => id.image).join('.');
      }
    } catch {}
    return undefined;
  }

  /**
   * Extract class name from class declaration
   */
  private extractClassName(classDecl: any): string | undefined {
    try {
      return classDecl.children?.normalClassDeclaration?.[0]?.children?.typeIdentifier?.[0]?.children?.Identifier?.[0]?.image;
    } catch {}
    return undefined;
  }

  /**
   * Extract methods from class declaration
   */
  private extractMethods(classDecl: any, source: string): MethodAnalysis[] {
    const methods: MethodAnalysis[] = [];

    try {
      const classBody = classDecl.children?.normalClassDeclaration?.[0]?.children?.classBody?.[0];
      if (!classBody) return methods;

      const declarations = classBody.children?.classBodyDeclaration || [];

      for (const decl of declarations) {
        // Method declaration
        const methodDecl = decl.children?.classMemberDeclaration?.[0]?.children?.methodDeclaration?.[0];
        if (methodDecl) {
          const methodAnalysis = this.analyzeMethod(methodDecl, source);
          if (methodAnalysis) {
            methods.push(methodAnalysis);
          }
        }

        // Constructor declaration
        const constructorDecl = decl.children?.constructorDeclaration?.[0];
        if (constructorDecl) {
          const constructorAnalysis = this.analyzeConstructor(constructorDecl, source);
          if (constructorAnalysis) {
            methods.push(constructorAnalysis);
          }
        }
      }
    } catch (error) {
      console.error('Error extracting methods:', error);
    }

    return methods;
  }

  /**
   * Analyze a method and calculate complexity
   */
  private analyzeMethod(methodDecl: any, _source: string): MethodAnalysis | null {
    try {
      const methodName = methodDecl.children?.methodHeader?.[0]?.children?.methodDeclarator?.[0]?.children?.Identifier?.[0]?.image;
      if (!methodName) return null;

      // Calculate cyclomatic complexity
      const complexity = this.calculateComplexity(methodDecl);

      // Count parameters
      const params = methodDecl.children?.methodHeader?.[0]?.children?.methodDeclarator?.[0]?.children?.formalParameterList?.[0]?.children?.formalParameter || [];
      const parameters = params.length;

      // Extract method calls (simplified - looks for method invocation patterns)
      const calls = this.extractMethodCalls(methodDecl);

      // Estimate lines (simplified - count statement-like tokens)
      const lines = this.estimateMethodLines(methodDecl);

      return {
        name: methodName,
        complexity,
        lines,
        parameters,
        calls
      };
    } catch (error) {
      console.error('Error analyzing method:', error);
      return null;
    }
  }

  /**
   * Analyze a constructor
   */
  private analyzeConstructor(constructorDecl: any, _source: string): MethodAnalysis | null {
    try {
      const constructorName = constructorDecl.children?.simpleTypeName?.[0]?.children?.Identifier?.[0]?.image;
      if (!constructorName) return null;

      const complexity = this.calculateComplexity(constructorDecl);
      const params = constructorDecl.children?.formalParameterList?.[0]?.children?.formalParameter || [];
      const parameters = params.length;
      const calls = this.extractMethodCalls(constructorDecl);
      const lines = this.estimateMethodLines(constructorDecl);

      return {
        name: `<init>${constructorName}`,
        complexity,
        lines,
        parameters,
        calls
      };
    } catch (error) {
      console.error('Error analyzing constructor:', error);
      return null;
    }
  }

  /**
   * Calculate cyclomatic complexity from AST
   * Complexity = 1 + (number of decision points)
   * Decision points: if, while, for, case, catch, &&, ||, ?:
   */
  private calculateComplexity(node: any): number {
    let complexity = 1; // Base complexity

    const countKeywords = (obj: any): number => {
      if (!obj || typeof obj !== 'object') return 0;

      let count = 0;

      // Decision points that add complexity
      if (obj.If) count += Array.isArray(obj.If) ? obj.If.length : 1;
      if (obj.While) count += Array.isArray(obj.While) ? obj.While.length : 1;
      if (obj.For) count += Array.isArray(obj.For) ? obj.For.length : 1;
      if (obj.Case) count += Array.isArray(obj.Case) ? obj.Case.length : 1;
      if (obj.Catch) count += Array.isArray(obj.Catch) ? obj.Catch.length : 1;
      if (obj.And) count += Array.isArray(obj.And) ? obj.And.length : 1; // &&
      if (obj.Or) count += Array.isArray(obj.Or) ? obj.Or.length : 1; // ||
      if (obj.Question) count += Array.isArray(obj.Question) ? obj.Question.length : 1; // ?: ternary

      // Recursively search children
      for (const key in obj) {
        if (key === 'children' || typeof obj[key] === 'object') {
          count += countKeywords(obj[key]);
        }
      }

      return count;
    };

    complexity += countKeywords(node);

    return complexity;
  }

  /**
   * Extract method calls from method body
   */
  private extractMethodCalls(node: any): string[] {
    const calls: string[] = [];

    const findCalls = (obj: any): void => {
      if (!obj || typeof obj !== 'object') return;

      // Look for method invocations
      if (obj.methodInvocation) {
        const invocations = Array.isArray(obj.methodInvocation) ? obj.methodInvocation : [obj.methodInvocation];
        for (const inv of invocations) {
          const methodName = inv.children?.Identifier?.[0]?.image;
          if (methodName && !calls.includes(methodName)) {
            calls.push(methodName);
          }
        }
      }

      // Recursively search
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          findCalls(obj[key]);
        }
      }
    };

    findCalls(node);
    return calls;
  }

  /**
   * Estimate method lines (simplified)
   */
  private estimateMethodLines(node: any): number {
    // Count statements as a proxy for lines
    let statementCount = 0;

    const countStatements = (obj: any): number => {
      if (!obj || typeof obj !== 'object') return 0;

      let count = 0;

      // Various statement types
      if (obj.statement) count += Array.isArray(obj.statement) ? obj.statement.length : 1;
      if (obj.returnStatement) count += 1;
      if (obj.expressionStatement) count += 1;

      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          count += countStatements(obj[key]);
        }
      }

      return count;
    };

    statementCount = countStatements(node);
    return Math.max(1, statementCount); // At least 1 line
  }

  /**
   * Analyze entire project
   */
  async analyzeProject(): Promise<ProjectAnalysis> {
    const javaFiles = await this.findJavaFiles();
    const files: FileAnalysis[] = [];
    let totalComplexity = 0;
    let totalMethods = 0;
    let totalLines = 0;

    for (const file of javaFiles) {
      const analysis = await this.analyzeFile(file);
      files.push(analysis);
      totalComplexity += analysis.classComplexity;
      totalMethods += analysis.methods.length;
      totalLines += analysis.metrics.totalLines;
    }

    const averageComplexity = totalMethods > 0 ? totalComplexity / totalMethods : 0;

    const mostComplexFiles = files
      .filter(f => f.classComplexity > 0)
      .sort((a, b) => b.classComplexity - a.classComplexity)
      .slice(0, 10)
      .map(f => ({ file: f.filePath, complexity: f.classComplexity }));

    return {
      files,
      totalFiles: files.length,
      totalComplexity,
      averageComplexity,
      totalMethods,
      totalLines,
      mostComplexFiles
    };
  }

  /**
   * Find all Java files in project
   */
  private async findJavaFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scan(dir: string, baseDir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', 'target'].includes(entry.name)) {
              await scan(fullPath, baseDir);
            }
          } else if (entry.isFile() && entry.name.endsWith('.java')) {
            const relativePath = path.relative(baseDir, fullPath);
            files.push(relativePath);
          }
        }
      } catch (error) {
        // Ignore read errors
      }
    }

    await scan(this.projectRoot, this.projectRoot);
    return files;
  }
}
