# Developer Workflow mit CodeWeaver MCP 🚀

**Praktischer End-to-End Guide für den Entwickleralltag**

Dieses Dokument zeigt einen kompletten Developer Workflow von Projektstart bis Deployment - mit jeder MCP-Methode in einem realistischen Kontext.

---

## 📋 Szenario: Neues Java Microservice Projekt

**Projektname:** `user-management-service`
**Tech Stack:** Java 21, Spring Boot, Gradle, PostgreSQL
**Features:** User CRUD, Authentication, REST API

---

## Phase 1: Projekt-Setup & Onboarding (Tag 1, Morgen)

### 🎯 Use Case: "Ich bin neu im Projekt und will verstehen was hier läuft"

#### Schritt 1: Projekt-Metadaten verstehen

**Tool:** `project.meta`

```typescript
// Claude Code fragt MCP:
const metadata = await mcp.call('project.meta', {});

// Ergebnis:
{
  "name": "user-management-service",
  "version": "0.1.0-SNAPSHOT",
  "javaVersion": "21",
  "gradleVersion": "8.5",
  "modules": ["app", "core", "api"],
  "dependencies": [
    "spring-boot-starter-web:3.2.0",
    "spring-boot-starter-data-jpa:3.2.0",
    "postgresql:42.7.0"
  ],
  "plugins": ["org.springframework.boot", "io.spring.dependency-management"]
}
```

**💡 Nutzen:**
- Sofort sehen: Java 21, Spring Boot, Multi-Modul Setup
- Keine Readme suchen, keine build.gradle durchforsten
- Claude kann direkt relevante Fragen beantworten

**Typische Claude Code Konversation:**
```
User: "Was für ein Projekt ist das?"
Claude: [Nutzt project.meta]
        "Das ist ein Java 21 Microservice mit Spring Boot 3.2,
        bestehend aus 3 Modulen (app, core, api). Es nutzt
        PostgreSQL als Datenbank..."
```

---

#### Schritt 2: Projektstruktur erkunden

**Tool:** `search.files` + `file.read`

```typescript
// 1. Alle Controller finden
const controllers = await mcp.call('search.files', {
  pattern: '*Controller.java'
});
// → ["UserController.java", "AuthController.java"]

// 2. UserController anschauen
const code = await mcp.call('file.read', {
  filePath: 'src/main/java/com/example/api/UserController.java',
  maxTokens: 5000
});
```

**💡 Nutzen:**
- Schnell alle wichtigen Komponenten finden (Controller, Services, Repositories)
- Token-effizientes Lesen (nur das Nötige, nicht die ganze Datei)
- Claude versteht Architektur ohne manuelles Copy-Paste

**Typische Konversation:**
```
User: "Zeig mir alle REST Endpoints"
Claude: [Nutzt search.files + file.read]
        "Das Projekt hat 2 Controller:

        UserController:
        - GET /api/users - Liste aller User
        - POST /api/users - Neuen User anlegen
        - GET /api/users/{id} - User by ID

        AuthController:
        - POST /api/auth/login
        - POST /api/auth/logout"
```

---

#### Schritt 3: Projekt-Symbole indexieren

**Tool:** `symbols.index`

```typescript
// Einmal ausführen, dann ist alles durchsuchbar
const indexResult = await mcp.call('symbols.index', {});

// Ergebnis:
{
  "files": 45,
  "symbols": 312,
  "classes": 28,
  "methods": 198,
  "fields": 86,
  "classList": ["UserController", "UserService", "UserRepository", ...]
}
```

**💡 Nutzen:**
- Einmal indexieren, dann Millisekunden-schnelle Symbol-Suche
- Keine manuelle Code-Navigation mehr
- Claude kennt ALLE Klassen, Methoden, Fields

---

#### Schritt 4: Bestimmte Klasse finden

**Tool:** `symbols.find`

