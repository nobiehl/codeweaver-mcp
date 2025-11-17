# Multi-Collection Semantic Search 🎯

**Index and search Code AND Documentation separately!**

## 🎉 Was ist neu?

CodeWeaver unterstützt jetzt **mehrere Collections**:
- **`code`** - Source Code (Java, TypeScript, Python, Go, Rust, etc.)
- **`docs`** - Dokumentation (Markdown, Text, etc.)
- **`all`** - Beide Collections durchsuchen

## 🚀 Quick Start

### 1. Alles indexieren (Code + Docs)

```bash
# Code UND Docs indexieren
codeweaver search semantic "test" --index

# Output:
# === Indexing code collection (150 Java files) ===
# ✓ Created 800 chunks from 150 files
# ✅ code collection indexed
#
# === Indexing docs collection (25 Markdown files) ===
# ✓ Created 120 chunks from 25 files
# ✅ docs collection indexed
#
# ✅ Semantic indexing complete!
#    Total files: 175
#    Total chunks: 920
#    - Code: 150 files
#    - Docs: 25 files
```

### 2. Nur Code indexieren

```bash
codeweaver search semantic "test" --index --index-collection code
```

### 3. Nur Docs indexieren

```bash
codeweaver search semantic "test" --index --index-collection docs
```

---

## 🔍 Searching

### Alle Collections durchsuchen (Default)

```bash
codeweaver search semantic "authentication logic"

# Output:
# 1. [CODE] UserService.java:45-65
#    Similarity: 78.3%
#    Preview: public class UserService { ... }
#
# 2. [DOCS] AUTHENTICATION.md:12-27
#    Similarity: 65.1%
#    Preview: # Authentication Flow ...
```

### Nur Code durchsuchen

```bash
codeweaver search semantic "authentication logic" --collection code

# Findet nur Java/TypeScript/etc. Code
```

### Nur Docs durchsuchen

```bash
codeweaver search semantic "how to setup authentication" --collection docs

# Findet nur Markdown/Text Dokumentation
```

---

## 💡 Use Cases

### 1. Code-Implementation finden

```bash
# Nur Code durchsuchen
codeweaver search semantic "user validation logic" --collection code

# Findet: UserValidator.java, ValidationService.ts, etc.
```

### 2. Dokumentation finden

```bash
# Nur Docs durchsuchen
codeweaver search semantic "how to setup database" --collection docs

# Findet: DATABASE_SETUP.md, README.md, etc.
```

### 3. Beides durchsuchen

```bash
# Code + Docs (Default)
codeweaver search semantic "authentication flow"

# Findet:
# - Code: AuthService.java
# - Docs: AUTH.md
```

---

## 🎨 Collection Badges

Results zeigen jetzt Collection-Typ:
- **[CODE]** - Source Code (blau in CLI)
- **[DOCS]** - Dokumentation (magenta in CLI)

```
1. [CODE] UserService.java:45-65
   Similarity: 78.3%

2. [DOCS] README.md:12-27
   Similarity: 65.1%
```

---

## 📊 Unterschiedliche Chunking-Strategien

Collections nutzen optimierte Chunking-Strategien:

### Code Collection
- **Chunk Size:** 20 Zeilen
- **Overlap:** 5 Zeilen
- **Optimiert für:** Methoden, Klassen, logische Code-Blöcke

### Docs Collection
- **Chunk Size:** 15 Zeilen
- **Overlap:** 3 Zeilen
- **Optimiert für:** Paragraphen, Sections, README-Abschnitte

---

## 🤖 MCP Integration

```typescript
// Alles indexieren
await mcp.call('search.semantic.index', {
  collection: 'all' // oder 'code' oder 'docs'
});

// Code durchsuchen
await mcp.call('search.semantic', {
  query: 'authentication logic',
  collection: 'code',
  limit: 10
});

// Docs durchsuchen
await mcp.call('search.semantic', {
  query: 'how to setup auth',
  collection: 'docs',
  limit: 10
});

// Beide durchsuchen
await mcp.call('search.semantic', {
  query: 'authentication',
  collection: 'all', // Default
  limit: 10
});
```

---

## 📂 Unterstützte Dateitypen

