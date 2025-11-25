# Project Metadata Agent Guide

**Version**: v0.3.1+
**Status**: ✅ Production-Ready
**Letzte Aktualisierung**: 2025-11-18

---

## 📖 Übersicht

Der **Project Metadata Agent** ist ein multi-language-fähiger Agent für die Extraktion von Projekt-Metadaten mit Plugin-Architektur. Er ersetzt den Java/Gradle-spezifischen Discovery Agent und unterstützt jetzt mehrere Build-Systeme und Programmiersprachen.

### ✨ Features

- **Multi-Language Support**: Gradle (Java/Kotlin), npm (TypeScript/JavaScript), erweiterbar für pip, Maven, Cargo, etc.
- **Auto-Detection**: Erkennt automatisch den Projekttyp(en) - unterstützt Monorepos mit mehreren Build-Systemen
- **Unified Schema**: Einheitliches Datenformat für alle Sprachen und Build-Systeme
- **Plugin Architecture**: Einfach erweiterbar für neue Build-Systeme

---

## 🎯 Use Cases

### 1. Projekt-Informationen abrufen (Auto-Detection)

**Szenario**: Du möchtest grundlegende Informationen über ein Projekt erhalten, ohne den Typ zu kennen.

```typescript
import { ProjectMetadataAgent } from './core/agents/projectMetadata.js';

const agent = new ProjectMetadataAgent('/path/to/project');

// Auto-Detection: Erkennt automatisch Gradle, npm, etc.
const metadata = await agent.getProjectMetadata();

console.log(`Projekt: ${metadata.name} v${metadata.version}`);
console.log(`Typ: ${metadata.projectType}`);
console.log(`Build-Tool: ${metadata.buildTool}`);
console.log(`Sprachen: ${metadata.languages.join(', ')}`);
console.log(`Dependencies: ${metadata.dependencies.length}`);
```

**Output (Gradle-Projekt)**:
```
Projekt: my-spring-app v1.0.0
Typ: gradle
Build-Tool: Gradle
Sprachen: java
Dependencies: 15
```

**Output (npm-Projekt)**:
```
Projekt: my-react-app v2.0.0
Typ: npm
Build-Tool: yarn
Sprachen: typescript, javascript
Dependencies: 42
```

---

### 2. Spezifischen Projekttyp extrahieren

**Szenario**: Du weißt, dass es ein Gradle-Projekt ist, und möchtest nur Gradle-Metadaten.

```typescript
const agent = new ProjectMetadataAgent('/path/to/java/project');

// Spezifisch Gradle-Metadaten abrufen
const gradleMetadata = await agent.getMetadataForType('gradle');

if (gradleMetadata) {
  console.log(`Java-Version: ${gradleMetadata.metadata.javaVersion}`);
  console.log(`Gradle-Version: ${gradleMetadata.metadata.gradleVersion}`);

  // Dependencies filtern
  const springDeps = gradleMetadata.dependencies.filter(d =>
    d.group?.includes('springframework')
  );
  console.log(`Spring Dependencies: ${springDeps.length}`);
}
```

---

### 3. Alle Projekttypen in einem Monorepo erkennen

**Szenario**: Du hast ein Monorepo mit Java-Backend (Gradle) und TypeScript-Frontend (npm).

```typescript
const agent = new ProjectMetadataAgent('/path/to/monorepo');

// Alle Projekttypen erkennen
const types = await agent.detectProjectTypes();
console.log(`Erkannte Typen: ${types.join(', ')}`); // ['gradle', 'npm']

// Metadaten für jeden Typ abrufen
for (const type of types) {
  const metadata = await agent.getMetadataForType(type);
  console.log(`\n${type.toUpperCase()}-Projekt:`);
  console.log(`  Name: ${metadata.name}`);
  console.log(`  Dependencies: ${metadata.dependencies.length}`);
}
```

**Output**:
```
Erkannte Typen: gradle, npm

GRADLE-Projekt:
  Name: backend-service
  Dependencies: 15

NPM-Projekt:
  Name: frontend-app
  Dependencies: 42
```

---

### 4. Build-Scripts abrufen

**Szenario**: Du möchtest wissen, welche Build-Scripts verfügbar sind.

```typescript
const agent = new ProjectMetadataAgent('/path/to/project');

// Scripts für erkannten Projekttyp
const scripts = await agent.getScripts();

console.log('Verfügbare Build-Commands:');
for (const [name, command] of Object.entries(scripts)) {
  console.log(`  ${name}: ${command}`);
}
```

**Output (Gradle)**:
```
Verfügbare Build-Commands:
  build: ./gradlew build
  test: ./gradlew test
  clean: ./gradlew clean
  run: ./gradlew run
```

**Output (npm mit yarn)**:
```
Verfügbare Build-Commands:
  build: yarn run build
  test: yarn run test
  dev: yarn run dev
  lint: yarn run lint
  install: yarn install
  update: yarn update
```

