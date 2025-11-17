# Semantic Search - AI-Powered Code Discovery 🔮

**Find code by meaning, not just keywords!**

## 🎯 Was ist Semantic Search?

Statt nur nach exakten Keywords zu suchen, versteht Semantic Search die **Bedeutung** deiner Frage und findet semantisch ähnlichen Code.

**Beispiel:**
```bash
# Keyword Search findet nur "findById"
codeweaver search keyword "findById"

# Semantic Search findet:
# - findById(), getUserById(), getByIdentifier(), fetchUser(), etc.
codeweaver search semantic "find user by identifier"
```

## 🚀 Quick Start

### 1. Index bauen (einmalig)

```bash
# CLI
codeweaver search semantic "your query" --index

# Oder manuell via JavaScript
import { CodeWeaverService } from './dist/core/service.js';
const service = new CodeWeaverService('./my-project');
await service.buildSemanticIndex();
```

**Was passiert:**
- Alle Java-Dateien werden in ~20-Zeilen-Chunks aufgeteilt
- Jeder Chunk wird mit AI-Model (MiniLM-L6-v2) in 384-dimensionale Vektoren umgewandelt
- Vektoren werden in LanceDB gespeichert (.codeweaver/lancedb/)
- **Dauer:** ~1-5 Minuten für 100 Dateien (erstes Mal: +90MB Model-Download)

### 2. Suchen

```bash
# CLI - Natural Language Queries!
codeweaver search semantic "authentication logic"
codeweaver search semantic "error handling"
codeweaver search semantic "database connection pooling"
codeweaver search semantic "how to validate user input"

# Mit Limit
codeweaver search semantic "find user" --limit 5
```

**MCP Tool:**
```typescript
await mcp.call('search.semantic', {
  query: 'authentication logic',
  limit: 10
});
```

## 📊 Similarity Scores

Ergebnisse werden nach Ähnlichkeit sortiert:

- **>50%** 🟢 - Sehr relevant
- **40-50%** 🟡 - Relevant
- **<40%** ⚪ - Möglicherweise relevant

## 💡 Beispiel-Queries

### Konzepte finden
```bash
"authentication and authorization"
"error handling and logging"
"database transactions"
"caching mechanism"
"validation logic"
```

### Funktionalität finden
```bash
"find user by email"
"create new order"
"update user profile"
"delete expired sessions"
"send notification email"
```

### Patterns finden
```bash
"singleton pattern implementation"
"factory method"
"observer pattern"
"dependency injection"
"retry logic"
```

### Problem-Solving
```bash
"how to handle null pointer exceptions"
"how to close database connections"
"how to validate JSON input"
"how to implement pagination"
```

## 🔬 Wie funktioniert's?

### 1. Embedding-Modell
- **Model:** `Xenova/all-MiniLM-L6-v2`
- **Size:** ~90MB (wird beim ersten Mal heruntergeladen)
- **Embeddings:** 384 Dimensionen
- **Speed:** ~10ms pro Chunk

### 2. Vector Database
- **LanceDB** - Columnar Vector Database
- **L2 Distance** für Similarity
- **Storage:** `.codeweaver/lancedb/`
- **Index Size:** ~6KB pro Chunk

### 3. Chunking-Strategie
- **Chunk Size:** 20 Zeilen
- **Overlap:** 5 Zeilen (für Kontext)
- **Language:** Java (aktuell)

## 🎓 Best Practices

### ✅ Gute Queries
- Natürliche Sprache: "find user by identifier"
- Beschreibend: "authentication logic for REST API"
- Spezifisch: "validate email address format"
- Konzeptuell: "error handling with try-catch"

### ❌ Schlechte Queries
- Zu kurz: "user" (verwende Keyword Search)
- Zu technisch: "java.util.List<User>" (verwende Symbol Search)
- Exakte Namen: "MySpecificClass" (verwende `symbols find`)

## 🛠️ Troubleshooting

### "No semantic index found"

```bash
# Index bauen
codeweaver search semantic "query" --index
```

### Langsam beim ersten Mal

```
Loading embedding model: Xenova/all-MiniLM-L6-v2...
```
→ Normal! Model wird heruntergeladen (~90MB). Danach cached.

### Schlechte Ergebnisse

1. **Index neu bauen:** Code geändert? Index aktualisieren!
   ```bash
   codeweaver search semantic "query" --index
   ```

2. **Query umformulieren:** Mehr Kontext geben
   ```bash
   # Statt: "user"
   # Besser: "find user by unique identifier"
   ```

