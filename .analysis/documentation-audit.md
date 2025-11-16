# Documentation Audit - Inkonsistenzen & Konsolidierungsplan

**Datum**: 2025-11-16
**Durchgeführt**: Vollständiger Abgleich Code vs. Dokumentation

---

## 🔍 GEFUNDENE INKONSISTENZEN

### 1. ❌ MCP Tools Anzahl FALSCH

**Code-Realität**: **19 MCP Tools**
**Doku behauptet**: **18 MCP Tools** (überall!)

**Tatsächliche Tools im Code** (`src/mcp/tools.ts`):

**Project & Files (4):**
1. project.meta
2. file.read
3. file.readRange
4. file.readWithNumbers

**Symbols (4):**
5. symbols.index
6. symbols.find
7. symbols.findByKind
8. symbols.get

**Search (3):**
9. search.keyword
10. search.semantic ← **Wird vermutlich nicht mitgezählt!**
11. search.files

**Analysis (2):**
12. analysis.file
13. analysis.project

**VCS (6):**
14. vcs.status
15. vcs.diff
16. vcs.blame
17. vcs.log
18. vcs.branches
19. vcs.compare

**Betroffene Dateien**:
- ✅ README.md - Zeile ~59: "all 18 MCP tools"
- ✅ CLAUDE.md - Mehrfach: "18 MCP Tools"
- ✅ DEVELOPER_WORKFLOW.md - Titel: "18 MCP tools in action"
- ✅ docs/USAGE.md
- ✅ PRODUCTION_READINESS.md (neu)

---

### 2. ❌ CLI Command-Gruppen Anzahl FALSCH

**Code-Realität**: **7 CLI Command-Dateien**
**Doku behauptet**: **6 Command-Gruppen**

**Tatsächliche Commands im Code** (`src/cli/commands/`):
1. info.ts
2. file.ts
3. symbols.ts
4. search.ts
5. analysis.ts
6. vcs.ts
7. watch.ts ← **Wird nicht mitgezählt!**

**Betroffene Dateien**:
- README.md
- CLAUDE.md
- docs/ARCHITECTURE.md

---

### 3. ✅ Agents Anzahl KORREKT

**Code-Realität**: **9 Agents**
**Doku sagt**: **9 Agents (7 implementiert, 2 geplant)** - **FALSCH!**

**Tatsächliche Agents im Code** (`src/core/agents/`):
1. discovery.ts ✅
2. cache.ts ✅
3. snippets.ts ✅
4. symbols.ts ✅
5. search.ts ✅
6. analysis.ts ✅
7. vcs.ts ✅
8. semantic.ts ✅
9. watcher.ts ✅

**Realität**: **ALLE 9 implementiert!**

**Betroffene Dateien**:
- CLAUDE.md: "9 Agents (7 implementiert)" - FALSCH
- README.md
- docs/ARCHITECTURE.md

---

### 4. ✅ Tests Anzahl KORREKT

**Code-Realität**: **102 Tests in 12 Test-Dateien**
**Doku sagt**: **102 Tests** - **KORREKT!**

---

### 5. ⚠️ "Zero Native Dependencies" - JETZT KORRIGIERT

**Code-Realität**:
- Core-Features: Zero Native Dependencies ✅
- Semantic Search: Benötigt LanceDB + ONNX Runtime (Native) ⚠️

**Doku-Status**:
- ✅ README.md - Jetzt mit Fußnote korrigiert
- ✅ CLAUDE.md - Jetzt differenziert
- ⚠️ Andere Docs müssen geprüft werden

---

## 📋 KONSOLIDIERUNGSPLAN

### Phase 1: Kritische Zahlen korrigieren

**Priorität: HOCH** - Diese Zahlen sind faktisch falsch

1. **MCP Tools**: 18 → 19 überall ändern
2. **CLI Commands**: 6 → 7 überall ändern
3. **Agents**: "7 implementiert" → "9 implementiert" (ALLE!)

**Betroffene Dateien**:
- README.md
- CLAUDE.md
- DEVELOPER_WORKFLOW.md
- PRODUCTION_READINESS.md
- docs/ARCHITECTURE.md
- docs/USAGE.md
- docs/STATUS_AND_ROADMAP.md

---

### Phase 2: Links validieren

**Priorität: MITTEL**

Alle Markdown-Dateien auf tote Links prüfen:
- Interne Links (z.B. `[ARCHITECTURE.md](./docs/ARCHITECTURE.md)`)
- Relative Pfade
- Anchors (z.B. `#section-name`)

**Tools**: Manuell durchgehen oder Link-Checker verwenden

