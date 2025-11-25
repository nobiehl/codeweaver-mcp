# Datenmodelle & Index-Strukturen

## Übersicht

Dieses Dokument spezifiziert alle Datenstrukturen, Index-Schemata und Persistenz-Formate des Java Analysis MCP Servers.

---

## 1. Projekt-Metadaten

### 1.1 UnifiedProjectMetadata (NEU - Multi-Language)

**Status**: ✅ Production-Ready (v0.3.1+)

Einheitliche Struktur für Multi-Language Projekt-Informationen (von Project Metadata Agent erzeugt).

```typescript
interface UnifiedProjectMetadata {
  // Identifikation
  root: string;                              // Absoluter Pfad zur Projektwurzel
  name: string;                              // Projektname
  version?: string;                          // Projekt-Version

  // Projekt-Typ & Build-System
  projectType: ProjectType;                  // 'gradle' | 'npm' | 'pip' | 'maven' | 'cargo' | ...
  languages: Language[];                     // ['java', 'kotlin'] oder ['typescript', 'javascript']
  buildTool: string;                         // 'Gradle', 'npm', 'yarn', 'pnpm', 'Maven', etc.

  // Dependencies (Unified Schema)
  dependencies: UnifiedDependency[];         // Runtime dependencies
  devDependencies?: UnifiedDependency[];     // Development dependencies

  // Scripts & Tasks
  scripts?: Record<string, string>;          // Build-Scripts (npm scripts, gradle tasks)

  // Module/Subprojects
  modules?: UnifiedModule[];                 // Multi-Module-Projekte

  // Zusätzliche Metadaten (projekt-spezifisch)
  metadata?: Record<string, unknown>;        // Flexible für spezifische Felder

  // Timestamps
  discoveredAt: Date;
  lastModified: Date;
}

// Project Types (erweiterbar)
type ProjectType =
  | 'gradle'      // Java, Kotlin (Gradle)
  | 'maven'       // Java (Maven)
  | 'npm'         // TypeScript, JavaScript (npm/yarn/pnpm/bun)
  | 'pip'         // Python (pip)
  | 'cargo'       // Rust (Cargo)
  | 'composer'    // PHP (Composer)
  | 'nuget'       // C# (.NET)
  | 'go-mod'      // Go (Go Modules)
  | 'ruby-gem'    // Ruby (RubyGems)
  | 'multi'       // Mehrere Projekttypen
  | 'unknown';    // Unbekannt

// Languages
type Language =
  | 'java' | 'kotlin' | 'scala' | 'groovy'           // JVM
  | 'typescript' | 'javascript'                       // JavaScript/TypeScript
  | 'python'                                          // Python
  | 'rust' | 'go' | 'c' | 'cpp' | 'csharp'          // Systems
  | 'php' | 'ruby' | 'perl'                          // Scripting
  | 'unknown';

// Unified Dependency (language-agnostic)
interface UnifiedDependency {
  group?: string;                            // Maven group / npm org (z.B. '@types')
  name: string;                              // Artifact/Package name
  version: string;                           // Version (z.B. '1.0.0', '^4.18.2')
  scope: DependencyScope;                    // 'runtime' | 'dev' | 'test' | 'peer' | ...
}

type DependencyScope =
  | 'runtime'     // Production runtime dependency
  | 'dev'         // Development-only
  | 'test'        // Testing-only
  | 'peer'        // Peer dependency (npm)
  | 'optional'    // Optional dependency
  | 'provided'    // Provided by container (Java)
  | 'compile';    // Compile-time only

// Unified Module
interface UnifiedModule {
  name: string;                              // Modul-Name
  path: string;                              // Relativer Pfad
  type: 'root' | 'subproject' | 'workspace'; // Modul-Typ
  dependencies?: UnifiedDependency[];        // Modul-spezifische Dependencies
}
```

**Plugin Architecture:**

```typescript
interface ProjectMetadataPlugin {
  readonly name: string;                     // Plugin-Name (z.B. 'gradle', 'npm')
  readonly projectType: ProjectType;
  readonly languages: Language[];

  // Detection
  detect(projectRoot: string): Promise<boolean>;

  // Extraction
  extract(projectRoot: string): Promise<UnifiedProjectMetadata>;

  // Optional: Scripts & Dependency Tree
  getScripts?(projectRoot: string): Promise<Record<string, string>>;
  getDependencyTree?(projectRoot: string): Promise<DependencyTree>;
}
```

