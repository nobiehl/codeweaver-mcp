import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.test.ts',
        '**/*.config.ts',
        'vitest.config.ts',
      ],
      all: true,
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85,
    },
    testTimeout: 30000, // 30s für E2E-Tests mit Gradle
    hookTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
  },
});
