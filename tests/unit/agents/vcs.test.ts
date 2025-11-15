import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { VCSAgent } from '../../../src/core/agents/vcs.js';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

describe('VCSAgent', () => {
  let agent: VCSAgent;
  let testRepoDir: string;

  beforeEach(async () => {
    // Create unique test directory
    testRepoDir = `.test-repo-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    await fs.mkdir(testRepoDir, { recursive: true });

    // Initialize git repository
    execSync('git init', { cwd: testRepoDir, stdio: 'pipe' });
    execSync('git config user.name "Test User"', { cwd: testRepoDir, stdio: 'pipe' });
    execSync('git config user.email "test@example.com"', { cwd: testRepoDir, stdio: 'pipe' });

    // Create initial commit
    await fs.writeFile(path.join(testRepoDir, 'README.md'), '# Test Repo\n');
    execSync('git add .', { cwd: testRepoDir, stdio: 'pipe' });
    execSync('git commit -m "Initial commit"', { cwd: testRepoDir, stdio: 'pipe' });

    // Create second commit with more files
    await fs.writeFile(path.join(testRepoDir, 'file1.txt'), 'Hello World\n');
    await fs.writeFile(path.join(testRepoDir, 'file2.txt'), 'Line 1\nLine 2\nLine 3\n');
    execSync('git add .', { cwd: testRepoDir, stdio: 'pipe' });
    execSync('git commit -m "Add test files"', { cwd: testRepoDir, stdio: 'pipe' });

    agent = new VCSAgent(testRepoDir);
  });

  afterEach(async () => {
    try {
      await fs.rm(testRepoDir, { recursive: true, force: true });
    } catch {}
  });

  it('should detect if directory is a git repository', async () => {
    const isRepo = await agent.isGitRepository();
    expect(isRepo).toBe(true);
  });

  it('should get current branch name', async () => {
    const branch = await agent.getCurrentBranch();
    expect(branch).toMatch(/^(master|main)$/); // Default branch name
  });

  it('should get repository status', async () => {
    // Modify a file
    await fs.writeFile(path.join(testRepoDir, 'file1.txt'), 'Modified content\n');

    // Add new file
    await fs.writeFile(path.join(testRepoDir, 'new-file.txt'), 'New file\n');

    const status = await agent.getStatus();

    // Should have at least one change (the new file)
    expect(status.length).toBeGreaterThan(0);

    // Normalize paths for cross-platform compatibility
    const statusFiles = status.map(s => s.file.replace(/\\/g, '/'));

    // Check that we found at least the new file
    expect(statusFiles.some(f => f.includes('new-file.txt'))).toBe(true);

    // Check status types
    const hasUntracked = status.some(s => s.status === 'untracked');
    const hasModifiedOrAdded = status.some(s => s.status === 'modified' || s.status === 'added');

    expect(hasUntracked || hasModifiedOrAdded).toBe(true);
  });

  it('should get diff for modified file', async () => {
    // Modify file
    await fs.writeFile(path.join(testRepoDir, 'file1.txt'), 'Modified content\n');

    const diff = await agent.getDiff('file1.txt');

    expect(diff.files.length).toBe(1);
    expect(diff.files[0].file).toContain('file1.txt');
    expect(diff.files[0].changeType).toBe('modified');
    expect(diff.files[0].patch).toContain('Modified content');
  });

  it('should get commit history', async () => {
    const log = await agent.getLog({ limit: 10 });

    expect(log.commits.length).toBeGreaterThanOrEqual(2);
    expect(log.commits[0].message).toContain('Add test files');
    expect(log.commits[0].author).toBe('Test User');
    expect(log.commits[0].hash).toMatch(/^[a-f0-9]{40}$/);
  });

  it('should get blame information for file', async () => {
    const blame = await agent.getBlame('file2.txt');

    expect(blame.length).toBe(3); // 3 lines in file2.txt
    expect(blame[0].content).toBe('Line 1');
    expect(blame[0].author).toBe('Test User');
    expect(blame[0].commit).toMatch(/^[a-f0-9]{40}$/);
  });

  it('should get blame for specific line range', async () => {
    const blame = await agent.getBlame('file2.txt', 1, 2);

    expect(blame.length).toBe(2); // Lines 1-2
    expect(blame[0].content).toBe('Line 1');
    expect(blame[1].content).toBe('Line 2');
  });

  it('should list all branches', async () => {
    const defaultBranch = await agent.getCurrentBranch();

    // Create a new branch
    execSync('git checkout -b feature-branch', { cwd: testRepoDir, stdio: 'pipe' });
    execSync(`git checkout ${defaultBranch}`, { cwd: testRepoDir, stdio: 'pipe' });

    const branches = await agent.getBranches();

    expect(branches.length).toBeGreaterThanOrEqual(2);
    const currentBranch = branches.find(b => b.name === defaultBranch);
    expect(currentBranch?.current).toBe(true);
  });

  it('should compare branches', async () => {
    const defaultBranch = await agent.getCurrentBranch();

    // Create feature branch and add commit
    execSync('git checkout -b feature', { cwd: testRepoDir, stdio: 'pipe' });
    await fs.writeFile(path.join(testRepoDir, 'feature.txt'), 'Feature file\n');
    execSync('git add .', { cwd: testRepoDir, stdio: 'pipe' });
    execSync('git commit -m "Add feature"', { cwd: testRepoDir, stdio: 'pipe' });

    const diff = await agent.compareBranches(defaultBranch, 'feature');

    expect(diff.files.length).toBe(1);
    expect(diff.files[0].file.replace(/\\/g, '/')).toContain('feature.txt');
    expect(diff.files[0].changeType).toBe('added');
  });

  it('should handle non-git directory gracefully', async () => {
    // Use OS temp directory to ensure we're outside any Git repository
    const os = await import('os');
    const nonGitDir = path.join(os.tmpdir(), `.test-non-git-${Date.now()}`);
    await fs.mkdir(nonGitDir, { recursive: true });

    try {
      const nonGitAgent = new VCSAgent(nonGitDir);
      const isRepo = await nonGitAgent.isGitRepository();
      expect(isRepo).toBe(false);
    } finally {
      await fs.rm(nonGitDir, { recursive: true, force: true });
    }
  });

  it('should get diff summary for all changes', async () => {
    // Modify multiple files
    await fs.writeFile(path.join(testRepoDir, 'file1.txt'), 'Line 1\nLine 2\nLine 3\n');
    await fs.writeFile(path.join(testRepoDir, 'file2.txt'), 'Modified\n');
    await fs.writeFile(path.join(testRepoDir, 'new.txt'), 'New\n');

    const diff = await agent.getDiff();

    expect(diff.filesChanged).toBeGreaterThanOrEqual(2);
    expect(diff.totalAdditions).toBeGreaterThan(0);
  });
});
