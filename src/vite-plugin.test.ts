import { describe, expect, it } from 'vitest';
import { createViteDebugInspectorPlugin } from './index';

describe('vite debug inspector plugin', () => {
  it('should expose a pre-transform plugin', () => {
    const plugin = createViteDebugInspectorPlugin();
    expect(plugin.name).toBe('react-debug-inspector-transform');
    expect(plugin.apply).toBe('serve');
    expect(plugin.enforce).toBe('pre');
    expect(typeof plugin.transform).toBe('function');
  });

  it('should inject data-debug into tsx source', async () => {
    const plugin = createViteDebugInspectorPlugin();
    const source = `
const App = () => {
  return <div><button>OK</button></div>
}
`;
    const result = await plugin.transform?.(source, '/test/src/App.tsx');
    expect(result).not.toBeNull();
    expect(typeof result).toBe('object');
    const code = (result as { code?: string }).code || '';
    expect(code).toMatch(/data-debug="(?:\/test\/)?src\/App\.tsx:App:div:3"/);
    expect(code).toMatch(/data-debug="(?:\/test\/)?src\/App\.tsx:App:button:3"/);
  });

  it('should skip node_modules files', async () => {
    const plugin = createViteDebugInspectorPlugin();
    const result = await plugin.transform?.('const a = 1', '/test/node_modules/foo/index.tsx');
    expect(result).toBeNull();
  });
});
