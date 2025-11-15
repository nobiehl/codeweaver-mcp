import chokidar, { type FSWatcher } from 'chokidar';
import type { SemanticIndexAgent } from './semantic.js';

/**
 * FileWatcherAgent - Watches for file changes and updates semantic index
 *
 * Features:
 * - Watches code and docs files for changes
 * - Debounces changes (waits for multiple changes before reindexing)
 * - Incremental updates (only reindex changed files)
 * - Handles file additions, modifications, and deletions
 */
export class FileWatcherAgent {
  private projectRoot: string;
  private semanticAgent: SemanticIndexAgent;
  private watcher: FSWatcher | null = null;
  private changedFiles: Set<string> = new Set();
  private deletedFiles: Set<string> = new Set();
  private debounceTimer: NodeJS.Timeout | null = null;
  private debounceMs: number;
  private stats = {
    filesWatched: 0,
    changesDetected: 0,
    reindexOperations: 0,
    lastUpdate: new Date()
  };

  constructor(
    projectRoot: string,
    semanticAgent: SemanticIndexAgent,
    debounceMs: number = 2000
  ) {
    this.projectRoot = projectRoot;
    this.semanticAgent = semanticAgent;
    this.debounceMs = debounceMs;
  }

  /**
   * Start watching files for changes
   */
  async start(patterns: string[] = ['**/*.java', '**/*.md']): Promise<void> {
    console.log('🔍 CodeWeaver Semantic Index Watcher');
    console.log('=====================================');
    console.log(`Pattern: ${patterns.join(', ')}`);
    console.log(`Debounce: ${this.debounceMs}ms`);
    console.log(`Project: ${this.projectRoot}\n`);

    this.watcher = chokidar.watch(patterns, {
      cwd: this.projectRoot,
      ignored: [
        /(^|[\/\\])\../, // Ignore dotfiles
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.codeweaver/**'
      ],
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 500, // Wait 500ms for file to be stable
        pollInterval: 100
      }
    });

    // Track initial file count
    this.watcher.on('ready', () => {
      const watched = this.watcher!.getWatched();
      this.stats.filesWatched = Object.values(watched).reduce((acc, files: string[]) => acc + files.length, 0);
      console.log(`✅ Watching ${this.stats.filesWatched} files\n`);
    });

    // Handle file changes
    this.watcher
      .on('add', (path: string) => this.onFileChange(path, 'added'))
      .on('change', (path: string) => this.onFileChange(path, 'changed'))
      .on('unlink', (path: string) => this.onFileDelete(path));

    console.log('Press Ctrl+C to stop watching\n');
  }

  /**
   * Handle file change (add or modify)
   */
  private onFileChange(filePath: string, eventType: 'added' | 'changed'): void {
    const timestamp = new Date().toLocaleTimeString();
    const icon = eventType === 'added' ? '➕' : '📝';
    console.log(`[${timestamp}] ${icon} ${filePath}`);

    this.changedFiles.add(filePath);
    this.deletedFiles.delete(filePath); // In case it was deleted before
    this.stats.changesDetected++;

    this.scheduleReindex();
  }

  /**
   * Handle file deletion
   */
  private onFileDelete(filePath: string): void {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] 🗑️  ${filePath}`);

    this.deletedFiles.add(filePath);
    this.changedFiles.delete(filePath); // Remove from changed if it was there
    this.stats.changesDetected++;

    this.scheduleReindex();
  }

  /**
   * Schedule reindex with debounce
   */
  private scheduleReindex(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const totalChanges = this.changedFiles.size + this.deletedFiles.size;
    console.log(`  ⏳ Waiting for more changes... (${totalChanges} pending)`);

    this.debounceTimer = setTimeout(() => {
      this.reindexChangedFiles();
    }, this.debounceMs);
  }

  /**
   * Reindex changed files
   */
  private async reindexChangedFiles(): Promise<void> {
    const changedArray = Array.from(this.changedFiles);
    const deletedArray = Array.from(this.deletedFiles);
    const total = changedArray.length + deletedArray.length;

    if (total === 0) return;

    this.changedFiles.clear();
    this.deletedFiles.clear();

    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[${timestamp}] ⚙️  Re-indexing ${total} file(s)...`);
    console.log(`  Changed: ${changedArray.length}`);
    console.log(`  Deleted: ${deletedArray.length}`);

    const startTime = Date.now();

    try {
      // Reindex changed and deleted files
      await this.semanticAgent.reindexFiles([...changedArray, ...deletedArray]);

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`[${timestamp}] ✅ Re-indexed ${total} file(s) in ${duration}s\n`);

      this.stats.reindexOperations++;
      this.stats.lastUpdate = new Date();
    } catch (error) {
      console.error(`[${timestamp}] ❌ Failed to re-index:`, (error as Error).message);
      console.log();
    }
  }

  /**
   * Get watcher statistics
   */
  getStats() {
    return {
      ...this.stats,
      uptime: Math.round((Date.now() - this.stats.lastUpdate.getTime()) / 1000)
    };
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      console.log('\n👋 File watcher stopped');

      console.log('\n📊 Statistics:');
      console.log(`  Files watched: ${this.stats.filesWatched}`);
      console.log(`  Changes detected: ${this.stats.changesDetected}`);
      console.log(`  Reindex operations: ${this.stats.reindexOperations}`);
    }
  }
}
