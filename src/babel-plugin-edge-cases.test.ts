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

describe('babel-plugin-debug-label - Edge Cases', () => {
  it('should handle components with default export', () => {
    const input = `
      export default function App() {
        return <div>Hello</div>;
      }
    `;
    const output = transform(input, '/test/src/App.tsx');
    expect(output).toContain('data-debug="src/App.tsx:App:div:3"');
  });

  it('should handle multiple components in one file', () => {
    const input = `
      function Header() {
        return <header>Header</header>;
      }

      function Footer() {
        return <footer>Footer</footer>;
      }
    `;
    const output = transform(input, '/test/src/Layout.tsx');
    expect(output).toContain('data-debug="src/Layout.tsx:Header:header:3"');
    expect(output).toContain('data-debug="src/Layout.tsx:Footer:footer:7"');
  });

  it('should handle deeply nested JSX', () => {
    const input = `
      function Card() {
        return (
          <div>
            <div>
              <div>
                <span>Deep</span>
              </div>
            </div>
          </div>
        );
      }
    `;
    const output = transform(input, '/test/src/Card.tsx');
    expect(output).toContain('data-debug="src/Card.tsx:Card:div:4"');
    expect(output).toContain('data-debug="src/Card.tsx:Card:div:5"');
    expect(output).toContain('data-debug="src/Card.tsx:Card:div:6"');
    expect(output).toContain('data-debug="src/Card.tsx:Card:span:7"');
  });

  it('should handle JSX fragments', () => {
    const input = `
      function List() {
        return (
          <>
            <li>Item 1</li>
            <li>Item 2</li>
          </>
        );
      }
    `;
    const output = transform(input, '/test/src/List.tsx');
    expect(output).toContain('data-debug="src/List.tsx:List:li:5"');
    expect(output).toContain('data-debug="src/List.tsx:List:li:6"');
  });

  it('should handle conditional rendering', () => {
    const input = `
      function Toggle({ show }) {
        return show ? <div>Visible</div> : <span>Hidden</span>;
      }
    `;
    const output = transform(input, '/test/src/Toggle.tsx');
    expect(output).toContain('data-debug="src/Toggle.tsx:Toggle:div:3"');
    expect(output).toContain('data-debug="src/Toggle.tsx:Toggle:span:3"');
  });

  it('should handle JSX in map functions', () => {
    const input = `
      function List({ items }) {
        return (
          <ul>
            {items.map(item => <li key={item.id}>{item.name}</li>)}
          </ul>
        );
      }
    `;
    const output = transform(input, '/test/src/List.tsx');
    expect(output).toContain('data-debug="src/List.tsx:List:ul:4"');
    expect(output).toContain('data-debug="src/List.tsx:List:li:5"');
  });

  it('should handle self-closing tags', () => {
    const input = `
      function Image() {
        return <img src="test.jpg" />;
      }
    `;
    const output = transform(input, '/test/src/Image.tsx');
    expect(output).toContain('data-debug="src/Image.tsx:Image:img:3"');
  });

  it('should handle components with props spread', () => {
    const input = `
      function Button(props) {
        return <button {...props}>Click</button>;
      }
    `;
    const output = transform(input, '/test/src/Button.tsx');
    expect(output).toContain('data-debug="src/Button.tsx:Button:button:3"');
  });

  it('should handle nested member expressions', () => {
    const input = `
      function Layout() {
        return <UI.Layout.Container>Content</UI.Layout.Container>;
      }
    `;
    const output = transform(input, '/test/src/Layout.tsx');
    expect(output).toContain('data-debug="src/Layout.tsx:Layout:UI.Layout.Container:3"');
  });

  it('should handle components with TypeScript generics', () => {
    const input = `
      function List<T>() {
        return <div>List</div>;
      }
    `;
    const output = transform(input, '/test/src/List.tsx');
    expect(output).toContain('data-debug="src/List.tsx:List:div:3"');
  });

  it('should handle HOC patterns', () => {
    const input = `
      const withAuth = (Component) => {
        const AuthWrapper = (props) => {
          return <div><Component {...props} /></div>;
        };
        return AuthWrapper;
      };
    `;
    const output = transform(input, '/test/src/hoc.tsx');
    expect(output).toContain('data-debug="src/hoc.tsx:AuthWrapper:div:4"');
  });

  it('should handle async components', () => {
    const input = `
      async function AsyncComponent() {
        return <div>Async</div>;
      }
    `;
    const output = transform(input, '/test/src/Async.tsx');
    expect(output).toContain('data-debug="src/Async.tsx:AsyncComponent:div:3"');
  });

  it('should preserve existing attributes', () => {
    const input = `
      function Button() {
        return <button className="btn" id="submit">Click</button>;
      }
    `;
    const output = transform(input, '/test/src/Button.tsx');
    expect(output).toContain('className="btn"');
    expect(output).toContain('id="submit"');
    expect(output).toContain('data-debug="src/Button.tsx:Button:button:3"');
  });

  it('should handle components with children prop', () => {
    const input = `
      function Container({ children }) {
        return <div className="container">{children}</div>;
      }
    `;
    const output = transform(input, '/test/src/Container.tsx');
    expect(output).toContain('data-debug="src/Container.tsx:Container:div:3"');
  });

  it('should handle JSX with inline styles', () => {
    const input = `
      function Styled() {
        return <div style={{ color: 'red' }}>Styled</div>;
      }
    `;
    const output = transform(input, '/test/src/Styled.tsx');
    expect(output).toContain('data-debug="src/Styled.tsx:Styled:div:3"');
    expect(output).toContain('style');
  });
});
