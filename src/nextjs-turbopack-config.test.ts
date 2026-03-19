import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Next.js Turbopack 文档与示例工程', () => {
  it('README 应包含 Next.js + Turbopack 的 module: 前缀配置', () => {
    const readme = read('README.md');

    expect(readme).toContain('### 3. 配置 Next.js（含 Turbopack）');
    expect(readme).toContain('"module:@linhey/react-debug-inspector"');
    expect(readme).toContain('next dev');
    expect(readme).toContain('Next.js 16+');
  });

  it('应提供可运行的 Next.js Turbopack demo 工程', () => {
    const demoFiles = [
      'examples/next-turbopack/package.json',
      'examples/next-turbopack/.babelrc',
      'examples/next-turbopack/app/layout.tsx',
      'examples/next-turbopack/app/page.tsx',
      'examples/next-turbopack/app/inspector-client.tsx',
      'examples/next-turbopack/README.md',
    ];

    demoFiles.forEach((relativePath) => {
      const absolutePath = path.join(repoRoot, relativePath);
      expect(fs.existsSync(absolutePath), `missing file: ${relativePath}`).toBe(true);
    });
  });
});
