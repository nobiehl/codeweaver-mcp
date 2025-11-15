# CodeWeaver CLI - Usage Guide

**Terminal-Interface für direkte Code-Analyse**

---

## Installation

```bash
npm install -g @codeweaver/mcp-server

# Oder lokal im Projekt
cd /path/to/java/project
npx @codeweaver/mcp-server --help
```

---

## Quick Start

```bash
# In deinem Java-Projekt
cd /path/to/my-java-project

# 1. Projekt-Info anzeigen
codeweaver info

# 2. Index bauen
codeweaver index build

# 3. Code suchen
codeweaver search "NullPointerException"

# 4. Semantische Suche
codeweaver ss "authentication logic"

# 5. Analyse ausführen
codeweaver analyze --all
```

---

## Alle Befehle

### 📋 Info

```bash
# Projekt-Informationen
codeweaver info

# Output:
# Project Information:
#   Name:         my-project
#   Root:         /path/to/project
#   Build System: gradle
#   Java Version: 21
#   Gradle:       8.5
#   Modules:      3
#   Dependencies: 42
```

---

### 🔍 Index Management

```bash
# Index bauen (alle Typen)
codeweaver index build

# Nur Semantic Index (LanceDB)
codeweaver index build --semantic

# Nur Symbol Index
codeweaver index build --symbols

# Index-Status anzeigen
codeweaver index status

# Output:
# Index Status:
#   Indexed:     ✓
#   Files:       156
#   Symbols:     1,234
#   Last Update: 2025-01-13 17:30:00
```

---

### 🔎 Search

#### Keyword-Suche

```bash
# Einfache Suche
codeweaver search "MyClass"

# Mit Limit
codeweaver search "public void" --limit 10

# Mit mehr Kontext-Zeilen
codeweaver search "Exception" --context 5

# Output:
# Found 23 results:
#
# src/main/java/com/example/Service.java:42
#     throw new NullPointerException("userId cannot be null");
#
# src/main/java/com/example/Repository.java:156
#     catch (SQLException e) {
```

#### Semantische Suche

```bash
# Konzept-basierte Suche
codeweaver search-semantic "authentication and authorization"

# Kurzform
codeweaver ss "database operations"

# Mit Limit
codeweaver ss "error handling" --limit 5

# Output:
# Searching for: "authentication and authorization"
#
# ┌──────────────────────────────────────┬──────┬────────────┬────────────────────┐
# │ File                                 │ Line │ Similarity │ Code               │
# ├──────────────────────────────────────┼──────┼────────────┼────────────────────┤
# │ src/.../AuthService.java             │ 42   │ 95.2%      │ public void login( │
# │ src/.../PermissionChecker.java       │ 15   │ 89.7%      │ public boolean au… │
# │ src/.../SecurityConfig.java          │ 28   │ 84.3%      │ @Bean public Secu… │
# └──────────────────────────────────────┴──────┴────────────┴────────────────────┘
```

---

### 🧭 Symbols

#### Definition finden

```bash
# Symbol-Definition anzeigen
codeweaver symbols find com.example.UserService

# Output:
# Symbol Definition:
#   Kind:       class
#   Name:       com.example.UserService
#   Location:   src/main/java/com/example/UserService.java:15
#   Visibility: public
#   Signature:  public class UserService

# Methode finden
codeweaver symbols find com.example.UserService#save

# Output:
#   Kind:       method
#   Signature:  public void save(User user)
#   Location:   UserService.java:42
```

#### Referenzen finden

```bash
# Alle Verwendungsstellen
codeweaver symbols refs com.example.UserService

# Kurzform
codeweaver symbols references com.example.UserService#save

# Mit Limit
codeweaver symbols refs com.example.MyClass --limit 20

# Output:
# Found 15 references:
#
#   src/main/java/com/example/Controller.java:28 (call)
#   src/main/java/com/example/Service.java:45 (field-access)
#   src/test/java/com/example/ServiceTest.java:12 (instantiation)
#   ...
#
# ... and 5 more
```

---

### 📊 Analysis

