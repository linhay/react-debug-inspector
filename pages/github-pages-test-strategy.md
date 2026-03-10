# GitHub Pages 测试策略

关联需求文档：`pages/github-pages-spec.md`

## 目标
将 Pages 的关键要求固化为自动化测试，防止文档与工作流回归。

## 自动化测试点
测试文件：`src/pages-config.test.ts`

1. 工作流关键能力校验
- 必须使用 `actions/configure-pages@v4`
- 必须使用 `actions/deploy-pages@v4`
- 必须包含 `pages: write` 与 `id-token: write` 权限

2. 可复现构建校验
- `deploy-pages.yml` 使用 `cache-dependency-path: test-app/package-lock.json`
- 在 `test-app` 中使用 `npm ci`
- `test-app/package-lock.json` 必须存在

3. 文档一致性校验
- `README.md` 与 `pages/GITHUB_PAGES.md` 必须指向真实 URL
- 禁止保留占位链接 `你的用户名`
- `pages/GITHUB_PAGES.md` 必须包含：快速开始、部署验证、排障章节

## 执行方式
```bash
npm test -- src/pages-config.test.ts
```

CI 中通过 `npm test` 自动覆盖该测试。
