# @linhey/react-debug-inspector 🎯

一个轻量级的 React 调试辅助工具，让你在浏览器中直接识别组件、标签及其对应的源码行号。

## 特性

- 🚀 **零配置注入**：通过 Babel 插件自动为每个 JSX 元素添加 `data-debug` 属性。
- 🎯 **瞄准模式**：悬浮显示元素标识，单击一键复制。
- 🌳 **零污染**：生产环境构建时自动剔除，不增加包体积。
- ⌨️ **快捷键支持**：支持 Esc 退出及 Alt+右键 快速复制。

## 安装

```bash
npm install @linhey/react-debug-inspector --save-dev
```

## 使用方法

### 1. 配置 Vite (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import debugInspector from '@linhey/react-debug-inspector';

export default defineConfig({
  plugins: [
    react({
      babel: {
        // 仅在开发环境下启用注入
        plugins: process.env.NODE_ENV === 'development' ? [debugInspector] : []
      }
    }),
  ],
});
```

### 2. 初始化交互界面 (main.tsx)

```typescript
import { initInspector } from '@linhey/react-debug-inspector';

if (import.meta.env.DEV) {
  initInspector();
}
```

## 交互说明

- **🎯 按钮**：位于右下角，点击进入/退出审查模式。
- **悬浮模式**：进入模式后，鼠标指向的元素将被高亮，并显示 `组件:标签:行号`。
- **单击左键**：复制标识到剪贴板并退出。
- **Esc**：退出模式。
- **Alt + 右键**：非模式下亦可直接复制标识。

## License

MIT
