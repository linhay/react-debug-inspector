import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('NPM 发布工作流配置', () => {
  it('应支持手动触发与 release 后续触发', () => {
    const workflow = read('.github/workflows/publish.yml');

    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('workflow_run:');
    expect(workflow).toContain('workflows: ["Version Bump and Release"]');
    expect(workflow).toContain('types: [completed]');
  });

  it('应使用 Trusted Publishing（不依赖 NPM_TOKEN）', () => {
    const workflow = read('.github/workflows/publish.yml');

    expect(workflow).toContain('id-token: write');
    expect(workflow).toContain('npm publish --provenance --access public');
    expect(workflow).not.toContain('NODE_AUTH_TOKEN');
    expect(workflow).not.toContain('secrets.NPM_TOKEN');
  });
});
