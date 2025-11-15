# Leichtgewichtige Architektur (Pure Node.js)

**Zero Native Dependencies - Alles auf Node.js/JSON-Basis**

---

## Philosophie

Keine Installation von nativen Bibliotheken erforderlich:
- ❌ **KEIN** SQLite (native Binaries)
- ❌ **KEIN** tree-sitter (native Compilation)
- ✅ **NUR** Pure JavaScript/TypeScript
- ✅ **JSON-basierte** Persistenz
- ✅ **In-Memory** für Performance

---

## Architektur-Änderungen

### 1. Symbol-Index: In-Memory + JSON

**Statt SQLite → JSON Lines + In-Memory Maps**

```typescript
// Persistenz-Format: JSON Lines (newline-delimited JSON)
// .mcp-cache/index/symbols-<hash>.jsonl

{"type":"symbol","id":"com.example.MyClass","kind":"class",...}
{"type":"symbol","id":"com.example.MyClass#myMethod","kind":"method",...}
{"type":"reference","from":{"path":"...","line":42},"to":"com.example.MyClass#myMethod"}
```

**Vorteile:**
- Streaming-fähig (große Dateien zeilenweise lesen)
- Human-readable
- Keine Compilation nötig
- Cross-Platform ohne Probleme

**In-Memory-Struktur:**

```typescript
// src/storage/json-symbol-store.ts

export class JsonSymbolStore {
  private symbols: Map<SymbolId, SymbolDefinition> = new Map();
  private references: Map<SymbolId, Reference[]> = new Map();
  private files: Map<FilePath, FileSymbols> = new Map();

  // Lädt von JSON Lines
  async load(path: string): Promise<void> {
    const stream = fs.createReadStream(path, 'utf-8');
    const rl = readline.createInterface({ input: stream });

    for await (const line of rl) {
      const entry = JSON.parse(line);

      if (entry.type === 'symbol') {
        this.symbols.set(entry.id, entry);
      } else if (entry.type === 'reference') {
        if (!this.references.has(entry.to)) {
          this.references.set(entry.to, []);
        }
        this.references.get(entry.to)!.push(entry);
      }
    }
  }

  // Speichert als JSON Lines
  async save(path: string): Promise<void> {
    const stream = fs.createWriteStream(path);

    // Schreibe Symbole
    for (const symbol of this.symbols.values()) {
      stream.write(JSON.stringify({ type: 'symbol', ...symbol }) + '\n');
    }

    // Schreibe Referenzen
    for (const [to, refs] of this.references.entries()) {
      for (const ref of refs) {
        stream.write(JSON.stringify({ type: 'reference', ...ref }) + '\n');
      }
    }

    stream.end();
  }

  // Schnelle Lookups (O(1))
  getSymbol(id: SymbolId): SymbolDefinition | undefined {
    return this.symbols.get(id);
  }

  getReferences(symbolId: SymbolId): Reference[] {
    return this.references.get(symbolId) || [];
  }

  // Query-Funktionen
  findSymbolsByKind(kind: SymbolKind): SymbolDefinition[] {
    return Array.from(this.symbols.values()).filter(s => s.kind === kind);
  }

  findSymbolsByName(name: string): SymbolDefinition[] {
    return Array.from(this.symbols.values()).filter(s => s.name === name);
  }
}
```

---

### 2. Java-Parser: Pure JavaScript

**Statt tree-sitter → java-parser (npm)**