**Beispiele:**

```typescript
// Gradle-Projekt
{
  root: '/path/to/project',
  name: 'my-app',
  version: '1.0.0',
  projectType: 'gradle',
  languages: ['java', 'kotlin'],
  buildTool: 'Gradle',
  dependencies: [
    { group: 'org.springframework.boot', name: 'spring-boot-starter-web', version: '3.2.0', scope: 'runtime' }
  ],
  metadata: {
    gradleVersion: '8.5',
    javaVersion: '21'
  }
}

// npm-Projekt
{
  root: '/path/to/project',
  name: 'my-frontend',
  version: '2.0.0',
  projectType: 'npm',
  languages: ['typescript', 'javascript'],
  buildTool: 'yarn',
  dependencies: [
    { name: 'react', version: '18.2.0', scope: 'runtime' },
    { name: 'express', version: '4.18.2', scope: 'runtime' }
  ],
  devDependencies: [
    { name: 'typescript', version: '5.0.0', scope: 'dev' },
    { name: 'vitest', version: '1.0.0', scope: 'dev' }
  ],
  scripts: {
    build: 'yarn run build',
    test: 'yarn run test',
    dev: 'yarn run dev'
  },
  metadata: {
    packageManager: 'yarn',
    nodeVersion: '>=20.0.0',
    hasTypeScript: true
  }
}
```

---

### 1.2 ProjectMetadata (DEPRECATED - Legacy Gradle)

**Status**: ⚠️ Deprecated (Removed in v0.3.0+)

Legacy-Struktur für Gradle-spezifische Projekt-Informationen.

**⚠️ Hinweis**: Nutze `UnifiedProjectMetadata` (siehe Section 1.1) für alle neuen Implementierungen!

```typescript
interface ProjectMetadata {
  // Identifikation
  root: string;                           // Absoluter Pfad zur Projektwurzel
  name: string;                           // Projektname (aus settings.gradle)
  version?: string;                       // Version (aus build.gradle)

  // Build-System
  buildSystem: 'gradle' | 'maven';        // Nur Gradle in Phase 1
  gradleVersion: string;                  // z.B. "8.5"
  gradleWrapperPresent: boolean;

  // Java
  javaVersion: string;                    // z.B. "21"
  javaToolchain?: string;                 // Toolchain-Konfiguration

  // Module
  modules: ModuleInfo[];                  // Alle Module (inkl. Root)
  moduleCount: number;

  // Abhängigkeiten (Top-Level)
  dependencies: DependencyInfo[];

  // Build-Tasks
  availableTasks: string[];               // Gradle tasks list output

  // Timestamps
  discoveredAt: Date;
  lastModified: Date;                     // Neueste Datei-Änderung
}
```

### 1.3 ModuleInfo (Legacy Gradle)

**Status**: ⚠️ Legacy (Teil von ProjectMetadata - deprecated)

Pro Gradle-Subproject oder Root-Projekt.

```typescript
interface ModuleInfo {
  name: string;                           // z.B. "core", "api"
  path: string;                           // Relativer Pfad von root
  type: 'root' | 'subproject';

  // Source-Sets
  sourceSets: {
    main: SourceSetInfo;
    test: SourceSetInfo;
    custom?: Record<string, SourceSetInfo>;  // z.B. "integrationTest"
  };

  // Dependencies (für dieses Modul)
  dependencies: DependencyInfo[];

  // Build-Konfiguration
  plugins: string[];                      // z.B. ["java", "application"]
  tasks: string[];                        // Modul-spezifische Tasks

  // Statistiken
  javaFileCount: number;
  testFileCount: number;
  totalLinesOfCode?: number;              // Optional
}
```

### 1.4 SourceSetInfo (Legacy Gradle)

**Status**: ⚠️ Legacy (Teil von ModuleInfo - deprecated)