```typescript
// User sucht nach User-bezogenen Klassen
const userClasses = await mcp.call('symbols.find', {
  name: 'User'
});

// Ergebnis:
[
  { name: "User", kind: "class", file: "core/src/.../User.java" },
  { name: "UserDTO", kind: "class", file: "api/src/.../UserDTO.java" },
  { name: "UserService", kind: "class", file: "app/src/.../UserService.java" },
  { name: "UserRepository", kind: "interface", file: "core/src/.../UserRepository.java" }
]
```

**💡 Nutzen:**
- Alle relevanten Klassen auf einen Blick
- Verstehe Architektur (Entity, DTO, Service, Repository Pattern)
- Claude kann Zusammenhänge erklären

**Typische Konversation:**
```
User: "Wie ist das User-Modul aufgebaut?"
Claude: [Nutzt symbols.find]
        "Das User-Modul folgt dem klassischen Spring Architektur-Pattern:

        1. User (Entity) - JPA Entity in core/
        2. UserDTO (Data Transfer Object) - API Layer
        3. UserService (Business Logic) - Service Layer
        4. UserRepository (Data Access) - JPA Repository

        Typischer Flow: Controller → Service → Repository → Database"
```

---

## Phase 2: Feature-Entwicklung (Tag 1, Nachmittag)

### 🎯 Use Case: "Ich soll ein neues Feature entwickeln - Password Reset"

#### Schritt 5: Ähnliche Implementierungen finden

**Tool:** `search.semantic` (AI-powered!)

```typescript
// Semantische Suche nach "password reset logic"
const results = await mcp.call('search.semantic', {
  query: "password reset functionality",
  limit: 5,
  collection: "code"
});

// Findet automatisch relevante Code-Stellen, auch wenn
// nirgendwo "password reset" steht!
// → Findet z.B. LoginService mit Token-Generation
// → Findet EmailService für Benachrichtigungen
```

**💡 Nutzen:**
- KI versteht **Bedeutung**, nicht nur Keywords
- Findet ähnliche Patterns auch mit anderen Namen
- Spart Stunden manueller Code-Suche

**Typische Konversation:**
```
User: "Ich soll Password Reset implementieren. Gibt es ähnliche Features?"
Claude: [Nutzt search.semantic]
        "Ja! Schau dir LoginService an - der macht bereits:
        - Token-Generierung (Zeile 45-60)
        - Token-Validierung (Zeile 78-92)
        - Email-Versand über EmailService

        Du kannst das Pattern wiederverwenden:
        1. Token generieren wie in generateLoginToken()
        2. Email senden wie in sendWelcomeEmail()
        3. Token validieren analog zu validateLoginToken()"
```

---

#### Schritt 6: Bestehende Methoden analysieren

**Tool:** `symbols.get` + `file.readRange`

```typescript
// 1. Service-Methode finden
const service = await mcp.call('symbols.get', {
  qualifiedName: 'com.example.service.UserService#createUser'
});

// 2. Nur diese Methode lesen (token-effizient!)
const method = await mcp.call('file.readRange', {
  filePath: service.file,
  startLine: service.startLine,
  endLine: service.endLine
});
```

**💡 Nutzen:**
- Nur relevante Code-Teile lesen (nicht ganze 1000-Zeilen Datei)
- Tokens sparen = schneller + günstiger
- Claude fokussiert auf das Wesentliche

**Typische Konversation:**
```
User: "Wie erstellt createUser() einen neuen User?"
Claude: [Nutzt symbols.get + file.readRange]
        "createUser() in UserService macht folgendes:

        1. Validiert Input (Zeile 45-48)
        2. Prüft ob Email schon existiert (Zeile 50)
        3. Hasht das Password mit BCrypt (Zeile 52)
        4. Speichert User in DB (Zeile 54)
        5. Sendet Welcome-Email (Zeile 56)

        Für Password Reset brauchst du ähnliche Schritte..."
```

---

#### Schritt 7: Keyword-Suche für spezifische Implementierung

**Tool:** `search.keyword`

