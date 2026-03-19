# Next.js Turbopack 接入执行文档（给 AI 代理）

## 目标
将 `@linhey/react-debug-inspector` 集成到一个 `Next.js 16+`（默认 Turbopack）项目中，确保开发环境可为 JSX 注入 `data-debug`，并在浏览器端启用检查器 UI。

## 约束
1. 仅在开发环境启用，不影响生产环境。
2. Babel 插件必须使用 `module:` 前缀，避免解析错误。
3. 初始化代码必须只在客户端执行。

## 必做步骤

### 1) 安装依赖
```bash
npm install @linhey/react-debug-inspector --save-dev
```

### 2) 新建或更新 `.babelrc`
```json
{
  "presets": ["next/babel"],
  "plugins": ["module:@linhey/react-debug-inspector"]
}
```

注意：
- 必须写成 `module:@linhey/react-debug-inspector`
- 不要写成 `@linhey/react-debug-inspector`（会被 Babel 按命名规则误解析）

### 3) 创建客户端初始化组件（App Router）
文件：`app/inspector-client.tsx`

```tsx
'use client';

import { useEffect } from 'react';
import { initInspector } from '@linhey/react-debug-inspector/browser';

export default function InspectorClient() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initInspector();
    }
  }, []);

  return null;
}
```

### 4) 在根布局注入组件
文件：`app/layout.tsx`

```tsx
import type { ReactNode } from 'react';
import InspectorClient from './inspector-client';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <InspectorClient />
        {children}
      </body>
    </html>
  );
}
```

### 5) 旧项目可选：Pages Router（`pages/_app.tsx`）接入
如果项目还在使用 `pages` 目录，可直接使用下面示例：

文件：`pages/_app.tsx`

```tsx
import type { AppProps } from 'next/app';
import { useEffect } from 'react';
import { initInspector } from '@linhey/react-debug-inspector/browser';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initInspector();
    }
  }, []);

  return <Component {...pageProps} />;
}
```

注意：
- `pages` 与 `app` 两种路由模式二选一接入即可，不要重复初始化。
- `.babelrc` 配置保持一致，仍然需要 `module:@linhey/react-debug-inspector`。
- 可直接参考仓库示例：`examples/next-pages-router`。

### 6) 启动开发服务并验证
```bash
npm run dev
```

验证点：
1. 页面右下角出现 inspector 按钮。
2. 页面元素出现 `data-debug="<path>:<Component>:<tag>:<line>"`。
3. 点击 inspector 后可悬浮查看并复制调试标识。
4. Pages Router 项目中，`pages/*` 页面同样可看到 `data-debug` 注入。

示例路径：
- App Router（Turbopack）：`examples/next-turbopack`
- Pages Router：`examples/next-pages-router`

## 常见失败与修复
1. 报错 `Cannot find module '@linhey/babel-plugin-react-debug-inspector'`
- 原因：插件名未使用 `module:` 前缀。
- 修复：改为 `"module:@linhey/react-debug-inspector"`。

2. 没有 inspector 按钮
- 检查是否在客户端组件中调用 `initInspector()`。
- 检查是否被开发环境判断拦截（`NODE_ENV`）。

3. 看不到 `data-debug`
- 检查 `.babelrc` 是否位于项目根目录。
- 确认页面是开发模式运行而非生产构建产物。

## 交付要求（让 AI 返回）
1. 修改过的文件清单。
2. 每个文件的关键变更说明。
3. 验证结果（命令 + 观察结果）。
4. 如果失败，给出最小可复现与下一步修复建议。
