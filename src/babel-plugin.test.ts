import { describe, expect, it } from 'vitest';
import { transformSync } from '@babel/core';
import babelPluginDebugLabel from './babel-plugin';

const transform = (code: string, filename = '/test/src/App.tsx') => {
  const result = transformSync(code, {
    filename,
    cwd: '/test',
    plugins: [babelPluginDebugLabel],
    parserOpts: {
      plugins: ['jsx', 'typescript'],
    },
  });
  return result?.code || '';
};

describe('babel-plugin-debug-label', () => {
  it('should inject data-debug with file path for function component', () => {
    const input = `
      function App() {
        return <div>Hello</div>;
      }
    `;
    const output = transform(input, '/test/src/App.tsx');
    expect(output).toContain('data-debug="src/App.tsx:App:div:3"');
  });

  it('should inject data-debug for arrow function component', () => {
    const input = `
      const Button = () => {
        return <button>Click</button>;
      };
    `;
    const output = transform(input, '/test/src/components/Button.tsx');
    expect(output).toContain('data-debug="src/components/Button.tsx:Button:button:3"');
  });

  it('should handle nested JSX elements', () => {
    const input = `
      function Card() {
        return (
          <div>
            <h1>Title</h1>
            <p>Content</p>
          </div>
        );
      }
    `;
    const output = transform(input, '/test/src/Card.tsx');
    expect(output).toContain('data-debug="src/Card.tsx:Card:div:4"');
    expect(output).toContain('data-debug="src/Card.tsx:Card:h1:5"');
    expect(output).toContain('data-debug="src/Card.tsx:Card:p:6"');
  });

  it('should handle JSX member expressions', () => {
    const input = `
      function Layout() {
        return <Motion.div>Animated</Motion.div>;
      }
    `;
    const output = transform(input, '/test/src/Layout.tsx');
    expect(output).toContain('data-debug="src/Layout.tsx:Layout:Motion.div:3"');
  });

  it('should not inject for lowercase function names', () => {
    const input = `
      function helper() {
        return <div>Not a component</div>;
      }
    `;
    const output = transform(input);
    expect(output).not.toContain('data-debug');
  });

  it('should not duplicate data-debug attributes', () => {
    const input = `
      function App() {
        return <div data-debug="existing">Hello</div>;
      }
    `;
    const output = transform(input);
    const matches = output.match(/data-debug/g);
    expect(matches?.length).toBe(1);
  });

  it('should handle function expression component', () => {
    const input = `
      const Header = function() {
        return <header>Header</header>;
      };
    `;
    const output = transform(input, '/test/src/Header.tsx');
    expect(output).toContain('data-debug="src/Header.tsx:Header:header:3"');
  });

  it('should handle relative path correctly', () => {
    const input = `
      function App() {
        return <div>Test</div>;
      }
    `;
    const output = transform(input, '/test/src/pages/home/index.tsx');
    expect(output).toContain('data-debug="src/pages/home/index.tsx:App:div:3"');
  });

  it('should handle unknown file path gracefully', () => {
    const result = transformSync(
      `function App() { return <div>Test</div>; }`,
      {
        filename: undefined,
        cwd: '/test',
        plugins: [babelPluginDebugLabel],
        parserOpts: {
          plugins: ['jsx', 'typescript'],
        },
      }
    );
    expect(result?.code).toContain('data-debug="unknown:App:div:1"');
  });
});