```typescript
// Alle Stellen finden wo Emails verschickt werden
const emailUsage = await mcp.call('search.keyword', {
  keyword: 'sendEmail',
  caseSensitive: false,
  contextLines: 3,
  fileExtensions: ['.java']
});

// Zeigt ALLE Stellen + 3 Zeilen Kontext
```

**💡 Nutzen:**
- Grep-like Suche direkt aus Claude
- Kontext-Zeilen zeigen Verwendung
- Verstehe wie Feature überall genutzt wird

---

## Phase 3: Code Quality & Refactoring (Tag 2)

### 🎯 Use Case: "Code Review - Ist mein Code gut genug?"

#### Schritt 8: Komplexität analysieren

**Tool:** `analysis.file`

```typescript
const analysis = await mcp.call('analysis.file', {
  filePath: 'src/main/java/com/example/service/UserService.java'
});

// Ergebnis:
{
  "complexity": 45,        // Hoch! Grenze ist ~20
  "loc": 234,
  "sloc": 187,
  "methods": 12,
  "averageComplexity": 3.75,
  "topComplexMethods": [
    { "method": "createUser", "complexity": 12 },
    { "method": "updateUser", "complexity": 15 },
    { "method": "validateUserData", "complexity": 18 }  // ⚠️ Zu komplex!
  ]
}
```

**💡 Nutzen:**
- Objektive Metriken statt Bauchgefühl
- Findet Problem-Methoden automatisch
- Claude schlägt Refactorings vor

**Typische Konversation:**
```
User: "Ist UserService zu komplex?"
Claude: [Nutzt analysis.file]
        "⚠️ Ja, UserService hat eine Komplexität von 45 (kritisch!)

        Hauptproblem: validateUserData() mit Komplexität 18
        → Zu viele if/else Verschachtelungen

        Refactoring-Vorschlag:
        1. Validation Rules in separate Klassen extrahieren
        2. Chain of Responsibility Pattern
        3. Oder: Spring Validator Framework nutzen

        Soll ich dir zeigen wie?"
```

---

#### Schritt 9: Projekt-weite Code Quality

**Tool:** `analysis.project`

```typescript
const projectAnalysis = await mcp.call('analysis.project', {});

// Ergebnis:
{
  "totalFiles": 45,
  "totalComplexity": 892,
  "averageComplexity": 19.8,
  "topComplexFiles": [
    { "file": "UserService.java", "complexity": 45 },
    { "file": "AuthService.java", "complexity": 38 },
    { "file": "OrderService.java", "complexity": 67 }  // ⚠️ KRITISCH!
  ],
  "totalLOC": 5431,
  "averageMethodComplexity": 4.2
}
```

**💡 Nutzen:**
- Gesamt-Überblick über Code Quality
- Hot Spots identifizieren
- Refactoring priorisieren

**Typische Konversation:**
```
User: "Welche Dateien brauchen dringend Refactoring?"
Claude: [Nutzt analysis.project]
        "🚨 Kritische Dateien (Komplexität > 50):

        1. OrderService.java (67) - HÖCHSTE PRIORITÄT
        2. UserService.java (45)
        3. AuthService.java (38)

        OrderService ist das größte Problem. Die hat:
        - 23 Methoden
        - Durchschnittliche Methoden-Komplexität: 7.8 (zu hoch!)
        - 456 Zeilen Code

        Empfehlung: In kleinere Services aufteilen:
        - OrderValidationService
        - OrderProcessingService
        - OrderNotificationService"
```

---

## Phase 4: Git Integration & Collaboration (Tag 3)

### 🎯 Use Case: "Was wurde geändert? Wer hat das gemacht?"

#### Schritt 10: Repository Status

**Tool:** `vcs.status`

```typescript
const status = await mcp.call('vcs.status', {});

// Ergebnis:
{
  "branch": "feature/password-reset",
  "modified": ["UserService.java", "UserController.java"],
  "added": ["PasswordResetService.java", "PasswordResetDTO.java"],
  "deleted": [],
  "untracked": ["PasswordResetServiceTest.java"]
}
```

