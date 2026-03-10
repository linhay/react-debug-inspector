import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Release workflow 配置', () => {
  it('发布前应安装 Playwright 浏览器以支持 test:e2e', () => {
    const workflow = read('.github/workflows/release.yml');

    expect(workflow).toContain('npx playwright install --with-deps chromium');
    expect(workflow).toMatch(/Install Playwright browsers[\s\S]*Run tests/);
  });
});
