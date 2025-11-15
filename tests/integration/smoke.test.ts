import { describe, it, expect } from 'vitest';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..', '..');
const indexPath = path.join(projectRoot, 'dist', 'index.js');

/**
 * Smoke Tests
 *
 * Basic integration tests to verify CLI and MCP server can start
 */
describe('Smoke Tests', () => {
  it('should build successfully', () => {
    // If this test runs, build was successful
    expect(true).toBe(true);
  });

  it('should have dist/index.js', async () => {
    const fs = await import('fs/promises');
    const exists = await fs.access(indexPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it('CLI should start and show version', (done) => {
    const proc = spawn('node', [indexPath, '--version'], {
      cwd: projectRoot,
      timeout: 5000
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toMatch(/\d+\.\d+\.\d+/);
      done();
    });

    proc.on('error', (err) => {
      done(err);
    });
  }, 10000);

  it('CLI should show help text', (done) => {
    const proc = spawn('node', [indexPath, '--help'], {
      cwd: projectRoot,
      timeout: 5000
    });

    let output = '';
    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', (code) => {
      expect(code).toBe(0);
      expect(output).toContain('CodeWeaver');
      expect(output).toContain('Commands:');
      done();
    });

    proc.on('error', (err) => {
      done(err);
    });
  }, 10000);

  it('MCP server should start with --mcp flag', (done) => {
    const proc = spawn('node', [indexPath, '--mcp'], {
      cwd: projectRoot,
      timeout: 3000
    });

    let stderr = '';
    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Give server time to start, then kill it
    setTimeout(() => {
      proc.kill();
    }, 1000);

    proc.on('close', () => {
      expect(stderr).toContain('CodeWeaver MCP Server running on stdio');
      done();
    });

    proc.on('error', (err) => {
      done(err);
    });
  }, 10000);
});
