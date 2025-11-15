export interface MethodAnalysis {
  name: string;
  complexity: number;
  lines: number;
  parameters: number;
  calls?: string[];
}

export interface CodeMetrics {
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
}

export interface FileAnalysis {
  filePath: string;
  className?: string;
  packageName?: string;
  imports: string[];
  methods: MethodAnalysis[];
  classComplexity: number;
  metrics: CodeMetrics;
}

export interface ProjectAnalysis {
  files: FileAnalysis[];
  totalFiles: number;
  totalComplexity: number;
  averageComplexity: number;
  totalMethods: number;
  totalLines: number;
  mostComplexFiles: Array<{ file: string; complexity: number }>;
}

export interface DependencyGraph {
  nodes: string[]; // File paths or package names
  edges: Array<{ from: string; to: string }>;
}

export interface CallGraph {
  nodes: string[]; // Method qualified names
  edges: Array<{ from: string; to: string }>;
}