```bash
# Alle Analysen ausführen
codeweaver analyze

# Spezifische Analysen
codeweaver analyze --compile
codeweaver analyze --test
codeweaver analyze --spotbugs
codeweaver analyze --checkstyle

# Kombinieren
codeweaver analyze --spotbugs --checkstyle

# Output:
# ✓ Analysis complete!
#
# ┌──────────────────────┬──────────┬──────────┬──────────┐
# │ Analyzer             │ Errors   │ Warnings │ Infos    │
# ├──────────────────────┼──────────┼──────────┼──────────┤
# │ compile              │ 0        │ 2        │ 5        │
# │ test                 │ 1        │ 0        │ 0        │
# │ spotbugs             │ 3        │ 12       │ 8        │
# │ checkstyle           │ 0        │ 45       │ 120      │
# └──────────────────────┴──────────┴──────────┴──────────┘
#
# Top Errors:
#   src/.../Service.java:142
#     Possible null pointer dereference
#   src/.../Repository.java:89
#     Resource leak: 'connection' is never closed
```

---

## Workflow-Beispiele

### Workflow 1: Neues Projekt analysieren

```bash
cd /path/to/new-project

# 1. Projekt-Info
codeweaver info

# 2. Index bauen
codeweaver index build

# 3. Erste Analyse
codeweaver analyze --all

# 4. Code suchen
codeweaver ss "main entry point"
```

### Workflow 2: Bug finden

```bash
# 1. Statische Analyse
codeweaver analyze --spotbugs

# 2. Spezifische Klasse finden
codeweaver symbols find com.example.Service

# 3. Alle Verwendungen anzeigen
codeweaver symbols refs com.example.Service#problematicMethod

# 4. Semantisch ähnlichen Code finden
codeweaver ss "similar null pointer check"
```

### Workflow 3: Refactoring vorbereiten

```bash
# 1. Finde Klasse
codeweaver symbols find com.example.OldClass

# 2. Finde alle Referenzen
codeweaver symbols refs com.example.OldClass

# 3. Finde ähnliche Implementierungen
codeweaver ss "similar implementation pattern"

# 4. Analysiere Impact
codeweaver analyze --compile
```

---

## Tipps & Tricks

### 1. Aliase einrichten

```bash
# In ~/.bashrc oder ~/.zshrc
alias cw='codeweaver'
alias cwi='codeweaver index build'
alias cws='codeweaver search'
alias cwss='codeweaver ss'
alias cwa='codeweaver analyze'

# Dann:
cw info
cwss "authentication"
```

### 2. Output in Datei speichern

```bash
codeweaver analyze --all > analysis-report.txt
codeweaver symbols refs MyClass > references.txt
```

### 3. Mit anderen Tools kombinieren

```bash
# Mit grep
codeweaver search "Exception" | grep "Service"

# Mit less (für lange Outputs)
codeweaver symbols refs MyClass | less

# Mit wc (Zeilen zählen)
codeweaver search "TODO" | wc -l
```

### 4. JSON-Output (für Scripting)

```bash
# In Zukunft:
codeweaver search "MyClass" --json | jq '.results[] | .path'
```

---

## Vergleich: CLI vs. MCP

| Feature | CLI | MCP Server |
|---------|-----|------------|
| **Nutzung** | Terminal, manuell | Claude Code, automatisch |
| **Interface** | Commands, Flags | JSON-RPC Tools |
| **Output** | Pretty-printed, Tabellen | JSON, tokenarm |
| **Use Case** | Development, Testing | LLM-Integration |
| **Interaktiv** | Ja | Nein |

**Beide nutzen die gleiche Core-Logic!**

---

## Troubleshooting

### "Command not found: codeweaver"

```bash
# Prüfe Installation
npm list -g @codeweaver/mcp-server

# Neu installieren
npm install -g @codeweaver/mcp-server

# Oder lokal via npx
npx @codeweaver/mcp-server info
```

### "No index found"

```bash
# Index bauen
codeweaver index build

# Status prüfen
codeweaver index status
```

### "Project not detected"

```bash
# Stelle sicher, dass du in einem Java/Gradle-Projekt bist
ls | grep -E "build.gradle|pom.xml"

# Projekt-Info anzeigen
codeweaver info
```

---

## Nächste Schritte

1. **Installation**: `npm install -g @codeweaver/mcp-server`
2. **Index bauen**: `codeweaver index build`
3. **Explorieren**: `codeweaver search "..."`
4. **Analysieren**: `codeweaver analyze`

**Happy Weaving!** 🕸️
