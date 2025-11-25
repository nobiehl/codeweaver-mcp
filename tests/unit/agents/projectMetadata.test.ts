import { describe, it, expect } from 'vitest';
import { ProjectMetadataAgent } from '../../../src/core/agents/projectMetadata.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('ProjectMetadataAgent', () => {
  describe('Gradle Project', () => {
    const gradleProjectPath = path.join(__dirname, '../../fixtures/gradle-projects/simple');

    it('should detect gradle project type', async () => {
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const types = await agent.detectProjectTypes();

      expect(types).toContain('gradle');
    });

    it('should extract gradle project metadata', async () => {
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('test-project');
      expect(metadata!.version).toBe('1.0.0');
      expect(metadata!.projectType).toBe('gradle');
      expect(metadata!.languages).toContain('java');
      expect(metadata!.buildTool).toBe('Gradle');
    });

    it('should extract gradle dependencies', async () => {
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata!.dependencies.length).toBeGreaterThan(0);

      const springBoot = metadata!.dependencies.find(d =>
        d.name === 'spring-boot-starter-web'
      );
      expect(springBoot).toBeDefined();
      expect(springBoot!.group).toBe('org.springframework.boot');
      expect(springBoot!.version).toBe('3.2.0');
      expect(springBoot!.scope).toBe('runtime');
    });

    it('should extract gradle scripts', async () => {
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const scripts = await agent.getScripts('gradle');

      expect(scripts).toBeDefined();
      expect(scripts.build).toBe('./gradlew build');
      expect(scripts.test).toBe('./gradlew test');
      expect(scripts.clean).toBe('./gradlew clean');
    });

    it('should get metadata for specific type', async () => {
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const metadata = await agent.getMetadataForType('gradle');

      expect(metadata).toBeDefined();
      expect(metadata!.projectType).toBe('gradle');
      expect(metadata!.name).toBe('test-project');
    });
  });

  describe('npm Project (JavaScript)', () => {
    const npmProjectPath = path.join(__dirname, '../../fixtures/npm-projects/simple');

    it('should detect npm project type', async () => {
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const types = await agent.detectProjectTypes();

      expect(types).toContain('npm');
    });

    it('should extract npm project metadata', async () => {
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata).toBeDefined();
      expect(metadata!.name).toBe('test-npm-project');
      expect(metadata!.version).toBe('1.0.0');
      expect(metadata!.projectType).toBe('npm');
      expect(metadata!.languages).toContain('javascript');
      expect(metadata!.buildTool).toBe('npm'); // Detected from package-lock.json
    });

    it('should extract npm dependencies with correct scopes', async () => {
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const metadata = await agent.getProjectMetadata();

      // Runtime dependencies
      const express = metadata!.dependencies.find(d => d.name === 'express');
      expect(express).toBeDefined();
      expect(express!.scope).toBe('runtime');
      expect(express!.version).toBe('4.18.2');

      // Peer dependencies
      const react = metadata!.dependencies.find(d => d.name === 'react');
      expect(react).toBeDefined();
      expect(react!.scope).toBe('peer');
    });

    it('should extract npm dev dependencies', async () => {
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata!.devDependencies).toBeDefined();
      expect(metadata!.devDependencies!.length).toBeGreaterThan(0);

      const jest = metadata!.devDependencies!.find(d => d.name === 'jest');
      expect(jest).toBeDefined();
      expect(jest!.scope).toBe('dev');
      expect(jest!.version).toBe('29.5.0');
    });

    it('should extract npm scripts', async () => {
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const scripts = await agent.getScripts('npm');

      expect(scripts).toBeDefined();
      expect(scripts.test).toBe('npm run test');
      expect(scripts.build).toBe('npm run build');
      expect(scripts.start).toBe('npm run start');
      expect(scripts.install).toBe('npm install');
      expect(scripts.update).toBe('npm update');
    });

    it('should extract node/npm version requirements', async () => {
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata!.metadata).toBeDefined();
      expect(metadata!.metadata!.nodeVersion).toBe('>=18.0.0');
      expect(metadata!.metadata!.npmVersion).toBe('>=9.0.0');
    });
  });

  describe('npm Project (TypeScript)', () => {
    const tsProjectPath = path.join(__dirname, '../../fixtures/npm-projects/typescript');

    it('should detect TypeScript in npm project', async () => {
      const agent = new ProjectMetadataAgent(tsProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata).toBeDefined();
      expect(metadata!.languages).toContain('typescript');
      expect(metadata!.languages).toContain('javascript');
      expect(metadata!.metadata!.hasTypeScript).toBe(true);
    });

    it('should detect yarn as package manager', async () => {
      const agent = new ProjectMetadataAgent(tsProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata!.buildTool).toBe('yarn');
      expect(metadata!.metadata!.packageManager).toBe('yarn');
    });

    it('should extract typescript project scripts with yarn', async () => {
      const agent = new ProjectMetadataAgent(tsProjectPath);
      const scripts = await agent.getScripts('npm');

      expect(scripts.test).toBe('yarn run test');
      expect(scripts.build).toBe('yarn run build');
      expect(scripts.dev).toBe('yarn run dev');
    });
  });

  describe('Plugin Registry', () => {
    it('should list all supported project types', () => {
      const agent = new ProjectMetadataAgent('/any/path');
      const types = agent.getSupportedProjectTypes();

      expect(types).toContain('gradle');
      expect(types).toContain('npm');
      expect(types.length).toBeGreaterThanOrEqual(2);
    });

    it('should check if specific plugin exists', () => {
      const agent = new ProjectMetadataAgent('/any/path');

      expect(agent.hasPlugin('gradle')).toBe(true);
      expect(agent.hasPlugin('npm')).toBe(true);
      expect(agent.hasPlugin('pip' as any)).toBe(false);
    });

    it('should get specific plugin', () => {
      const agent = new ProjectMetadataAgent('/any/path');

      const gradlePlugin = agent.getPlugin('gradle');
      expect(gradlePlugin).toBeDefined();
      expect(gradlePlugin!.name).toBe('gradle');
      expect(gradlePlugin!.languages).toContain('java');

      const npmPlugin = agent.getPlugin('npm');
      expect(npmPlugin).toBeDefined();
      expect(npmPlugin!.name).toBe('npm');
      expect(npmPlugin!.languages).toContain('javascript');
      expect(npmPlugin!.languages).toContain('typescript');
    });
  });

  describe('Unknown Project', () => {
    const emptyPath = path.join(__dirname, '../../fixtures');

    it('should return unknown when no project detected', async () => {
      const agent = new ProjectMetadataAgent(emptyPath);
      const types = await agent.detectProjectTypes();

      expect(types).toContain('unknown');
    });

    it('should return null metadata for unknown project', async () => {
      const agent = new ProjectMetadataAgent(emptyPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata).toBeNull();
    });

    it('should return empty scripts for unknown project', async () => {
      const agent = new ProjectMetadataAgent(emptyPath);
      const scripts = await agent.getScripts();

      expect(scripts).toEqual({});
    });
  });

  describe('Auto-detection', () => {
    it('should auto-detect project type from gradle project', async () => {
      const gradleProjectPath = path.join(__dirname, '../../fixtures/gradle-projects/simple');
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata).toBeDefined();
      expect(metadata!.projectType).toBe('gradle');
    });

    it('should auto-detect project type from npm project', async () => {
      const npmProjectPath = path.join(__dirname, '../../fixtures/npm-projects/simple');
      const agent = new ProjectMetadataAgent(npmProjectPath);
      const metadata = await agent.getProjectMetadata();

      expect(metadata).toBeDefined();
      expect(metadata!.projectType).toBe('npm');
    });

    it('should auto-detect scripts without specifying project type', async () => {
      const gradleProjectPath = path.join(__dirname, '../../fixtures/gradle-projects/simple');
      const agent = new ProjectMetadataAgent(gradleProjectPath);
      const scripts = await agent.getScripts(); // No project type specified

      expect(scripts).toBeDefined();
      expect(scripts.build).toBe('./gradlew build');
    });
  });
});
