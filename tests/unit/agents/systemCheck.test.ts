import { describe, it, expect } from 'vitest';
import { SystemCheckAgent } from '../../../src/core/agents/systemCheck.js';

describe('SystemCheckAgent', () => {
  describe('Quick Check (Critical Dependencies)', () => {
    it('should check Node.js and Git', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runQuickCheck();

      expect(result).toBeDefined();
      expect(result.checks).toHaveLength(2); // Node.js + Git
      expect(result.timestamp).toBeInstanceOf(Date);

      // Node.js should always be installed (we're running in Node.js)
      const nodeCheck = result.checks.find(c => c.name === 'Node.js');
      expect(nodeCheck).toBeDefined();
      expect(nodeCheck?.installed).toBe(true);
      expect(nodeCheck?.required).toBe(true);
      expect(nodeCheck?.version).toBeDefined();
    });

    it('should report if Git is installed', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runQuickCheck();

      const gitCheck = result.checks.find(c => c.name === 'Git');
      expect(gitCheck).toBeDefined();
      expect(gitCheck?.required).toBe(true);

      // Git might or might not be installed, but check should exist
      if (gitCheck?.installed) {
        expect(gitCheck.version).toBeDefined();
      }
    });
  });

  describe('Full Check (All Dependencies)', () => {
    it('should check all dependencies', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runFullCheck();

      expect(result).toBeDefined();
      expect(result.checks.length).toBeGreaterThanOrEqual(2); // At least Node.js + Git

      // Should check: Node.js, Git, Python, Gradle, Maven
      const dependencyNames = result.checks.map(c => c.name);
      expect(dependencyNames).toContain('Node.js');
      expect(dependencyNames).toContain('Git');
      expect(dependencyNames).toContain('Python');
      expect(dependencyNames).toContain('Gradle');
      expect(dependencyNames).toContain('Maven');
    });

    it('should mark optional dependencies correctly', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runFullCheck();

      const pythonCheck = result.checks.find(c => c.name === 'Python');
      expect(pythonCheck).toBeDefined();
      expect(pythonCheck?.required).toBe(false); // Python is optional

      const gradleCheck = result.checks.find(c => c.name === 'Gradle');
      expect(gradleCheck).toBeDefined();
      expect(gradleCheck?.required).toBe(false); // Gradle is optional

      const mavenCheck = result.checks.find(c => c.name === 'Maven');
      expect(mavenCheck).toBeDefined();
      expect(mavenCheck?.required).toBe(false); // Maven is optional
    });
  });

  describe('Individual Dependency Checks', () => {
    it('should check Node.js individually', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.checkDependency('node');

      expect(result).toBeDefined();
      expect(result.name).toBe('Node.js');
      expect(result.required).toBe(true);
      expect(result.installed).toBe(true);
      expect(result.version).toBeDefined();
    });

    it('should check Git individually', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.checkDependency('git');

      expect(result).toBeDefined();
      expect(result.name).toBe('Git');
      expect(result.required).toBe(true);

      // Git might or might not be installed
      if (result.installed) {
        expect(result.version).toBeDefined();
      } else {
        expect(result.error).toBeDefined();
      }
    });

    it('should check Python individually', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.checkDependency('python');

      expect(result).toBeDefined();
      expect(result.name).toBe('Python');
      expect(result.required).toBe(false);

      // Python might or might not be installed
      if (result.installed) {
        expect(result.version).toBeDefined();
      }
    });
  });

  describe('Result Structure', () => {
    it('should return valid result structure', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runQuickCheck();

      expect(result).toHaveProperty('allPassed');
      expect(result).toHaveProperty('checks');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('errors');
      expect(result).toHaveProperty('timestamp');

      expect(Array.isArray(result.checks)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(typeof result.allPassed).toBe('boolean');
    });

    it('should have valid check structure', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runQuickCheck();

      for (const check of result.checks) {
        expect(check).toHaveProperty('name');
        expect(check).toHaveProperty('required');
        expect(check).toHaveProperty('installed');
        expect(typeof check.name).toBe('string');
        expect(typeof check.required).toBe('boolean');
        expect(typeof check.installed).toBe('boolean');

        if (check.installed) {
          expect(check.version).toBeDefined();
          expect(typeof check.version).toBe('string');
        }
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing critical dependencies', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runQuickCheck();

      // If Git is not installed, allPassed should be false
      const gitCheck = result.checks.find(c => c.name === 'Git');
      if (gitCheck && !gitCheck.installed) {
        expect(result.allPassed).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it('should not fail on missing optional dependencies', async () => {
      const agent = new SystemCheckAgent();
      const result = await agent.runFullCheck();

      // Missing optional dependencies should generate warnings, not errors
      const optionalChecks = result.checks.filter(c => !c.required && !c.installed);

      for (const check of optionalChecks) {
        // Optional missing deps should be in warnings, not errors
        const hasWarning = result.warnings.some(w => w.includes(check.name));
        expect(hasWarning).toBe(true);
      }
    });
  });
});