```typescript
// src/index/java-parser.ts

import { parse } from 'java-parser';

export class JavaParser {
  extractSymbols(code: string, filePath: string): SymbolDefinition[] {
    const ast = parse(code);
    const symbols: SymbolDefinition[] = [];

    // Traverse AST
    this.visitNode(ast, symbols, filePath);

    return symbols;
  }

  private visitNode(node: any, symbols: SymbolDefinition[], filePath: string): void {
    if (node.name === 'classDeclaration') {
      symbols.push(this.extractClass(node, filePath));
    } else if (node.name === 'methodDeclaration') {
      symbols.push(this.extractMethod(node, filePath));
    }
    // ... weitere Node-Typen

    // Rekursiv Kinder besuchen
    if (node.children) {
      for (const child of Object.values(node.children)) {
        if (Array.isArray(child)) {
          child.forEach(c => this.visitNode(c, symbols, filePath));
        } else if (typeof child === 'object' && child !== null) {
          this.visitNode(child, symbols, filePath);
        }
      }
    }
  }

  private extractClass(node: any, filePath: string): SymbolDefinition {
    return {
      id: this.getQualifiedName(node),
      kind: 'class',
      name: node.name,
      qualifiedName: this.getQualifiedName(node),
      location: this.getLocation(node, filePath),
      modifiers: this.getModifiers(node),
      // ...
    };
  }
}
```

**Alternativ: Regex-basierter Parser (noch leichtgewichtiger)**

```typescript
// src/index/regex-java-parser.ts

export class RegexJavaParser {
  extractSymbols(code: string, filePath: string): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];
    const lines = code.split('\n');

    // Package
    const packageMatch = code.match(/package\s+([\w.]+);/);
    const packageName = packageMatch?.[1] || '';

    // Classes
    const classRegex = /^\s*(public|private|protected)?\s*(static|final|abstract)?\s*(class|interface|enum|record)\s+(\w+)/gm;
    let match;
    while ((match = classRegex.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index);
      symbols.push({
        id: `${packageName}.${match[4]}`,
        kind: match[3] as SymbolKind,
        name: match[4],
        qualifiedName: `${packageName}.${match[4]}`,
        location: { path: filePath, startLine: line, startColumn: 0, endLine: line, endColumn: 0 },
        modifiers: [match[1], match[2]].filter(Boolean) as Modifier[],
        visibility: match[1] as any || 'package-private',
        annotations: []
      });
    }

    // Methods
    const methodRegex = /^\s*(public|private|protected)?\s*(static|final|synchronized)?\s*(\w+)\s+(\w+)\s*\(/gm;
    while ((match = methodRegex.exec(code)) !== null) {
      const line = this.getLineNumber(code, match.index);
      symbols.push({
        id: `${packageName}.${match[4]}`, // Vereinfacht
        kind: 'method',
        name: match[4],
        qualifiedName: `${packageName}.${match[4]}`,
        location: { path: filePath, startLine: line, startColumn: 0, endLine: line, endColumn: 0 },
        modifiers: [match[1], match[2]].filter(Boolean) as Modifier[],
        visibility: match[1] as any || 'package-private',
        annotations: []
      });
    }

    return symbols;
  }

  private getLineNumber(code: string, index: number): number {
    return code.substring(0, index).split('\n').length;
  }
}
```

---

### 3. Cache-Struktur: Nur JSON-Dateien

```
.mcp-cache/
├── metadata.json                     # Cache-Index
├── index/
│   ├── fulltext-<hash>.json          # FlexSearch export
│   └── symbols-<hash>.jsonl          # JSON Lines (symbols + refs)
├── reports/
│   ├── compile-<hash>.json
│   ├── test-<hash>.json
│   └── spotbugs-<hash>.json
├── snippets/
│   └── <file-hash>-L<start>-<end>.txt
└── vcs/
    └── diff-<hash>.patch
```

---

## Performance-Optimierungen

### 1. Lazy Loading

```typescript
// Lade nur bei Bedarf
class SymbolIndex {
  private loaded = false;
  private symbols: Map<SymbolId, SymbolDefinition> | null = null;

  async getSymbol(id: SymbolId): Promise<SymbolDefinition | undefined> {
    if (!this.loaded) {
      await this.load();
    }
    return this.symbols!.get(id);
  }

  private async load(): Promise<void> {
    if (this.loaded) return;
    // Lade von JSON Lines...
    this.loaded = true;
  }
}
```

### 2. Streaming für große Dateien

