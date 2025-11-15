# CodeWeaver Usage Guide

**Version 2.0 - Konsolidiert 2025-11-14**

Vollständige Anleitung für CLI-Befehle und MCP-Tools.

---

## 📋 Inhaltsverzeichnis

1. [Installation & Setup](#installation--setup)
2. [Quick Start](#quick-start)
3. [CLI Commands](#cli-commands)
4. [MCP Tools](#mcp-tools)
5. [Workflow-Beispiele](#workflow-beispiele)
6. [Tipps & Tricks](#tipps--tricks)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Installation & Setup

### Voraussetzungen

- **Node.js** >= 20.0.0
- **TypeScript** 5.7+
- **Java** JDK 21 (für Ziel-Projekte)
- **Gradle** (optional, Wrapper bevorzugt)

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd mcp-workbench

# Dependencies installieren (KEINE native Compilation!)
npm install

# Build
npm run build

# Fertig! Dauer: ~30 Sekunden
```

### Entwicklungsmodus

```bash
# Build mit Auto-Reload
npm run build:watch

# Dev-Modus (ohne Build)
npm run dev

# Tests
npm test
```

---

## ⚡ Quick Start

### CLI-Modus (Terminal)

```bash
# In deinem Java-Projekt
cd /path/to/my-java-project

# 1. Projekt-Info anzeigen
npm run dev -- info

# 2. Symbole indexieren
npm run dev -- symbols index

# 3. Code suchen
npm run dev -- search keyword "NullPointerException"

# 4. Datei analysieren
npm run dev -- analysis project
```

### MCP-Modus (für LLMs)

```bash
# MCP Server starten (stdio transport)
npm run dev -- --mcp

# Oder mit node
node dist/index.js --mcp
```

**Auto-Detection**: Wenn stdin kein TTY ist, startet automatisch MCP-Modus!

---

## 🖥️ CLI Commands

CodeWeaver bietet **6 Command Groups** mit insgesamt **20+ Commands**.

### 📋 Group 1: Info

**Projekt-Informationen anzeigen**

```bash
codeweaver info
```

**Output:**
```
Project Information:
  Name:         my-project
  Root:         /path/to/project
  Build System: gradle
  Java Version: 21
  Gradle:       8.5
  Modules:      3
  Dependencies: 42
```

---

### 📄 Group 2: File Commands

#### Read File

```bash
# Gesamte Datei lesen
codeweaver file read <path>

# Mit Zeilen-Nummern
codeweaver file read <path> --numbers

# Mit Token-Limit
codeweaver file read <path> --limit 5000
```

**Beispiel:**
```bash
codeweaver file read src/main/java/com/example/App.java --numbers
```

**Output:**
```
  1: package com.example;
  2:
  3: public class App {
  4:     public static void main(String[] args) {
  5:         System.out.println("Hello World");
  6:     }
  7: }
```

#### Read Range

```bash
# Spezifische Zeilen lesen (1-indexed, inclusive)
codeweaver file range <path> <startLine> <endLine>
```

**Beispiel:**
```bash
codeweaver file range src/main/java/com/example/Service.java 10 30
```

#### Read Context

```bash
# Kontext um Zeile herum lesen (default: ±5 Zeilen)
codeweaver file context <path> <line> [--context N]
codeweaver file context <path> <line> [-c N]
```

**Beispiel:**
```bash
codeweaver file context src/main/java/com/example/Service.java 42
codeweaver file context src/main/java/com/example/Service.java 42 -c 10
```

---

### 🔍 Group 3: Symbols Commands

#### Index Project

```bash
# Gesamtes Projekt indexieren
codeweaver symbols index
```

**Output:**
```
Symbol Index:
  Files:        5
  Symbols:      47
  Classes:      3
  Methods:      28
  Fields:       12
  Constructors: 4

Classes:
  - com.example.editor.Main
  - com.example.editor.MarkdownHighlighter
  - com.example.editor.MarkdownEditorGUI
```

#### Find Symbols

```bash
# Symbol nach Name suchen (case-insensitive substring)
codeweaver symbols find <name>
```

**Beispiel:**
```bash
codeweaver symbols find "UserService"
codeweaver symbols find "get"  # Findet alle getXxx Methoden
```

**Output:**
```
Found 5 symbols matching "get":

  [class] com.example.UserService
    Location: UserService.java:15

  [method] getUserById(String id)
    Location: UserService.java:42

  [method] getUsers()
    Location: UserService.java:67
```

#### Get Symbol

```bash
# Symbol-Details per Qualified Name
codeweaver symbols get <qualifiedName>
```

**Beispiel:**
```bash
codeweaver symbols get "com.example.UserService"
codeweaver symbols get "com.example.UserService#findById"
```

**Output:**
```
Symbol Definition:
  Kind:       method
  Name:       findById
  Qualified:  com.example.UserService#findById
  Signature:  public User findById(String id)
  Location:   UserService.java:42
  Visibility: public
```

#### List by Kind

```bash
# Alle Symbole eines Typs auflisten
codeweaver symbols list <kind>
```

**Kinds:**
- `class` - Alle Klassen
- `method` - Alle Methoden
- `field` - Alle Felder
- `constructor` - Alle Konstruktoren

**Beispiel:**
```bash
codeweaver symbols list method
```

---

### 🔎 Group 4: Search Commands

#### Keyword Search

```bash
# Keyword im Code suchen (grep-like)
codeweaver search keyword <keyword> [options]
```

**Options:**
- `-i, --case-insensitive` - Case-insensitive Suche
- `-m, --max-results <N>` - Maximal N Ergebnisse
- `-c, --context <N>` - N Zeilen Kontext vor/nach Match
- `-e, --extensions <.ext>` - Nur bestimmte Dateitypen

**Beispiele:**
```bash
# Einfache Suche
codeweaver search keyword "TODO"

# Case-insensitive
codeweaver search keyword "exception" -i

# Mit Kontext
codeweaver search keyword "TODO" -c 3

# Limit Ergebnisse
codeweaver search keyword "public" -m 10

# Nur Java-Dateien
codeweaver search keyword "interface" -e .java
```

**Output:**
```
Found 23 results for "TODO":

src/main/java/com/example/Service.java:42
    40: public void processData() {
    41:     // TODO: Implement data validation
    42:     data.process();
    43: }

src/main/java/com/example/Repository.java:156
   154: private void cleanup() {
   155:     // TODO: Add connection pooling
   156:     connection.close();
   157: }
```

#### File Search

```bash
# Dateien nach Pattern finden (glob-like)
codeweaver search files <pattern>
```

**Pattern-Syntax:**
- `*` - Beliebige Zeichen
- `?` - Einzelnes Zeichen
- `*.java` - Alle Java-Dateien
- `*Test.java` - Alle Test-Dateien

**Beispiele:**
```bash
codeweaver search files "*.java"
codeweaver search files "*Test.java"
codeweaver search files "User*.ts"
```

---

### 📊 Group 5: Analysis Commands

#### Analyze File

```bash
# Einzelne Datei analysieren
codeweaver analysis file <path>
```

**Output:**
```
File Analysis: Service.java

Metrics:
  Total Lines:       242
  Source Lines:      198
  Comment Lines:     28
  Blank Lines:       16
  Total Complexity:  26

Complexity Breakdown:
  - processData():     8
  - validateInput():   6
  - handleError():     5
  - saveToDatabase():  4
  - cleanup():         3

Imports:
  - java.util.List
  - java.util.Map
  - java.io.IOException
```

#### Analyze Project

```bash
# Gesamtes Projekt analysieren
codeweaver analysis project [--top N]
```

**Output:**
```
Project Analysis

Statistics:
  Total Files:       15
  Total Lines:       3,542
  Source Lines:      2,891
  Total Complexity:  156
  Average Complexity: 10.4

Top 5 Most Complex Files:
  1. Service.java            (complexity: 42)
  2. Controller.java         (complexity: 38)
  3. Repository.java         (complexity: 31)
  4. ValidationUtils.java    (complexity: 25)
  5. DataProcessor.java      (complexity: 20)
```

#### Analyze Complexity

```bash
# Detailliertes Complexity-Breakdown
codeweaver analysis complexity <path>
```

**Output:**
```
Complexity Analysis: Service.java

Total Complexity: 26

Methods:
  processData()        : 8
    - 3 if statements
    - 2 loops
    - 1 try-catch
    - 2 logical operators

  validateInput()      : 6
    - 4 if statements
    - 2 logical operators
```

---

### 🔧 Group 6: VCS Commands

#### Git Status

```bash
# Repository-Status anzeigen
codeweaver vcs status
```

**Output:**
```
Git Status:

Modified:
  - src/main/java/com/example/Service.java
  - build.gradle

Untracked:
  - src/test/java/NewTest.java

Deleted:
  - old-file.txt
```

#### Git Diff

```bash
# Diff anzeigen
codeweaver vcs diff [file]
```

**Beispiele:**
```bash
# Alle Änderungen
codeweaver vcs diff

# Nur eine Datei
codeweaver vcs diff src/main/java/Service.java
```

#### Git Blame

```bash
# Blame-Info für Datei
codeweaver vcs blame <file> [--lines <start>-<end>]
codeweaver vcs blame <file> [-l <start>-<end>]
```

**Beispiel:**
```bash
codeweaver vcs blame src/main/java/Service.java
codeweaver vcs blame src/main/java/Service.java -l 10-20
```

#### Git Log

```bash
# Commit-Historie
codeweaver vcs log [options]
```

**Options:**
- `-n, --max-count <N>` - Maximal N Commits
- `--since <date>` - Nur Commits seit Datum
- `--author <name>` - Nur Commits von Author

**Beispiele:**
```bash
codeweaver vcs log
codeweaver vcs log -n 10
codeweaver vcs log --since "2025-01-01"
codeweaver vcs log --author "John Doe"
```

#### Git Branches

```bash
# Alle Branches auflisten
codeweaver vcs branches
```

#### Git Compare

```bash
# Zwei Branches vergleichen
codeweaver vcs compare <base> <compare>
```

**Beispiel:**
```bash
codeweaver vcs compare main feature-branch
```

---

## 🤖 MCP Tools

CodeWeaver bietet **18 MCP Tools** für die Integration mit LLMs.

### MCP-Server konfigurieren

**Claude Desktop Config** (`~/.config/claude/config.json`):

```json
{
  "mcpServers": {
    "codeweaver": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-workbench/dist/index.js",
        "--mcp"
      ],
      "cwd": "/path/to/your/java/project"
    }
  }
}
```

**Oder via npm:**

```json
{
  "mcpServers": {
    "codeweaver": {
      "command": "npm",
      "args": ["run", "dev", "--", "--mcp"],
      "cwd": "/absolute/path/to/mcp-workbench"
    }
  }
}
```

### Tool-Übersicht

#### 1. Project & Files (4 Tools)

**`project.meta`** - Projekt-Metadaten abrufen
```typescript
// Input: {} (keine Parameter)
// Output: ProjectMetadata
{
  "name": "my-project",
  "version": "1.0.0",
  "javaVersion": "21",
  "gradleVersion": "8.5",
  "modules": [...],
  "dependencies": [...],
  "plugins": [...]
}
```

**`file.read`** - Datei lesen mit Token-Limit
```typescript
// Input: { filePath: string, maxTokens?: number }
await mcp.call('file.read', {
  filePath: 'src/main/java/com/example/App.java',
  maxTokens: 5000
});
```

**`file.readRange`** - Spezifische Zeilen lesen
```typescript
// Input: { filePath: string, startLine: number, endLine: number }
await mcp.call('file.readRange', {
  filePath: 'src/main/java/com/example/App.java',
  startLine: 10,
  endLine: 30
});
```

**`file.readWithNumbers`** - Mit Zeilen-Nummern
```typescript
// Input: { filePath: string }
await mcp.call('file.readWithNumbers', {
  filePath: 'src/main/java/com/example/App.java'
});
// Output: "  1: package com.example;\n  2: \n  3: public class App { ... }"
```

#### 2. Symbols (4 Tools)

**`symbols.index`** - Projekt indexieren
```typescript
// Input: {} (keine Parameter)
await mcp.call('symbols.index', {});
// Output: { files: 15, symbols: 234, classes: 12, classList: [...] }
```

**`symbols.find`** - Symbole nach Name finden
```typescript
// Input: { name: string }
await mcp.call('symbols.find', {
  name: 'UserService'
});
// Output: SymbolDefinition[]
```

**`symbols.findByKind`** - Symbole nach Kind finden
```typescript
// Input: { kind: 'class' | 'method' | 'field' | 'constructor' }
await mcp.call('symbols.findByKind', {
  kind: 'method'
});
// Output: SymbolDefinition[]
```

**`symbols.get`** - Symbol per Qualified Name
```typescript
// Input: { qualifiedName: string }
await mcp.call('symbols.get', {
  qualifiedName: 'com.example.UserService#findById'
});
// Output: SymbolDefinition
```

#### 3. Search (2 Tools)

**`search.keyword`** - Keyword-Suche
```typescript
// Input: { keyword: string, caseSensitive?: boolean, maxResults?: number, contextLines?: number, fileExtensions?: string[] }
await mcp.call('search.keyword', {
  keyword: 'TODO',
  caseSensitive: false,
  maxResults: 50,
  contextLines: 2,
  fileExtensions: ['.java', '.ts']
});
// Output: SearchResult[] with file, line, column, content, beforeContext, afterContext
```

**`search.files`** - Datei-Pattern-Suche
```typescript
// Input: { pattern: string }
await mcp.call('search.files', {
  pattern: '*Test.java'
});
// Output: string[] (file paths)
```

#### 4. Analysis (2 Tools)

**`analysis.file`** - Datei analysieren
```typescript
// Input: { filePath: string }
await mcp.call('analysis.file', {
  filePath: 'src/main/java/Service.java'
});
// Output: AnalysisReport
```

**`analysis.project`** - Projekt analysieren
```typescript
// Input: { topN?: number }
await mcp.call('analysis.project', {
  topN: 10
});
// Output: ProjectAnalysis
```

#### 5. Version Control (6 Tools)

**`vcs.status`** - Git Status
```typescript
// Input: {} (keine Parameter)
await mcp.call('vcs.status', {});
```

**`vcs.diff`** - Git Diff
```typescript
// Input: { filePath?: string }
await mcp.call('vcs.diff', {
  filePath: 'src/main/java/Service.java'
});
```

**`vcs.blame`** - Git Blame
```typescript
// Input: { filePath: string, startLine?: number, endLine?: number }
await mcp.call('vcs.blame', {
  filePath: 'src/main/java/Service.java',
  startLine: 10,
  endLine: 20
});
```

**`vcs.log`** - Commit-Historie
```typescript
// Input: { maxCount?: number, since?: string, author?: string, filePath?: string }
await mcp.call('vcs.log', {
  maxCount: 10,
  since: '2025-01-01'
});
```

**`vcs.branches`** - Branch-Liste
```typescript
// Input: {} (keine Parameter)
await mcp.call('vcs.branches', {});
```

**`vcs.compare`** - Branch-Vergleich
```typescript
// Input: { base: string, compare: string }
await mcp.call('vcs.compare', {
  base: 'main',
  compare: 'feature-branch'
});
```

---

## 💼 Workflow-Beispiele

### Workflow 1: Neues Projekt analysieren

```bash
cd /path/to/new-project

# 1. Projekt-Info
codeweaver info

# 2. Index bauen
codeweaver symbols index

# 3. Erste Analyse
codeweaver analysis project

# 4. Code durchsuchen
codeweaver search keyword "main entry point"
```

### Workflow 2: Bug finden

```bash
# 1. Statische Analyse
codeweaver analysis project --top 10

# 2. Spezifische Klasse finden
codeweaver symbols find "Service"

# 3. Symbol-Details anzeigen
codeweaver symbols get "com.example.Service"

# 4. Alle Verwendungen suchen
codeweaver search keyword "Service" -e .java
```

### Workflow 3: Refactoring vorbereiten

```bash
# 1. Finde Klasse
codeweaver symbols find "OldClass"

# 2. Finde alle Verwendungen
codeweaver search keyword "OldClass" -i

# 3. Analysiere Komplexität
codeweaver analysis file src/main/java/OldClass.java

# 4. Git-Historie prüfen
codeweaver vcs log src/main/java/OldClass.java
codeweaver vcs blame src/main/java/OldClass.java
```

### Workflow 4: Code Review

```bash
# 1. Git-Status prüfen
codeweaver vcs status

# 2. Diff anzeigen
codeweaver vcs diff

# 3. Geänderte Dateien analysieren
codeweaver analysis file src/main/java/ChangedFile.java

# 4. Komplexe Methoden identifizieren
codeweaver analysis complexity src/main/java/ChangedFile.java
```

---

## 🎯 Tipps & Tricks

### 1. Shell-Aliase einrichten

**Bash/Zsh** (`~/.bashrc` oder `~/.zshrc`):
```bash
alias cw='codeweaver'
alias cwi='codeweaver symbols index'
alias cws='codeweaver search keyword'
alias cwf='codeweaver search files'
alias cwa='codeweaver analysis project'
alias cwv='codeweaver vcs status'

# Dann:
cw info
cws "TODO"
cwv
```

**PowerShell** (`$PROFILE`):
```powershell
function cw { codeweaver $args }
function cwi { codeweaver symbols index }
function cws { codeweaver search keyword $args }
function cwa { codeweaver analysis project $args }
```

### 2. Output in Datei speichern

```bash
# Analyse-Report speichern
codeweaver analysis project > analysis-report.txt

# Alle TODOs exportieren
codeweaver search keyword "TODO" > todos.txt

# Symbol-Index exportieren
codeweaver symbols list method > methods.txt
```

### 3. Mit anderen Tools kombinieren

```bash
# Mit grep filtern
codeweaver search keyword "Exception" | grep "Service"

# Mit less pagieren (lange Outputs)
codeweaver symbols list method | less

# Mit wc zählen
codeweaver search keyword "TODO" | wc -l

# Mit jq (JSON processing) - zukünftig
codeweaver search keyword "MyClass" --json | jq '.results[] | .path'
```

### 4. Performance-Tuning

```bash
# Nur bestimmte File-Extensions indexieren
codeweaver symbols index # Indexiert nur .java automatisch

# Search mit File-Filter beschleunigen
codeweaver search keyword "pattern" -e .java -e .kt

# Limit für schnelle Übersicht
codeweaver search keyword "TODO" -m 10
```

### 5. Multi-Projekt Workflow

```bash
# Projekt A
cd /path/to/project-a
codeweaver symbols index

# Projekt B
cd /path/to/project-b
codeweaver symbols index

# Cache wird pro Projekt in .mcp-cache/ gespeichert
```

---

## 🔧 Troubleshooting

### "Command not found: codeweaver"

```bash
# Prüfe Installation
npm list @codeweaver/mcp-server

# Nutze npm run dev statt globalem codeweaver
npm run dev -- info

# Oder nutze node direkt
node dist/index.js info
```

### Tests schlagen fehl

```bash
# Clean und Reinstall
npm run clean
rm -rf node_modules package-lock.json
npm install
npm test -- --run
```

### Build-Fehler

```bash
# TypeScript-Version prüfen
npx tsc --version  # Sollte 5.7+ sein

# Rebuild
npm run clean
npm run build
```

### MCP Server reagiert nicht

```bash
# MCP-Modus explizit starten
npm run dev -- --mcp

# Stdio-Transport verifizieren
echo '{}' | npm run dev -- --mcp

# Logs prüfen (falls vorhanden)
cat .codeweaver/progress.jsonl
```

### CLI funktioniert nicht

```bash
# TTY-Modus sicherstellen (nicht piped)
npm run dev -- info

# Built Binary prüfen
node dist/index.js info

# Working Directory prüfen
pwd  # Sollte in Java-Projekt sein
ls | grep -E "build.gradle|pom.xml"
```

### "No index found"

```bash
# Index bauen
codeweaver symbols index

# Cache-Verzeichnis prüfen
ls -la .mcp-cache/

# Cache löschen und neu bauen
rm -rf .mcp-cache/
codeweaver symbols index
```

### "Project not detected"

```bash
# Stelle sicher, dass du in einem Java/Gradle-Projekt bist
ls | grep -E "build.gradle|pom.xml"

# Projekt-Info anzeigen
codeweaver info

# Falls kein Java-Projekt: Lege build.gradle an
echo 'plugins { id "java" }' > build.gradle
```

### Symbol-Extraktion funktioniert nicht

```bash
# Prüfe Java-Dateien
find . -name "*.java" | head

# Manuell indexieren
codeweaver symbols index

# Einzelne Datei analysieren
codeweaver analysis file src/main/java/MyClass.java
```

### Performance-Probleme

```bash
# Cache prüfen
du -sh .mcp-cache/

# Alte Caches löschen
rm -rf .mcp-cache/

# Nur relevante Files indexieren
codeweaver search files "*.java" | wc -l
```

---

## 🎓 Best Practices

### 1. Indexierung

- **Index bauen** nach größeren Code-Änderungen
- **Cache löschen** bei strukturellen Änderungen (Package-Rename, etc.)
- **Selective Indexing** für große Projekte (nur relevante Module)

### 2. Search

- **File-Extensions nutzen** (`-e .java`) für schnellere Suche
- **Case-Insensitive** (`-i`) für API-Suche
- **Context-Lines** (`-c 3`) für besseres Verständnis
- **Max-Results** (`-m 10`) für schnelle Übersicht

### 3. Analysis

- **File-Level** für detaillierte Insights
- **Project-Level** für Übersicht und Hotspots
- **Top N** (`--top 10`) für Prioritäten

### 4. Version Control

- **Status** vor jedem Commit
- **Diff** für Code-Review
- **Blame** für Historie-Recherche
- **Log** für Release-Notes

---

## 📚 Weiterführende Dokumentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System-Architektur
- **[STATUS_AND_ROADMAP.md](./STATUS_AND_ROADMAP.md)** - Feature-Status und Roadmap
- **[DATA_MODELS.md](./DATA_MODELS.md)** - Datenstrukturen
- **[TESTING.md](./TESTING.md)** - Test-Strategie
- **[TOKEN_MANAGEMENT.md](./TOKEN_MANAGEMENT.md)** - Token-Effizienz

---

## 🤝 Vergleich: CLI vs. MCP

| Feature | CLI | MCP Server |
|---------|-----|------------|
| **Nutzung** | Terminal, manuell | Claude Code, automatisch |
| **Interface** | Commands, Flags | JSON-RPC Tools |
| **Output** | Pretty-printed, Tabellen | JSON, tokenarm |
| **Use Case** | Development, Testing | LLM-Integration |
| **Interaktiv** | Ja | Nein |
| **Transport** | TTY (stdout/stderr) | stdio (JSON-RPC) |

**Wichtig**: Beide Modi nutzen **exakt dieselbe Business Logic** (`CodeWeaverService`)!

---

**Happy Weaving!** 🕸️
