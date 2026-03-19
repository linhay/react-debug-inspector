# Next.js Pages Router Demo 规格（BDD）

## 背景
为仍使用 `pages/` 目录的旧版 Next.js 项目提供可直接复制的 demo，降低接入 `@linhey/react-debug-inspector` 的迁移成本。

## 验收范围
- 仓库提供独立 `Pages Router` demo 工程。
- demo 包含 `.babelrc`、`pages/_app.jsx`、`pages/index.jsx` 与运行说明。
- `pages/_app.jsx` 中仅在开发环境初始化 `initInspector()`。

## 场景 1：demo 工程可安装与启动
- **Given** 开发者进入 `examples/next-pages-router`
- **When** 执行 `npm install && npm run dev`
- **Then** 示例应可正常启动并访问首页

## 场景 2：Pages Router 初始化链路正确
- **Given** 示例工程使用 `pages/_app.jsx`
- **When** 开发环境加载页面
- **Then** 应调用 `initInspector()` 并显示检查器按钮

## 场景 3：页面元素应被注入 data-debug
- **Given** Babel 插件配置为 `module:@linhey/react-debug-inspector`
- **When** 渲染 `pages/index.jsx`
- **Then** 页面产物应出现 `data-debug` 属性
