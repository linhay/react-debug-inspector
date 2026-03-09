# 录制演示视频/GIF 指南

## 🎬 推荐工具

### macOS
- **Kap** (免费) - https://getkap.co/
  - 轻量级屏幕录制工具
  - 直接导出 GIF
  - 支持编辑和裁剪

- **LICEcap** (免费) - https://www.cockos.com/licecap/
  - 简单易用
  - 直接录制 GIF

- **ScreenToGif** (免费) - https://www.screentogif.com/
  - 功能强大
  - 支持编辑每一帧

### Windows
- **ScreenToGif** (免费) - https://www.screentogif.com/
- **ShareX** (免费) - https://getsharex.com/

### 在线工具
- **Gifox** - https://gifox.app/
- **CloudApp** - https://www.getcloudapp.com/

## 📝 录制脚本

### 场景 1: 基本使用流程 (30秒)

1. **启动应用** (3秒)
   ```bash
   npm run dev
   ```
   - 显示终端命令
   - 浏览器自动打开

2. **显示初始界面** (2秒)
   - 展示右下角的 🎯 按钮
   - 鼠标指向按钮

3. **进入检查模式** (2秒)
   - 点击 🎯 按钮
   - 按钮变红，光标变为十字

4. **悬停元素** (5秒)
   - 悬停在标题上 → 显示 `App.tsx › App › h1:8`
   - 悬停在按钮上 → 显示 `Button.tsx › Button › button:12`
   - 悬停在卡片上 → 显示 `Card.tsx › Card › div:5`

5. **复制调试信息** (3秒)
   - 点击按钮元素
   - 显示 "✅ Copied!" 提示
   - 自动退出检查模式

6. **展示复制内容** (5秒)
   - 打开文本编辑器或终端
   - 粘贴内容：`src/components/Button.tsx:Button:button:12`
   - 高亮显示各部分含义

7. **拖拽按钮** (3秒)
   - 拖拽 🎯 按钮到左上角
   - 展示按钮可以自由移动

8. **Esc 退出** (2秒)
   - 再次进入检查模式
   - 按 Esc 键退出

### 场景 2: 高级功能展示 (20秒)

1. **嵌套组件** (5秒)
   - 悬停在嵌套的深层元素上
   - 显示正确的组件层级

2. **对话框避障** (5秒)
   - 打开一个对话框
   - 🎯 按钮自动移动到对话框内

3. **动态内容** (5秒)
   - 点击计数器按钮
   - 悬停在更新的元素上
   - 显示调试信息仍然正确

4. **完整路径提示** (5秒)
   - 悬停在元素上
   - 鼠标移到 tooltip 上
   - 显示完整路径（通过 title 属性）

## 🎨 录制设置

### 推荐参数
- **分辨率**: 1280x720 或 1920x1080
- **帧率**: 15-30 FPS
- **格式**: GIF (< 5MB) 或 MP4
- **时长**: 20-40 秒

### 优化建议
1. **清理界面**
   - 关闭不必要的浏览器标签
   - 隐藏书签栏
   - 使用无痕模式

2. **放大关键区域**
   - 使用浏览器缩放 (Cmd/Ctrl + +)
   - 确保文字清晰可读

3. **添加鼠标高亮**
   - 使用工具的鼠标高亮功能
   - 让用户清楚看到点击位置

4. **减小文件大小**
   - 裁剪不必要的区域
   - 降低帧率到 15 FPS
   - 使用 GIF 优化工具

## 📦 准备测试应用

创建一个简单的演示应用：

```bash
# 在 test-app 目录
cd test-app

# 启动开发服务器
npm run dev
```

确保应用包含：
- ✅ 标题 (h1)
- ✅ 按钮 (button)
- ✅ 卡片 (div)
- ✅ 计数器（展示动态更新）
- ✅ 嵌套组件

## 🎬 录制步骤

### 1. 准备环境
```bash
# 启动测试应用
cd test-app
npm run dev

# 打开浏览器
open http://localhost:5173
```

### 2. 开始录制
- 打开 Kap 或其他录制工具
- 选择录制区域（浏览器窗口）
- 点击开始录制

### 3. 执行演示
- 按照上面的脚本操作
- 动作要慢一点，清晰明了
- 每个步骤停顿 1-2 秒

### 4. 停止录制
- 点击停止按钮
- 预览录制内容
- 如果不满意，重新录制

### 5. 编辑和导出
- 裁剪不需要的部分
- 添加文字说明（可选）
- 导出为 GIF 或 MP4

### 6. 优化文件大小
```bash
# 使用 gifsicle 优化 GIF
gifsicle -O3 --colors 256 demo.gif -o demo-optimized.gif

# 或使用在线工具
# https://ezgif.com/optimize
```

## 📁 文件命名

建议使用以下命名：
- `demo-basic.gif` - 基本使用流程
- `demo-advanced.gif` - 高级功能
- `demo-full.mp4` - 完整演示视频

## 📤 上传到 GitHub

### 方式 1: 直接上传到仓库
```bash
# 创建 assets 目录
mkdir -p assets

# 复制 GIF 文件
cp demo-basic.gif assets/

# 提交
git add assets/demo-basic.gif
git commit -m "docs: add demo GIF"
git push
```

### 方式 2: 使用 GitHub Issues
1. 创建一个 Issue
2. 拖拽 GIF 到评论框
3. GitHub 会自动上传并生成 URL
4. 复制 URL 到 README

### 方式 3: 使用 CDN
- 上传到 Imgur、Cloudinary 等
- 获取直链
- 在 README 中引用

## 📝 更新 README

在 README.md 中添加：

```markdown
## 🎬 演示

### 基本使用

![基本使用演示](./assets/demo-basic.gif)

### 功能特性

1. **点击 🎯 按钮进入检查模式**
2. **悬停查看元素信息**
3. **点击复制调试标识**
4. **按 Esc 退出**

![高级功能演示](./assets/demo-advanced.gif)
```

## 🎯 录制检查清单

录制前确认：
- [ ] 测试应用正常运行
- [ ] 浏览器窗口大小合适
- [ ] 关闭不必要的标签和扩展
- [ ] 鼠标移动速度适中
- [ ] 每个步骤清晰可见
- [ ] 文字大小足够大
- [ ] 光线充足（如果录制屏幕）

录制后确认：
- [ ] 所有功能都展示了
- [ ] 时长在 20-40 秒之间
- [ ] 文件大小 < 5MB
- [ ] 画面清晰流畅
- [ ] 没有敏感信息

## 💡 提示

1. **多录几次**
   - 第一次通常不完美
   - 多尝试几次找到最佳节奏

2. **保持简洁**
   - 只展示核心功能
   - 避免冗长的操作

3. **添加说明**
   - 在 README 中添加文字说明
   - 配合 GIF 更容易理解

4. **测试不同设备**
   - 在不同分辨率下查看
   - 确保在移动端也能看清

## 🔗 参考资源

- [如何制作完美的 GIF](https://github.com/sindresorhus/guides/blob/main/how-to-make-a-screencast.md)
- [GitHub README 最佳实践](https://github.com/matiassingers/awesome-readme)
- [GIF 优化工具](https://ezgif.com/)

---

**需要帮助？** 如果录制过程中遇到问题，可以参考其他优秀项目的演示方式。