**💡 Nutzen:**
- Überblick über eigene Änderungen
- Vergessene Files erkennen (untracked)
- Claude kann Commit-Messages vorschlagen

**Typische Konversation:**
```
User: "Was habe ich alles geändert?"
Claude: [Nutzt vcs.status]
        "Du hast 5 Dateien geändert für Password Reset:

        Neu:
        - PasswordResetService.java (Business Logic)
        - PasswordResetDTO.java (API)

        Geändert:
        - UserService.java (Integration)
        - UserController.java (neuer Endpoint)

        ⚠️ Du hast PasswordResetServiceTest.java noch nicht committed!"
```

---

#### Schritt 11: Änderungen reviewen

**Tool:** `vcs.diff`

```typescript
// Diff einer spezifischen Datei
const diff = await mcp.call('vcs.diff', {
  file: 'src/main/java/com/example/service/UserService.java'
});

// Zeigt genau was geändert wurde (unified diff format)
```

**💡 Nutzen:**
- Vor Commit nochmal checken
- Claude kann Änderungen erklären
- Code Review vor Push

**Typische Konversation:**
```
User: "Was habe ich in UserService geändert?"
Claude: [Nutzt vcs.diff]
        "In UserService.java hast du 3 Änderungen:

        1. Neue Methode: requestPasswordReset() (Zeile 145-167)
           → Generiert Token, speichert in DB, sendet Email

        2. Neue Methode: validateResetToken() (Zeile 169-182)
           → Prüft Token-Gültigkeit und Ablauf

        3. Import hinzugefügt: PasswordResetToken (Zeile 12)

        Sieht gut aus! Ready für Commit."
```

---

#### Schritt 12: Code History & Blame

**Tool:** `vcs.blame`

```typescript
const blame = await mcp.call('vcs.blame', {
  file: 'src/main/java/com/example/service/UserService.java',
  lineRange: '45-60'
});

// Zeigt wer welche Zeile wann geändert hat
```

**💡 Nutzen:**
- Verstehen WARUM Code so ist
- Richtigen Ansprechpartner finden
- Code History nachvollziehen

**Typische Konversation:**
```
User: "Warum ist diese Validierung so kompliziert?"
Claude: [Nutzt vcs.blame + vcs.log]
        "Diese Validierung wurde in 3 Schritten entwickelt:

        1. Commit abc123 (Max, 2024-01-15)
           'Initial user validation'
           → Basis-Validierung

        2. Commit def456 (Sarah, 2024-02-03)
           'Add email format validation'
           → Email-Check hinzugefügt

        3. Commit ghi789 (Tom, 2024-03-10)
           'Fix: Validate special characters in username'
           → Bug-Fix für SQL Injection

        Die Komplexität kommt von Security-Fixes.
        Frag Sarah, die kennt die Details!"
```

---

#### Schritt 13: Branch Vergleich

**Tool:** `vcs.compare`

```typescript
const comparison = await mcp.call('vcs.compare', {
  base: 'main',
  compare: 'feature/password-reset'
});

// Zeigt alle Unterschiede zwischen Branches
```

**💡 Nutzen:**
- Vor Merge checken was alles merged wird
- Konflikte früh erkennen
- Pull Request vorbereiten

---

## Phase 5: Semantic Search Deep Dive (Fortgeschritten)

### 🎯 Use Case: "Ich will verstehen wie Feature X überall verwendet wird"

#### Schritt 14: Semantic Index aufbauen

**Tool:** Semantic Search mit `--index`

```bash
# CLI
codeweaver search semantic "authentication" --index

# MCP (automatisch)
await mcp.call('search.semantic', {
  query: 'authentication',
  buildIndex: true
});
```

**💡 Nutzen:**
- Einmal aufbauen (10 Min für 10k Files)
- Dann Millisekunden-schnelle Suchen
- KI versteht Code-Bedeutung

