import { describe, it, expect } from 'vitest';
import { DiscoveryAgent } from '../../../src/core/agents/discovery.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DiscoveryAgent', () => {
  const testProjectPath = path.join(__dirname, '../../fixtures/gradle-projects/simple');

  it('should detect gradle project', async () => {
    const agent = new DiscoveryAgent(testProjectPath);
    const isGradle = await agent.detectGradleProject();
    expect(isGradle).toBe(true);
  });

  it('should analyze project and return metadata', async () => {
    const agent = new DiscoveryAgent(testProjectPath);
    const metadata = await agent.analyze();

    expect(metadata.root).toBe(testProjectPath);
    expect(metadata.name).toBe('test-project');
    expect(metadata.buildSystem).toBe('gradle');
    expect(metadata.javaVersion).toBe('21');
    expect(metadata.version).toBe('1.0.0');
  });

  it('should extract modules', async () => {
    const agent = new DiscoveryAgent(testProjectPath);
    const metadata = await agent.analyze();

    expect(metadata.modules).toHaveLength(1);
    expect(metadata.modules[0].name).toBe('test-project');
    expect(metadata.modules[0].type).toBe('root');
  });

  it('should extract dependencies', async () => {
    const agent = new DiscoveryAgent(testProjectPath);
    const metadata = await agent.analyze();

    expect(metadata.dependencies.length).toBeGreaterThan(0);
    const springBoot = metadata.dependencies.find(d =>
      d.artifact === 'spring-boot-starter-web'
    );
    expect(springBoot).toBeDefined();
    expect(springBoot?.group).toBe('org.springframework.boot');
    expect(springBoot?.version).toBe('3.2.0');
  });
});