3. **Limit erhöhen:** Mehr Ergebnisse anzeigen
   ```bash
   codeweaver search semantic "query" --limit 20
   ```

## 🔧 Advanced Usage

### Hybrid Search (Keyword + Semantic)

```javascript
// Keyword für exakte Matches
const keywordResults = await service.searchKeyword('UserService');

// Semantic für ähnliche Konzepte
const semanticResults = await service.searchSemantic('user management');

// Merge & deduplicate
const combined = [...keywordResults, ...semanticResults];
```

### Custom Index Location

```javascript
// Index wird automatisch in .codeweaver/lancedb/ gespeichert
// Custom Location: Nicht unterstützt (by design)
```

### Index Stats

```javascript
const stats = await service.getSemanticStats();
console.log(`Chunks: ${stats.chunks}`);
console.log(`Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
```

## 📈 Performance

### Indexing (mit Batch-Processing ✅)
- **100 Files:** ~30 Sekunden (vorher: 2-3 Minuten) 🚀
- **1000 Files:** ~5 Minuten (vorher: 20-30 Minuten) 🚀
- **10.000 Files:** ~30 Minuten (vorher: 8 Stunden!) 🚀
- **First Time:** +2 Minuten (Model Download)

**Speedup: 16x schneller durch Batch-Processing!**

### Search
- **Query Time:** ~100-200ms
- **Result Processing:** ~10ms
- **Total:** ~200ms

### Storage
- **Model:** 90MB (cached in ~/.cache/)
- **Index:** ~6KB × Chunks
- **Example:** 100 files → ~500 chunks → 3MB

---

## ⚡ Weitere Optimierungen

Für noch schnellere Performance (bis zu 240x!) siehe:
**📖 [PERFORMANCE_OPTIMIZATION.md](./../architecture/PERFORMANCE_OPTIMIZATION.md)**

- **ONNX Runtime** - 3x zusätzlicher Speedup (10 Min für 10k Files)
- **GPU-Acceleration** - 10-50x mit CUDA (2-3 Min für 10k Files)
- **File Watcher** - Automatische Updates bei Code-Änderungen

## 🆚 Vergleich: Semantic vs. Keyword vs. Symbol

| Feature | Keyword | Symbol | Semantic |
|---------|---------|--------|----------|
| **Speed** | ⚡ 10ms | ⚡ 1ms | 🐢 200ms |
| **Precision** | 🎯 Hoch | 🎯 Sehr Hoch | 🎯 Mittel |
| **Recall** | 📊 Niedrig | 📊 Mittel | 📊 Sehr Hoch |
| **Setup** | ✅ Instant | ✅ Instant | ⏳ 2-5 min |
| **Storage** | 💾 0 MB | 💾 1 MB | 💾 90 MB + Index |
| **Use Case** | Exakte Wörter | Definitionen | Konzepte |

**Wann was nutzen?**
- **Symbol:** "Wo ist `UserService` definiert?"
- **Keyword:** "Wo wird `TODO` verwendet?"
- **Semantic:** "Wie funktioniert Authentication?"

## 🚀 Integration in den Entwickleralltag

### 🎯 Entscheidungsbaum: Wann welche Search-Art?

```
Frage: Was willst du finden?
│
├─ Exakte Definition einer Klasse/Methode?
│  └─> symbols find "UserService"
│     Beispiel: "Wo ist die Klasse UserService definiert?"
│
├─ Exaktes Keyword/String im Code?
│  └─> search keyword "TODO" -i
│     Beispiel: "Alle TODOs finden", "Wo steht 'deprecated'?"
│
└─ Konzept / Funktionalität / "Wie macht man X?"
   └─> search semantic "how to validate user input"
      Beispiel: "Wie funktioniert Authentication?", "Error Handling Patterns"
```

**Faustregel:**
- **Symbol Search**: Du kennst den Namen → `symbols find "UserService"`
- **Keyword Search**: Du kennst das Wort → `search keyword "processOrder"`
- **Semantic Search**: Du kennst das Konzept → `search semantic "order processing logic"`

---

### 📋 Typische Workflows

#### Workflow 1: Morgen-Routine (Neue Codebase)

```bash
# 1. Überblick verschaffen (5 Minuten)
codeweaver search semantic "main business logic"
codeweaver search semantic "entry points and controllers"
codeweaver search semantic "database models and entities"

# 2. Architektur verstehen (5 Minuten)
codeweaver search semantic "dependency injection setup"
codeweaver search semantic "configuration and properties"
codeweaver search semantic "REST API endpoints"