---

#### Schritt 15: Code nach Konzept suchen

**Tool:** `search.semantic`

```typescript
// Suche: "Wo wird mit Datenbank-Transaktionen gearbeitet?"
const results = await mcp.call('search.semantic', {
  query: "database transaction handling",
  limit: 10
});

// Findet ALLE relevanten Stellen, auch ohne Keywords
// "transaction", "@Transactional", "rollback", etc.
```

**💡 Nutzen:**
- Findet Code nach BEDEUTUNG, nicht nur Worten
- Versteht Synonyme und Patterns
- Perfekt für "Wie wird X gemacht?" Fragen

**Typische Konversation:**
```
User: "Wie gehen wir mit Database Transactions um?"
Claude: [Nutzt search.semantic]
        "Ich habe 8 Stellen gefunden wo Transaktionen verwendet werden:

        Hauptpattern: Spring @Transactional

        1. UserService (87% Match)
           → @Transactional(readOnly = false)
           → Verwendet für alle Write-Operationen

        2. OrderService (91% Match)
           → @Transactional(propagation = REQUIRED)
           → Complex Multi-Step Transactions

        3. PaymentService (95% Match) ⭐ BESTE REFERENZ
           → @Transactional mit Rollback-Rules
           → Error Handling mit try-catch
           → Logging bei Rollback

        Empfehlung: Schau dir PaymentService an,
        das ist das sauberste Beispiel!"
```

---

#### Schritt 16: Multi-Collection Search

**Tool:** Semantic Search mit Collections

```typescript
// In Code-Dateien suchen
const codeResults = await mcp.call('search.semantic', {
  query: "REST API pagination",
  collection: "code",
  limit: 5
});

// In Dokumentation suchen
const docsResults = await mcp.call('search.semantic', {
  query: "REST API pagination",
  collection: "docs",
  limit: 5
});
```

**💡 Nutzen:**
- Code UND Docs durchsuchen
- Verstehe Implementierung + Konzept
- Perfekt für "Wie funktioniert X und warum?"

---

## Phase 6: File Watcher für Live-Updates (Power User)

### 🎯 Use Case: "Index soll immer aktuell sein"

#### Schritt 17: File Watcher starten

```bash
# Terminal 1: Watcher läuft im Hintergrund
codeweaver watch

# Output:
# 🔍 Watching 1,234 files...
# [10:15:23] 📝 UserService.java changed
# [10:15:25] ⚙️  Re-indexing 1 file...
# [10:15:27] ✓ Updated 1 file (5 chunks)
```

**💡 Nutzen:**
- Index immer aktuell (Sekunden statt Minuten)
- Keine manuellen Re-Builds
- Perfekt für aktive Development

```
# Terminal 2: Arbeiten wie gewohnt
vim UserService.java
# ... Änderungen ...
:wq

# Terminal 1: Watcher hat's automatisch erfasst!
# [10:16:45] 📝 UserService.java changed
# [10:16:47] ✓ Updated
```

---

## 🎯 Zusammenfassung: Alle 18 MCP Tools im Kontext

| Phase | Tool | Use Case | Nutzen |
|-------|------|----------|--------|
| **Onboarding** | `project.meta` | "Was ist das für ein Projekt?" | Tech-Stack auf einen Blick |
| | `symbols.index` | "Alle Klassen indexieren" | Basis für schnelle Suche |
| | `symbols.find` | "Wo ist die User-Klasse?" | Millisekunden-schnell |
| | `symbols.get` | "Zeig mir diese Methode" | Exakter Code-Zugriff |
| **Exploration** | `search.files` | "Alle Controller finden" | Pattern-basierte Suche |
| | `file.read` | "Lies diese Datei" | Token-efficient |
| | `file.readRange` | "Nur Zeilen 50-80" | Noch effizienter |
| | `file.readWithNumbers` | "Mit Zeilennummern" | Bessere Referenz |
| **Development** | `search.keyword` | "Wo wird X verwendet?" | Grep-like Suche |
| | `search.semantic` | "Ähnliche Implementierungen?" | KI-powered Search |
| **Quality** | `analysis.file` | "Ist diese Datei zu komplex?" | Objektive Metriken |
| | `analysis.project` | "Wo sind die Hotspots?" | Projekt-Überblick |
| **Collaboration** | `vcs.status` | "Was habe ich geändert?" | Git Status |
| | `vcs.diff` | "Zeig die Änderungen" | Code Review |
| | `vcs.blame` | "Wer hat das gemacht?" | Code History |
| | `vcs.log` | "Commit History" | Verstehe Entwicklung |
| | `vcs.branches` | "Welche Branches gibt's?" | Branch Overview |
| | `vcs.compare` | "Branch A vs B?" | Merge Vorbereitung |

