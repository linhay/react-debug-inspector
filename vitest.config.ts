import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/test-app/**'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
