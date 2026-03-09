import { describe, expect, it } from 'vitest';
import { transformSync } from '@babel/core';
import babelPluginDebugLabel from './babel-plugin';

describe('babel-plugin integration tests', () => {
  const transform = (code: string, filename: string, cwd = '/project') => {
    const result = transformSync(code, {
      filename,
      cwd,
      plugins: [babelPluginDebugLabel],
      parserOpts: {
        plugins: ['jsx', 'typescript'],
      },
    });
    return result?.code || '';
  };

  it('should handle real-world component structure', () => {
    const input = `
      import React, { useState } from 'react';

      function TodoApp() {
        const [todos, setTodos] = useState([]);

        return (
          <div className="app">
            <header>
              <h1>Todo List</h1>
            </header>
            <main>
              <TodoList items={todos} />
              <AddTodoForm onAdd={setTodos} />
            </main>
            <footer>
              <p>Total: {todos.length}</p>
            </footer>
          </div>
        );
      }

      const TodoList = ({ items }) => {
        return (
          <ul>
            {items.map(item => (
              <li key={item.id}>
                <span>{item.text}</span>
                <button>Delete</button>
              </li>
            ))}
          </ul>
        );
      };

      function AddTodoForm({ onAdd }) {
        return (
          <form>
            <input type="text" placeholder="Add todo" />
            <button type="submit">Add</button>
          </form>
        );
      }

      export default TodoApp;
    `;

    const output = transform(input, '/project/src/TodoApp.tsx');

    // TodoApp 组件
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:div');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:header');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:h1');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:main');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:TodoList');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:AddTodoForm');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:footer');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoApp:p');

    // TodoList 组件
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoList:ul');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoList:li');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoList:span');
    expect(output).toContain('data-debug="src/TodoApp.tsx:TodoList:button');

    // AddTodoForm 组件
    expect(output).toContain('data-debug="src/TodoApp.tsx:AddTodoForm:form');
    expect(output).toContain('data-debug="src/TodoApp.tsx:AddTodoForm:input');
    expect(output).toContain('data-debug="src/TodoApp.tsx:AddTodoForm:button');
  });

  it('should handle different file path structures', () => {
    const input = `
      function Component() {
        return <div>Test</div>;
      }
    `;

    // 深层嵌套路径
    const output1 = transform(input, '/project/src/features/auth/components/LoginForm.tsx');
    expect(output1).toContain('data-debug="src/features/auth/components/LoginForm.tsx:Component:div');

    // 根目录文件
    const output2 = transform(input, '/project/App.tsx');
    expect(output2).toContain('data-debug="App.tsx:Component:div');

    // 不同的 cwd
    const output3 = transform(input, '/home/user/project/src/Component.tsx', '/home/user/project');
    expect(output3).toContain('data-debug="src/Component.tsx:Component:div');
  });

  it('should handle complex JSX expressions', () => {
    const input = `
      function Dashboard({ user, stats }) {
        return (
          <div>
            <h1>Welcome, {user.name}</h1>
            {user.isAdmin && <AdminPanel />}
            {stats.length > 0 ? (
              <StatsList items={stats} />
            ) : (
              <EmptyState message="No stats available" />
            )}
            <div>
              {stats.map((stat, index) => (
                <StatCard key={stat.id} data={stat} index={index} />
              ))}
            </div>
          </div>
        );
      }
    `;

    const output = transform(input, '/project/src/Dashboard.tsx');

    expect(output).toContain('data-debug="src/Dashboard.tsx:Dashboard:div');
    expect(output).toContain('data-debug="src/Dashboard.tsx:Dashboard:h1');
    expect(output).toContain('data-debug="src/Dashboard.tsx:Dashboard:AdminPanel');
    expect(output).toContain('data-debug="src/Dashboard.tsx:Dashboard:StatsList');
    expect(output).toContain('data-debug="src/Dashboard.tsx:Dashboard:EmptyState');
    expect(output).toContain('data-debug="src/Dashboard.tsx:Dashboard:StatCard');
  });

  it('should preserve component functionality', () => {
    const input = `
      function Counter() {
        const [count, setCount] = React.useState(0);

        return (
          <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>
              Increment
            </button>
          </div>
        );
      }
    `;

    const output = transform(input, '/project/src/Counter.tsx');

    // 确保代码仍然包含原始逻辑
    expect(output).toContain('useState');
    expect(output).toContain('setCount');
    expect(output).toContain('onClick');
    expect(output).toContain('count + 1');

    // 同时包含 debug 属性
    expect(output).toContain('data-debug="src/Counter.tsx:Counter:div');
    expect(output).toContain('data-debug="src/Counter.tsx:Counter:p');
    expect(output).toContain('data-debug="src/Counter.tsx:Counter:button');
  });

  it('should handle TypeScript-specific syntax', () => {
    const input = `
      interface Props {
        title: string;
        count: number;
      }

      const Card: React.FC<Props> = ({ title, count }) => {
        return (
          <div>
            <h2>{title}</h2>
            <span>{count}</span>
          </div>
        );
      };

      function GenericComponent<T extends { id: string }>(props: T) {
        return <div>{props.id}</div>;
      }
    `;

    const output = transform(input, '/project/src/Card.tsx');

    expect(output).toContain('data-debug="src/Card.tsx:Card:div');
    expect(output).toContain('data-debug="src/Card.tsx:Card:h2');
    expect(output).toContain('data-debug="src/Card.tsx:Card:span');
    expect(output).toContain('data-debug="src/Card.tsx:GenericComponent:div');
  });

  it('should not inject into non-component functions', () => {
    const input = `
      function helper() {
        return <div>Should not inject</div>;
      }

      const utils = {
        render() {
          return <span>Should not inject</span>;
        }
      };

      function Component() {
        return <div>Should inject</div>;
      }
    `;

    const output = transform(input, '/project/src/utils.tsx');

    // 小写函数不应该注入
    expect(output).not.toContain('data-debug="src/utils.tsx:helper');

    // 大写组件应该注入
    expect(output).toContain('data-debug="src/utils.tsx:Component:div');
  });

  it('should handle monorepo structure', () => {
    const input = `
      function Button() {
        return <button>Click</button>;
      }
    `;

    const output = transform(
      input,
      '/monorepo/packages/ui/src/Button.tsx',
      '/monorepo/packages/ui'
    );

    expect(output).toContain('data-debug="src/Button.tsx:Button:button');
  });

  it('should handle Windows-style paths', () => {
    const input = `
      function Component() {
        return <div>Test</div>;
      }
    `;

    // 模拟 Windows 路径
    const output = transform(
      input,
      'C:\\Users\\dev\\project\\src\\Component.tsx',
      'C:\\Users\\dev\\project'
    );

    // 应该正确处理路径分隔符
    expect(output).toContain('data-debug=');
    expect(output).toContain('Component:div');
  });
});