```typescript
import readline from 'readline';
import fs from 'fs';

async function* streamSymbols(path: string): AsyncGenerator<SymbolDefinition> {
  const stream = fs.createReadStream(path, 'utf-8');
  const rl = readline.createInterface({ input: stream });

  for await (const line of rl) {
    const entry = JSON.parse(line);
    if (entry.type === 'symbol') {
      yield entry;
    }
  }
}

// Nutzung
for await (const symbol of streamSymbols('symbols.jsonl')) {
  if (symbol.name === 'MyClass') {
    console.log('Found:', symbol);
    break; // Früh abbrechen
  }
}
```

### 3. Indizes für schnelle Lookups

```typescript
// src/storage/indexed-json-store.ts

export class IndexedJsonStore {
  private symbols: Map<SymbolId, SymbolDefinition> = new Map();

  // Zusätzliche Indizes für schnelle Queries
  private byKind: Map<SymbolKind, Set<SymbolId>> = new Map();
  private byName: Map<string, Set<SymbolId>> = new Map();
  private byFile: Map<FilePath, Set<SymbolId>> = new Map();

  addSymbol(symbol: SymbolDefinition): void {
    this.symbols.set(symbol.id, symbol);

    // Update Indizes
    if (!this.byKind.has(symbol.kind)) {
      this.byKind.set(symbol.kind, new Set());
    }
    this.byKind.get(symbol.kind)!.add(symbol.id);

    if (!this.byName.has(symbol.name)) {
      this.byName.set(symbol.name, new Set());
    }
    this.byName.get(symbol.name)!.add(symbol.id);

    if (!this.byFile.has(symbol.location.path)) {
      this.byFile.set(symbol.location.path, new Set());
    }
    this.byFile.get(symbol.location.path)!.add(symbol.id);
  }

  // O(1) Lookup nach Kind
  findByKind(kind: SymbolKind): SymbolDefinition[] {
    const ids = this.byKind.get(kind) || new Set();
    return Array.from(ids).map(id => this.symbols.get(id)!);
  }

  // O(1) Lookup nach Name
  findByName(name: string): SymbolDefinition[] {
    const ids = this.byName.get(name) || new Set();
    return Array.from(ids).map(id => this.symbols.get(id)!);
  }
}
```

---

## Vollständige Dependencies (Pure Node.js)

### package.json

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.4",
    "chokidar": "^4.0.3",
    "flexsearch": "^0.7.43",
    "simple-git": "^3.27.0",
    "java-parser": "^2.3.0",
    "fast-xml-parser": "^4.5.0",
    "zod": "^3.24.1"
  }
}
```

**KEINE native Dependencies!**

---

## Alternativen für Java-Parser

Falls `java-parser` nicht gut funktioniert:

### Option 1: Regex-Parser (siehe oben)
- Schnell
- Einfach
- Deckt 80% der Fälle ab
- Keine Dependencies

### Option 2: Eigener Mini-Lexer

```typescript
// src/index/simple-lexer.ts

export class SimpleJavaLexer {
  tokenize(code: string): Token[] {
    const tokens: Token[] = [];
    const keywords = ['class', 'interface', 'enum', 'public', 'private', 'protected', 'static', 'final'];

    // Einfacher Tokenizer
    const regex = /\b(class|interface|enum|public|private|protected|static|final|void|int|String|\w+)\b|[{}();]/g;
    let match;

    while ((match = regex.exec(code)) !== null) {
      tokens.push({
        type: keywords.includes(match[1]) ? 'keyword' : 'identifier',
        value: match[1] || match[0],
        position: match.index
      });
    }

    return tokens;
  }

  parse(tokens: Token[]): SymbolDefinition[] {
    const symbols: SymbolDefinition[] = [];

    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i].value === 'class' && tokens[i + 1]?.type === 'identifier') {
        symbols.push({
          kind: 'class',
          name: tokens[i + 1].value,
          // ...
        });
      }
    }

    return symbols;
  }
}
```

### Option 3: Chevrotain (Parser-Generator)

```typescript
import { createToken, Lexer, CstParser } from 'chevrotain';