```typescript
interface SourceSetInfo {
  name: string;                           // "main" | "test" | custom
  srcDirs: string[];                      // z.B. ["src/main/java"]
  resourceDirs: string[];                 // z.B. ["src/main/resources"]
  outputDir: string;                      // build/classes/java/main
  compileClasspath?: string[];            // JAR-Pfade
}
```

### 1.5 DependencyInfo (Legacy Gradle)

**Status**: ⚠️ Legacy (Teil von ProjectMetadata - deprecated)

**⚠️ Hinweis**: Für neue Implementierungen nutze `UnifiedDependency` (Sektion 1.1)

```typescript
interface DependencyInfo {
  group: string;                          // z.B. "org.springframework.boot"
  artifact: string;                       // z.B. "spring-boot-starter-web"
  version: string;
  configuration: string;                  // "implementation" | "testImplementation" | ...
  scope?: 'compile' | 'runtime' | 'test';
}
```

---

## 2. Symbol-Index

### 2.1 SymbolIndex (In-Memory Struktur)

```typescript
interface SymbolIndex {
  // Version & Metadaten
  version: string;                        // Index-Schema-Version (z.B. "1.0")
  projectRoot: string;
  buildHash: string;                      // SHA-256 über alle Source-Dateien + build.gradle
  createdAt: Date;
  stats: IndexStats;

  // Haupt-Datenstrukturen
  symbols: Map<SymbolId, SymbolDefinition>;
  references: Map<SymbolId, Reference[]>;
  files: Map<FilePath, FileSymbols>;
  packages: Map<PackageName, PackageInfo>;
}

type SymbolId = string;                   // FQN, z.B. "com.example.MyClass#myMethod"
type FilePath = string;                   // Relativ zu projectRoot
type PackageName = string;                // z.B. "com.example.core"

interface IndexStats {
  filesIndexed: number;
  symbolsIndexed: number;
  referencesIndexed: number;
  indexSizeBytes: number;
  buildDurationMs: number;
}
```

### 2.2 SymbolDefinition

```typescript
interface SymbolDefinition {
  id: SymbolId;                           // Unique identifier
  kind: SymbolKind;
  name: string;                           // Simple name (z.B. "myMethod")
  qualifiedName: string;                  // FQN (z.B. "com.example.MyClass#myMethod")

  // Lokation
  location: Location;

  // Signatur & Typ
  signature?: string;                     // Für Methoden: "myMethod(String, int): boolean"
  returnType?: TypeReference;             // Nur für Methoden/Fields
  parameters?: Parameter[];               // Nur für Methoden/Constructors
  typeParameters?: string[];              // Generics: <T, U>

  // Modifiers
  modifiers: Modifier[];                  // public, static, final, abstract, ...
  annotations: Annotation[];

  // Hierarchie
  parent?: SymbolId;                      // Enclosing class/interface
  extends?: SymbolId[];                   // Superclass (nur 1 bei Java)
  implements?: SymbolId[];                // Interfaces

  // Dokumentation
  javadoc?: string;                       // Erste 500 Zeichen

  // Visibility
  visibility: 'public' | 'protected' | 'package-private' | 'private';
}

type SymbolKind =
  | 'package'
  | 'import'
  | 'class' | 'interface' | 'enum' | 'record' | 'annotation-type'
  | 'method' | 'constructor'
  | 'field' | 'enum-constant'
  | 'parameter' | 'local-variable'
  | 'type-parameter';                     // Generics

interface Location {
  path: string;                           // Relativ zu projectRoot
  startLine: number;                      // 1-based
  startColumn: number;
  endLine: number;
  endColumn: number;
}

interface TypeReference {
  name: string;                           // z.B. "String", "List<String>"
  qualifiedName?: string;                 // FQN
  typeArguments?: TypeReference[];        // Für Generics
  arrayDimensions?: number;               // 0 = kein Array, 1 = [], 2 = [][]
}

interface Parameter {
  name: string;
  type: TypeReference;
  annotations: Annotation[];
}

type Modifier =
  | 'public' | 'protected' | 'private'
  | 'static' | 'final' | 'abstract' | 'native' | 'synchronized' | 'transient' | 'volatile'
  | 'strictfp' | 'default';               // Interface default methods

interface Annotation {
  type: string;                           // z.B. "@Override", "@Deprecated"
  arguments?: Record<string, any>;        // Key-Value für Annotation-Attribute
}
```

