import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

describe('Next.js Pages Router 示例工程', () => {
  it('应提供可运行的 Pages Router demo 文件', () => {
    const demoFiles = [
      'examples/next-pages-router/package.json',
      'examples/next-pages-router/.babelrc',
      'examples/next-pages-router/pages/_app.jsx',
      'examples/next-pages-router/pages/index.jsx',
      'examples/next-pages-router/README.md',
    ];

    demoFiles.forEach((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      expect(fs.existsSync(absolutePath), `missing file: ${relativePath}`).toBe(true);
    });
  });
});
