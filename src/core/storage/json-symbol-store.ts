import fs from 'fs/promises';
import readline from 'readline';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import type {
  SymbolId,
  SymbolDefinition,
  Reference,
  SymbolKind,
  FileSymbols
} from '../../types/symbols.js';

export class JsonSymbolStore {
  private symbols: Map<SymbolId, SymbolDefinition> = new Map();
  private references: Map<SymbolId, Reference[]> = new Map();
  private files: Map<string, FileSymbols> = new Map();

  // Secondary indexes for fast queries
  private byKind: Map<SymbolKind, Set<SymbolId>> = new Map();
  private byName: Map<string, Set<SymbolId>> = new Map();
  private byFile: Map<string, Set<SymbolId>> = new Map();

  addSymbol(symbol: SymbolDefinition): void {
    this.symbols.set(symbol.id, symbol);

    // Update byKind index
    if (!this.byKind.has(symbol.kind)) {
      this.byKind.set(symbol.kind, new Set());
    }
    this.byKind.get(symbol.kind)!.add(symbol.id);

    // Update byName index
    if (!this.byName.has(symbol.name)) {
      this.byName.set(symbol.name, new Set());
    }
    this.byName.get(symbol.name)!.add(symbol.id);

    // Update byFile index
    if (!this.byFile.has(symbol.location.path)) {
      this.byFile.set(symbol.location.path, new Set());
    }
    this.byFile.get(symbol.location.path)!.add(symbol.id);
  }

  getSymbol(id: SymbolId): SymbolDefinition | undefined {
    return this.symbols.get(id);
  }

  findByKind(kind: SymbolKind): SymbolDefinition[] {
    const ids = this.byKind.get(kind) || new Set();
    return Array.from(ids)
      .map(id => this.symbols.get(id)!)
      .filter(Boolean);
  }

  findByName(name: string): SymbolDefinition[] {
    const ids = this.byName.get(name) || new Set();
    return Array.from(ids)
      .map(id => this.symbols.get(id)!)
      .filter(Boolean);
  }

  findByFile(filePath: string): SymbolDefinition[] {
    const ids = this.byFile.get(filePath) || new Set();
    return Array.from(ids)
      .map(id => this.symbols.get(id)!)
      .filter(Boolean);
  }

  addReference(ref: Reference): void {
    if (!this.references.has(ref.to)) {
      this.references.set(ref.to, []);
    }
    this.references.get(ref.to)!.push(ref);
  }

  getReferences(symbolId: SymbolId): Reference[] {
    return this.references.get(symbolId) || [];
  }

  size(): number {
    return this.symbols.size;
  }

  clear(): void {
    this.symbols.clear();
    this.references.clear();
    this.files.clear();
    this.byKind.clear();
    this.byName.clear();
    this.byFile.clear();
  }

  async save(filePath: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });

    const stream = createWriteStream(filePath);

    // Write symbols
    for (const symbol of this.symbols.values()) {
      stream.write(JSON.stringify({ type: 'symbol', ...symbol }) + '\n');
    }

    // Write references
    for (const [_to, refs] of this.references.entries()) {
      for (const ref of refs) {
        stream.write(JSON.stringify({ type: 'reference', ...ref }) + '\n');
      }
    }

    // Write files
    for (const file of this.files.values()) {
      stream.write(JSON.stringify({ type: 'file', ...file }) + '\n');
    }

    return new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      stream.end();
    });
  }

  async load(filePath: string): Promise<void> {
    this.clear();

    try {
      const stream = createReadStream(filePath, 'utf-8');
      const rl = readline.createInterface({ input: stream });

      for await (const line of rl) {
        if (!line.trim()) continue;

        const entry = JSON.parse(line);

        if (entry.type === 'symbol') {
          const { type, ...symbol } = entry;
          this.addSymbol(symbol as SymbolDefinition);
        } else if (entry.type === 'reference') {
          const { type, ...ref } = entry;
          this.addReference(ref as Reference);
        } else if (entry.type === 'file') {
          const { type, ...file } = entry;
          this.files.set(file.path, file as FileSymbols);
        }
      }
    } catch (error) {
      // File doesn't exist or is empty - that's ok
      if ((error as any).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  getFiles(): FileSymbols[] {
    return Array.from(this.files.values());
  }

  addFile(file: FileSymbols): void {
    this.files.set(file.path, file);
  }
}