// Definiere Tokens
const Class = createToken({ name: "Class", pattern: /class/ });
const Identifier = createToken({ name: "Identifier", pattern: /[a-zA-Z]\w*/ });

// Erstelle Lexer & Parser
// ... (komplexer, aber sehr mächtig)
```

---

## Vergleich: SQLite vs. JSON

| Aspekt | SQLite | JSON Lines |
|--------|--------|------------|
| **Installation** | Native Binary (node-gyp) | Keine |
| **Größe** | ~4MB Binary | 0 Bytes |
| **Performance (Lookup)** | O(log n) mit Index | O(1) mit Map |
| **Performance (Query)** | SQL = sehr schnell | Linear-Scan / Index-Maps |
| **Persistenz** | File-basiert | File-basiert |
| **Human-Readable** | Nein | Ja (JSON) |
| **Cross-Platform** | Compilation nötig | Sofort funktionsfähig |
| **Memory-Footprint** | Gering | Hoch (alles im RAM) |

**Für dein Use-Case (tokenarme Responses, gezielte Lookups):**
→ **JSON Lines + In-Memory Maps = Perfekt!**

---

## Migration-Plan

### Phase 1: Foundation (Woche 1-2)
- **STATT** `symbol-db.ts` (SQLite)
- **NUTZE** `json-symbol-store.ts` (JSON Lines)

### Phase 2: Indexing (Woche 3-4)
- **STATT** `tree-sitter-parser.ts`
- **NUTZE** `java-parser.ts` (npm package) oder `regex-java-parser.ts`

### Implementation-Änderungen

```typescript
// src/agents/index.ts

import { JsonSymbolStore } from '../storage/json-symbol-store.js';
import { JavaParser } from '../index/java-parser.js'; // oder RegexJavaParser

export class IndexAgent {
  private symbolStore = new JsonSymbolStore();
  private javaParser = new JavaParser();

  async buildSymbolIndex(): Promise<IndexStats> {
    const javaFiles = await this.findJavaFiles();

    for (const file of javaFiles) {
      const code = await fs.readFile(file, 'utf-8');
      const symbols = this.javaParser.extractSymbols(code, file);

      for (const symbol of symbols) {
        this.symbolStore.addSymbol(symbol);
      }
    }

    // Persistiere zu JSON Lines
    await this.symbolStore.save('.mcp-cache/index/symbols-latest.jsonl');

    return {
      filesIndexed: javaFiles.length,
      symbolsIndexed: this.symbolStore.size(),
      durationMs: 1234
    };
  }
}
```

---

## Vorteile des Leichtgewicht-Ansatzes

✅ **Zero Installation** - `npm install` und fertig
✅ **Cross-Platform** - Windows/Mac/Linux ohne Probleme
✅ **Debuggable** - JSON ist human-readable
✅ **Fast Startup** - Keine native Library laden
✅ **Portable** - `node_modules` kopieren = funktioniert
✅ **CI/CD-freundlich** - Keine Build-Steps für natives Code

---

## Nachteile (und Workarounds)

### 1. Memory-Verbrauch
**Problem**: Alles im RAM (bei 10.000 Klassen ~100-200MB)
**Lösung**: Lazy Loading, Partitionierung nach Packages

### 2. Query-Performance
**Problem**: Keine SQL-Queries
**Lösung**: In-Memory-Indizes (byKind, byName, byFile)

### 3. Parsing-Genauigkeit
**Problem**: Regex kann Edge-Cases verpassen
**Lösung**: java-parser Library (pure JS) ist sehr gut

---

## Empfehlung

Für dein Projekt:
- ✅ **JsonSymbolStore** mit JSON Lines
- ✅ **java-parser** npm package (falls gut) oder **RegexJavaParser** (fallback)
- ✅ **In-Memory-Maps** für schnelle Lookups
- ✅ **FlexSearch** für Fulltext (bleibt)
- ✅ **JSON-Cache** für Reports

**= Zero native Dependencies, maximale Portabilität!** 🎯
