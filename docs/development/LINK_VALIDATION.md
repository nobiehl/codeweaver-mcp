# Link-Validierung in der Dokumentation

**Werkzeug zur automatischen Überprüfung aller Markdown-Links**

---

## 📖 Übersicht

CodeWeaver enthält ein TypeScript-basiertes Tool zur Validierung aller Links in der Markdown-Dokumentation. Es prüft:

- ✅ **Interne Links** zu anderen Markdown-Dateien
- ✅ **Anchor-Links** zu Abschnitten innerhalb von Dateien
- ✅ **Externe URLs** (optional)

Das Tool erkennt automatisch broken links und hilft dabei, die Dokumentation konsistent zu halten.

---

## 🚀 Quick Start

```bash
# Schnelle Validierung (nur interne Links)
npm run validate-links

# Mit externen Links (langsamer)
npm run validate-links:external

# Detaillierter Output
npm run validate-links:verbose
```

**Empfehlung**: Führe `npm run validate-links` vor jedem Commit aus, um broken links zu vermeiden.

---

## 📊 Output-Beispiel

### Console-Report

```
════════════════════════════════════════════════════════════════════════════════
  📋 Markdown Link Validation Report
════════════════════════════════════════════════════════════════════════════════

Summary:
  Files scanned:     39
  Total links:       255
    Internal:        165
    Anchors:         65
    External:        25

  Valid links:      225 (88.2%)
  Broken links:     30

Broken Links:
────────────────────────────────────────────────────────────────────────────────

📄 docs/GLOSSARY.md
  Line 34: [Decorator](#decorator)
    ✗ Anchor #decorator not found in current file

📄 docs/development/CONTRIBUTING.md
  Line 341: [LICENSE](LICENSE)
    ✗ File not found: docs/development/LICENSE

────────────────────────────────────────────────────────────────────────────────
Duration: 2.34s

Report saved to: .analysis/link_validation_report.json
```

### JSON-Report

Das Tool generiert automatisch einen detaillierten Report:

**Location**: `.analysis/link_validation_report.json`

```json
{
  "totalFiles": 39,
  "totalLinks": 255,
  "internalLinks": 165,
  "externalLinks": 25,
  "anchorLinks": 65,
  "validLinks": 225,
  "brokenLinks": [
    {
      "sourceFile": "/path/to/docs/GLOSSARY.md",
      "linkText": "Decorator",
      "linkTarget": "#decorator",
      "lineNumber": 34,
      "type": "anchor",
      "valid": false,
      "error": "Anchor #decorator not found in current file"
    }
  ],
  "duration": 2345
}
```

---

## 🔍 Validierte Link-Typen

### 1. Interne Links

Relative oder absolute Pfade zu anderen Markdown-Dateien.

**Beispiele**:
```markdown
[Guide](./GUIDE.md)                    # Relativ zum aktuellen File
[Architecture](../architecture/ARCHITECTURE.md)  # Verzeichnis höher
[README](/README.md)                   # Absolut von Project Root
```

**Validierung**:
- Prüft ob die Ziel-Datei existiert
- Unterstützt relative Pfade (`./`, `../`)
- Unterstützt absolute Pfade (`/`)

### 2. Anchor-Links

Links zu Abschnitten (Headern) in Markdown-Dateien.

**Beispiele**:
```markdown
[Installation](#installation)          # Anchor im aktuellen File
[API Reference](./API.md#endpoints)    # Anchor in anderem File
```

**Validierung**:
- Extrahiert automatisch Anchors aus Markdown-Headern
- Prüft explizite `<a id="anchor">` Tags
- Folgt GitHub's Anchor-Generierungs-Regeln

**Anchor-Generierung** (GitHub-kompatibel):
```markdown
## Installation Guide     → #installation-guide
## API: Endpoints         → #api-endpoints
## FAQ & Tips             → #faq--tips
```

### 3. Externe Links

HTTP/HTTPS URLs zu externen Ressourcen.

**Beispiele**:
```markdown
[GitHub](https://github.com/user/repo)
[Spec](https://spec.example.com)
```

**Validierung** (nur mit `--external` Flag):
- HTTP HEAD Request mit 5s Timeout
- Folgt Redirects automatisch
- Prüft HTTP-Statuscode (200-299 = OK)
- Rate-Limiting: 100ms Pause zwischen Requests

⚠️ **Hinweis**: Externe Validierung ist langsam und sollte nur vor Releases durchgeführt werden.

---

## 🎯 Verwendung

### Regelmäßige Validierung (Development)