### 2.3 Reference

```typescript
interface Reference {
  from: Location;                         // Wo wird referenziert?
  to: SymbolId;                           // Welches Symbol?
  kind: ReferenceKind;
  context?: string;                       // Optional: umgebender Code (1 Zeile)
}

type ReferenceKind =
  | 'call'                                // Methodenaufruf
  | 'field-access'                        // Field-Zugriff (read/write)
  | 'type-usage'                          // Typ-Verwendung (Variable, Parameter, Return-Type)
  | 'extends'                             // Class extends
  | 'implements'                          // Class/Interface implements
  | 'annotation'                          // Annotation-Verwendung
  | 'throws'                              // throws-Klausel
  | 'instantiation';                      // new MyClass()
```

### 2.4 FileSymbols

```typescript
interface FileSymbols {
  path: string;
  hash: string;                           // SHA-256 des Datei-Inhalts
  lastModified: Date;
  packageName: string;
  imports: ImportInfo[];
  topLevelSymbols: SymbolId[];            // Classes, Interfaces, Enums im File
  allSymbols: SymbolId[];                 // Inkl. Methods, Fields, etc.
}

interface ImportInfo {
  importedName: string;                   // z.B. "java.util.List"
  isStatic: boolean;
  isWildcard: boolean;                    // import java.util.*;
}
```

### 2.5 PackageInfo

```typescript
interface PackageInfo {
  name: string;                           // z.B. "com.example.core"
  files: string[];                        // Alle .java-Dateien in diesem Package
  classes: SymbolId[];
  interfaces: SymbolId[];
  enums: SymbolId[];
  annotations: SymbolId[];
}
```

---

## 3. Fulltext-Index

### 3.1 Technologie

**Option A: FlexSearch** (empfohlen für Phase 1)
- In-Memory, sehr schnell
- Unterstützt Partial Matching, Fuzzy Search
- Einschränkung: Keine Persistenz (muss bei Start neu gebaut werden)

**Option B: Lunr.js**
- Ähnlich wie FlexSearch, etwas langsamer
- Besser dokumentiert

**Option C: SQLite FTS5**
- Persistent
- Langsamer bei Queries, aber gut für große Projekte

### 3.2 Index-Schema (FlexSearch)

```typescript
import FlexSearch from 'flexsearch';

interface FulltextIndexer {
  // FlexSearch Index
  index: FlexSearch.Document<FileLineIndex>;
}

interface FileLineIndex {
  id: string;                             // Unique: `${path}:${line}`
  path: string;
  line: number;
  text: string;                           // Zeilen-Inhalt
  tokens: string[];                       // Tokenized für Suche
}
```

### 3.3 Query-Format

```typescript
interface FulltextQuery {
  pattern: string;                        // Suchbegriff oder Regex
  mode: 'text' | 'regex';
  caseSensitive?: boolean;
  limit?: number;                         // Max. Treffer
}

interface FulltextResult {
  path: string;
  line: number;
  column: number;                         // Bei Regex-Matches
  lineText: string;
  score: number;                          // Relevanz-Score
}
```

---

## 4. Analysis-Reports

### 4.1 AnalysisReport (Übergeordnet)

```typescript
interface AnalysisReport {
  // Metadaten
  id: string;                             // UUID
  source: AnalysisSource;
  projectRoot: string;
  timestamp: Date;
  durationMs: number;

  // Ergebnisse
  findings: Finding[];
  summary: ReportSummary;

  // Kontext
  configuration?: any;                    // Tool-spezifische Config (z.B. Checkstyle-Regeln)
  toolVersion?: string;
}

type AnalysisSource =
  | 'compile'
  | 'test'
  | 'spotbugs'
  | 'checkstyle'
  | 'pmd'
  | 'error-prone'
  | 'sonarqube';
```

### 4.2 Finding

