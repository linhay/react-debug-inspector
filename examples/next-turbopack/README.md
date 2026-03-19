# Next.js Turbopack Demo

该示例演示 `@linhey/react-debug-inspector` 在 Next.js（Turbopack）中的最小接入方式。

## 运行

```bash
npm install
npm run dev
```

默认访问：`http://localhost:3000`

## 说明

- `next dev` 在 Next.js 16+ 默认使用 Turbopack。
- `.babelrc` 需使用 `module:@linhey/react-debug-inspector`。
- `app/inspector-client.tsx` 中仅在开发环境初始化 `initInspector()`。