# 3. Spezifische Domäne erkunden (10 Minuten)
codeweaver search semantic "user authentication and authorization"
codeweaver search semantic "payment processing"
codeweaver search semantic "data validation rules"
```

**Ergebnis:** Nach 20 Minuten verstehst du die Codebase besser als nach 2 Stunden Code-Lesen!

#### Workflow 2: Feature-Implementierung

```bash
# Task: "User-Registrierung mit E-Mail-Bestätigung"

# Schritt 1: Ähnliche Features finden (2 Minuten)
codeweaver search semantic "user registration workflow"
codeweaver search semantic "account creation process"

# Schritt 2: Benötigte Komponenten identifizieren (5 Minuten)
codeweaver search semantic "email sending functionality"
codeweaver search semantic "token generation and verification"
codeweaver search semantic "database user creation"

# Schritt 3: Patterns und Best Practices (3 Minuten)
codeweaver search semantic "input validation for user data"
codeweaver search semantic "transaction management"
codeweaver search semantic "error handling in registration"

# Schritt 4: Implementieren (basierend auf gefundenen Patterns)
# → Copy-Paste Pattern, anpassen, fertig!
```

**Vorteil:** Konsistenter Code, der den Projekt-Standards entspricht!

#### Workflow 3: Bug-Hunting

```bash
# Bug-Report: "NullPointerException bei User-Abfrage"

# Schritt 1: Problem verstehen (1 Minute)
codeweaver search semantic "null pointer exception handling"
codeweaver search semantic "handling missing user data"

# Schritt 2: Ähnliche Fixes finden (2 Minuten)
codeweaver search semantic "safe user lookup methods"
codeweaver search semantic "optional return types for queries"

# Schritt 3: Best Practice identifizieren (2 Minuten)
codeweaver search semantic "defensive null checks"
codeweaver search semantic "java optional usage patterns"

# Schritt 4: Fix implementieren (basierend auf Best Practices)
```

**Ergebnis:** Bug in 10 Minuten gefixt statt 2 Stunden debuggen!

#### Workflow 4: Code Review

```bash
# Review-Task: "Neuen Feature-Branch reviewen"

# Schritt 1: Verstehe die Änderungen konzeptuell
git diff main...feature-branch | grep "class\|method"

# Schritt 2: Finde etablierte Patterns im Projekt
codeweaver search semantic "error handling patterns"
codeweaver search semantic "logging best practices"
codeweaver search semantic "test coverage approaches"

# Schritt 3: Vergleiche neue Implementation mit existierenden Patterns
# → Gibt konstruktives Feedback basierend auf Projekt-Standards!
```

---

### 🤖 Integration mit Claude (MCP)

#### Setup

**In Claude Desktop Config:**

```json
{
  "mcpServers": {
    "codeweaver": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-workbench/dist/index.js", "--mcp"],
      "cwd": "/path/to/your/java/project"
    }
  }
}
```

#### Automatische Nutzung durch Claude

```
User: "Zeig mir, wie Authentication in diesem Projekt funktioniert"

Claude: [Nutzt search.semantic tool automatisch]

        Ich habe folgende relevante Code-Stellen gefunden:

        1. AuthenticationService.java (82% Similarity)
           - Hauptlogik für User-Login und Token-Generierung
           - Zeilen 45-89

        2. JwtTokenProvider.java (76% Similarity)
           - JWT-Token Erstellung und Validierung
           - Zeilen 23-67

        3. SecurityConfig.java (71% Similarity)
           - Spring Security Konfiguration
           - Zeilen 12-45

        [Zeigt Code-Snippets und erklärt den Authentication-Flow]
```

**Vorteil:** Claude versteht deinen Code sofort und kann intelligente Vorschläge machen!

#### Typische Claude-Fragen die Semantic Search triggern

```
"Wie funktioniert X in dieser Codebase?"
"Wo wird Y implementiert?"
"Zeig mir Beispiele für Z"
"Wie sollte ich Feature X implementieren?"
"Welche Patterns nutzt das Projekt für Y?"
```

---

### 💡 Query-Strategien

#### Strategie 1: Von breit zu spezifisch

```bash
# 1. Breit starten
codeweaver search semantic "authentication"
# → 50 Ergebnisse: Auth-Services, Config, Filters, etc.

# 2. Spezifischer werden
codeweaver search semantic "JWT token authentication"
# → 15 Ergebnisse: JWT-spezifische Komponenten

