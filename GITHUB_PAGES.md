# GitHub Pages 配置指南

本项目配置了 GitHub Pages 自动部署，用于展示在线演示。

## 🌐 演示地址

部署后访问：`https://你的用户名.github.io/react-debug-inspector/`

## 📋 配置步骤

### 1. 启用 GitHub Pages

1. 进入 GitHub 仓库
2. 点击 **Settings** → **Pages**
3. 在 **Source** 下选择：
   - Source: **GitHub Actions**
4. 保存设置

### 2. 推送代码

```bash
git add .
git commit -m "feat: add GitHub Pages demo site"
git push
```

### 3. 等待部署

- 推送后会自动触发 GitHub Actions
- 进入 **Actions** 页面查看部署进度
- 部署成功后，访问演示地址

## 🔧 工作流说明

### 触发条件

- 推送到 `main` 分支
- 手动触发（workflow_dispatch）

### 部署流程

1. **构建阶段**
   - 安装依赖
   - 构建 test-app
   - 上传构建产物

2. **部署阶段**
   - 部署到 GitHub Pages
   - 更新演示网站

## 📁 项目结构

```
test-app/
├── src/
│   ├── App.tsx          # 演示应用
│   ├── App.css          # 样式文件
│   └── main.tsx         # 入口文件
├── index.html           # HTML 模板
├── package.json         # 依赖配置
├── vite.config.ts       # Vite 配置
└── tsconfig.json        # TypeScript 配置
```

## 🎨 演示功能

演示网站包含以下功能展示：

1. **计数器示例**
   - 展示基本的状态管理
   - 演示按钮点击交互

2. **对话框示例**
   - 展示 🎯 按钮的智能避障
   - 演示弹窗场景

3. **列表示例**
   - 展示列表渲染
   - 演示多个元素的调试

## 🔄 更新演示

每次推送到 `main` 分支时，演示网站会自动更新。

### 手动触发部署

1. 进入 **Actions** 页面
2. 选择 **Deploy to GitHub Pages** 工作流
3. 点击 **Run workflow**
4. 选择 `main` 分支
5. 点击 **Run workflow** 按钮

## 🐛 故障排查

### 问题：部署失败

**检查项：**
1. GitHub Pages 是否已启用
2. 工作流权限是否正确
3. 查看 Actions 日志获取详细错误

**解决方案：**
```bash
# 本地测试构建
cd test-app
npm install
npm run build

# 检查构建产物
ls -la dist/
```

### 问题：页面显示 404

**原因：**
- base 路径配置不正确

**解决方案：**
检查 `test-app/vite.config.ts` 中的 `base` 配置：
```typescript
export default defineConfig({
  base: '/react-debug-inspector/', // 必须与仓库名一致
  // ...
});
```

### 问题：样式或资源加载失败

**原因：**
- 资源路径不正确

**解决方案：**
确保所有资源使用相对路径或正确的 base 路径。

## 📝 自定义演示

### 修改演示内容

编辑 `test-app/src/App.tsx`：

```typescript
function App() {
  return (
    <div className="app">
      {/* 添加你的演示内容 */}
    </div>
  );
}
```

### 修改样式

编辑 `test-app/src/App.css`：

```css
.app {
  /* 自定义样式 */
}
```

### 本地预览

```bash
cd test-app
npm install
npm run dev
```

访问 `http://localhost:5173` 预览效果。

## 🎯 最佳实践

1. **保持演示简洁**
   - 只展示核心功能
   - 避免过于复杂的示例

2. **添加说明文字**
   - 引导用户如何使用
   - 解释每个功能的作用

3. **响应式设计**
   - 确保在移动设备上也能正常显示
   - 测试不同屏幕尺寸

4. **性能优化**
   - 压缩资源文件
   - 使用代码分割
   - 优化加载速度

## 📚 相关资源

- [GitHub Pages 文档](https://docs.github.com/en/pages)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
- [GitHub Actions 文档](https://docs.github.com/en/actions)

## 🎊 完成

配置完成后，你的演示网站将自动部署到 GitHub Pages！

访问 `https://你的用户名.github.io/react-debug-inspector/` 查看效果。