```bash
# Vor jedem Commit - schnell (~2s)
npm run validate-links
```

**Validiert**: Interne Links + Anchors
**Dauer**: ~2 Sekunden für 39 Files

### Pre-Release Validierung

```bash
# Vor jedem Release - vollständig (~30s)
npm run validate-links:external
```

**Validiert**: Interne Links + Anchors + Externe URLs
**Dauer**: ~30 Sekunden für 255 Links

### Debugging broken links

```bash
# Detaillierter Output mit resolved paths
npm run validate-links:verbose
```

**Zeigt**:
- Source-File
- Link-Target
- Resolved path (wohin der Link aufgelöst wird)
- Fehlerursache

---

## 🐛 Häufige Probleme & Lösungen

### Problem 1: Anchor nicht gefunden

**Fehlermeldung**:
```
✗ Anchor #übersicht not found in current file
```

**Ursachen**:
1. Tippfehler im Anchor-Namen
2. Header wurde umbenannt
3. Sonderzeichen werden anders encoded

**Lösungen**:

```markdown
# Option 1: Expliziten Anchor hinzufügen
<a id="übersicht"></a>
## Übersicht

# Option 2: ASCII-only Header verwenden
## Uebersicht  # → #uebersicht
```

### Problem 2: Relativer Pfad nach Umstrukturierung

**Fehlermeldung**:
```
✗ File not found: docs/guides/API.md
```

**Ursache**: Datei wurde verschoben, aber Links nicht aktualisiert.

**Lösung**:

```markdown
# Vorher (File war in docs/):
[API](./API.md)

# Nachher (File ist jetzt in docs/guides/):
[API](../reference/API.md)
```

**Tipp**: Nutze `--verbose` um den resolved path zu sehen.

### Problem 3: Case-Sensitivity (Linux/Mac)

**Fehlermeldung**:
```
✗ File not found: docs/readme.md
```

**Ursache**: Auf Windows ist `readme.md` = `README.md`, auf Linux nicht.

**Lösung**:

```markdown
# ❌ Falsch (funktioniert nur auf Windows)
[Readme](./readme.md)

# ✅ Richtig (funktioniert überall)
[Readme](./README.md)
```

### Problem 4: Externe Links langsam

**Problem**: Validierung mit `--external` dauert sehr lange.

**Lösungen**:

```bash
# Option 1: Nur interne Links (standard)
npm run validate-links

# Option 2: Externe nur in CI/CD oder vor Releases
npm run validate-links:external

# Option 3: Im Code temporär externe Links ausnehmen
# (URLs werden dann als valid angenommen ohne Check)
```

---

## 📋 Best Practices

### 1. Vor jedem Commit validieren

```bash
# In deinem Workflow integrieren
git add .
npm run validate-links  # Stoppt wenn broken links gefunden werden
git commit -m "docs: update guide"
```

### 2. Relative Pfade bevorzugen

```markdown
# ✅ EMPFOHLEN: Relative Pfade
[Guide](../guides/GUIDE.md)

# ⚠️ OK, aber weniger flexibel
[Guide](/docs/guides/GUIDE.md)
```

**Vorteil**: Funktioniert auch wenn das Repo in ein anderes Verzeichnis verschoben wird.

### 3. Anchors konsistent benennen

```markdown
# ✅ EMPFOHLEN: Lowercase, kebab-case
## installation-guide     # → #installation-guide

# ⚠️ Vermeiden: Sonderzeichen, Leerzeichen
## Installation & Setup   # → #installation--setup (doppelter Bindestrich!)
```

### 4. README-Links regelmäßig checken

```bash
# README.md ist oft das erste Dokument das User sehen
npm run validate-links -- README.md  # Nur README checken
```

### 5. Test-Fixtures ausschließen

Test-Fixtures können absichtlich broken links enthalten:

```markdown
# tests/fixtures/markdown/README.md
[Broken Link](./non-existent.md)  # Absichtlich für Tests!
```

Das Tool erkennt automatisch `tests/fixtures/` und reportet diese separat.

---

## 🔄 Workflow-Empfehlungen

### Workflow 1: Neue Dokumentation schreiben

```bash
# 1. Dokumentation schreiben
vim docs/guides/NEW_GUIDE.md

# 2. Links validieren
npm run validate-links

# 3. Broken links fixen
# (basierend auf Report)

# 4. Erneut validieren
npm run validate-links

# 5. Committen
git add docs/guides/NEW_GUIDE.md
git commit -m "docs: add new guide"
```

### Workflow 2: Dokumentation umstrukturieren

