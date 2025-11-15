import fs from 'fs';
import path from 'path';
import type { ProgressEntry, PhaseName, Status } from '../types/progress.js';

export class ProgressWriter {
  private stream: fs.WriteStream;
  private progressFile = '.codeweaver/progress.jsonl';

  constructor() {
    const dir = path.dirname(this.progressFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.stream = fs.createWriteStream(this.progressFile, { flags: 'a' });
  }

  log(entry: Omit<ProgressEntry, 'timestamp'>): void {
    const fullEntry: ProgressEntry = {
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.stream.write(JSON.stringify(fullEntry) + '\n');
    this.logToConsole(fullEntry);
  }

  milestone(phase: PhaseName, status: Status, message: string): void {
    this.log({ level: 'milestone', phase, status, agent: 'orchestrator', message });
  }

  taskStarted(phase: PhaseName, task: string, agent: string): void {
    this.log({ level: 'task', phase, task, status: 'started', agent, message: `Starting ${task}` });
  }

  taskCompleted(phase: PhaseName, task: string, agent: string, duration: number): void {
    this.log({ level: 'task', phase, task, status: 'completed', agent, duration, message: `Completed ${task}` });
  }

  testPassed(phase: PhaseName, task: string, test: string, agent: string): void {
    this.log({ level: 'test', phase, task, test, status: 'passed', agent, message: `Test passed: ${test}` });
  }

  testFailed(phase: PhaseName, task: string, test: string, agent: string, error: string): void {
    this.log({ level: 'test', phase, task, test, status: 'failed', agent, message: `Test failed: ${test}`, metadata: { error } });
  }

  checkpoint(phase: PhaseName, completed: number, total: number): void {
    this.log({
      level: 'checkpoint',
      phase,
      status: 'in_progress',
      agent: 'orchestrator',
      message: `Checkpoint: ${completed}/${total} tasks completed`,
      metadata: { tasks_completed: completed, tasks_total: total, progress: completed / total }
    });
  }

  error(phase: PhaseName, task: string, agent: string, error: Error): void {
    this.log({
      level: 'error',
      phase,
      task,
      status: 'failed',
      agent,
      message: error.message,
      metadata: { stack: error.stack }
    });
  }

  close(): void {
    this.stream.end();
  }

  private logToConsole(entry: ProgressEntry): void {
    const colors = {
      milestone: '\x1b[35m',
      task: '\x1b[36m',
      test: '\x1b[32m',
      checkpoint: '\x1b[33m',
      error: '\x1b[31m'
    };
    const reset = '\x1b[0m';

    const color = colors[entry.level];
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    console.log(`${color}[${entry.level.toUpperCase()}]${reset} ${timestamp} - ${entry.message}`);
  }
}
