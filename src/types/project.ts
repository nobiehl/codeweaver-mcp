export interface ProjectMetadata {
  root: string;
  name: string;
  version?: string;
  buildSystem: 'gradle' | 'maven';
  gradleVersion: string;
  gradleWrapperPresent: boolean;
  javaVersion: string;
  javaToolchain?: string;
  modules: ModuleInfo[];
  moduleCount: number;
  dependencies: DependencyInfo[];
  availableTasks: string[];
  discoveredAt: Date;
  lastModified: Date;
}

export interface ModuleInfo {
  name: string;
  path: string;
  type: 'root' | 'subproject';
  sourceSets: {
    main: SourceSetInfo;
    test: SourceSetInfo;
    custom?: Record<string, SourceSetInfo>;
  };
  dependencies: DependencyInfo[];
  plugins: string[];
  tasks: string[];
  javaFileCount: number;
  testFileCount: number;
  totalLinesOfCode?: number;
}

export interface SourceSetInfo {
  name: string;
  srcDirs: string[];
  resourceDirs: string[];
  outputDir: string;
  compileClasspath?: string[];
}

export interface DependencyInfo {
  group: string;
  artifact: string;
  version: string;
  configuration: string;
  scope?: 'compile' | 'runtime' | 'test';
}