---

### 5. Dependencies analysieren

**Szenario**: Du möchtest alle Runtime-Dependencies auflisten.

```typescript
const agent = new ProjectMetadataAgent('/path/to/project');
const metadata = await agent.getProjectMetadata();

// Runtime dependencies
const runtimeDeps = metadata.dependencies.filter(d => d.scope === 'runtime');

console.log('Runtime Dependencies:');
runtimeDeps.forEach(dep => {
  const fullName = dep.group ? `${dep.group}:${dep.name}` : dep.name;
  console.log(`  ${fullName}@${dep.version}`);
});

// Dev dependencies (falls vorhanden)
if (metadata.devDependencies) {
  console.log('\nDevelopment Dependencies:');
  metadata.devDependencies.forEach(dep => {
    const fullName = dep.group ? `${dep.group}:${dep.name}` : dep.name;
    console.log(`  ${fullName}@${dep.version}`);
  });
}
```

---

### 6. Package Manager Detection (npm-Projekte)

**Szenario**: Du möchtest wissen, welcher Package Manager verwendet wird.

```typescript
const agent = new ProjectMetadataAgent('/path/to/npm/project');
const metadata = await agent.getMetadataForType('npm');

console.log(`Package Manager: ${metadata.buildTool}`); // 'npm', 'yarn', 'pnpm', 'bun'
console.log(`Node Version: ${metadata.metadata.nodeVersion}`);
console.log(`Hat TypeScript: ${metadata.metadata.hasTypeScript}`);

// Workspaces erkennen (Monorepo)
if (metadata.metadata.workspaces) {
  console.log(`Workspaces: ${metadata.metadata.workspaces.join(', ')}`);
}
```

---

## 🔧 MCP Tool: `project.meta`

### Aufruf über MCP

```json
{
  "name": "project.meta",
  "arguments": {}
}
```

**Response (Auto-Detection)**:
```json
{
  "root": "/path/to/project",
  "name": "my-app",
  "version": "1.0.0",
  "projectType": "gradle",
  "languages": ["java"],
  "buildTool": "Gradle",
  "dependencies": [
    {
      "group": "org.springframework.boot",
      "name": "spring-boot-starter-web",
      "version": "3.2.0",
      "scope": "runtime"
    }
  ],
  "metadata": {
    "gradleVersion": "8.5",
    "javaVersion": "21"
  }
}
```

### Mit spezifischem Projekttyp

```json
{
  "name": "project.meta",
  "arguments": {
    "projectType": "npm"
  }
}
```

### Legacy-Format (Gradle-spezifisch)

```json
{
  "name": "project.meta",
  "arguments": {
    "legacy": true
  }
}
```

**Response (Legacy)**:
```json
{
  "root": "/path/to/project",
  "name": "my-app",
  "buildSystem": "gradle",
  "javaVersion": "21",
  "gradleVersion": "8.5",
  "dependencies": [
    {
      "group": "org.springframework.boot",
      "artifact": "spring-boot-starter-web",
      "version": "3.2.0",
      "configuration": "implementation"
    }
  ]
}
```

---

## 🔌 Plugin-System

### Verfügbare Plugins

| Plugin | Projekttyp | Sprachen | Detection | Status |
|--------|------------|----------|-----------|--------|
| **GradleMetadataPlugin** | `gradle` | Java, Kotlin | `build.gradle(.kts)`, `settings.gradle(.kts)` | ✅ Production |
| **NpmMetadataPlugin** | `npm` | TypeScript, JavaScript | `package.json` | ✅ Production |
| **PipMetadataPlugin** | `pip` | Python | `requirements.txt`, `pyproject.toml` | 🔜 Planned |
| **MavenMetadataPlugin** | `maven` | Java | `pom.xml` | 🔜 Planned |
| **CargoMetadataPlugin** | `cargo` | Rust | `Cargo.toml` | 🔜 Planned |

### Eigenes Plugin erstellen

