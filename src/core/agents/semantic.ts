import { connect } from '@lancedb/lancedb';
import { pipeline, env } from '@xenova/transformers';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import type { CodeChunk, SemanticSearchResult, CollectionType, IndexOptions } from '../../types/semantic.js';

// Performance optimizations
env.allowLocalModels = false; // Faster startup
env.backends.onnx.wasm.numThreads = os.cpus().length; // Use all CPU cores
env.backends.onnx.wasm.simd = true; // Enable SIMD instructions
env.backends.onnx.wasm.proxy = false; // Disable proxy for better performance

/**
 * SemanticIndexAgent - LanceDB Vector Search for Code & Docs
 *
 * Features:
 * - Multi-collection support (code, docs)
 * - Embed code snippets using Sentence Transformers
 * - Store vectors in LanceDB (separate tables per collection)
 * - Semantic similarity search across one or multiple collections
 */
export class SemanticIndexAgent {
  private projectRoot: string;
  private dbPath: string;
  private db: any = null;
  private tables: Map<CollectionType, any> = new Map(); // code_chunks, docs_chunks
  private embedder: any = null;
  private modelName = 'Xenova/all-MiniLM-L6-v2'; // Fast, 384-dim embeddings

  constructor(projectRoot: string = '.') {
    this.projectRoot = projectRoot;
    this.dbPath = path.join(projectRoot, '.codeweaver', 'lancedb');
  }

  /**
   * Get table name for collection type
   */
  private getTableName(collection: CollectionType): string {
    if (collection === 'all') {
      throw new Error('Cannot get table name for "all" collection');
    }
    return `${collection}_chunks`;
  }

  /**
   * Detect collection type from file extension
   */
  private detectCollectionType(file: string): CollectionType | null {
    const ext = path.extname(file).toLowerCase();

    // Code extensions
    if (['.java', '.ts', '.js', '.py', '.go', '.rs', '.kt', '.cs', '.cpp', '.c', '.h'].includes(ext)) {
      return 'code';
    }

    // Documentation extensions
    if (['.md', '.markdown', '.txt', '.rst', '.adoc'].includes(ext)) {
      return 'docs';
    }

    return null;
  }

  /**
   * Detect language from file extension
   */
  private detectLanguage(file: string): string {
    const ext = path.extname(file).toLowerCase();
    const languageMap: Record<string, string> = {
      '.java': 'java',
      '.ts': 'typescript',
      '.js': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.kt': 'kotlin',
      '.cs': 'csharp',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.md': 'markdown',
      '.markdown': 'markdown',
      '.txt': 'text',
      '.rst': 'restructuredtext',
      '.adoc': 'asciidoc'
    };
    return languageMap[ext] || 'unknown';
  }

  /**
   * Initialize LanceDB connection and embedding model
   */
  async initialize(): Promise<void> {
    // Ensure directory exists
    await fs.mkdir(this.dbPath, { recursive: true });

    // Connect to LanceDB
    this.db = await connect(this.dbPath);

    // Load embedding model (downloads on first use, ~90MB)
    console.log(`Loading embedding model: ${this.modelName}...`);
    console.log(`  ONNX Runtime: ENABLED (${os.cpus().length} threads, SIMD enabled)`);
    this.embedder = await pipeline('feature-extraction', this.modelName);
    console.log('✅ Embedding model loaded with ONNX optimizations');
  }