```typescript
interface Finding {
  // Identifikation
  id: string;                             // Unique per Report
  ruleId?: string;                        // z.B. "NP_NULL_ON_SOME_PATH" (SpotBugs)
  category?: string;                      // z.B. "CORRECTNESS", "PERFORMANCE"

  // Schweregrad
  severity: Severity;
  priority?: number;                      // 1-5 (Tool-spezifisch)

  // Lokation
  location: FindingLocation;

  // Beschreibung
  message: string;                        // Kurze Beschreibung
  description?: string;                   // Lange Beschreibung (falls vorhanden)
  shortContext?: string;                  // 2-3 Zeilen Code um die Fundstelle

  // Fix-Hinweise
  remediation?: string;                   // Wie beheben?
  suggestedFix?: SuggestedFix;            // Automatischer Fix (falls verfügbar)

  // Zusätzliche Infos
  effort?: string;                        // z.B. "5min" (SonarQube)
  tags?: string[];                        // z.B. ["null-check", "performance"]
}

type Severity = 'error' | 'warning' | 'info';

interface FindingLocation {
  path: string;
  startLine: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
  methodName?: string;                    // Betroffene Methode (falls bekannt)
  className?: string;                     // Betroffene Klasse
}

interface SuggestedFix {
  description: string;
  replacement: string;                    // Neuer Code
  location: FindingLocation;
}
```

### 4.3 ReportSummary

```typescript
interface ReportSummary {
  totalFindings: number;
  byCategory: Record<string, number>;     // z.B. { "CORRECTNESS": 5, "STYLE": 12 }
  bySeverity: {
    error: number;
    warning: number;
    info: number;
  };
  filesAffected: number;
  topCategories: Array<{ category: string; count: number }>;
}
```

### 4.4 Tool-spezifische Formate

#### Compile Report
```typescript
interface CompileReport extends AnalysisReport {
  source: 'compile';
  exitCode: number;                       // 0 = success
  stdout: string;                         // Gradle Output (gekürzt)
  stderr: string;
}
```

#### Test Report
```typescript
interface TestReport extends AnalysisReport {
  source: 'test';
  testResults: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  failures: TestFailure[];
}

interface TestFailure {
  testClass: string;
  testMethod: string;
  message: string;
  stackTrace: string;                     // Erste 1000 Zeichen
  location?: FindingLocation;             // Wo ist der Test?
}
```

---

## 5. Cache-Strukturen

### 5.1 Cache-Key-Format

```typescript
interface CacheKey {
  type: CacheType;
  scope?: string;                         // Optional: Sub-Typ (z.B. "fulltext", "symbols")
  hash: string;                           // Content-Hash (SHA-256)
}

type CacheType = 'index' | 'report' | 'snippet' | 'vcs' | 'pipeline';
```

### 5.2 Cache-Entry

```typescript
interface CacheEntry {
  key: CacheKey;
  data: any;                              // Beliebige Daten (JSON-serialisierbar)
  metadata: CacheMetadata;
}

interface CacheMetadata {
  createdAt: Date;
  accessedAt: Date;
  expiresAt?: Date;                       // Optional: TTL
  sizeBytes: number;
  version: string;                        // Schema-Version
  dependencies?: string[];                // Hash-Abhängigkeiten (z.B. Source-Files)
}
```

### 5.3 Cache-Verzeichnis-Struktur

```
.mcp-cache/
├── metadata.json                         # Cache-Index (alle Entries)
├── index/
│   ├── fulltext-<hash>.json              # FlexSearch Dump
│   └── symbols-<hash>.db                 # SQLite-Datei
├── reports/
│   ├── compile-<hash>.json
│   ├── test-<hash>.json
│   └── spotbugs-<hash>.json
├── snippets/
│   └── <file-hash>-L<start>-<end>.txt
└── vcs/
    └── diff-<hash>.patch
```

### 5.4 metadata.json

```typescript
interface CacheMetadataFile {
  version: string;                        // Cache-Format-Version
  projectRoot: string;
  entries: CacheEntry[];
  stats: {
    totalSizeBytes: number;
    entryCount: number;
    lastCleanup: Date;
  };
}
```

---

## 6. MCP-Request/Response-Formate

### 6.1 project.meta Response