---

### Phase 3: Redundanzen eliminieren

**Priorität: NIEDRIG**

Mehrere Dokumente beschreiben das Gleiche:
- `README.md` vs `docs/README.md` vs `docs/USAGE.md`
- `CLAUDE.md` vs `docs/ARCHITECTURE.md`
- `PRODUCTION_READINESS.md` vs `docs/STATUS_AND_ROADMAP.md`

**Entscheidung**: Welche Dokumente behalten? Welche archivieren?

---

## 🎯 DETAILLIERTE ÄNDERUNGEN

### README.md

**Zeile ~11**: ✅ Bereits korrigiert mit Fußnote
```markdown
- ✅ **Zero Native Dependencies*** - Pure Node.js/TypeScript with java-parser
```

**Zeile ~59**: ❌ Ändern
```markdown
- OLD: "all 18 MCP tools in action"
+ NEW: "all 19 MCP tools in action"
```

**Zeile ~220**: ❌ Ändern
```markdown
- OLD: "**MCP Tools**: 18"
+ NEW: "**MCP Tools**: 19"
```

---

### CLAUDE.md

**Mehrfach**: ❌ Ändern
```markdown
- OLD: "18 MCP Tools"
+ NEW: "19 MCP Tools"

- OLD: "6 CLI Command-Gruppen"
+ NEW: "7 CLI Command-Gruppen"

- OLD: "9 Agents (7 implementiert)"
+ NEW: "9 Agents (alle implementiert)"
```

**Zeile ~171**: ❌ MCP Tools Liste
```markdown
### MCP Tools (19 total)  ← ÄNDERN!
```

**Zeile ~400**: ❌ Features
```markdown
- ✅ 19 MCP Tools  ← ÄNDERN!
- ✅ 7 CLI Command-Gruppen  ← ÄNDERN!
- ✅ 9 Agents (alle implementiert)  ← ÄNDERN!
```

---

### DEVELOPER_WORKFLOW.md

**Titel**: ❌ Ändern
```markdown
- OLD: "all 18 MCP tools"
+ NEW: "all 19 MCP tools"
```

---

### PRODUCTION_READINESS.md

**MCP Tools erwähnt**: ❌ Prüfen und ggf. ändern

---

### docs/ARCHITECTURE.md

**Agents**: ❌ Ändern
```markdown
- OLD: "7 Implementierte Agents"
+ NEW: "9 Implementierte Agents"
```

**CLI Commands**: ❌ Ändern
```markdown
- OLD: "6 Command Groups"
+ NEW: "7 Command Groups"
```

---

### docs/USAGE.md

**MCP Tools Liste**: ❌ Komplett überprüfen

---

### docs/STATUS_AND_ROADMAP.md

**Phase-Status**: ❌ Aktualisieren
```markdown
Phase 4: VCS Integration - ✅ COMPLETE (nicht nur geplant!)
```

---

## 🔗 LINK-VALIDIERUNG (TODO)

### Interne Links zu prüfen:

**Root-Level Docs**:
- README.md → Links zu anderen Docs prüfen
- DEVELOPER_WORKFLOW.md → Links zu Sections
- SEMANTIC_SEARCH.md → Links zu anderen Guides

**docs/ Ordner**:
- docs/README.md → Links zu Unterdocs
- docs/ARCHITECTURE.md → Links zu anderen Docs

**Häufige Link-Typen**:
- `[ARCHITECTURE.md](./docs/ARCHITECTURE.md)`
- `[Section](#section-name)`
- `[External](https://...)`

---

## 📊 ZUSAMMENFASSUNG

| Kategorie | Code-Realität | Doku behauptet | Status |
|-----------|---------------|----------------|--------|
| MCP Tools | 19 | 18 | ❌ FALSCH |
| CLI Commands | 7 | 6 | ❌ FALSCH |
| Agents (implementiert) | 9 | 7 | ❌ FALSCH |
| Tests | 102 | 102 | ✅ KORREKT |
| Native Dependencies (Core) | 0 | 0 | ✅ KORREKT (nach Fix) |
| Native Dependencies (Semantic) | LanceDB+ONNX | Nicht klar kommuniziert | ✅ KORREKT (nach Fix) |

---

## ✅ NÄCHSTE SCHRITTE

1. ✅ Phase 1: Kritische Zahlen korrigieren (18→19, 6→7, 7→9)
2. ⏳ Phase 2: Alle Links validieren
3. ⏳ Phase 3: Redundanzen eliminieren (optional)

**Geschätzter Aufwand**: 30-60 Minuten für Phase 1
