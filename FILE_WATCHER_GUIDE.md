# File Watcher Guide 🔍

**Keep your semantic search index ALWAYS up-to-date!**

Der File Watcher beobachtet deine Code- und Docs-Dateien und aktualisiert den Semantic Search Index automatisch bei Änderungen.

## 🚀 Quick Start

```bash
# 1. Initial Index bauen
codeweaver search semantic "test" --index

# 2. Watcher starten
codeweaver watch

# Output:
# 🔍 CodeWeaver Semantic Index Watcher
# =====================================
# Pattern: **/*.java, **/*.md, ...
# Debounce: 2000ms
# Project: /path/to/your/project
#
# ✅ Watching 10,500 files
#
# Press Ctrl+C to stop watching

# 3. Code ändern und speichern
# → Watcher erkennt das automatisch!

# [12:34:56] 📝 src/UserService.java
#   ⏳ Waiting for more changes... (1 pending)
# [12:34:58] ⚙️  Re-indexing 1 file(s)...
#   Generating embeddings for 5 chunks...
#   ✓ Updated 1 files (5 chunks) in code
# [12:34:59] ✅ Re-indexed 1 file(s) in 1.2s

# 4. Suchen (in anderem Terminal)
codeweaver search semantic "user service"
# → Findet sofort die geänderte Version! 🎉
```

---

## 💡 Warum File Watcher?

### ❌ Ohne File Watcher

```bash
# Code ändern
vim UserService.java

# Manuell neu indexieren (5-30 Minuten!)
codeweaver search semantic "test" --index --index-collection code

# Dann suchen
codeweaver search semantic "user service"
```

**Problem:** Manuelle Neuindexierung dauert lange und man vergisst es!

### ✅ Mit File Watcher

```bash
# Terminal 1: Watcher startet einmal
codeweaver watch

# Terminal 2: Code ändern wie gewohnt
vim UserService.java
# → Automatisch nach 2s re-indexed!

# Terminal 3: Suchen funktioniert immer
codeweaver search semantic "user service"
# → Index ist IMMER aktuell!
```

**Vorteil:** Index ist IMMER aktuell ohne manuelle Arbeit! 🎯

---

## 🔧 Optionen

### Debounce Time anpassen

```bash
# Standard: 2 Sekunden
codeweaver watch

# Schneller (1 Sekunde)
codeweaver watch --debounce 1000

# Langsamer (5 Sekunden - besser bei vielen Änderungen)
codeweaver watch --debounce 5000
```

**Empfehlung:** 2-5 Sekunden je nach Arbeitsweise

### Nur Code oder nur Docs

```bash
# Nur Code-Dateien beobachten
codeweaver watch --code-only

# Nur Dokumentation beobachten
codeweaver watch --docs-only

# Beide (Default)
codeweaver watch
```

---

## 📊 Performance

### Incremental Updates

Watcher nutzt **Incremental Updates** statt Full Reindex:

| Szenario | Full Reindex | Incremental Update |
|----------|--------------|-------------------|
| **1 File geändert** | ~3 Minuten | **~2 Sekunden** ⚡ |
| **10 Files geändert** | ~3 Minuten | **~10 Sekunden** ⚡ |
| **100 Files geändert** | ~3 Minuten | **~90 Sekunden** ⚡ |

**Speedup: Bis zu 90x schneller!**

### Was passiert bei Änderungen?

```bash
# 1. Datei ändern
vim UserService.java

# 2. Watcher erkennt Änderung
#    - Wartet 2 Sekunden (Debounce)
#    - Sammelt weitere Änderungen

# 3. Batch-Update
#    - Löscht alte Chunks für UserService.java
#    - Liest neue Datei-Version
#    - Generiert neue Embeddings (mit Batch-Processing!)
#    - Fügt neue Chunks in Index ein

# 4. Fertig! (2-3 Sekunden)
```

---

## 🎯 Workflows

### 1. Normaler Entwicklungs-Tag

```bash
# Morgens: Watcher starten
cd /path/to/project
codeweaver watch

# Dann normal arbeiten
# → Watcher läuft im Hintergrund
# → Index bleibt automatisch aktuell

# Abends: Watcher stoppen (Ctrl+C)
# → Statistiken werden angezeigt
```

### 2. Git Pull mit vielen Changes

```bash
# Watcher läuft bereits...
git pull origin main  # 50 Files geändert

# Watcher erkennt alle Änderungen:
# [12:34:56] 📝 src/UserService.java
# [12:34:56] 📝 src/OrderService.java
# [12:34:57] 📝 ...
#   ⏳ Waiting for more changes... (50 pending)
# [12:34:59] ⚙️  Re-indexing 50 file(s)...
#   ✓ Updated 50 files (250 chunks)
# [12:35:42] ✅ Re-indexed 50 file(s) in 43s

# → Batch-Update statt einzeln! Sehr effizient!
```

