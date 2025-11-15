/**
 * Version Control System Types
 */

export interface DiffEntry {
  file: string;
  changeType: 'added' | 'modified' | 'deleted' | 'renamed';
  additions: number;
  deletions: number;
  patch?: string;
  oldPath?: string; // For renamed files
}

export interface BlameLine {
  line: number;
  content: string;
  commit: string;
  author: string;
  authorEmail: string;
  date: Date;
  summary: string;
}

export interface CommitInfo {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: Date;
  message: string;
  body?: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
}

export interface FileStatus {
  file: string;
  status: 'modified' | 'added' | 'deleted' | 'renamed' | 'untracked';
  staged: boolean;
}

export interface GitLog {
  commits: CommitInfo[];
  total: number;
}

export interface DiffSummary {
  files: DiffEntry[];
  totalAdditions: number;
  totalDeletions: number;
  filesChanged: number;
}
