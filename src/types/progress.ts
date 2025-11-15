export type ProgressLevel = 'milestone' | 'task' | 'test' | 'checkpoint' | 'error';

export type Status = 'started' | 'in_progress' | 'completed' | 'failed' | 'skipped' | 'passed';

export type PhaseName = 'foundation' | 'indexing' | 'analysis' | 'orchestration' | 'optimization';

export interface ProgressEntry {
  timestamp: string;
  level: ProgressLevel;
  phase: PhaseName;
  task?: string;
  test?: string;
  status: Status;
  agent: string;
  duration?: number;
  message: string;
  metadata?: Record<string, any>;
}
