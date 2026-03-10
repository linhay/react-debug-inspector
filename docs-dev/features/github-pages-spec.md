# GitHub Pages 功能规格（BDD）

## 背景
为 `react-debug-inspector` 提供稳定可复现的 GitHub Pages 演示站点，并确保文档可直接指导维护者完成部署、验证与排障。

## 验收范围
- GitHub Actions Pages 工作流配置正确。
- Pages 文档包含可执行的使用说明与验证步骤。
- README 演示地址为真实可访问地址。
- Demo 页面提供可见且可点击的 GitHub 仓库返回入口。

## 场景 1：工作流可稳定发布
- **Given** 仓库使用 `.github/workflows/deploy-pages.yml` 发布 Pages
- **When** 推送到 `main` 或手动触发工作流
- **Then** 工作流应包含 `configure-pages` 与 `deploy-pages` 步骤
- **And** `permissions` 至少包含 `pages: write` 与 `id-token: write`
- **And** 安装阶段使用可复现依赖安装（`npm ci`）

## 场景 2：文档可直接操作
- **Given** 维护者首次接手仓库
- **When** 打开 `GITHUB_PAGES.md`
- **Then** 可以看到真实演示地址
- **And** 可以按步骤执行本地验证、手动重跑部署与线上健康检查
- **And** 包含常见故障与排查动作

## 场景 3：入口文档一致
- **Given** 用户从 `README.md` 进入演示站
- **When** 点击在线演示链接
- **Then** 跳转到真实 GitHub Pages URL
- **And** 文档中不应出现占位地址（如 `你的用户名`）

## 场景 4：Demo 页支持跳回 GitHub
- **Given** 用户正在 GitHub Pages Demo 页面浏览示例
- **When** 需要回到仓库查看源码或提 Issue
- **Then** 页面应提供可见的“返回 GitHub”链接
- **And** 链接应指向仓库主页 `https://github.com/linhay/react-debug-inspector`
