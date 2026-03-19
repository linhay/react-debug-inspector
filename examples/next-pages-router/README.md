# Next.js Pages Router Demo

该示例演示 `@linhey/react-debug-inspector` 在 Next.js Pages Router（`pages/`）中的最小接入方式。

## 运行

```bash
npm install
npm run dev
```

默认访问：`http://localhost:3000`

## 关键点

- Babel 配置使用 `module:@linhey/react-debug-inspector`。
- 在 `pages/_app.jsx` 中，仅开发环境执行 `initInspector()`。
