# 快速开始指南

## 📦 安装

```bash
npm install @linhey/react-debug-inspector --save-dev
```

## ⚙️ 配置

### Vite 项目

**vite.config.ts:**
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import debugInspector from '@linhey/react-debug-inspector';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: process.env.NODE_ENV === 'development' ? [debugInspector] : []
      }
    }),
  ],
});
```

**src/main.tsx:**
```typescript
import { initInspector } from '@linhey/react-debug-inspector';

if (import.meta.env.DEV) {
  initInspector();
}

// ... 其他代码
```

### Next.js 项目

**next.config.js:**
```javascript
module.exports = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.module.rules.push({
        test: /\.(tsx|ts|jsx|js)$/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: ['@linhey/react-debug-inspector']
          }
        }
      });
    }
    return config;
  }
};
```

**pages/_app.tsx:**
```typescript
import { useEffect } from 'react';
import { initInspector } from '@linhey/react-debug-inspector';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      initInspector();
    }
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
```

### Create React App (CRA)

需要使用 CRACO 或 react-app-rewired 来自定义 Babel 配置。

**craco.config.js:**
```javascript
module.exports = {
  babel: {
    plugins: [
      process.env.NODE_ENV === 'development' && '@linhey/react-debug-inspector'
    ].filter(Boolean)
  }
};
```

**src/index.tsx:**
```typescript
import { initInspector } from '@linhey/react-debug-inspector';

if (process.env.NODE_ENV === 'development') {
  initInspector();
}

// ... 其他代码
```

## 🎮 使用

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **打开浏览器**
   - 你会在右下角看到一个 🎯 按钮

3. **进入检查模式**
   - 点击 🎯 按钮
   - 鼠标悬停在任何元素上查看信息
   - 点击元素复制调试信息

4. **退出检查模式**
   - 按 `Esc` 键
   - 或再次点击 🎯 按钮

## 📋 输出示例

当你点击一个按钮时，会复制如下信息到剪贴板：

```
src/components/Button.tsx:Button:button:42
```

这表示：
- 文件：`src/components/Button.tsx`
- 组件：`Button`
- 标签：`button`
- 行号：`42`

## 🔍 高级用法

### 自定义配置（未来版本）

```typescript
initInspector({
  position: 'bottom-left',  // 按钮位置
  hotkey: 'ctrl+shift+i',   // 自定义快捷键
  exclude: ['div', 'span'], // 排除特定标签
});
```

## ❓ 常见问题

### Q: 为什么看不到 🎯 按钮？

A: 确保：
1. 在开发环境运行（`NODE_ENV === 'development'`）
2. 已调用 `initInspector()`
3. Babel 插件已正确配置

### Q: 点击元素没有反应？

A: 确保：
1. 已进入检查模式（按钮变红）
2. 元素有 `data-debug` 属性（检查 DOM）
3. 浏览器支持 Clipboard API

### Q: 生产环境会包含调试代码吗？

A: 不会。只要正确配置（仅在开发环境启用），生产构建不会包含任何调试代码。

## 🐛 故障排查

### 检查 Babel 插件是否生效

打开浏览器开发者工具，检查 DOM：

```html
<div data-debug="src/App.tsx:App:div:10">
  <!-- 如果看到 data-debug 属性，说明插件工作正常 -->
</div>
```

### 检查运行时是否初始化

在浏览器控制台运行：

```javascript
document.querySelector('button[title="开启组件定位器"]')
// 应该返回按钮元素
```

## 📚 更多资源

- [完整文档](./README.md)
- [GitHub Actions 配置](./GITHUB_ACTIONS.md)
- [更新日志](./CHANGELOG.md)
- [问题反馈](https://github.com/linhey/react-debug-inspector/issues)

## 💡 提示

- 使用 `Alt + 右键` 可以在非检查模式下快速复制
- 按钮可以拖拽到任意位置
- 按钮会自动避开对话框和弹窗
- 支持嵌套组件的调试
