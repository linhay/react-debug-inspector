# GitHub Actions 配置说明

本项目配置了三个 GitHub Actions 工作流，用于自动化测试、构建和发布。

## 📋 工作流概览

### 1. CI (持续集成) - `.github/workflows/ci.yml`

**触发条件:**
- 推送到 `main` 分支
- 针对 `main` 分支的 Pull Request

**功能:**
- 在 Node.js 18.x 和 20.x 上运行测试
- 运行单元测试 (Vitest)
- 运行 E2E 测试 (Playwright)
- 构建项目
- 失败时上传测试报告

**使用场景:**
- 每次提交代码时自动运行
- 确保代码质量
- PR 合并前的验证

---

### 2. Publish to NPM - `.github/workflows/publish.yml`

**触发条件:**
- 创建 GitHub Release 时自动触发

**功能:**
- 安装依赖
- 运行测试
- 构建项目
- 发布到 NPM (带 provenance)

**前置要求:**
1. 在 GitHub 仓库设置中添加 `NPM_TOKEN` secret
2. 创建 GitHub Release

---

### 3. Version Bump and Release - `.github/workflows/release.yml`

**触发条件:**
- 手动触发 (workflow_dispatch)

**功能:**
- 自动升级版本号 (patch/minor/major)
- 运行完整测试套件
- 更新 CHANGELOG.md
- 提交版本变更
- 创建 Git tag
- 创建 GitHub Release (自动触发 NPM 发布)

**使用场景:**
- 准备发布新版本时使用

---

## 🚀 发布流程

### 方式一：自动化发布（推荐）

1. **触发版本升级工作流**
   - 进入 GitHub 仓库的 Actions 页面
   - 选择 "Version Bump and Release" 工作流
   - 点击 "Run workflow"
   - 选择版本类型：
     - `patch`: 1.1.0 → 1.1.1 (bug 修复)
     - `minor`: 1.1.0 → 1.2.0 (新功能)
     - `major`: 1.1.0 → 2.0.0 (破坏性变更)

2. **自动执行流程**
   - ✅ 运行所有测试
   - ✅ 构建项目
   - ✅ 升级版本号
   - ✅ 更新 CHANGELOG
   - ✅ 提交并推送
   - ✅ 创建 Git tag
   - ✅ 创建 GitHub Release
   - ✅ 自动触发 NPM 发布

### 方式二：手动发布

1. **本地升级版本**
   ```bash
   npm version patch  # 或 minor / major
   ```

2. **推送到 GitHub**
   ```bash
   git push && git push --tags
   ```

3. **创建 GitHub Release**
   - 进入 GitHub 仓库的 Releases 页面
   - 点击 "Create a new release"
   - 选择刚创建的 tag
   - 填写 Release 说明
   - 点击 "Publish release"

4. **自动发布到 NPM**
   - Release 创建后自动触发 NPM 发布

---

## 🔑 配置 NPM Token

### 1. 获取 NPM Token

```bash
# 登录 NPM
npm login

# 生成 automation token
npm token create --type=automation
```

### 2. 添加到 GitHub Secrets

1. 进入 GitHub 仓库设置
2. 选择 "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. 名称: `NPM_TOKEN`
5. 值: 粘贴你的 NPM token
6. 点击 "Add secret"

---

## 📊 工作流状态徽章

在 README.md 中添加状态徽章：

```markdown
![CI](https://github.com/你的用户名/react-debug-inspector/workflows/CI/badge.svg)
![NPM Version](https://img.shields.io/npm/v/@linhey/react-debug-inspector)
![NPM Downloads](https://img.shields.io/npm/dm/@linhey/react-debug-inspector)
```

---

## 🛠️ 本地测试工作流

在推送前本地验证：

```bash
# 运行所有测试
npm run test:all

# 构建项目
npm run build

# 检查打包内容
npm pack --dry-run
```

---

## 📝 版本发布检查清单

发布前确认：

- [ ] 所有测试通过
- [ ] CHANGELOG.md 已更新
- [ ] README.md 文档是最新的
- [ ] 版本号符合语义化版本规范
- [ ] 没有未提交的更改
- [ ] NPM_TOKEN 已配置

---

## 🔧 故障排查

### 问题：NPM 发布失败

**解决方案:**
1. 检查 NPM_TOKEN 是否正确配置
2. 确认 NPM 账号有发布权限
3. 检查包名是否已被占用
4. 查看 Actions 日志获取详细错误信息

### 问题：测试失败

**解决方案:**
1. 本地运行 `npm run test:all` 复现问题
2. 检查 Node.js 版本兼容性
3. 查看上传的测试报告

### 问题：版本冲突

**解决方案:**
1. 确保本地代码是最新的
2. 手动解决冲突后重新运行工作流

---

## 🎯 最佳实践

1. **使用自动化发布流程**
   - 减少人为错误
   - 保持一致性
   - 自动化文档更新

2. **遵循语义化版本**
   - patch: 向后兼容的 bug 修复
   - minor: 向后兼容的新功能
   - major: 破坏性变更

3. **保持 CHANGELOG 更新**
   - 记录每个版本的变更
   - 帮助用户了解更新内容

4. **测试覆盖**
   - 确保所有测试通过再发布
   - 定期检查测试覆盖率

---

## 📚 相关资源

- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [NPM 发布指南](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Provenance 说明](https://docs.npmjs.com/generating-provenance-statements)