# 3. Noch spezifischer
codeweaver search semantic "refresh JWT token after expiry"
# → 3 Ergebnisse: Exakt was du suchst!
```

#### Strategie 2: Problem → Lösung

```bash
# ❌ Nicht: "NullPointerException"
# ✅ Besser: "how to prevent null pointer exceptions"

# ❌ Nicht: "for loop"
# ✅ Besser: "iterate over collection safely"

# ❌ Nicht: "database"
# ✅ Besser: "database connection pooling configuration"
```

#### Strategie 3: Synonyme ausprobieren

```bash
# Verschiedene Formulierungen für dasselbe Konzept:
codeweaver search semantic "find user by identifier"
codeweaver search semantic "retrieve user by id"
codeweaver search semantic "get user by unique key"
codeweaver search semantic "lookup user by identifier"

# → Unterschiedliche Ergebnisse! Teste mehrere Varianten.
```

#### Strategie 4: Kontext hinzufügen

```bash
# ❌ Zu vage: "validation"
# ✅ Besser: "email address validation"
# ✅✅ Noch besser: "validate email address format with regex"

# ❌ Zu vage: "error"
# ✅ Besser: "error handling"
# ✅✅ Noch besser: "error handling with custom exceptions"
```

---

### 📊 Similarity Scores verstehen

```
Query: "find user by identifier"

Ergebnisse:
1. UserService.findById() → 62.3% 🟢 PERFEKT!
   → Exakt was du suchst

2. UserRepository.getUserByEmail() → 54.1% 🟢 SEHR GUT!
   → Ähnliche Funktionalität, andere Methode

3. OrderService.findOrderById() → 47.8% 🟡 RELEVANT
   → Ähnliches Pattern, andere Domäne

4. SessionManager.lookupSession() → 38.2% ⚪ MÖGLICHERWEISE
   → Entfernt verwandt, evtl. interessant

5. CacheService.get() → 31.5% ⚪ WEIT ENTFERNT
   → Wahrscheinlich nicht relevant
```

**Interpretation:**
- **>60%** 🟢 - Exakt was du suchst, hier anfangen!
- **50-60%** 🟢 - Sehr relevant, definitiv anschauen
- **40-50%** 🟡 - Related, könnte helfen
- **30-40%** ⚪ - Evtl. relevant, wenn nichts besseres
- **<30%** ⚫ - Wahrscheinlich irrelevant

---

### 🔄 Index-Management

#### Wann Index aktualisieren?

```bash
# ✅ IMMER nach:
# - Git Pull mit vielen Changes
# - Merge von Feature-Branches
# - Großes Refactoring
# - Neue Module/Packages hinzugefügt

git pull origin main
codeweaver search semantic "dummy" --index

# ⚠️ OPTIONAL nach:
# - Einzelne Datei geändert (Index enthält alte Version)
# - Wöchentliche Routine (jeden Montag)

# ❌ NICHT NÖTIG nach:
# - Nur Tests geändert
# - Nur Kommentare geändert
# - Nur Formatting
```

#### Git Hook für automatische Updates

**`.git/hooks/post-merge`:**

```bash
#!/bin/bash
# Nach Git Pull: Index automatisch aktualisieren

echo "🔄 Updating semantic search index..."
codeweaver search semantic "dummy" --index > /dev/null 2>&1 &
echo "✓ Semantic index wird im Hintergrund aktualisiert..."
```

```bash
chmod +x .git/hooks/post-merge
```

#### Index löschen und neu aufbauen

```bash
# Index komplett löschen
rm -rf .codeweaver/lancedb/

# Neu aufbauen beim nächsten Search
codeweaver search semantic "test" --index
```

#### Index-Größe optimieren

```bash
# Index-Statistiken anzeigen
codeweaver analysis project | grep -A5 "Semantic Index"

# Alte Chunks bereinigen (Feature: TODO)
# Aktuell: Index löschen und neu aufbauen
```

---

### 🎓 Learning-Kurve

#### Woche 1: Experimentieren (5-10 Suchen pro Tag)

```bash
# Probiere verschiedene Queries für dasselbe aus:
codeweaver search semantic "error handling"
codeweaver search semantic "exception management"
codeweaver search semantic "try-catch patterns"
codeweaver search semantic "handling errors gracefully"

