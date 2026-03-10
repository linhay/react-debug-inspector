# GitHub Pages 使用说明

本仓库使用 GitHub Actions 自动发布演示站点。

- 线上地址：`https://linhay.github.io/react-debug-inspector/`
- 工作流文件：`.github/workflows/deploy-pages.yml`
- 演示项目目录：`test-app/`
- 浏览器自动化案例：`pages/AGENT_BROWSER_CASES.md`

## 快速开始

### 1. 启用 Pages（只需一次）

1. 进入仓库 `Settings` -> `Pages`
2. 在 `Build and deployment` 中选择 `Source: GitHub Actions`
3. 保存配置

### 2. 本地验证构建

```bash
cd test-app
npm ci
npm run build
```

构建成功后应生成 `test-app/dist/`。

### 3. 触发部署

- 自动触发：推送到 `main`
- 手动触发：`Actions` -> `Deploy to GitHub Pages` -> `Run workflow`

## 部署验证

部署完成后执行以下检查：

1. Actions 页面中 `Deploy to GitHub Pages` 为 `success`
2. 访问 `https://linhay.github.io/react-debug-inspector/` 返回 200
3. 页面资源正常加载（无明显 404）
4. Demo 页面可看到右下角 `🎯` 按钮

可用命令行快速验证：

```bash
curl -I -L https://linhay.github.io/react-debug-inspector/
```

期望包含 `HTTP/2 200`（或等价 200 状态）。

## 工作流说明

`deploy-pages.yml` 关键阶段：

1. `build`
- 使用 Node 20
- 基于 `test-app/package-lock.json` 缓存依赖
- 在 `test-app` 执行 `npm ci` 和 `npm run build`
- 上传 `test-app/dist` 作为 Pages artifact

2. `deploy`
- 使用 `actions/deploy-pages@v4` 发布 artifact
- 通过 `environment: github-pages` 暴露站点 URL

## 常见问题与排障

### 问题 1：`actions/configure-pages` 报 404

原因：仓库未启用 Pages 或 Source 不是 `GitHub Actions`。

处理：
1. 到 `Settings -> Pages` 检查 Source
2. 修正后重新运行 `Deploy to GitHub Pages`

### 问题 2：工作流安装失败

原因：`test-app/package-lock.json` 与 `package.json` 不一致，导致 `npm ci` 失败。

处理：

```bash
cd test-app
npm install
git add package-lock.json
```

提交后重新触发部署。

### 问题 3：页面 404 或资源路径错误

原因：`test-app/vite.config.ts` 的 `base` 与仓库名不一致。

当前应为：

```ts
base: '/react-debug-inspector/'
```

### 问题 4：页面已部署但内容没更新

原因：CDN 缓存。

处理：
1. 强制刷新浏览器（macOS: `Cmd+Shift+R`）
2. 等待 1-3 分钟后再验证

## 维护建议

1. 修改 `test-app` 依赖后，同步更新并提交 `test-app/package-lock.json`
2. 每次合并到 `main` 后，检查最新一次 Pages workflow 结果
3. 文档中的演示地址必须保持真实可访问，禁止占位链接
