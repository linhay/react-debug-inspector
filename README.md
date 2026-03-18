# @linhey/react-debug-inspector 🎯

[![CI](https://github.com/linhay/react-debug-inspector/actions/workflows/ci.yml/badge.svg)](https://github.com/linhay/react-debug-inspector/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@linhey/react-debug-inspector)](https://www.npmjs.com/package/@linhey/react-debug-inspector)
[![NPM Downloads](https://img.shields.io/npm/dm/@linhey/react-debug-inspector)](https://www.npmjs.com/package/@linhey/react-debug-inspector)
[![License](https://img.shields.io/npm/l/@linhey/react-debug-inspector)](https://github.com/linhay/react-debug-inspector/blob/main/LICENSE)
[![repo](https://img.shields.io/badge/github-linhay%2Freact--debug--inspector-181717?logo=github)](https://github.com/linhay/react-debug-inspector)

一个轻量级的 React 调试辅助工具，让你在浏览器中直接识别组件、标签及其对应的源码行号。

## 🎬 演示

### 在线演示

🌐 **[在线体验 Demo](https://linhay.github.io/react-debug-inspector/)**

> GitHub Pages 配置说明见 [GITHUB_PAGES.md](./pages/GITHUB_PAGES.md)

### 快速预览

1. 点击右下角的 🎯 按钮进入检查模式
2. 鼠标悬停在任何元素上查看调试信息
3. 直接点击元素复制完整的调试标识
4. 使用悬浮菜单复制文案、图片或全部上下文
4. 按 `Esc` 键退出检查模式

<!-- TODO: 添加演示 GIF -->
<!-- ![基本使用演示](./assets/demo-basic.gif) -->

## 特性

- 🚀 **零配置注入**：通过 Babel 插件自动为每个 JSX 元素添加 `data-debug` 属性。
- 🎯 **瞄准模式**：悬浮显示元素标识，单击一键复制。
- 🧾 **上下文复制**：支持复制目标文案、图片信息和完整调试上下文。
- 📁 **完整路径**：显示文件路径、组件名、标签名和行号，精确定位源码。
- 🌳 **零污染**：生产环境构建时自动剔除，不增加包体积。
- ⌨️ **快捷键支持**：支持 Esc 退出及 Alt+右键 快速复制。

## 安装

```bash
npm install @linhey/react-debug-inspector --save-dev
```

## 使用方法

### 1. 配置 Vite (vite.config.ts)

推荐在 Vite 8+ 使用官方导出的插件工厂，确保 `data-debug` 注入稳定：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createViteDebugInspectorPlugin } from '@linhey/react-debug-inspector';

export default defineConfig({
  plugins: [
    createViteDebugInspectorPlugin(),
    react(),
  ],
});
```

如果你仍在旧链路中使用 Babel 直接注入，也可以保留：

```typescript
import debugInspector from '@linhey/react-debug-inspector';

react({
  babel: {
    plugins: [debugInspector],
  }
})
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
- **悬浮模式**：进入模式后，鼠标指向的元素将被高亮，并显示 `文件名 › 组件 › 标签:行号`。
- **悬浮菜单**：命中元素后可使用“复制 ID / 复制文案 / 复制图片 / 全部复制”。
- **单击左键**：复制完整标识（`文件路径:组件:标签:行号`）到剪贴板并退出。
- **复制图片**：优先尝试写入图片本体；若浏览器或资源不支持，则自动降级复制图片信息文本。
- **Esc**：退出模式。
- **Alt + 右键**：非模式下亦可直接复制标识。

## 输出格式

复制到剪贴板的格式为：`src/components/Button.tsx:Button:button:42`

- `src/components/Button.tsx` - 文件相对路径
- `Button` - 组件名
- `button` - HTML 标签名
- `42` - 源码行号

## 开发

```bash
# 安装依赖
npm install

# 运行单元测试
npm test

# 运行 E2E 测试
npm run test:e2e

# 录制演示视频（选择元素 -> 粘贴到输入框）
npm run record:demo

# 运行所有测试
npm run test:all

# 构建
npm run build

# 开发模式
npm run dev
```

## 发布

本项目使用 GitHub Actions 自动化发布流程。详见 [GITHUB_ACTIONS.md](./GITHUB_ACTIONS.md)。

### 快速发布

1. 进入 GitHub Actions 页面
2. 选择 "Version Bump and Release" 工作流
3. 点击 "Run workflow"，选择版本类型（patch/minor/major）
4. 自动完成测试、构建、发布到 NPM

## License

MIT
