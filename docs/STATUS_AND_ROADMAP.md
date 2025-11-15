# Fehlende Features & Priorisierung - CodeWeaver

**Erstellt**: 2025-11-14
**Status**: Phase 1-4 Complete (78% der ursprünglichen Planung)

---

## 📊 Übersicht: Was fehlt?

Von ursprünglich **9 geplanten Agents** sind **7 implementiert** (78%).

### ✅ Implementiert (Phase 1-4)
1. Discovery Agent - Gradle Metadaten ✅
2. Cache Agent - Content-addressable Caching ✅
3. Snippets Agent - Token-effizientes File-Reading ✅
4. Symbols Agent - Java Symbol-Extraktion ✅
5. Search Agent - Keyword/Pattern-Suche ✅
6. Analysis Agent - Complexity & Metrics ✅
7. VCS Agent - Git-Operationen ✅

### ❌ Nicht implementiert
8. **Index Agent** (LanceDB Semantic Search)
9. **Orchestrator Agent** (Pipeline-Koordination)
10. **Static Analysis Tools** (SpotBugs, Checkstyle, PMD)

---

## 🎯 Feature-Bewertung & Empfehlungen

### 🥇 Priorität 1: SOLLTE implementiert werden

#### 1. SpotBugs Integration
**Datei**: `src/core/analysis/spotbugs.ts` (fehlt)

**Was es macht**:
- Findet echte Bugs: NullPointerExceptions, Resource Leaks, SQL Injections
- Statische Code-Analyse für Java

**Nutzen-Score**: ⭐⭐⭐⭐⭐ (5/5)

**Beispiel**:
```java
// SpotBugs würde finden:
String name = user.getName();
if (name.isEmpty()) { // ← NPE wenn name == null!
    ...
}
```

**Aufwand**:
- Entwicklung: 1 Woche
- Komplexität: Mittel
- Dependencies: Java Runtime + Gradle Plugin

**Warum nicht implementiert**:
- Braucht externe Java Runtime
- Gradle-Build-Integration kompliziert

**Empfehlung**: ✅ **JA - sehr praktisch für echte Projekte**

---

#### 2. Checkstyle Integration
**Datei**: `src/core/analysis/checkstyle.ts` (fehlt)

**Was es macht**:
- Code-Style Enforcement
- Naming Conventions, Formatting Rules

**Nutzen-Score**: ⭐⭐⭐⭐☆ (4/5)

**Aufwand**:
- Entwicklung: 1 Woche
- Komplexität: Mittel
- Dependencies: Java Runtime + XML-Config

**Warum nicht implementiert**:
- Braucht externe Java Runtime
- Komplexe Regelkonfiguration

**Empfehlung**: ✅ **JA - gut für Code-Qualität**

---

### 🥈 Priorität 2: Nützlich für große Projekte

#### 3. Orchestrator Agent (Phase 5)
**Datei**: `src/core/agents/orchestrator.ts` (fehlt)

**Was es macht**:
- Parallele Task-Ausführung (Worker Threads)
- DAG-basierte Pipelines
- Automatische Abhängigkeitsauflösung

**Nutzen-Score**: ⭐⭐⭐⭐☆ (4/5)

**Beispiel**:
```bash
# Statt:
codeweaver symbols index    # 30s
codeweaver analysis project # 20s
# TOTAL: 50s sequenziell

# Mit Orchestrator:
codeweaver orchestrate "index + analysis"
# TOTAL: 30s parallel (Worker Threads)
```

**Aufwand**:
- Entwicklung: 2-3 Wochen
- Komplexität: Hoch
- Dependencies: Worker Threads API

**Warum nicht implementiert**:
- Core-Features waren wichtiger
- Komplexe Parallelisierung

**Empfehlung**: ⚠️ **Nur bei großen Projekten (1000+ Files) oder komplexen CI/CD-Pipelines**

**Use-Cases**:
- Große Codebases (10.000+ Files): -50% Analysezeit
- CI/CD-Integration: Robuste Pipelines
- Komplexe Workflows: Automatische Koordination

---

### 🥉 Priorität 3: Nice-to-have

#### 4. LanceDB Semantic Search
**Dateien**:
- `src/core/index/lancedb-indexer.ts` (fehlt)
- `src/core/storage/lancedb-store.ts` (fehlt)

**Was es macht**:
- Semantische Code-Suche statt Keyword
- Findet ähnlichen Code ohne exakte Keywords
- ML-basierte Embeddings

**Nutzen-Score**: ⭐⭐⭐☆☆ (3/5)

**Beispiel**:
```bash
# Statt:
codeweaver search keyword "authentication"
# Findet nur exakt "authentication"

# Mit LanceDB:
codeweaver search semantic "Wie funktioniert Login?"
# Findet: "authentication", "login", "credentials", "auth"
```

**Vorteile**:
- Findet semantisch ähnlichen Code
- +30-50% mehr Treffer
- Code-Duplikate finden

**Nachteile**:
- Sehr langsam: 1-5 Minuten Index-Zeit (vs. 10 Sekunden Keyword)
- ~200MB Model-Download
- Hoher Memory-Verbrauch
- Query: 100-500ms (vs. 10ms Keyword)

**Aufwand**:
- Entwicklung: 1-2 Wochen
- Komplexität: Sehr hoch
- Dependencies: @lancedb/lancedb, @xenova/transformers (bereits installiert!)

**Warum nicht implementiert**:
- Keyword-Search deckt 90% der Use-Cases ab
- Performance-Impact zu groß
- Aufwand >> Nutzen für MVP

**Empfehlung**: ⚠️ **Nur bei SEHR großen Codebases (10.000+ Files) sinnvoll**

---