  /**
   * Index files for semantic search (multi-collection support)
   */
  async indexFiles(files: string[], options: IndexOptions = {}): Promise<{ indexed: number; chunks: number }> {
    if (!this.embedder) {
      await this.initialize();
    }

    // Group files by collection type
    const filesByCollection: Map<CollectionType, string[]> = new Map();

    console.log(`Processing ${files.length} files...`);
    for (const file of files) {
      const collectionType = this.detectCollectionType(file);
      if (!collectionType) {
        console.log(`Skipping unsupported file type: ${file}`);
        continue;
      }

      // Filter by target collection if specified
      if (options.collection && options.collection !== 'all' && collectionType !== options.collection) {
        continue;
      }

      if (!filesByCollection.has(collectionType)) {
        filesByCollection.set(collectionType, []);
      }
      filesByCollection.get(collectionType)!.push(file);
    }

    let totalChunks = 0;
    let totalIndexed = 0;

    // Index each collection separately
    for (const [collectionType, collectionFiles] of filesByCollection) {
      console.log(`\n=== Indexing ${collectionType} collection (${collectionFiles.length} files) ===`);

      const chunks: CodeChunk[] = [];

      // Read and chunk all files
      for (const file of collectionFiles) {
        const filePath = path.join(this.projectRoot, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const fileChunks = this.chunkFile(file, content, collectionType);
          chunks.push(...fileChunks);
        } catch (error) {
          console.error(`Failed to read ${file}:`, error);
        }
      }

      console.log(`✓ Created ${chunks.length} chunks from ${collectionFiles.length} files`);

      // Generate embeddings for all chunks with BATCH PROCESSING
      console.log(`\nGenerating embeddings with batch processing...`);
      const chunksWithVectors = await this.generateEmbeddingsBatch(chunks);

      // Store in LanceDB
      console.log('\nStoring vectors in LanceDB...');

      const tableName = this.getTableName(collectionType);
      const tableNames = await this.db.tableNames();
      if (tableNames.includes(tableName)) {
        await this.db.dropTable(tableName);
      }

      // Create new table
      const table = await this.db.createTable(tableName, chunksWithVectors);
      this.tables.set(collectionType, table);

      console.log(`✅ ${collectionType} collection indexed\n`);

      totalChunks += chunksWithVectors.length;
      totalIndexed += collectionFiles.length;
    }

    console.log(`\n✅ Semantic indexing complete!`);
    console.log(`   Total files: ${totalIndexed}`);
    console.log(`   Total chunks: ${totalChunks}`);
    if (filesByCollection.has('code')) {
      console.log(`   - Code: ${filesByCollection.get('code')!.length} files`);
    }
    if (filesByCollection.has('docs')) {
      console.log(`   - Docs: ${filesByCollection.get('docs')!.length} files`);
    }

    return {
      indexed: totalIndexed,
      chunks: totalChunks
    };
  }

  /**
   * Chunk a file into searchable segments (collection-specific strategies)
   */
  private chunkFile(file: string, content: string, collection: CollectionType): CodeChunk[] {
    const lines = content.split('\n');
    const chunks: CodeChunk[] = [];
    const language = this.detectLanguage(file);

    let chunkSize: number;
    let overlap: number;

    // Different chunking strategies per collection
    if (collection === 'code') {
      // Code: Larger chunks to capture complete methods/classes
      chunkSize = 20;
      overlap = 5;
    } else if (collection === 'docs') {
      // Docs: Smaller chunks to capture paragraphs/sections
      chunkSize = 15;
      overlap = 3;
    } else {
      // Default
      chunkSize = 20;
      overlap = 5;
    }

    for (let start = 0; start < lines.length; start += (chunkSize - overlap)) {
      const end = Math.min(start + chunkSize, lines.length);
      const chunkContent = lines.slice(start, end).join('\n');

      // Skip empty or whitespace-only chunks
      if (chunkContent.trim().length < 10) continue;

      chunks.push({
        id: `${file}:${start + 1}-${end}`,
        file,
        startLine: start + 1,
        endLine: end,
        content: chunkContent,
        language,
        collection
      });
    }

    return chunks;
  }

