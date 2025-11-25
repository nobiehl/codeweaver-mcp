/**
 * System dependency types
 */

export interface DependencyCheck {
  name: string;
  required: boolean;
  installed: boolean;
  version?: string;
  expectedVersion?: string;
  path?: string;
  error?: string;
}

export interface SystemCheckResult {
  allPassed: boolean;
  checks: DependencyCheck[];
  warnings: string[];
  errors: string[];
  timestamp: Date;
}

export type DependencyName = 'node' | 'git' | 'python' | 'gradle' | 'maven';

export interface SystemRequirements {
  node: {
    minVersion: string;
    required: true;
  };
  git: {
    minVersion?: string;
    required: boolean; // true if VCS features are needed
  };
  python: {
    minVersion?: string;
    required: boolean; // false (optional for future features)
  };
  gradle: {
    minVersion?: string;
    required: boolean; // false (only for Gradle projects)
  };
  maven: {
    minVersion?: string;
    required: boolean; // false (only for Maven projects)
  };
}
