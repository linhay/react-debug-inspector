# 发布前检查清单

在发布新版本到 NPM 之前，请确保完成以下所有检查项。

## ✅ 代码质量

- [ ] 所有单元测试通过 (`npm test`)
- [ ] 所有 E2E 测试通过 (`npm run test:e2e`)
- [ ] 代码构建成功 (`npm run build`)
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 警告（如果配置了）

## ✅ 文档

- [ ] README.md 已更新
- [ ] CHANGELOG.md 已更新，包含本次版本的变更
- [ ] 所有新功能都有文档说明
- [ ] API 文档是最新的
- [ ] 示例代码可以正常运行

## ✅ 版本管理

- [ ] 版本号遵循语义化版本规范
  - `patch` (1.1.0 → 1.1.1): Bug 修复
  - `minor` (1.1.0 → 1.2.0): 新功能，向后兼容
  - `major` (1.1.0 → 2.0.0): 破坏性变更
- [ ] package.json 中的版本号已更新
- [ ] Git 工作区是干净的（没有未提交的更改）

## ✅ 依赖管理

- [ ] 所有依赖都是最新的稳定版本
- [ ] peerDependencies 正确配置
- [ ] devDependencies 和 dependencies 分类正确
- [ ] 没有不必要的依赖

## ✅ 构建产物

- [ ] dist/ 目录包含所有必要文件
  - [ ] index.js (CommonJS)
  - [ ] index.mjs (ES Module)
  - [ ] index.d.ts (TypeScript 类型定义)
- [ ] 检查打包大小是否合理
  ```bash
  npm pack --dry-run
  ```
- [ ] .npmignore 正确配置，不包含不必要的文件

## ✅ GitHub 配置

- [ ] npm Trusted Publisher 已配置（OIDC）
- [ ] GitHub Actions 工作流文件存在
  - [ ] .github/workflows/ci.yml
  - [ ] .github/workflows/publish.yml
  - [ ] .github/workflows/release.yml
- [ ] 仓库权限正确配置

## ✅ NPM 配置

- [ ] package.json 中的字段完整
  - [ ] name
  - [ ] version
  - [ ] description
  - [ ] author
  - [ ] license
  - [ ] repository
  - [ ] keywords
  - [ ] main
  - [ ] module
  - [ ] types
  - [ ] files
- [ ] NPM 账号有发布权限
- [ ] 包名没有被占用（首次发布）

## ✅ 测试发布

在正式发布前，建议先测试：

```bash
# 1. 本地打包
npm pack

# 2. 在测试项目中安装
cd /path/to/test-project
npm install /path/to/react-debug-inspector-1.1.0.tgz

# 3. 验证功能正常
npm run dev
```

## ✅ 发布流程

### 自动化发布（推荐）

1. [ ] 进入 GitHub Actions 页面
2. [ ] 选择 "Version Bump and Release" 工作流
3. [ ] 点击 "Run workflow"
4. [ ] 选择版本类型（patch/minor/major）
5. [ ] 等待工作流完成
6. [ ] 验证 NPM 上的新版本

### 手动发布

1. [ ] 本地升级版本
   ```bash
   npm version patch  # 或 minor / major
   ```
2. [ ] 推送到 GitHub
   ```bash
   git push && git push --tags
   ```
3. [ ] 创建 GitHub Release
4. [ ] 等待自动发布到 NPM

## ✅ 发布后验证

- [ ] NPM 上可以看到新版本
  ```bash
  npm view @linhey/react-debug-inspector
  ```
- [ ] 可以正常安装
  ```bash
  npm install @linhey/react-debug-inspector@latest
  ```
- [ ] 在新项目中测试功能
- [ ] GitHub Release 已创建
- [ ] CHANGELOG 链接正确

## ✅ 通知

- [ ] 在相关渠道通知用户（如果需要）
- [ ] 更新相关文档和教程
- [ ] 关闭相关的 GitHub Issues

## 🚨 回滚计划

如果发布后发现严重问题：

1. **NPM 回滚**
   ```bash
   npm unpublish @linhey/react-debug-inspector@1.1.0
   ```
   注意：只能在发布后 72 小时内回滚

2. **发布修复版本**
   ```bash
   npm version patch
   # 修复问题后
   npm publish
   ```

3. **通知用户**
   - 在 GitHub 创建 Issue 说明问题
   - 更新 CHANGELOG
   - 发布公告

## 📝 发布记录

记录每次发布的关键信息：

| 版本 | 日期 | 发布者 | 主要变更 | 问题 |
|------|------|--------|----------|------|
| 1.1.0 | 2026-03-09 | linhey | 添加文件路径支持 | 无 |
| 1.0.0 | 2026-03-08 | linhey | 初始版本 | 无 |

---

**提示**: 将此清单打印出来，每次发布时逐项检查，确保不遗漏任何步骤。