### Code Collection
- `.java` - Java
- `.ts`, `.js` - TypeScript/JavaScript
- `.py` - Python
- `.go` - Go
- `.rs` - Rust
- `.kt` - Kotlin
- `.cs` - C#
- `.cpp`, `.c`, `.h` - C/C++

### Docs Collection
- `.md`, `.markdown` - Markdown
- `.txt` - Text
- `.rst` - ReStructuredText
- `.adoc` - AsciiDoc

---

## 🔧 Advanced

### Index Stats

```bash
# Zeigt Stats für beide Collections
codeweaver analysis project --semantic-stats

# Output:
# Semantic Index Stats:
#   Code: 800 chunks (3.2 MB)
#   Docs: 120 chunks (0.5 MB)
#   Total: 920 chunks (3.7 MB)
#   Model: Xenova/all-MiniLM-L6-v2
```

### Index löschen

```bash
# Alle Collections löschen
codeweaver search semantic clear --all

# Nur Code löschen
codeweaver search semantic clear --collection code

# Nur Docs löschen
codeweaver search semantic clear --collection docs
```

---

## 🎯 Best Practices

### ✅ DO

```bash
# Code-spezifische Fragen → --collection code
codeweaver search semantic "validation logic" --collection code

# Doc-spezifische Fragen → --collection docs
codeweaver search semantic "how to install" --collection docs

# Allgemeine Fragen → --collection all
codeweaver search semantic "authentication" --collection all
```

### ❌ DON'T

```bash
# Nicht: Docs durchsuchen nach Code-Details
codeweaver search semantic "validateEmail method" --collection docs
# → Findet nichts, weil Docs keine Methoden-Implementierungen haben

# Besser:
codeweaver search semantic "validateEmail method" --collection code
```

---

## 🚀 Workflow-Beispiele

### Onboarding in neue Codebase

```bash
# 1. Alles indexieren
codeweaver search semantic "test" --index

# 2. Erst Docs lesen
codeweaver search semantic "project overview" --collection docs
codeweaver search semantic "getting started" --collection docs

# 3. Dann Code erkunden
codeweaver search semantic "main business logic" --collection code
```

### Feature-Entwicklung

```bash
# 1. Docs checken
codeweaver search semantic "authentication setup" --collection docs

# 2. Existierenden Code finden
codeweaver search semantic "authentication logic" --collection code

# 3. Implementieren basierend auf gefundenen Patterns
```

### Bug-Fixing

```bash
# 1. Docs für Best Practices
codeweaver search semantic "error handling best practices" --collection docs

# 2. Code mit ähnlichem Pattern finden
codeweaver search semantic "error handling" --collection code

# 3. Fix implementieren
```

---

## 📈 Performance

### Indexierung

| Collection | Files | Chunks | Time (Batch) |
|------------|-------|--------|--------------|
| Code (150 Java) | 150 | ~800 | ~2 Minuten |
| Docs (25 MD) | 25 | ~120 | ~20 Sekunden |
| **Total (All)** | **175** | **920** | **~2.5 Minuten** |

*Mit Batch-Processing (16x Speedup)*

### Search

- **Query Time:** ~200ms (unabhängig von Collection)
- **Multi-Collection:** ~250ms (beide Collections durchsuchen)

---

## 🎓 FAQ

**Q: Muss ich beide Collections indexieren?**
A: Nein! Du kannst auch nur Code oder nur Docs indexieren:
```bash
codeweaver search semantic "test" --index --index-collection code
```

**Q: Kann ich weitere Collections hinzufügen?**
A: Aktuell: `code` und `docs`. Weitere Collections (z.B. `tests`, `config`) sind für die Zukunft geplant.

**Q: Welche Sprachen werden erkannt?**
A: Alle gängigen Sprachen werden automatisch erkannt: Java, TypeScript, Python, Go, Rust, Kotlin, C#, C++, Markdown, etc.

**Q: Werden Tests auch indexiert?**
A: Ja, Tests sind Teil der `code` Collection. Wenn du nur Production-Code willst, kannst du in Zukunft Pattern-Filtering nutzen.

---

**Viel Erfolg mit Multi-Collection Semantic Search!** 🎯🚀