```json
{
  "root": "/Users/dev/my-project",
  "name": "my-project",
  "version": "1.0.0",
  "buildSystem": "gradle",
  "gradleVersion": "8.5",
  "gradleWrapperPresent": true,
  "javaVersion": "21",
  "modules": [
    {
      "name": "core",
      "path": "core",
      "type": "subproject",
      "sourceSets": {
        "main": {
          "name": "main",
          "srcDirs": ["core/src/main/java"],
          "resourceDirs": ["core/src/main/resources"],
          "outputDir": "core/build/classes/java/main"
        },
        "test": { ... }
      },
      "javaFileCount": 42,
      "testFileCount": 18
    }
  ],
  "moduleCount": 3,
  "discoveredAt": "2025-01-13T10:30:00Z",
  "lastModified": "2025-01-13T09:15:00Z"
}
```

### 6.2 search.find Response

```json
[
  {
    "path": "src/main/java/com/example/Service.java",
    "line": 142,
    "column": 28,
    "lineText": "    throw new NullPointerException(\"userId cannot be null\");",
    "linesBefore": [
      "public User getUser(String userId) {",
      "  if (userId == null) {"
    ],
    "linesAfter": [
      "  }",
      "  return userRepository.findById(userId);"
    ]
  }
]
```

### 6.3 symbols.lookup Response (Definition)

```json
{
  "id": "com.example.Service#getUser",
  "kind": "method",
  "name": "getUser",
  "qualifiedName": "com.example.Service#getUser",
  "location": {
    "path": "src/main/java/com/example/Service.java",
    "startLine": 140,
    "startColumn": 3,
    "endLine": 145,
    "endColumn": 4
  },
  "signature": "getUser(String): User",
  "returnType": {
    "name": "User",
    "qualifiedName": "com.example.model.User"
  },
  "parameters": [
    {
      "name": "userId",
      "type": {
        "name": "String",
        "qualifiedName": "java.lang.String"
      },
      "annotations": []
    }
  ],
  "modifiers": ["public"],
  "visibility": "public",
  "parent": "com.example.Service",
  "javadoc": "Retrieves a user by their unique identifier..."
}
```

### 6.4 analysis.getReports Response

```json
[
  {
    "id": "rep-123",
    "source": "spotbugs",
    "projectRoot": "/Users/dev/my-project",
    "timestamp": "2025-01-13T10:35:00Z",
    "durationMs": 2341,
    "findings": [
      {
        "id": "f1",
        "ruleId": "NP_NULL_ON_SOME_PATH",
        "category": "CORRECTNESS",
        "severity": "warning",
        "location": {
          "path": "src/main/java/com/example/Service.java",
          "startLine": 142,
          "className": "com.example.Service",
          "methodName": "getUser"
        },
        "message": "Possible null pointer dereference",
        "shortContext": "  if (userId == null) {\n    throw new NullPointerException(...);\n  }",
        "remediation": "Add null check before accessing 'userId'"
      }
    ],
    "summary": {
      "totalFindings": 1,
      "byCategory": { "CORRECTNESS": 1 },
      "bySeverity": { "error": 0, "warning": 1, "info": 0 },
      "filesAffected": 1
    }
  }
]
```

### 6.5 file.readRange Response

```json
{
  "path": "src/main/java/com/example/Service.java",
  "startLine": 140,
  "endLine": 145,
  "lines": [
    "public User getUser(String userId) {",
    "  if (userId == null) {",
    "    throw new NullPointerException(\"userId cannot be null\");",
    "  }",
    "  return userRepository.findById(userId);",
    "}"
  ],
  "language": "java",
  "truncated": false
}
```

### 6.6 vcs.diff Response

```
diff --git a/src/main/java/com/example/Service.java b/src/main/java/com/example/Service.java
index 1234567..abcdefg 100644
--- a/src/main/java/com/example/Service.java
+++ b/src/main/java/com/example/Service.java
@@ -140,7 +140,10 @@ public class Service {
   public User getUser(String userId) {
-    if (userId == null) {
-      throw new NullPointerException("userId cannot be null");
-    }
+    Objects.requireNonNull(userId, "userId cannot be null");
     return userRepository.findById(userId);
   }
```

---

## 7. Pipeline-State (für Resume)