---

## 🚀 Best Practices

### Do's ✅

1. **Semantic Search mit Index**
   - Einmal bauen, dann schnell suchen
   - Für "Wie wird X gemacht?" Fragen

2. **File Watcher für aktive Development**
   - Immer aktueller Index
   - Perfekt bei vielen Änderungen

3. **Symbols vor File Read**
   - Erst finden, dann lesen
   - Spart Tokens

4. **Analysis vor Refactoring**
   - Objektive Metriken
   - Priorisiere richtig

5. **Multi-Collection Search**
   - Code UND Docs durchsuchen
   - Ganzheitliches Verständnis

### Don'ts ❌

1. **Nicht ganze Dateien lesen wenn Range reicht**
   - Verschwendet Tokens
   - Nutze `file.readRange` oder `symbols.get`

2. **Nicht Keyword-Search für konzeptuelle Fragen**
   - "Wie wird Authentication gemacht?"
   - → Nutze Semantic Search!

3. **Nicht Index ignorieren**
   - Ohne Index: langsam
   - Mit Index: Millisekunden

4. **Nicht File Watcher vergessen**
   - Bei aktiver Dev: Gold wert
   - Spart manuelle Re-Builds

---

## 💡 Pro-Tipps

### Tipp 1: Kombiniere Tools

```
User: "Zeig mir die komplexeste Methode im Projekt"
Claude:
1. analysis.project → Finde komplexeste Datei
2. analysis.file → Finde komplexeste Methode
3. symbols.get → Hole exakte Position
4. file.readRange → Zeige nur diese Methode
```

### Tipp 2: Semantic Search für "Wie-Fragen"

```
❌ "Suche nach 'authentication'"
✅ "Wie wird User-Authentifizierung implementiert?"

Semantic Search versteht Kontext und findet:
- Login-Flow
- Token-Generation
- Session-Management
- Auch wenn nirgendwo "authentication" steht!
```

### Tipp 3: Multi-Step Workflows

```
Use Case: "Refactor komplexe Methode"

1. analysis.file → Finde Problem
2. symbols.get → Hole Methode
3. search.semantic → Finde ähnliche, bessere Implementierungen
4. vcs.blame → Verstehe Historie
5. Refactor mit Claude
6. vcs.diff → Review Änderungen
```

---

## 🎓 Learning Path

### Woche 1: Basics
- `project.meta`, `file.read`, `search.files`
- Verstehe Projekt-Struktur

### Woche 2: Symbols
- `symbols.index`, `symbols.find`, `symbols.get`
- Navigation ohne IDE

### Woche 3: Search
- `search.keyword`, `search.semantic`
- Finde Code nach Bedeutung

### Woche 4: Quality
- `analysis.file`, `analysis.project`
- Code Quality Metriken

### Woche 5: Git
- `vcs.*` Tools
- Collaboration & History

### Woche 6: Power User
- File Watcher
- Multi-Collection
- Tool-Kombinationen

---

**Viel Erfolg mit CodeWeaver! 🚀**

*Feedback? Issues? → https://github.com/nobiehl/codeweaver-mcp/issues*
