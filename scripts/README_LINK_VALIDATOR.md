# Markdown Link Validator

Umfassendes Tool zur Validierung aller Links in der Markdown-Dokumentation.

---

## 🎯 Features

- ✅ **Interne Links** - Validiert relative Pfade (`./file.md`, `../dir/file.md`)
- ✅ **Anchor Links** - Prüft Anchor-Existenz (`#section`, `file.md#section`)
- ✅ **Externe Links** - Optional: HTTP-Statuscode-Prüfung (https://example.com)
- ✅ **Header-Anchor-Detection** - Extrahiert Anchors aus Markdown-Headern
- ✅ **Colored Output** - Übersichtlicher Report mit Farben
- ✅ **JSON Report** - Speichert Ergebnisse in `.analysis/link_validation_report.json`
- ✅ **CI/CD Ready** - Exit-Code 1 bei broken links

---

## 🚀 Usage

### Schnellstart

```bash
# Nur interne Links validieren (schnell)
npm run validate-links

# Interne + externe Links (langsam, empfohlen vor Release)
npm run validate-links:external

# Verbose Output (zeigt resolved paths)
npm run validate-links:verbose

# Alle Optionen kombinieren
npm run validate-links -- --external --verbose
```

### CLI Optionen

| Option | Beschreibung |
|--------|-------------|
| `--external` | Validiert auch externe Links (HTTP-Checks) |
| `--verbose`, `-v` | Zeigt zusätzliche Details (resolved paths) |

---

## 📊 Output

### Console Report

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
```

### JSON Report

Das Tool speichert einen detaillierten Report in `.analysis/link_validation_report.json`:

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

## 🔍 Link-Typen

### 1. Interne Links (Internal)

Relative oder absolute Pfade zu anderen Markdown-Dateien:

```markdown
[Link](./file.md)              # Relativ zum aktuellen File
[Link](../other/file.md)       # Relativ, ein Verzeichnis höher
[Link](/docs/file.md)          # Absolut von Project Root
```

**Validierung**:
- ✅ Prüft ob die Datei existiert
- ✅ Unterstützt relative Pfade
- ✅ Unterstützt absolute Pfade (von Project Root)

### 2. Anchor Links (Anchor)

Links zu Abschnitten innerhalb von Dateien:

```markdown
[Link](#section-name)          # Anchor im aktuellen File
[Link](file.md#section)        # Anchor in anderem File
```

**Validierung**:
- ✅ Extrahiert Anchors aus Markdown-Headern (`## My Section` → `#my-section`)
- ✅ Unterstützt explizite `<a id="anchor">` Tags
- ✅ Prüft ob der Anchor existiert

**Anchor-Generierung** (wie GitHub):
```markdown
## My Header          → #my-header
## My Special: Header → #my-special-header
## Test 123           → #test-123
```

### 3. Externe Links (External)

HTTP/HTTPS URLs:

```markdown
[Link](https://example.com)
[Link](https://github.com/user/repo)
```

**Validierung** (nur mit `--external`):
- ✅ HTTP HEAD Request
- ✅ Folgt Redirects
- ✅ Prüft HTTP-Statuscode (200-299 = OK)
- ✅ 5s Timeout
- ✅ Rate-Limiting (100ms pause zwischen Requests)

**⚠️ Hinweis**: Externe Link-Validierung ist langsam (kann mehrere Minuten dauern bei vielen Links).

---

## 🎨 Exit Codes

| Code | Bedeutung |
|------|-----------|
| 0 | ✅ Alle Links sind valid |
| 1 | ❌ Mindestens ein broken link gefunden |

**CI/CD Integration**:
```yaml
# .github/workflows/docs.yml
- name: Validate documentation links
  run: npm run validate-links
```

---

## 🔧 Konfiguration

### Ausgeschlossene Verzeichnisse

Das Tool ignoriert automatisch:

**Global (überall)**:
- `node_modules/`
- `.git/`
- `dist/`
- `build/`
- `.codeweaver/`

**In docs/ nur**:
- `docs/archive/` - Alte/veraltete Dokumente

### Anpassung

Bearbeite `scripts/validate-links.ts`:

```typescript
const EXCLUDE_DIRS = ['node_modules', '.git', 'dist', 'build', '.codeweaver'];
const EXCLUDE_DOCS_DIRS = ['archive']; // Nur in docs/
```

---

## 🐛 Troubleshooting

### Problem: Anchor nicht gefunden

```
✗ Anchor #übersicht not found in current file
```

**Ursachen**:
1. Anchor existiert nicht (Tippfehler?)
2. Anchor-Generierung unterscheidet sich von GitHub

**Lösung**:
```markdown
# Expliziter Anchor hinzufügen
<a id="übersicht"></a>
## Übersicht

# ODER: GitHub-kompatiblen Header nutzen
## uebersicht  # → #uebersicht
```

### Problem: Externe Links langsam

```bash
# Nur interne Links prüfen (schnell)
npm run validate-links

# Externe Links nur vor Releases
npm run validate-links:external
```

### Problem: False Positives in Test-Fixtures

Test-Fixtures können absichtlich broken links enthalten:

```markdown
# tests/fixtures/markdown/README.md
[Broken Link](./non-existent.md)  # Absichtlich für Tests
```

**Lösung**: Fixtures werden automatisch validiert, aber als "Test-Dateien" erkannt.

---

## 📈 Performance

| Projekt-Größe | Interne Links | Interne + Externe |
|---------------|---------------|-------------------|
| Klein (10 Dateien, 50 Links) | ~1s | ~5s |
| Mittel (40 Dateien, 250 Links) | ~2s | ~30s |
| Groß (100 Dateien, 1000 Links) | ~5s | ~2min |

**Tipp**: Nutze `--external` nur vor Releases oder in CI/CD.

---

## 🔄 Workflow

### 1. Regelmäßige Validierung (während Development)

```bash
# Schnelle Validierung nur interne Links
npm run validate-links
```

### 2. Pre-Release Validation

```bash
# Vollständige Validierung inkl. externe Links
npm run validate-links:external

# Report prüfen
cat .analysis/link_validation_report.json
```

### 3. CI/CD Integration

```yaml
# .github/workflows/docs-check.yml
name: Documentation Check

on: [push, pull_request]

jobs:
  validate-links:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run validate-links  # Nur interne Links in CI
```

### 4. Nach Dokumentations-Umstrukturierung

```bash
# Verbose Output um broken links zu analysieren
npm run validate-links:verbose

# Fix broken links...

# Erneut validieren
npm run validate-links
```

---

## 📚 Häufige Link-Fehler

### 1. Falsche relative Pfade nach Umstrukturierung

```markdown
# ❌ Alt (nach Move von docs/GUIDE.md → docs/guides/GUIDE.md)
[Link](./API.md)  # Sucht in docs/guides/API.md

# ✅ Neu
[Link](../reference/API.md)  # Korrekt nach Umstrukturierung
```

### 2. Anchors mit Sonderzeichen

```markdown
# ❌ Funktioniert nicht
[Link](#übersicht)  # Umlaute werden anders encoded

# ✅ Funktioniert
[Link](#uebersicht)  # ASCII-only
# ODER expliziter Anchor:
<a id="übersicht"></a>
```

### 3. Case-Sensitivity (auf Linux/Mac)

```markdown
# ❌ Auf Linux broken wenn Datei README.md heißt
[Link](./readme.md)

# ✅ Exakt wie Dateiname
[Link](./README.md)
```

### 4. Vergessene Datei-Extensions

```markdown
# ❌ Broken
[Link](./guide)

# ✅ Mit Extension
[Link](./guide.md)
```

---

## 🎯 Best Practices

### 1. Regelmäßig validieren

```bash
# Vor jedem Commit
npm run validate-links
```

### 2. Relative Pfade bevorzugen

```markdown
# ✅ Gut (funktioniert auch wenn Repo verschoben wird)
[Link](../guides/GUIDE.md)

# ❌ Weniger gut (bricht bei Repo-Move)
[Link](/docs/guides/GUIDE.md)
```

### 3. Anchors testen

```markdown
# Immer beide Richtungen testen
[To Section](#my-section)  # Von oben nach unten
...
## My Section
[Back to top](#top)         # Von unten nach oben
```

### 4. Externe Links sparsam nutzen

- ✅ Nur für stable, long-term URLs (GitHub Repos, Specs)
- ❌ Nicht für Blogs, Tutorials (können offline gehen)

---

## 🚀 Erweiterungen

### Custom Rules hinzufügen

```typescript
// scripts/validate-links.ts

// Beispiel: Warnung bei bestimmten Domains
async function validateExternalLink(target: string): Promise<{ valid: boolean; error?: string; warning?: string }> {
  if (target.includes('example.com')) {
    return { valid: true, warning: 'Using example.com - replace with real URL' };
  }
  // ... rest
}
```

### Auto-Fix (geplant)

```bash
# Automatisches Fixen von relativen Pfaden
npm run validate-links -- --fix

# Würde broken links automatisch korrigieren
```

---

## 📖 Siehe auch

- [GLOSSARY.md](../docs/GLOSSARY.md) - Begriffe & Definitionen
- [CONTRIBUTING.md](../docs/development/CONTRIBUTING.md) - Contribution Guidelines
- [INDEX.md](../docs/INDEX.md) - Documentation Index

---

**Version**: 1.0.0
**Erstellt**: 2025-11-18
**Autor**: CodeWeaver Team