### 3. Feature-Branch Development

```bash
# Terminal 1: Watcher
codeweaver watch

# Terminal 2: Entwickeln
git checkout -b feature/new-auth
# ... viele Änderungen ...
git commit -m "New auth"

# Terminal 3: Claude/MCP nutzen
# → Semantic Search hat IMMER die neuesten Änderungen!
```

---

## 🔍 Beobachtete Dateitypen

### Code (auto-detected)
- `.java` - Java
- `.ts`, `.js` - TypeScript/JavaScript
- `.py` - Python
- `.go` - Go
- `.rs` - Rust
- `.kt` - Kotlin
- `.cs` - C#
- `.cpp`, `.c`, `.h` - C/C++

### Docs (auto-detected)
- `.md`, `.markdown` - Markdown
- `.txt` - Text
- `.rst` - ReStructuredText
- `.adoc` - AsciiDoc

### Ignoriert (automatisch)
- `node_modules/` - Dependencies
- `dist/`, `build/` - Build Outputs
- `.codeweaver/` - Index-Verzeichnis
- Dotfiles (`.git/`, `.env`, etc.)

---

## 📈 Statistiken

```bash
# Watcher läuft...
# Nach einiger Zeit: Ctrl+C drücken

# Output:
# 👋 File watcher stopped
#
# 📊 Statistics:
#   Files watched: 10,500
#   Changes detected: 127
#   Reindex operations: 23
```

---

## 🛠️ Troubleshooting

### "No semantic index found"

```bash
# Problem: Index existiert noch nicht
# Lösung: Initial Index bauen
codeweaver search semantic "test" --index

# Dann Watcher starten
codeweaver watch
```

### Watcher erkennt Änderungen nicht

```bash
# Check 1: Läuft Watcher?
# Sollte im Terminal "✅ Watching X files" zeigen

# Check 2: Richtige Dateitypen?
# Nur .java, .ts, .md, etc. werden beobachtet

# Check 3: Datei in ignoriertem Verzeichnis?
# node_modules/, dist/, build/ werden ignoriert
```

### Zu viele Updates / Performance-Probleme

```bash
# Debounce erhöhen
codeweaver watch --debounce 5000

# Oder nur spezifische Collections
codeweaver watch --code-only
```

### Watcher beenden

```bash
# Einfach Ctrl+C drücken
# → Graceful Shutdown mit Statistiken
```

---

## 🎓 Best Practices

### ✅ DO

1. **Watcher morgens starten, abends stoppen**
   ```bash
   # Morgens
   codeweaver watch &

   # Abends
   # Ctrl+C
   ```

2. **Debounce an Arbeitsweise anpassen**
   - Viele kleine Änderungen → höherer Debounce (5s)
   - Wenige große Änderungen → niedriger Debounce (2s)

3. **Nach Git Pull laufen lassen**
   - Batch-Updates sind sehr effizient
   - Index wird automatisch aktualisiert

### ❌ DON'T

1. **Nicht mehrere Watcher parallel starten**
   - Nur ein Watcher pro Projekt!

2. **Nicht bei jedem Speichern warten**
   - Watcher läuft asynchron im Hintergrund
   - Einfach weiterarbeiten!

3. **Nicht manuell re-indexieren wenn Watcher läuft**
   - Watcher macht das automatisch
   - Manuelles Re-Indexing kann Konflikte verursachen

---

## 💎 Pro-Tipps

### 1. Als Background Process

```bash
# Linux/Mac:
nohup codeweaver watch > watcher.log 2>&1 &

# Windows (PowerShell):
Start-Process -NoNewWindow codeweaver watch
```

### 2. Mit systemd (Linux)

```ini
# ~/.config/systemd/user/codeweaver-watch.service
[Unit]
Description=CodeWeaver File Watcher
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/your/project
ExecStart=/usr/local/bin/codeweaver watch
Restart=on-failure

[Install]
WantedBy=default.target
```

```bash
systemctl --user enable codeweaver-watch
systemctl --user start codeweaver-watch
```

### 3. In Docker Container

```dockerfile
# Dockerfile
FROM node:20
RUN npm install -g codeweaver
WORKDIR /project
CMD ["codeweaver", "watch"]
```

### 4. Mit Screen/tmux

```bash
# Screen
screen -S codeweaver-watch
codeweaver watch
# Ctrl+A, D (detach)

# tmux
tmux new -s codeweaver-watch
codeweaver watch
# Ctrl+B, D (detach)
```

---

## 🔮 Zukünftige Features

- [ ] Pattern-Filtering (nur bestimmte Dateien/Ordner)
- [ ] Webhook-Support (Notifications bei Updates)
- [ ] Web-Dashboard (Live-Status im Browser)
- [ ] Multiple Project Support (mehrere Projekte gleichzeitig)

---

**Happy Watching!** 🔍✨
