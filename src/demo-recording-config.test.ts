import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const read = (relativePath: string) =>
  fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');

describe('Demo 视频录制配置', () => {
  it('应提供一键录制脚本并启用 Playwright 视频输出', () => {
    const packageJson = JSON.parse(read('package.json')) as {
      scripts?: Record<string, string>;
    };
    const demoConfig = read('playwright.demo.config.ts');

    expect(packageJson.scripts?.['record:demo']).toBe(
      'playwright test e2e/demo-recording.spec.ts --config playwright.demo.config.ts'
    );
    expect(demoConfig).toContain("video: 'on'");
    expect(demoConfig).toContain("testDir: './e2e'");
  });
});
