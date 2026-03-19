# Next.js Turbopack 接入规格（BDD）

## 背景
有用户反馈在 Next.js 项目中使用 Turbopack 时，不清楚如何配置 `react-debug-inspector`。需要提供官方可复制配置，并提供一个可运行 demo 工程，降低接入门槛。

## 验收范围
- README 增加 Next.js（含 Turbopack）接入章节。
- 文档明确 Babel 插件在 Next.js 中需使用 `module:` 前缀。
- 仓库提供可运行的 Next.js Turbopack demo 工程。
- demo 工程包含运行时初始化示例（`initInspector()`）。

## 场景 1：README 提供可复制配置
- **Given** 开发者在 Next.js 项目中接入本库
- **When** 查看 README 的 Next.js 指南
- **Then** 可以直接复制 `.babelrc` 配置并启动项目
- **And** 文档中应包含 `module:@linhey/react-debug-inspector`

## 场景 2：Turbopack 下 data-debug 能成功注入
- **Given** 开发者按 README 完成 Next.js 配置
- **When** 使用 Turbopack 启动开发服务
- **Then** JSX 产物应包含 `data-debug` 属性

## 场景 3：demo 工程可作为最小参考
- **Given** 开发者希望快速验证集成链路
- **When** 进入仓库 demo 目录并安装依赖后运行
- **Then** 可以看到页面示例并验证检查器按钮与 `data-debug` 注入链路

## 场景 4：运行时初始化仅在客户端执行
- **Given** Next.js App Router 场景
- **When** 在布局中引入初始化组件
- **Then** `initInspector()` 仅在客户端执行
- **And** 不影响服务端渲染稳定性