# → Verstehe, welche Formulierungen welche Ergebnisse liefern
```

**Ziel:** Gefühl für gute vs. schlechte Queries entwickeln

#### Woche 2-4: Integration in Workflow (täglich nutzen)

```bash
# ✅ Vor jeder neuen Task: Ähnlichen Code suchen
# ✅ Bei jedem Bug: Error-Handling-Patterns suchen
# ✅ Bei Code Review: Best Practices im Projekt finden
# ✅ Bei Design-Entscheidungen: Existierende Patterns checken
```

**Ziel:** Semantic Search zur Gewohnheit machen

#### Ab Monat 2: Automatismus (ohne nachzudenken)

- Du weißt intuitiv, wann Semantic vs. Keyword vs. Symbol
- Queries werden präziser und effektiver
- Semantic Search ist integraler Teil deines Workflows
- Du erklärst es neuen Team-Mitgliedern

**Ziel:** Semantic Search ist zweite Natur

---

### 🚀 Quick-Start für MORGEN

```bash
# 1. Index bauen (einmalig, 5 Minuten)
cd /path/to/your/java/project
codeweaver search semantic "test" --index

# 2. Teste mit aktuellem Task (2 Minuten)
codeweaver search semantic "was auch immer du gerade entwickelst"

# 3. Vergleiche mit Keyword Search (1 Minute)
codeweaver search keyword "gleiches keyword"

# Siehst du den Unterschied? 🎯
```

**Challenge:** Nutze Semantic Search 5x am ersten Tag für verschiedene Aufgaben!

---

### 📝 Cheat Sheet für den Alltag

```bash
# === ORIENTIERUNG ===
# "Was macht dieses System?"
codeweaver search semantic "main business logic"

# "Wo ist die Konfiguration?"
codeweaver search semantic "application configuration"

# === FEATURE-ENTWICKLUNG ===
# "Wie macht man X im Projekt?"
codeweaver search semantic "how to implement X"

# "Ähnlicher Code für Y?"
codeweaver search semantic "Y functionality"

# === BUG-FIXING ===
# "Wie wird Fehler Z behandelt?"
codeweaver search semantic "Z error handling"

# "Defensive Checks für Y?"
codeweaver search semantic "Y validation and null checks"

# === CODE REVIEW ===
# "Best Practice für X?"
codeweaver search semantic "X best practices"

# "Logging-Pattern?"
codeweaver search semantic "logging patterns"

# === TESTING ===
# "Test-Beispiele für X?"
codeweaver search semantic "X unit tests"
```

---

### 💎 Pro-Tipps

1. **Limit anpassen**: Bei breiten Queries `--limit 20` nutzen
   ```bash
   codeweaver search semantic "validation" --limit 20
   ```

2. **Mehrere Queries parallel**: Verschiedene Formulierungen testen
   ```bash
   codeweaver search semantic "user authentication" &
   codeweaver search semantic "login logic" &
   wait
   ```

3. **Mit Keyword kombinieren**: Erst Semantic, dann Keyword für Details
   ```bash
   codeweaver search semantic "error handling"
   # → Finde ErrorHandler.java
   codeweaver search keyword "ErrorHandler" -c 5
   # → Finde alle Usages mit Kontext
   ```

4. **Ergebnisse als Einstiegspunkt**: Semantic Search findet den Startpunkt, dann Code lesen
   ```bash
   codeweaver search semantic "database transaction management"
   # → Findet TransactionManager.java:45-89
   codeweaver file range TransactionManager.java 45 89
   # → Lies die relevante Sektion
   ```

5. **Dokumentation suchen**: Semantic Search findet auch Kommentare!
   ```bash
   codeweaver search semantic "API documentation for users"
   # → Findet auch gut dokumentierte Code-Sections
   ```

---

## 🎯 Real-World Beispiele

### 1. Onboarding in neue Codebase

```bash
# Was macht das System?
codeweaver search semantic "main business logic"

# Wie funktioniert Auth?
codeweaver search semantic "authentication and session management"

# Wo sind die APIs?
codeweaver search semantic "REST API endpoints"
```

### 2. Bug Fixing

```bash
# Wie wird das behandelt?
codeweaver search semantic "error handling for database failures"

# Ähnliche Bugs?
codeweaver search semantic "null pointer exception handling"
```

### 3. Feature Implementation

```bash
# Ähnlicher Code?
codeweaver search semantic "user registration workflow"

# Best Practices?
codeweaver search semantic "input validation and sanitization"
```

## 🔮 Future Enhancements

- [ ] Support für andere Sprachen (TypeScript, Python, Go)
- [ ] Größere Models (CodeBERT, GraphCodeBERT)
- [ ] Incremental Indexing (nur geänderte Files)
- [ ] Query Expansion (automatische Synonyme)
- [ ] Hybrid Ranking (Keyword + Semantic combined)

---

**Happy Semantic Searching!** 🔮✨
