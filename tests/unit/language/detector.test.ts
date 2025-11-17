/**
 * Tests for LanguageDetector
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LanguageDetector } from '../../../src/core/language/detector.js';

describe('LanguageDetector', () => {
  describe('detectLanguage', () => {
    it('should detect Java files', () => {
      expect(LanguageDetector.detectLanguage('Example.java')).toBe('java');
      expect(LanguageDetector.detectLanguage('src/main/java/Example.java')).toBe('java');
      expect(LanguageDetector.detectLanguage('/absolute/path/Example.java')).toBe('java');
    });

    it('should detect TypeScript files', () => {
      expect(LanguageDetector.detectLanguage('Component.ts')).toBe('typescript');
      expect(LanguageDetector.detectLanguage('Component.tsx')).toBe('typescript');
      expect(LanguageDetector.detectLanguage('module.mts')).toBe('typescript');
      expect(LanguageDetector.detectLanguage('module.cts')).toBe('typescript');
    });

    it('should detect JavaScript files', () => {
      expect(LanguageDetector.detectLanguage('script.js')).toBe('javascript');
      expect(LanguageDetector.detectLanguage('app.jsx')).toBe('javascript');
      expect(LanguageDetector.detectLanguage('module.mjs')).toBe('javascript');
      expect(LanguageDetector.detectLanguage('module.cjs')).toBe('javascript');
    });

    it('should detect Python files', () => {
      expect(LanguageDetector.detectLanguage('script.py')).toBe('python');
      expect(LanguageDetector.detectLanguage('types.pyi')).toBe('python');
      expect(LanguageDetector.detectLanguage('gui.pyw')).toBe('python');
    });

    it('should detect Go files', () => {
      expect(LanguageDetector.detectLanguage('main.go')).toBe('go');
    });

    it('should detect Rust files', () => {
      expect(LanguageDetector.detectLanguage('main.rs')).toBe('rust');
    });

    it('should detect Markdown files', () => {
      expect(LanguageDetector.detectLanguage('README.md')).toBe('markdown');
      expect(LanguageDetector.detectLanguage('docs.markdown')).toBe('markdown');
      expect(LanguageDetector.detectLanguage('file.mdown')).toBe('markdown');
      expect(LanguageDetector.detectLanguage('file.mkd')).toBe('markdown');
    });

    it('should detect Python files', () => {
      expect(LanguageDetector.detectLanguage('app.py')).toBe('python');
      expect(LanguageDetector.detectLanguage('types.pyi')).toBe('python');
      expect(LanguageDetector.detectLanguage('script.pyw')).toBe('python');
    });

    it('should return unknown for unsupported files', () => {
      expect(LanguageDetector.detectLanguage('config.json')).toBe('unknown');
      expect(LanguageDetector.detectLanguage('styles.css')).toBe('unknown');
      expect(LanguageDetector.detectLanguage('no-extension')).toBe('unknown');
    });

    it('should be case-insensitive', () => {
      expect(LanguageDetector.detectLanguage('Example.JAVA')).toBe('java');
      expect(LanguageDetector.detectLanguage('Component.TS')).toBe('typescript');
      expect(LanguageDetector.detectLanguage('Script.JS')).toBe('javascript');
    });
  });

  describe('isSupported', () => {
    it('should return true for supported files', () => {
      expect(LanguageDetector.isSupported('Example.java')).toBe(true);
      expect(LanguageDetector.isSupported('App.ts')).toBe(true);
      expect(LanguageDetector.isSupported('script.js')).toBe(true);
      expect(LanguageDetector.isSupported('README.md')).toBe(true);
      expect(LanguageDetector.isSupported('app.py')).toBe(true);
    });

    it('should return false for unsupported files', () => {
      expect(LanguageDetector.isSupported('config.json')).toBe(false);
      expect(LanguageDetector.isSupported('styles.css')).toBe(false);
    });
  });

  describe('isSupportedLanguage', () => {
    it('should return true for supported languages', () => {
      expect(LanguageDetector.isSupportedLanguage('java')).toBe(true);
      expect(LanguageDetector.isSupportedLanguage('typescript')).toBe(true);
      expect(LanguageDetector.isSupportedLanguage('javascript')).toBe(true);
      expect(LanguageDetector.isSupportedLanguage('markdown')).toBe(true);
      expect(LanguageDetector.isSupportedLanguage('python')).toBe(true); // Already in list!
      expect(LanguageDetector.isSupportedLanguage('go')).toBe(true);
      expect(LanguageDetector.isSupportedLanguage('rust')).toBe(true);
    });

    it('should return false for unknown language', () => {
      expect(LanguageDetector.isSupportedLanguage('unknown')).toBe(false);
    });
  });

  describe('getExtensions', () => {
    it('should return extensions for Java', () => {
      const exts = LanguageDetector.getExtensions('java');
      expect(exts).toEqual(['.java']);
    });

    it('should return extensions for TypeScript', () => {
      const exts = LanguageDetector.getExtensions('typescript');
      expect(exts).toContain('.ts');
      expect(exts).toContain('.tsx');
      expect(exts).toContain('.mts');
      expect(exts).toContain('.cts');
      expect(exts.length).toBe(4);
    });

    it('should return extensions for JavaScript', () => {
      const exts = LanguageDetector.getExtensions('javascript');
      expect(exts).toContain('.js');
      expect(exts).toContain('.jsx');
      expect(exts).toContain('.mjs');
      expect(exts).toContain('.cjs');
    });

    it('should return extensions for Markdown', () => {
      const exts = LanguageDetector.getExtensions('markdown');
      expect(exts).toContain('.md');
      expect(exts).toContain('.markdown');
      expect(exts).toContain('.mdown');
      expect(exts).toContain('.mkd');
      expect(exts.length).toBe(4);
    });

    it('should return extensions for Python', () => {
      const exts = LanguageDetector.getExtensions('python');
      expect(exts).toContain('.py');
      expect(exts).toContain('.pyi');
      expect(exts).toContain('.pyw');
      expect(exts.length).toBe(3);
    });

    it('should return empty array for unknown language', () => {
      expect(LanguageDetector.getExtensions('unknown')).toEqual([]);
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = LanguageDetector.getSupportedLanguages();
      expect(languages).toContain('java');
      expect(languages).toContain('typescript');
      expect(languages).toContain('javascript');
      expect(languages).toContain('markdown');
      expect(languages).toContain('python'); // Already tested!
      expect(languages).toContain('go');
      expect(languages).toContain('rust');
      expect(languages).not.toContain('unknown');
    });

    it('should return sorted array', () => {
      const languages = LanguageDetector.getSupportedLanguages();
      const sorted = [...languages].sort();
      expect(languages).toEqual(sorted);
    });
  });

  describe('getSupportedExtensions', () => {
    it('should return all supported extensions', () => {
      const extensions = LanguageDetector.getSupportedExtensions();
      expect(extensions).toContain('.java');
      expect(extensions).toContain('.ts');
      expect(extensions).toContain('.js');
      expect(extensions).toContain('.md');
      expect(extensions).toContain('.py'); // Python!
      expect(extensions).toContain('.go');
      expect(extensions).toContain('.rs');
    });

    it('should return sorted array', () => {
      const extensions = LanguageDetector.getSupportedExtensions();
      const sorted = [...extensions].sort();
      expect(extensions).toEqual(sorted);
    });
  });

  describe('isLanguage', () => {
    it('should check if file is specific language', () => {
      expect(LanguageDetector.isLanguage('Example.java', 'java')).toBe(true);
      expect(LanguageDetector.isLanguage('Example.java', 'typescript')).toBe(false);
      expect(LanguageDetector.isLanguage('App.ts', 'typescript')).toBe(true);
      expect(LanguageDetector.isLanguage('App.ts', 'javascript')).toBe(false);
    });
  });

  describe('convenience methods', () => {
    it('isJava should work', () => {
      expect(LanguageDetector.isJava('Example.java')).toBe(true);
      expect(LanguageDetector.isJava('App.ts')).toBe(false);
    });

    it('isTypeScript should work', () => {
      expect(LanguageDetector.isTypeScript('App.ts')).toBe(true);
      expect(LanguageDetector.isTypeScript('App.tsx')).toBe(true);
      expect(LanguageDetector.isTypeScript('Example.java')).toBe(false);
    });

    it('isJavaScript should work', () => {
      expect(LanguageDetector.isJavaScript('app.js')).toBe(true);
      expect(LanguageDetector.isJavaScript('app.jsx')).toBe(true);
      expect(LanguageDetector.isJavaScript('App.ts')).toBe(false);
    });

    it('isMarkdown should work', () => {
      expect(LanguageDetector.isLanguage('README.md', 'markdown')).toBe(true);
      expect(LanguageDetector.isLanguage('docs.markdown', 'markdown')).toBe(true);
      expect(LanguageDetector.isLanguage('App.ts', 'markdown')).toBe(false);
    });
  });

  describe('getDisplayName', () => {
    it('should return human-readable names', () => {
      expect(LanguageDetector.getDisplayName('java')).toBe('Java');
      expect(LanguageDetector.getDisplayName('typescript')).toBe('TypeScript');
      expect(LanguageDetector.getDisplayName('javascript')).toBe('JavaScript');
      expect(LanguageDetector.getDisplayName('markdown')).toBe('Markdown');
      expect(LanguageDetector.getDisplayName('python')).toBe('Python'); // Already there!
      expect(LanguageDetector.getDisplayName('go')).toBe('Go');
      expect(LanguageDetector.getDisplayName('rust')).toBe('Rust');
      expect(LanguageDetector.getDisplayName('unknown')).toBe('Unknown');
    });
  });

  describe('registerExtension', () => {
    afterEach(() => {
      // Clean up custom extensions
      LanguageDetector.unregisterExtension('.customjava');
      LanguageDetector.unregisterExtension('.customts');
    });

    it('should register new extension', () => {
      LanguageDetector.registerExtension('.customjava', 'java');
      expect(LanguageDetector.detectLanguage('test.customjava')).toBe('java');
    });

    it('should work without leading dot', () => {
      LanguageDetector.registerExtension('customts', 'typescript');
      expect(LanguageDetector.detectLanguage('test.customts')).toBe('typescript');
    });

    it('should be case-insensitive', () => {
      LanguageDetector.registerExtension('.CustomJava', 'java');
      expect(LanguageDetector.detectLanguage('test.CUSTOMJAVA')).toBe('java');
    });
  });

  describe('unregisterExtension', () => {
    beforeEach(() => {
      LanguageDetector.registerExtension('.temp', 'java');
    });

    it('should unregister extension', () => {
      expect(LanguageDetector.detectLanguage('test.temp')).toBe('java');
      LanguageDetector.unregisterExtension('.temp');
      expect(LanguageDetector.detectLanguage('test.temp')).toBe('unknown');
    });

    it('should work without leading dot', () => {
      expect(LanguageDetector.detectLanguage('test.temp')).toBe('java');
      LanguageDetector.unregisterExtension('temp');
      expect(LanguageDetector.detectLanguage('test.temp')).toBe('unknown');
    });
  });
});
