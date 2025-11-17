/**
 * Tests for LanguagePluginRegistry
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { LanguagePluginRegistry } from '../../../src/core/language/registry.js';
import type { LanguagePlugin } from '../../../src/core/language/plugin.js';
import type { LanguageMetadata, ParseResult, PluginConfig } from '../../../src/types/language.js';
import type { SymbolDefinition } from '../../../src/types/symbols.js';

// Mock Plugin for Testing
class MockJavaPlugin implements LanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'java',
    fileExtensions: ['.java'],
    displayName: 'Java',
    supportsGenerics: true,
    supportsDecorators: true,
    supportsModules: true,
    supportsClasses: true,
    supportsFunctions: true,
  };

  async parse(source: string, filePath: string, config?: PluginConfig): Promise<ParseResult> {
    return {
      ast: { type: 'mock-java-ast' },
      errors: [],
      success: true,
      filePath,
    };
  }

  async extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    return [];
  }

  async indexFile(filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    return [];
  }

  canHandle(filePath: string): boolean {
    return filePath.endsWith('.java');
  }
}

class MockTypeScriptPlugin implements LanguagePlugin {
  readonly metadata: LanguageMetadata = {
    language: 'typescript',
    fileExtensions: ['.ts', '.tsx'],
    displayName: 'TypeScript',
    supportsGenerics: true,
    supportsDecorators: true,
    supportsModules: true,
    supportsClasses: true,
    supportsFunctions: true,
  };

  async parse(source: string, filePath: string, config?: PluginConfig): Promise<ParseResult> {
    return {
      ast: { type: 'mock-ts-ast' },
      errors: [],
      success: true,
      filePath,
    };
  }

  async extractSymbols(ast: any, filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    return [];
  }

  async indexFile(filePath: string, config?: PluginConfig): Promise<SymbolDefinition[]> {
    return [];
  }

  canHandle(filePath: string): boolean {
    return filePath.endsWith('.ts') || filePath.endsWith('.tsx');
  }
}

describe('LanguagePluginRegistry', () => {
  let registry: LanguagePluginRegistry;

  beforeEach(() => {
    registry = new LanguagePluginRegistry();
  });

  describe('register', () => {
    it('should register a plugin', () => {
      const plugin = new MockJavaPlugin();
      registry.register('java', plugin);

      expect(registry.hasPlugin('java')).toBe(true);
      expect(registry.getPlugin('java')).toBe(plugin);
    });

    it('should throw if registering duplicate language', () => {
      const plugin1 = new MockJavaPlugin();
      const plugin2 = new MockJavaPlugin();

      registry.register('java', plugin1);
      expect(() => registry.register('java', plugin2)).toThrow('already registered');
    });

    it('should throw if plugin metadata does not match language', () => {
      const plugin = new MockJavaPlugin();
      expect(() => registry.register('typescript' as any, plugin)).toThrow(
        'Plugin metadata language'
      );
    });
  });

  describe('registerOrReplace', () => {
    it('should register new plugin', () => {
      const plugin = new MockJavaPlugin();
      registry.registerOrReplace('java', plugin);

      expect(registry.hasPlugin('java')).toBe(true);
    });

    it('should replace existing plugin', () => {
      const plugin1 = new MockJavaPlugin();
      const plugin2 = new MockJavaPlugin();

      registry.registerOrReplace('java', plugin1);
      expect(registry.getPlugin('java')).toBe(plugin1);

      registry.registerOrReplace('java', plugin2);
      expect(registry.getPlugin('java')).toBe(plugin2);
    });
  });

  describe('unregister', () => {
    it('should unregister plugin', () => {
      const plugin = new MockJavaPlugin();
      registry.register('java', plugin);

      expect(registry.hasPlugin('java')).toBe(true);
      const removed = registry.unregister('java');
      expect(removed).toBe(true);
      expect(registry.hasPlugin('java')).toBe(false);
    });

    it('should return false if plugin not found', () => {
      const removed = registry.unregister('java');
      expect(removed).toBe(false);
    });
  });

  describe('getPlugin', () => {
    it('should return registered plugin', () => {
      const plugin = new MockJavaPlugin();
      registry.register('java', plugin);

      expect(registry.getPlugin('java')).toBe(plugin);
    });

    it('should return undefined for unregistered language', () => {
      expect(registry.getPlugin('java')).toBeUndefined();
    });
  });

  describe('getPluginForFile', () => {
    beforeEach(() => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());
    });

    it('should return plugin for Java file', () => {
      const plugin = registry.getPluginForFile('Example.java');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.language).toBe('java');
    });

    it('should return plugin for TypeScript file', () => {
      const plugin = registry.getPluginForFile('Component.ts');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.language).toBe('typescript');
    });

    it('should return plugin for TSX file', () => {
      const plugin = registry.getPluginForFile('Component.tsx');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.language).toBe('typescript');
    });

    it('should return undefined for unsupported file', () => {
      const plugin = registry.getPluginForFile('README.md');
      expect(plugin).toBeUndefined();
    });
  });

  describe('hasPlugin', () => {
    it('should return true for registered language', () => {
      registry.register('java', new MockJavaPlugin());
      expect(registry.hasPlugin('java')).toBe(true);
    });

    it('should return false for unregistered language', () => {
      expect(registry.hasPlugin('java')).toBe(false);
    });
  });

  describe('canHandle', () => {
    beforeEach(() => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());
    });

    it('should return true for supported files', () => {
      expect(registry.canHandle('Example.java')).toBe(true);
      expect(registry.canHandle('Component.ts')).toBe(true);
      expect(registry.canHandle('Component.tsx')).toBe(true);
    });

    it('should return false for unsupported files', () => {
      expect(registry.canHandle('README.md')).toBe(false);
      expect(registry.canHandle('script.py')).toBe(false);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return empty array when no plugins registered', () => {
      expect(registry.getSupportedLanguages()).toEqual([]);
    });

    it('should return all registered languages', () => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());

      const languages = registry.getSupportedLanguages();
      expect(languages).toContain('java');
      expect(languages).toContain('typescript');
      expect(languages.length).toBe(2);
    });

    it('should return sorted array', () => {
      registry.register('typescript', new MockTypeScriptPlugin());
      registry.register('java', new MockJavaPlugin());

      const languages = registry.getSupportedLanguages();
      expect(languages).toEqual(['java', 'typescript']);
    });
  });

  describe('getAllPlugins', () => {
    it('should return empty array when no plugins registered', () => {
      expect(registry.getAllPlugins()).toEqual([]);
    });

    it('should return all plugins', () => {
      const javaPlugin = new MockJavaPlugin();
      const tsPlugin = new MockTypeScriptPlugin();

      registry.register('java', javaPlugin);
      registry.register('typescript', tsPlugin);

      const plugins = registry.getAllPlugins();
      expect(plugins).toContain(javaPlugin);
      expect(plugins).toContain(tsPlugin);
      expect(plugins.length).toBe(2);
    });
  });

  describe('size', () => {
    it('should return 0 when empty', () => {
      expect(registry.size()).toBe(0);
    });

    it('should return number of registered plugins', () => {
      registry.register('java', new MockJavaPlugin());
      expect(registry.size()).toBe(1);

      registry.register('typescript', new MockTypeScriptPlugin());
      expect(registry.size()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should remove all plugins', () => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());

      expect(registry.size()).toBe(2);
      registry.clear();
      expect(registry.size()).toBe(0);
      expect(registry.hasPlugin('java')).toBe(false);
      expect(registry.hasPlugin('typescript')).toBe(false);
    });
  });

  describe('getPluginInfo', () => {
    it('should return empty array when no plugins', () => {
      expect(registry.getPluginInfo()).toEqual([]);
    });

    it('should return plugin metadata', () => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());

      const info = registry.getPluginInfo();
      expect(info.length).toBe(2);

      const javaInfo = info.find((i) => i.language === 'java');
      expect(javaInfo).toBeDefined();
      expect(javaInfo?.displayName).toBe('Java');
      expect(javaInfo?.fileExtensions).toEqual(['.java']);
      expect(javaInfo?.supportsGenerics).toBe(true);

      const tsInfo = info.find((i) => i.language === 'typescript');
      expect(tsInfo).toBeDefined();
      expect(tsInfo?.displayName).toBe('TypeScript');
      expect(tsInfo?.fileExtensions).toEqual(['.ts', '.tsx']);
    });
  });

  describe('filterSupportedFiles', () => {
    beforeEach(() => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());
    });

    it('should filter supported files', () => {
      const files = [
        'Example.java',
        'Component.ts',
        'Component.tsx',
        'README.md',
        'script.py',
        'config.json',
      ];

      const supported = registry.filterSupportedFiles(files);
      expect(supported).toEqual(['Example.java', 'Component.ts', 'Component.tsx']);
    });

    it('should return empty array if no files supported', () => {
      const files = ['README.md', 'config.json'];
      expect(registry.filterSupportedFiles(files)).toEqual([]);
    });
  });

  describe('groupFilesByLanguage', () => {
    beforeEach(() => {
      registry.register('java', new MockJavaPlugin());
      registry.register('typescript', new MockTypeScriptPlugin());
    });

    it('should group files by language', () => {
      const files = [
        'A.java',
        'B.ts',
        'C.java',
        'D.tsx',
        'README.md', // Should be ignored
      ];

      const grouped = registry.groupFilesByLanguage(files);

      expect(grouped.size).toBe(2);
      expect(grouped.get('java')).toEqual(['A.java', 'C.java']);
      expect(grouped.get('typescript')).toEqual(['B.ts', 'D.tsx']);
      expect(grouped.has('unknown')).toBe(false);
    });

    it('should return empty map for unsupported files', () => {
      const files = ['README.md', 'config.json'];
      const grouped = registry.groupFilesByLanguage(files);
      expect(grouped.size).toBe(0);
    });
  });
});
