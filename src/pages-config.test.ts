import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('GitHub Pages 配置与文档', () => {
  it('deploy-pages 工作流应包含关键 Pages 步骤与权限', () => {
    const workflow = read('.github/workflows/deploy-pages.yml');

    expect(workflow).toContain('actions/configure-pages@v4');
    expect(workflow).toContain('actions/deploy-pages@v4');
    expect(workflow).toContain('pages: write');
    expect(workflow).toContain('id-token: write');
  });

  it('deploy-pages 工作流应使用可复现安装', () => {
    const workflow = read('.github/workflows/deploy-pages.yml');

    expect(workflow).toContain("cache-dependency-path: 'test-app/package-lock.json'");
    expect(workflow).toMatch(/cd test-app\s*[\r\n]+\s*npm ci/);
  });

  it('test-app 应存在 lockfile 以支撑 npm ci', () => {
    const lockPath = path.join(repoRoot, 'test-app/package-lock.json');
    expect(fs.existsSync(lockPath)).toBe(true);
  });

  it('README 与 Pages 指南应使用真实演示地址，且不含占位链接', () => {
    const readme = read('README.md');
    const pagesDoc = read('pages/GITHUB_PAGES.md');

    const realUrl = 'https://linhay.github.io/react-debug-inspector/';

    expect(readme).toContain(realUrl);
    expect(pagesDoc).toContain(realUrl);
    expect(readme).not.toContain('https://你的用户名.github.io/react-debug-inspector/');
    expect(pagesDoc).not.toContain('https://你的用户名.github.io/react-debug-inspector/');
  });

  it('Pages 使用说明应覆盖部署、验证与排障', () => {
    const pagesDoc = read('pages/GITHUB_PAGES.md');

    expect(pagesDoc).toContain('## 快速开始');
    expect(pagesDoc).toContain('## 部署验证');
    expect(pagesDoc).toContain('## 常见问题与排障');
  });

  it('CI 工作流应使用 Node 20+（避免 Node 18 的 ESM 兼容失败）', () => {
    const ciWorkflow = read('.github/workflows/ci.yml');

    expect(ciWorkflow).toContain('node-version: [20.x');
    expect(ciWorkflow).not.toContain('18.x');
  });

  it('Demo 页面应提供跳回 GitHub 的入口', () => {
    const appSource = read('test-app/src/App.tsx');

    expect(appSource).toContain('返回 GitHub');
    expect(appSource).toContain('https://github.com/linhay/react-debug-inspector');
    expect(appSource).toContain('target="_blank"');
  });
});