### ❌ Priorität 4: Niedrig / Nicht empfohlen

#### 5. Symbol References (Find Usages)
**Funktion**: `findSymbolReferences()` in `src/core/service.ts`

**Was es macht**:
- Findet alle Stellen, wo ein Symbol verwendet wird
- "Find Usages" wie in IDE

**Nutzen-Score**: ⭐⭐⭐☆☆ (3/5)

**Aufwand**:
- Entwicklung: 1-2 Wochen
- Komplexität: Sehr hoch
- Performance: Langsam (muss alle Files parsen)

**Warum nicht implementiert**:
- IntelliJ IDEA / Eclipse machen das besser
- Sehr langsam ohne LSP
- Hoher Aufwand

**Empfehlung**: ❌ **NEIN - IDE-Features besser nutzen**

---

#### 6. Gradle Test Runner
**Datei**: `src/core/analysis/gradle-runner.ts` (fehlt)

**Was es macht**:
- Tests über CodeWeaver ausführen

**Nutzen-Score**: ⭐⭐☆☆☆ (2/5)

**Warum nicht implementiert**:
- `gradle test` funktioniert bereits
- Keine Mehrwert gegenüber direktem Gradle-Aufruf

**Empfehlung**: ❌ **NEIN - nicht notwendig**

---

## 📋 Code-TODOs (Kleinigkeiten)

### Minor Improvements im existierenden Code:

1. **Actual Line Numbers** (`src/core/agents/symbols.ts:112`)
   - Problem: Alle Symbols haben `startLine: 1`
   - Aufwand: 2-4 Stunden
   - Impact: Gering

2. **Interface & Enum Parsing** (`src/core/agents/symbols.ts:134-139`)
   - Problem: Nur Classes/Methods werden geparst
   - Aufwand: 2-4 Stunden
   - Impact: Gering (Search findet sie trotzdem)

3. **Cache Hit Rate Tracking** (`src/core/agents/cache.ts:92`)
   - Problem: Statistik immer 0
   - Aufwand: 30 Minuten
   - Impact: Sehr gering (nur Debugging)

4. **Full Metadata Tracking** (`src/core/agents/cache.ts:141`)
   - Problem: Keine Last-Access-Time, Access-Count
   - Aufwand: 2 Stunden
   - Impact: Gering

---

## 🎯 Empfohlene Roadmap

### Kurzfristig (1-2 Wochen)
1. ✅ **SpotBugs Integration** - Findet echte Bugs
2. ✅ **Checkstyle Integration** - Code-Qualität
3. ✅ **Interface/Enum Parsing** - Quick Win

### Mittelfristig (1-2 Monate)
4. ⚠️ **Orchestrator Agent (Phase 5)** - Bei Bedarf für große Projekte

### Langfristig (3+ Monate / Optional)
5. ⚠️ **LanceDB Semantic Search** - Nur bei sehr großen Codebases
6. ❌ **Symbol References** - Wenn LSP-Alternative nicht reicht

### Nicht empfohlen
- ❌ Gradle Test Runner (kein Mehrwert)

---

## 💭 Strategische Fragen zu klären

### Vor weiterer Implementierung:

1. **Zielgruppe**:
   - Kleine Projekte (<100 Files)? → Aktuelle Features reichen
   - Große Projekte (1000+ Files)? → Orchestrator + LanceDB sinnvoll

2. **Use-Case**:
   - LLM-Integration (MCP)? → Aktuelle Features optimal
   - CI/CD-Pipeline? → Orchestrator + Static Analysis sinnvoll
   - Lokale Entwicklung? → SpotBugs/Checkstyle am wertvollsten

3. **Performance-Anforderungen**:
   - Schnell (<5 Sekunden)? → Kein LanceDB
   - Gründlich (>1 Minute ok)? → LanceDB + Static Analysis

4. **Java-Abhängigkeit akzeptabel?**:
   - JA → SpotBugs/Checkstyle sofort umsetzbar
   - NEIN → Weiter mit Pure Node.js Features

---

## 📊 Feature-Matrix

| Feature | Nutzen | Aufwand | Java-Dep? | Empfehlung | Priorität |
|---------|--------|---------|-----------|------------|-----------|
| **SpotBugs** | ⭐⭐⭐⭐⭐ | Mittel | ✅ Ja | ✅ Implementieren | 1 |
| **Checkstyle** | ⭐⭐⭐⭐☆ | Mittel | ✅ Ja | ✅ Implementieren | 2 |
| **Orchestrator** | ⭐⭐⭐⭐☆ | Hoch | ❌ Nein | ⚠️ Bei Bedarf | 3 |
| **LanceDB** | ⭐⭐⭐☆☆ | Sehr Hoch | ❌ Nein | ⚠️ Optional | 4 |
| **Symbol Refs** | ⭐⭐⭐☆☆ | Sehr Hoch | ❌ Nein | ❌ Nicht nötig | 5 |
| **Test Runner** | ⭐⭐☆☆☆ | Mittel | ✅ Ja | ❌ Nicht nötig | 6 |

---

## 🔄 Nächste Schritte

### Entscheidung erforderlich:

**Frage an Product Owner**: Was ist das Hauptziel von CodeWeaver?

**Option A: Praktisches Tool für Entwickler**
→ SpotBugs + Checkstyle implementieren (hoher Mehrwert)

**Option B: LLM-optimierter MCP Server**
→ Aktueller Stand ist optimal, nur Minor Improvements

**Option C: Enterprise CI/CD Tool**
→ Orchestrator + Static Analysis + Test Integration

**Option D: Forschungs-Tool für semantische Suche**
→ LanceDB implementieren

---

**Dokumentiert**: 2025-11-14
**Review**: Offen
**Entscheidung**: Ausstehend