```typescript
import { ProjectMetadataPlugin, UnifiedProjectMetadata, ProjectType, Language } from '../types/projectMetadata.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export class MavenMetadataPlugin implements ProjectMetadataPlugin {
  readonly name = 'maven';
  readonly projectType: ProjectType = 'maven';
  readonly languages: Language[] = ['java'];

  async detect(projectRoot: string): Promise<boolean> {
    try {
      await fs.access(join(projectRoot, 'pom.xml'));
      return true;
    } catch {
      return false;
    }
  }

  async extract(projectRoot: string): Promise<UnifiedProjectMetadata> {
    const pomXml = await fs.readFile(join(projectRoot, 'pom.xml'), 'utf-8');

    // Parse pom.xml (XML parser erforderlich)
    const name = this.extractProjectName(pomXml);
    const version = this.extractVersion(pomXml);
    const dependencies = this.extractDependencies(pomXml);

    return {
      root: projectRoot,
      name,
      version,
      projectType: 'maven',
      languages: ['java'],
      buildTool: 'Maven',
      dependencies,
      discoveredAt: new Date(),
      lastModified: new Date(),
    };
  }

  async getScripts(projectRoot: string): Promise<Record<string, string>> {
    const hasWrapper = await this.fileExists(projectRoot, 'mvnw');
    const cmd = hasWrapper ? './mvnw' : 'mvn';

    return {
      build: `${cmd} clean install`,
      test: `${cmd} test`,
      package: `${cmd} package`,
      clean: `${cmd} clean`,
    };
  }

  private async fileExists(dir: string, file: string): Promise<boolean> {
    try {
      await fs.access(join(dir, file));
      return true;
    } catch {
      return false;
    }
  }

  private extractProjectName(pomXml: string): string {
    // XML parsing logic
    return 'maven-project';
  }

  private extractVersion(pomXml: string): string {
    // XML parsing logic
    return '1.0.0';
  }

  private extractDependencies(pomXml: string): UnifiedDependency[] {
    // XML parsing logic
    return [];
  }
}
```

**Plugin registrieren**:

```typescript
// In src/core/agents/projectMetadata.ts
import { MavenMetadataPlugin } from '../projectMetadata/plugins/maven/index.js';

private registerDefaultPlugins(): void {
  this.registerPlugin(new GradleMetadataPlugin());
  this.registerPlugin(new NpmMetadataPlugin());
  this.registerPlugin(new MavenMetadataPlugin()); // NEU!
}
```

---

## 🧪 Testing

### Unit Tests für Plugins

```typescript
import { describe, it, expect } from 'vitest';
import { MavenMetadataPlugin } from '../../../src/core/projectMetadata/plugins/maven/index.js';
import path from 'path';

describe('MavenMetadataPlugin', () => {
  const testProjectPath = path.join(__dirname, '../../fixtures/maven-projects/simple');

  it('should detect maven project', async () => {
    const plugin = new MavenMetadataPlugin();
    const detected = await plugin.detect(testProjectPath);
    expect(detected).toBe(true);
  });

  it('should extract maven metadata', async () => {
    const plugin = new MavenMetadataPlugin();
    const metadata = await plugin.extract(testProjectPath);

    expect(metadata.name).toBe('maven-test-project');
    expect(metadata.projectType).toBe('maven');
    expect(metadata.buildTool).toBe('Maven');
  });

  it('should extract maven dependencies', async () => {
    const plugin = new MavenMetadataPlugin();
    const metadata = await plugin.extract(testProjectPath);

    expect(metadata.dependencies.length).toBeGreaterThan(0);

    const junitDep = metadata.dependencies.find(d => d.name === 'junit-jupiter');
    expect(junitDep).toBeDefined();
    expect(junitDep.scope).toBe('test');
  });
});
```

---

## 📊 Comparison: Discovery Agent vs Project Metadata Agent

| Feature | Discovery Agent (Legacy) | Project Metadata Agent (Neu) |
|---------|--------------------------|-------------------------------|
| **Projekttypen** | Nur Gradle | Gradle, npm, pip, Maven, etc. |
| **Auto-Detection** | ❌ Nein | ✅ Ja |
| **Unified Schema** | ❌ Nein | ✅ Ja |
| **Erweiterbar** | ❌ Schwer | ✅ Plugin-System |
| **Monorepo Support** | ❌ Nein | ✅ Ja |
| **Package Manager Detection** | ❌ Nein | ✅ Ja (npm/yarn/pnpm/bun) |
| **Status** | ⚠️ Deprecated | ✅ Production-Ready |
| **Verwendung** | Nur Gradle-Projekte | Alle Projekttypen |

---

## 🔄 Migration von Discovery Agent

### Alt (Discovery Agent)

```typescript
import { DiscoveryAgent } from './core/agents/discovery.js';

const agent = new DiscoveryAgent('/path/to/gradle/project');
const metadata = await agent.analyze(); // Legacy Gradle-Format

console.log(`Java-Version: ${metadata.javaVersion}`);
console.log(`Dependencies: ${metadata.dependencies.length}`);
```

### Neu (Project Metadata Agent)

```typescript
import { ProjectMetadataAgent } from './core/agents/projectMetadata.js';

const agent = new ProjectMetadataAgent('/path/to/project');

// Option 1: Auto-Detection
const metadata = await agent.getProjectMetadata();

// Option 2: Spezifischer Typ
const gradleMetadata = await agent.getMetadataForType('gradle');

// Option 3: Legacy-Format (für Backward Compatibility)
const service = new CodeWeaverService('/path/to/project');
const legacyMetadata = await service.getProjectMetadata();

console.log(`Java-Version: ${metadata.metadata.javaVersion}`);
console.log(`Dependencies: ${metadata.dependencies.length}`);
```