  /**
   * Generate embedding vector for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // Truncate if too long (model limit: 512 tokens)
    const truncated = text.slice(0, 2000);

    const output = await this.embedder(truncated, {
      pooling: 'mean',
      normalize: true
    });

    // Convert to array
    return Array.from(output.data);
  }

  /**
   * Generate embeddings for multiple chunks with batch processing
   * This is ~16x faster than sequential processing!
   */
  private async generateEmbeddingsBatch(chunks: CodeChunk[]): Promise<CodeChunk[]> {
    // Determine optimal batch size based on CPU cores
    // Rule of thumb: 2x number of cores for I/O bound operations
    const cpuCores = os.cpus().length;
    const BATCH_SIZE = Math.max(8, cpuCores * 2); // Min 8, typically 16-32

    console.log(`  Batch size: ${BATCH_SIZE} (${cpuCores} CPU cores detected)`);
    console.log(`  Total chunks: ${chunks.length}`);
    console.log(`  Estimated batches: ${Math.ceil(chunks.length / BATCH_SIZE)}\n`);

    const chunksWithVectors: CodeChunk[] = [];
    const startTime = Date.now();

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batchStart = Date.now();
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      // Process batch in parallel
      const vectors = await Promise.all(
        batch.map(chunk => this.generateEmbedding(chunk.content))
      );

      // Add vectors to chunks
      batch.forEach((chunk, idx) => {
        chunksWithVectors.push({ ...chunk, vector: vectors[idx] });
      });

      // Calculate progress and ETA
      const processed = i + batch.length;
      const progress = Math.round((processed / chunks.length) * 100);
      const elapsed = (Date.now() - startTime) / 1000; // seconds
      const rate = processed / elapsed; // chunks per second
      const remaining = chunks.length - processed;
      const eta = Math.round(remaining / rate); // seconds

      const batchTime = ((Date.now() - batchStart) / 1000).toFixed(1);

      // Format ETA
      const etaMin = Math.floor(eta / 60);
      const etaSec = eta % 60;
      const etaStr = etaMin > 0 ? `${etaMin}m ${etaSec}s` : `${etaSec}s`;

      console.log(
        `  [${progress}%] Batch ${batchNum}/${totalBatches} | ` +
        `${processed}/${chunks.length} chunks | ` +
        `${batchTime}s/batch | ` +
        `ETA: ${etaStr}`
      );
    }

    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✓ Generated ${chunksWithVectors.length} embeddings in ${totalTime}s`);

    return chunksWithVectors;
  }

  /**
   * Search for semantically similar code/docs across collections
   */
  async search(query: string, limit: number = 10, collection: CollectionType = 'all'): Promise<SemanticSearchResult[]> {
    // Load tables if not already loaded
    if (!this.db) {
      await this.initialize();
    }

    const tableNames = await this.db.tableNames();

    // Determine which collections to search
    const collectionsToSearch: CollectionType[] = [];
    if (collection === 'all') {
      if (tableNames.includes('code_chunks')) collectionsToSearch.push('code');
      if (tableNames.includes('docs_chunks')) collectionsToSearch.push('docs');
    } else {
      const tableName = this.getTableName(collection);
      if (!tableNames.includes(tableName)) {
        throw new Error(`No ${collection} index found. Run indexing first for ${collection}.`);
      }
      collectionsToSearch.push(collection);
    }

    if (collectionsToSearch.length === 0) {
      throw new Error('No semantic index found. Run indexing first.');
    }

    // Generate query embedding once
    const queryVector = await this.generateEmbedding(query);

    // Search all relevant collections
    const allResults: SemanticSearchResult[] = [];

    for (const coll of collectionsToSearch) {
      const tableName = this.getTableName(coll);
      let table = this.tables.get(coll);

      if (!table) {
        table = await this.db.openTable(tableName);
        this.tables.set(coll, table);
      }

      // Search this collection
      const results = await table
        .search(queryVector)
        .limit(limit)
        .toArray();

      // Map and annotate with collection
      const mappedResults = results.map((result: any) => ({
        file: result.file || '',
        startLine: result.startLine || 0,
        endLine: result.endLine || 0,
        content: result.content || '',
        similarity: 1 / (1 + (result._distance || 0)),
        _distance: result._distance || 0,
        collection: coll
      }));

      allResults.push(...mappedResults);
    }

    // Sort by similarity (highest first) and limit
    allResults.sort((a, b) => b.similarity - a.similarity);
    return allResults.slice(0, limit);
  }

  /**
   * Get index statistics (multi-collection)
   */
  async getStats(): Promise<{ code?: { chunks: number; size: number }; docs?: { chunks: number; size: number }; total: { chunks: number; size: number }; modelName: string }> {
    if (!this.db) {
      try {
        await this.initialize();
      } catch {
        return {
          total: { chunks: 0, size: 0 },
          modelName: this.modelName
        };
      }
    }

    const tableNames = await this.db.tableNames();
    const stats: any = {
      modelName: this.modelName,
      total: { chunks: 0, size: 0 }
    };

    // Check code collection
    if (tableNames.includes('code_chunks')) {
      const table = await this.db.openTable('code_chunks');
      const count = await table.countRows();
      const size = count * 384 * 4; // 384 dims * 4 bytes per float

      stats.code = { chunks: count, size };
      stats.total.chunks += count;
      stats.total.size += size;
    }

    // Check docs collection
    if (tableNames.includes('docs_chunks')) {
      const table = await this.db.openTable('docs_chunks');
      const count = await table.countRows();
      const size = count * 384 * 4;

      stats.docs = { chunks: count, size };
      stats.total.chunks += count;
      stats.total.size += size;
    }

    return stats;
  }

  /**
   * Clear semantic index (one or all collections)
   */
  async clearIndex(collection: CollectionType = 'all'): Promise<void> {
    if (!this.db) {
      await this.initialize();
    }

    const tableNames = await this.db.tableNames();

    if (collection === 'all' || collection === 'code') {
      if (tableNames.includes('code_chunks')) {
        await this.db.dropTable('code_chunks');
        this.tables.delete('code');
      }
    }

    if (collection === 'all' || collection === 'docs') {
      if (tableNames.includes('docs_chunks')) {
        await this.db.dropTable('docs_chunks');
        this.tables.delete('docs');
      }
    }
  }

  /**
   * Re-index specific files (incremental update for file watcher)
   * This is much faster than full reindex!
   */
  async reindexFiles(files: string[]): Promise<void> {
    if (!this.embedder) {
      await this.initialize();
    }

    if (files.length === 0) return;

    // Group files by collection
    const filesByCollection: Map<CollectionType, string[]> = new Map();

    for (const file of files) {
      const collectionType = this.detectCollectionType(file);
      if (!collectionType) continue;

      if (!filesByCollection.has(collectionType)) {
        filesByCollection.set(collectionType, []);
      }
      filesByCollection.get(collectionType)!.push(file);
    }

    // Re-index each collection
    for (const [collectionType, collectionFiles] of filesByCollection) {
      const tableName = this.getTableName(collectionType);
      const tableNames = await this.db.tableNames();

      if (!tableNames.includes(tableName)) {
        console.log(`  ⚠️  ${collectionType} collection not indexed yet, skipping...`);
        continue;
      }

      // Load table if not already loaded
      let table = this.tables.get(collectionType);
      if (!table) {
        table = await this.db.openTable(tableName);
        this.tables.set(collectionType, table);
      }

      // 1. Delete old chunks for these files
      for (const file of collectionFiles) {
        try {
          await table.delete(`file = '${file}'`);
        } catch (error) {
          // File might not exist in index, that's ok
        }
      }

      // 2. Generate new chunks for changed files (skip deleted files)
      const chunks: CodeChunk[] = [];
      for (const file of collectionFiles) {
        const filePath = path.join(this.projectRoot, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const fileChunks = this.chunkFile(file, content, collectionType);
          chunks.push(...fileChunks);
        } catch (error) {
          // File was deleted or unreadable, already removed from index
          console.log(`    Removed ${file} from index (file deleted or unreadable)`);
        }
      }

      if (chunks.length === 0) {
        console.log(`  ✓ Processed ${collectionFiles.length} deletions in ${collectionType}`);
        continue;
      }

      // 3. Generate embeddings with batch processing
      console.log(`  Generating embeddings for ${chunks.length} chunks...`);
      const chunksWithVectors = await this.generateEmbeddingsBatch(chunks);

      // 4. Add new chunks to table
      await table.add(chunksWithVectors);
      console.log(`  ✓ Updated ${collectionFiles.length} files (${chunksWithVectors.length} chunks) in ${collectionType}`);
    }
  }
}