```typescript
interface PipelineState {
  id: string;                             // UUID
  projectRoot: string;
  phase: PipelinePhase;
  startedAt: Date;
  lastUpdated: Date;

  // Phasen-Ergebnisse
  results: {
    projectMeta?: ProjectMetadata;
    fulltextIndex?: IndexStats;
    symbolIndex?: IndexStats;
    reports?: AnalysisReport[];
  };

  // Fehler (falls Pipeline fehlgeschlagen)
  error?: {
    phase: PipelinePhase;
    message: string;
    stack?: string;
  };
}

type PipelinePhase =
  | 'discovery'
  | 'indexing'
  | 'analysis'
  | 'ready'
  | 'failed';
```

---

## 8. Persistenz-Formate

### 8.1 Symbol-Index (SQLite-Schema)

```sql
-- Symbols-Tabelle
CREATE TABLE symbols (
  id TEXT PRIMARY KEY,                    -- SymbolId
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  qualified_name TEXT NOT NULL,
  signature TEXT,
  location_path TEXT NOT NULL,
  location_start_line INTEGER NOT NULL,
  location_start_column INTEGER,
  location_end_line INTEGER,
  location_end_column INTEGER,
  modifiers TEXT,                         -- JSON-Array
  annotations TEXT,                       -- JSON-Array
  parent_id TEXT,
  extends TEXT,                           -- JSON-Array von SymbolIds
  implements TEXT,                        -- JSON-Array
  javadoc TEXT,
  visibility TEXT,
  return_type TEXT,                       -- JSON
  parameters TEXT,                        -- JSON-Array
  FOREIGN KEY (parent_id) REFERENCES symbols(id)
);

CREATE INDEX idx_symbols_kind ON symbols(kind);
CREATE INDEX idx_symbols_qualified_name ON symbols(qualified_name);
CREATE INDEX idx_symbols_location ON symbols(location_path, location_start_line);

-- References-Tabelle
CREATE TABLE references (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_path TEXT NOT NULL,
  from_line INTEGER NOT NULL,
  from_column INTEGER,
  to_symbol_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  context TEXT,
  FOREIGN KEY (to_symbol_id) REFERENCES symbols(id)
);

CREATE INDEX idx_references_to ON references(to_symbol_id);
CREATE INDEX idx_references_from ON references(from_path, from_line);

-- Files-Tabelle
CREATE TABLE files (
  path TEXT PRIMARY KEY,
  hash TEXT NOT NULL,
  last_modified TEXT NOT NULL,
  package_name TEXT,
  imports TEXT,                           -- JSON-Array
  top_level_symbols TEXT,                 -- JSON-Array von SymbolIds
  all_symbols TEXT                        -- JSON-Array
);

CREATE INDEX idx_files_package ON files(package_name);

-- Metadata
CREATE TABLE index_metadata (
  key TEXT PRIMARY KEY,
  value TEXT
);

INSERT INTO index_metadata (key, value) VALUES
  ('version', '1.0'),
  ('build_hash', '<hash>'),
  ('created_at', '<timestamp>');
```

### 8.2 Fulltext-Index (FlexSearch Export)

FlexSearch bietet `export()` und `import()` für Persistenz:

```typescript
// Export
const exported = fulltextIndex.export();
await fs.writeFile('.mcp-cache/index/fulltext-<hash>.json', JSON.stringify(exported));

// Import
const data = await fs.readFile('.mcp-cache/index/fulltext-<hash>.json', 'utf-8');
fulltextIndex.import(JSON.parse(data));
```

---

## Zusammenfassung

Dieses Datenmodell-Dokument definiert:
- **Projekt-Metadaten**: Vollständige Struktur für Gradle-Projekte
- **Symbol-Index**: Detaillierte AST-basierte Symbole mit Referenzen
- **Fulltext-Index**: Zeilenbasierte Suche
- **Analysis-Reports**: Strukturierte Findings mit Remediation-Hinweisen
- **Cache-Strukturen**: Content-Addressable Storage
- **MCP-Formate**: JSON-Schemas für alle Tool-Responses
- **Persistenz**: SQLite-Schema für Symbol-Index

**Nächster Schritt**: Parallelisierungs-Strategie mit Code-Beispielen (siehe ARCHITECTURE.md Abschnitt 5).