---

## ⚠️ Troubleshooting

### Problem: Projekt wird nicht erkannt

```typescript
const agent = new ProjectMetadataAgent('/path/to/project');
const types = await agent.detectProjectTypes();

if (types.includes('unknown')) {
  console.log('Kein bekannter Projekttyp erkannt');
  console.log('Verfügbare Plugins:', agent.getSupportedProjectTypes());

  // Check: Sind die Build-Files vorhanden?
  // - Gradle: build.gradle oder build.gradle.kts
  // - npm: package.json
  // - Maven: pom.xml
  // - pip: requirements.txt oder pyproject.toml
}
```

### Problem: Dependencies fehlen

```typescript
const metadata = await agent.getProjectMetadata();

if (metadata.dependencies.length === 0) {
  console.log('Keine Dependencies gefunden');

  // Gradle: Check build.gradle für dependencies { ... }
  // npm: Check package.json für "dependencies" und "devDependencies"
}
```

### Problem: Falscher Package Manager erkannt

```typescript
const npmMetadata = await agent.getMetadataForType('npm');

console.log(`Erkannter Package Manager: ${npmMetadata.buildTool}`);

// Detection basiert auf Lock-Files:
// - npm: package-lock.json
// - yarn: yarn.lock
// - pnpm: pnpm-lock.yaml
// - bun: bun.lockb

// Falls falsch: Check welche Lock-Files vorhanden sind
```

---

## 🚀 Best Practices

### 1. Nutze Auto-Detection

```typescript
// ✅ EMPFOHLEN: Auto-Detection
const metadata = await agent.getProjectMetadata();

// ❌ NICHT EMPFOHLEN: Hartcodierter Typ
const metadata = await agent.getMetadataForType('gradle');
```

### 2. Handle Unknown Projects

```typescript
const metadata = await agent.getProjectMetadata();

if (metadata === null) {
  console.log('Projekt nicht erkannt - kein unterstützter Build-System gefunden');
  return;
}

// Weiter mit metadata...
```

### 3. Cache Project Metadata

```typescript
class ProjectService {
  private metadataCache: UnifiedProjectMetadata | null = null;

  async getMetadata(): Promise<UnifiedProjectMetadata | null> {
    if (this.metadataCache) {
      return this.metadataCache;
    }

    const agent = new ProjectMetadataAgent(this.projectRoot);
    this.metadataCache = await agent.getProjectMetadata();
    return this.metadataCache;
  }
}
```

### 4. Filter Dependencies by Scope

```typescript
const metadata = await agent.getProjectMetadata();

// Nur Production Dependencies
const prodDeps = metadata.dependencies.filter(d => d.scope === 'runtime');

// Nur Test Dependencies
const testDeps = metadata.dependencies.filter(d => d.scope === 'test');

// Nur Dev Dependencies (npm)
const devDeps = metadata.devDependencies || [];
```

---

## 📚 Weitere Ressourcen

- **[DATA_MODELS.md](../architecture/DATA_MODELS.md)** - Vollständige Schema-Dokumentation
- **[PRODUCTION_READINESS.md](../getting-started/PRODUCTION_READINESS.md)** - Production-Status
- **[GLOSSARY.md](../GLOSSARY.md)** - Begriffe & Definitionen
- **[Source Code](../../src/core/agents/projectMetadata.ts)** - Implementation
- **[Tests](../../tests/unit/agents/projectMetadata.test.ts)** - 23 Tests

---

## 💡 FAQ

**Q: Kann ich mehrere Projekttypen gleichzeitig extrahieren?**
A: Ja! `detectProjectTypes()` gibt ein Array zurück. Du kannst dann `getMetadataForType()` für jeden Typ aufrufen.

**Q: Ist Discovery Agent veraltet?**
A: Ja, Discovery Agent ist deprecated. Er funktioniert noch als Wrapper, wird aber in v1.0 entfernt. Nutze Project Metadata Agent.

**Q: Wie füge ich Unterstützung für ein neues Build-System hinzu?**
A: Erstelle ein neues Plugin, implementiere das `ProjectMetadataPlugin` Interface, und registriere es in `ProjectMetadataAgent.registerDefaultPlugins()`.

**Q: Funktioniert es mit Monorepos?**
A: Ja! Der Agent erkennt mehrere Projekttypen im selben Verzeichnis.

**Q: Was passiert wenn kein Projekt erkannt wird?**
A: `getProjectMetadata()` gibt `null` zurück und `detectProjectTypes()` gibt `['unknown']` zurück.

---

**Version**: v0.3.1+
**Status**: ✅ Production-Ready
**Feedback**: [GitHub Issues](https://github.com/your-org/codeweaver/issues)
