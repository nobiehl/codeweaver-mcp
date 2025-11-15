import { execSync } from 'child_process';
import type {
  DiffEntry,
  BlameLine,
  CommitInfo,
  BranchInfo,
  FileStatus,
  GitLog,
  DiffSummary,
} from '../../types/vcs.js';

export interface LogOptions {
  limit?: number;
  since?: string;
  until?: string;
  author?: string;
  path?: string;
}

export class VCSAgent {
  constructor(private projectRoot: string) {}

  /**
   * Check if directory is a Git repository
   */
  async isGitRepository(): Promise<boolean> {
    try {
      this.exec('git rev-parse --is-inside-work-tree');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current branch name
   */
  async getCurrentBranch(): Promise<string> {
    const output = this.exec('git branch --show-current');
    return output.trim();
  }

  /**
   * Get repository status (modified, added, deleted, untracked files)
   */
  async getStatus(): Promise<FileStatus[]> {
    const output = this.exec('git status --porcelain');
    const lines = output.trim().split('\n').filter(line => line.length > 0);

    return lines.map(line => {
      const statusCode = line.substring(0, 2);
      const filePath = line.substring(3);

      let status: FileStatus['status'];
      let staged = false;

      // Parse status code (XY format: X = staged, Y = working tree)
      const stagedChar = statusCode[0];
      const workingChar = statusCode[1];

      if (stagedChar === 'A' || workingChar === 'A') {
        status = 'added';
        staged = stagedChar === 'A';
      } else if (stagedChar === 'D' || workingChar === 'D') {
        status = 'deleted';
        staged = stagedChar === 'D';
      } else if (stagedChar === 'R' || workingChar === 'R') {
        status = 'renamed';
        staged = stagedChar === 'R';
      } else if (stagedChar === 'M' || workingChar === 'M') {
        status = 'modified';
        staged = stagedChar === 'M';
      } else if (statusCode === '??') {
        status = 'untracked';
        staged = false;
      } else {
        status = 'modified';
        staged = stagedChar !== ' ';
      }

      return {
        file: filePath,
        status,
        staged,
      };
    });
  }

  /**
   * Get diff for file(s)
   * @param filePath - Optional file path, if omitted returns diff for all changes
   */
  async getDiff(filePath?: string): Promise<DiffSummary> {
    const files: DiffEntry[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    try {
      // Get diff with stats
      const statsCmd = filePath
        ? `git diff --numstat HEAD -- "${filePath}"`
        : 'git diff --numstat HEAD';

      const statsOutput = this.exec(statsCmd, { allowEmpty: true });

      if (statsOutput.trim()) {
        const lines = statsOutput.trim().split('\n');

        for (const line of lines) {
          const [additions, deletions, file] = line.split('\t');

          const addNum = parseInt(additions, 10) || 0;
          const delNum = parseInt(deletions, 10) || 0;

          totalAdditions += addNum;
          totalDeletions += delNum;

          // Get patch for this file
          const patchCmd = `git diff HEAD -- "${file}"`;
          const patch = this.exec(patchCmd, { allowEmpty: true });

          // Determine change type
          let changeType: DiffEntry['changeType'] = 'modified';
          if (patch.includes('new file mode')) {
            changeType = 'added';
          } else if (patch.includes('deleted file mode')) {
            changeType = 'deleted';
          } else if (patch.includes('rename from')) {
            changeType = 'renamed';
          }

          files.push({
            file,
            changeType,
            additions: addNum,
            deletions: delNum,
            patch: patch || undefined,
          });
        }
      }
    } catch (error) {
      // No changes or error
    }

    return {
      files,
      totalAdditions,
      totalDeletions,
      filesChanged: files.length,
    };
  }

  /**
   * Get git blame for file
   * @param filePath - File path relative to project root
   * @param startLine - Optional start line (1-indexed)
   * @param endLine - Optional end line (1-indexed)
   */
  async getBlame(filePath: string, startLine?: number, endLine?: number): Promise<BlameLine[]> {
    let cmd = `git blame --line-porcelain`;

    if (startLine && endLine) {
      cmd += ` -L ${startLine},${endLine}`;
    }

    cmd += ` -- "${filePath}"`;

    const output = this.exec(cmd);
    const lines = output.split('\n');

    const blameLines: BlameLine[] = [];
    let currentBlame: Partial<BlameLine> = {};
    let lineNumber = startLine || 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.match(/^[a-f0-9]{40}/)) {
        // New blame entry
        const hash = line.split(' ')[0];
        currentBlame = { commit: hash, line: lineNumber };
      } else if (line.startsWith('author ')) {
        currentBlame.author = line.substring(7);
      } else if (line.startsWith('author-mail ')) {
        currentBlame.authorEmail = line.substring(12).replace(/[<>]/g, '');
      } else if (line.startsWith('author-time ')) {
        const timestamp = parseInt(line.substring(12), 10);
        currentBlame.date = new Date(timestamp * 1000);
      } else if (line.startsWith('summary ')) {
        currentBlame.summary = line.substring(8);
      } else if (line.startsWith('\t')) {
        // Content line
        currentBlame.content = line.substring(1);

        if (
          currentBlame.commit &&
          currentBlame.author &&
          currentBlame.authorEmail &&
          currentBlame.date &&
          currentBlame.summary &&
          currentBlame.content !== undefined
        ) {
          blameLines.push(currentBlame as BlameLine);
          lineNumber++;
          currentBlame = {};
        }
      }
    }

    return blameLines;
  }

  /**
   * Get commit history
   */
  async getLog(options: LogOptions = {}): Promise<GitLog> {
    const { limit = 100, since, until, author, path: pathFilter } = options;

    let cmd = 'git log --numstat --format=format:"%H%n%h%n%an%n%ae%n%at%n%s%n%b%n---END---"';

    if (limit) cmd += ` -n ${limit}`;
    if (since) cmd += ` --since="${since}"`;
    if (until) cmd += ` --until="${until}"`;
    if (author) cmd += ` --author="${author}"`;
    if (pathFilter) cmd += ` -- "${pathFilter}"`;

    const output = this.exec(cmd, { allowEmpty: true });

    if (!output.trim()) {
      return { commits: [], total: 0 };
    }

    const commits: CommitInfo[] = [];
    const commitBlocks = output.split('---END---\n').filter(b => b.trim());

    for (const block of commitBlocks) {
      const lines = block.split('\n');

      if (lines.length < 7) continue;

      const hash = lines[0];
      const shortHash = lines[1];
      const author = lines[2];
      const authorEmail = lines[3];
      const timestamp = parseInt(lines[4], 10);
      const message = lines[5];

      // Find body and stats separator
      let bodyEndIndex = 6;
      for (let i = 6; i < lines.length; i++) {
        if (lines[i] === '' || lines[i].match(/^\d+\t\d+\t/)) {
          bodyEndIndex = i;
          break;
        }
      }

      const body = lines.slice(6, bodyEndIndex).join('\n').trim() || undefined;

      // Parse numstat
      let filesChanged = 0;
      let insertions = 0;
      let deletions = 0;

      for (let i = bodyEndIndex; i < lines.length; i++) {
        const statLine = lines[i];
        if (statLine.match(/^\d+\t\d+\t/)) {
          const [add, del] = statLine.split('\t');
          insertions += parseInt(add, 10) || 0;
          deletions += parseInt(del, 10) || 0;
          filesChanged++;
        }
      }

      commits.push({
        hash,
        shortHash,
        author,
        authorEmail,
        date: new Date(timestamp * 1000),
        message,
        body,
        filesChanged,
        insertions,
        deletions,
      });
    }

    return {
      commits,
      total: commits.length,
    };
  }

  /**
   * Get list of all branches
   */
  async getBranches(): Promise<BranchInfo[]> {
    const output = this.exec('git branch -vv');
    const lines = output.split('\n').filter(line => line.trim());

    return lines.map(line => {
      const current = line.startsWith('*');
      const trimmed = line.substring(2);
      const parts = trimmed.split(/\s+/);

      const name = parts[0];
      const commit = parts[1];

      // Parse upstream info [origin/master: ahead 2, behind 3]
      let upstream: string | undefined;
      let ahead: number | undefined;
      let behind: number | undefined;

      const upstreamMatch = line.match(/\[([^\]]+)\]/);
      if (upstreamMatch) {
        const upstreamInfo = upstreamMatch[1];
        upstream = upstreamInfo.split(':')[0];

        const aheadMatch = upstreamInfo.match(/ahead (\d+)/);
        if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);

        const behindMatch = upstreamInfo.match(/behind (\d+)/);
        if (behindMatch) behind = parseInt(behindMatch[1], 10);
      }

      return {
        name,
        current,
        commit,
        upstream,
        ahead,
        behind,
      };
    });
  }

  /**
   * Compare two branches
   */
  async compareBranches(baseBranch: string, compareBranch: string): Promise<DiffSummary> {
    const files: DiffEntry[] = [];
    let totalAdditions = 0;
    let totalDeletions = 0;

    try {
      const statsOutput = this.exec(
        `git diff --numstat ${baseBranch}...${compareBranch}`,
        { allowEmpty: true }
      );

      if (statsOutput.trim()) {
        const lines = statsOutput.trim().split('\n');

        for (const line of lines) {
          const [additions, deletions, file] = line.split('\t');

          const addNum = parseInt(additions, 10) || 0;
          const delNum = parseInt(deletions, 10) || 0;

          totalAdditions += addNum;
          totalDeletions += delNum;

          // Get patch
          const patch = this.exec(
            `git diff ${baseBranch}...${compareBranch} -- "${file}"`,
            { allowEmpty: true }
          );

          let changeType: DiffEntry['changeType'] = 'modified';
          if (patch.includes('new file mode')) {
            changeType = 'added';
          } else if (patch.includes('deleted file mode')) {
            changeType = 'deleted';
          } else if (patch.includes('rename from')) {
            changeType = 'renamed';
          }

          files.push({
            file,
            changeType,
            additions: addNum,
            deletions: delNum,
            patch: patch || undefined,
          });
        }
      }
    } catch {
      // No diff
    }

    return {
      files,
      totalAdditions,
      totalDeletions,
      filesChanged: files.length,
    };
  }

  /**
   * Execute git command
   */
  private exec(command: string, options: { allowEmpty?: boolean } = {}): string {
    try {
      const output = execSync(command, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      return output || '';
    } catch (error: any) {
      if (options.allowEmpty && error.stdout) {
        return error.stdout.toString();
      }
      if (options.allowEmpty) {
        return '';
      }
      throw new Error(`Git command failed: ${error.message}`);
    }
  }
}