```bash
# 1. Files verschieben
mv docs/API.md docs/reference/API.md

# 2. Validieren (findet broken links)
npm run validate-links:verbose

# 3. Broken links analysieren und fixen
# Der verbose output zeigt resolved paths

# 4. Erneut validieren
npm run validate-links

# 5. Committen
git add docs/
git commit -m "docs: restructure documentation"
```

### Workflow 3: Release vorbereiten

```bash
# 1. Vollständige Validierung (inkl. externe Links)
npm run validate-links:external

# 2. Broken links fixen

# 3. Report prüfen
cat .analysis/link_validation_report.json

# 4. Release erstellen
git tag v1.0.0
git push --tags
```

---

## 🎨 CI/CD Integration

### GitHub Actions Workflow

Erstelle `.github/workflows/docs-validation.yml`:

```yaml
name: Documentation Validation

on:
  push:
    branches: [main, master]
    paths:
      - 'docs/**'
      - '*.md'
  pull_request:
    paths:
      - 'docs/**'
      - '*.md'

jobs:
  validate-links:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Validate documentation links
        run: npm run validate-links

      - name: Upload validation report
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: link-validation-report
          path: .analysis/link_validation_report.json
```

**Verhalten**:
- ✅ Läuft bei jedem Push/PR der `docs/` oder `*.md` ändert
- ✅ Validiert nur interne Links (schnell)
- ✅ Schlägt fehl wenn broken links gefunden werden
- ✅ Uploaded JSON-Report bei Failure

### Pre-Commit Hook

Erstelle `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Validate links before commit
npm run validate-links
```

**Installation**:
```bash
npm install --save-dev husky
npx husky install
npx husky add .husky/pre-commit "npm run validate-links"
```

---

## 📊 Performance

| Projekt-Größe | Dateien | Links | Nur Intern | Inkl. Extern |
|---------------|---------|-------|------------|--------------|
| Klein | 10 | 50 | ~1s | ~5s |
| Mittel | 40 | 250 | ~2s | ~30s |
| Groß | 100 | 1000 | ~5s | ~2min |

**CodeWeaver (aktuell)**: 39 Dateien, 255 Links → ~2s (intern), ~30s (extern)

---

## 🔧 Konfiguration

### Ausgeschlossene Verzeichnisse

Das Tool ignoriert automatisch:

**Global**:
- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `.codeweaver/`

**In docs/**:
- `docs/archive/` - Alte/veraltete Dokumente

### Anpassung

Um weitere Verzeichnisse auszuschließen, bearbeite `scripts/validate-links.ts`:

```typescript
const EXCLUDE_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.codeweaver',
  'temp',  // NEU
];

const EXCLUDE_DOCS_DIRS = [
  'archive',
  'drafts',  // NEU
];
```

---

## 📚 Weiterführende Informationen

### Technische Details

- **Location**: `scripts/validate-links.ts`
- **Technologie**: TypeScript + Node.js (tsx)
- **Dependencies**: Nur Node.js Built-ins (fs, path)
- **Exit Codes**: 0 = OK, 1 = Broken links found

### Verwandte Dokumentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution Guidelines
- [TESTING.md](./TESTING.md) - Test-Strategie
- [scripts/README_LINK_VALIDATOR.md](../../scripts/README_LINK_VALIDATOR.md) - Technische Dokumentation

### Support & Issues

Bei Problemen oder Feature-Requests:
1. Check [scripts/README_LINK_VALIDATOR.md](../../scripts/README_LINK_VALIDATOR.md) für Details
2. Erstelle ein Issue auf GitHub
3. Erwähne Tool-Version und Error-Output

---

## 🎯 Zusammenfassung

**Wann nutzen?**:
- ✅ Vor jedem Commit (`npm run validate-links`)
- ✅ Nach Dokumentations-Umstrukturierung
- ✅ Vor Releases (`npm run validate-links:external`)
- ✅ In CI/CD Pipeline

**Was wird geprüft?**:
- ✅ Interne Markdown-Links
- ✅ Anchor-Links zu Abschnitten
- ✅ Externe URLs (optional)

**Output**:
- 📊 Farbiger Console-Report
- 📄 JSON-Report (`.analysis/link_validation_report.json`)
- 🚨 Exit-Code 1 bei broken links (CI/CD-ready)

**Performance**:
- ⚡ Schnell: ~2s für 39 Dateien (nur intern)
- 🐢 Langsam: ~30s für 255 Links (inkl. extern)

---

**Version**: 1.0.0
**Erstellt**: 2025-11-18
**Status**: ✅ Production-Ready
