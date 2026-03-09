# 截图指南

由于我无法直接生成截图，这里提供详细的截图指导，你可以按照以下步骤自行截取。

## 📸 需要的截图

### 1. 初始状态 (`screenshot-initial.png`)

**内容：**
- 显示右下角的 🎯 按钮
- 一个简单的 React 应用界面
- 按钮处于未激活状态（蓝色）

**截图区域：**
- 整个浏览器窗口
- 或只截取应用区域

**参考布局：**
```
┌─────────────────────────────────┐
│  React Debug Inspector Demo     │
│                                  │
│  ┌──────────────────────────┐  │
│  │  Counter: 0              │  │
│  │  [Increment]             │  │
│  └──────────────────────────┘  │
│                                  │
│                          [🎯]   │
└─────────────────────────────────┘
```

### 2. 检查模式激活 (`screenshot-active.png`)

**内容：**
- 🎯 按钮变为红色
- 光标变为十字形
- 鼠标悬停在某个元素上

**要点：**
- 显示高亮的元素（蓝色虚线边框）
- 显示 tooltip 提示信息

**参考布局：**
```
┌─────────────────────────────────┐
│  React Debug Inspector Demo     │
│                                  │
│  ┌──────────────────────────┐  │
│  │╔═══════════════════════╗ │  │
│  │║ Counter: 0            ║ │  │ ← 高亮元素
│  │╚═══════════════════════╝ │  │
│  │  [Increment]             │  │
│  └──────────────────────────┘  │
│  ┌─────────────────────────┐   │
│  │ Card.tsx › Card › div:5 │   │ ← tooltip
│  └─────────────────────────┘   │
│                          [🎯]   │ ← 红色按钮
└─────────────────────────────────┘
```

### 3. 复制成功 (`screenshot-copied.png`)

**内容：**
- 显示 "✅ Copied!" 提示
- 高亮变为绿色
- 即将退出检查模式

**参考布局：**
```
┌─────────────────────────────────┐
│  React Debug Inspector Demo     │
│                                  │
│  ┌──────────────────────────┐  │
│  │╔═══════════════════════╗ │  │
│  │║ [Increment]           ║ │  │ ← 绿色高亮
│  │╚═══════════════════════╝ │  │
│  └──────────────────────────┘  │
│  ┌──────────────┐              │
│  │ ✅ Copied!   │              │ ← 成功提示
│  └──────────────┘              │
│                          [🎯]   │
└─────────────────────────────────┘
```

### 4. 调试信息展示 (`screenshot-debug-info.png`)

**内容：**
- 文本编辑器或终端
- 显示粘贴的调试信息
- 标注各部分含义

**示例内容：**
```
src/components/Button.tsx:Button:button:42
│                         │      │      │
│                         │      │      └─ 行号
│                         │      └──────── 标签名
│                         └─────────────── 组件名
└───────────────────────────────────────── 文件路径
```

### 5. 多个元素对比 (`screenshot-multiple.png`)

**内容：**
- 展示不同元素的调试信息
- 标题、按钮、卡片等

**示例：**
```
悬停在标题上：
App.tsx › App › h1:8

悬停在按钮上：
Button.tsx › Button › button:12

悬停在卡片上：
Card.tsx › Card › div:5
```

## 🛠️ 截图工具

### macOS
```bash
# 截取选定区域
Cmd + Shift + 4

# 截取整个窗口
Cmd + Shift + 4 + Space
```

### Windows
```bash
# 使用 Snipping Tool
Win + Shift + S
```

### 浏览器开发者工具
```bash
# Chrome DevTools
Cmd/Ctrl + Shift + P
输入 "screenshot"
选择 "Capture full size screenshot"
```

## 📐 截图规范

### 尺寸
- **宽度**: 1200-1600px
- **高度**: 根据内容自适应
- **格式**: PNG (保持清晰度)

### 优化
```bash
# 使用 ImageOptim (macOS)
# 或在线工具: https://tinypng.com/

# 命令行优化
pngquant screenshot.png --output screenshot-optimized.png
```

### 文件命名
- `screenshot-initial.png` - 初始状态
- `screenshot-active.png` - 激活状态
- `screenshot-copied.png` - 复制成功
- `screenshot-debug-info.png` - 调试信息
- `screenshot-multiple.png` - 多元素对比

## 🎨 美化建议

### 1. 使用标注工具
- **Skitch** (macOS) - https://evernote.com/products/skitch
- **Snagit** - https://www.techsmith.com/screen-capture.html
- **Annotate** - https://annotate.app/

### 2. 添加箭头和文字
- 指向关键元素
- 说明操作步骤
- 标注重要信息

### 3. 统一风格
- 使用相同的浏览器主题
- 保持窗口大小一致
- 使用相同的字体大小

## 📝 截图步骤

### 准备工作
1. 启动测试应用
   ```bash
   cd test-app
   npm run dev
   ```

2. 打开浏览器（推荐 Chrome）
   ```bash
   open http://localhost:5173
   ```

3. 调整窗口大小
   - 宽度约 1200px
   - 高度根据内容调整

4. 清理界面
   - 关闭不必要的标签
   - 隐藏书签栏
   - 使用无痕模式

### 截图流程

#### 截图 1: 初始状态
1. 确保 🎯 按钮可见
2. 应用处于正常状态
3. 截取整个窗口
4. 保存为 `screenshot-initial.png`

#### 截图 2: 激活状态
1. 点击 🎯 按钮
2. 悬停在一个元素上（如标题）
3. 等待 tooltip 显示
4. 截取窗口
5. 保存为 `screenshot-active.png`

#### 截图 3: 复制成功
1. 在激活状态下点击元素
2. 快速截图（显示 "✅ Copied!"）
3. 保存为 `screenshot-copied.png`

#### 截图 4: 调试信息
1. 打开文本编辑器或终端
2. 粘贴复制的内容
3. 使用标注工具添加说明
4. 保存为 `screenshot-debug-info.png`

#### 截图 5: 多元素对比
1. 创建一个拼图
2. 展示不同元素的 tooltip
3. 使用图片编辑工具组合
4. 保存为 `screenshot-multiple.png`

## 🖼️ 创建拼图

使用在线工具或图片编辑软件：

### 在线工具
- **Canva** - https://www.canva.com/
- **Figma** - https://www.figma.com/
- **Photopea** - https://www.photopea.com/

### 拼图布局示例
```
┌─────────────────────────────────────┐
│  初始状态          激活状态          │
│  [screenshot 1]    [screenshot 2]   │
├─────────────────────────────────────┤
│  复制成功          调试信息          │
│  [screenshot 3]    [screenshot 4]   │
└─────────────────────────────────────┘
```

## 📤 上传截图

### 1. 添加到仓库
```bash
# 复制截图到 assets 目录
cp ~/Desktop/screenshot-*.png assets/

# 提交
git add assets/
git commit -m "docs: add screenshots"
git push
```

### 2. 更新 README
```markdown
## 🎬 演示

### 初始状态
![初始状态](./assets/screenshot-initial.png)

### 使用流程
![激活状态](./assets/screenshot-active.png)

### 复制成功
![复制成功](./assets/screenshot-copied.png)
```

## ✅ 检查清单

截图前：
- [ ] 测试应用正常运行
- [ ] 浏览器窗口大小合适
- [ ] 界面干净整洁
- [ ] 字体大小适中

截图后：
- [ ] 图片清晰
- [ ] 文件大小合理 (< 500KB)
- [ ] 文件命名规范
- [ ] 已优化压缩

## 💡 提示

1. **使用高分辨率显示器**
   - 截图会更清晰
   - 文字更易读

2. **保持一致性**
   - 所有截图使用相同的浏览器
   - 相同的窗口大小
   - 相同的缩放级别

3. **突出重点**
   - 使用箭头指向关键元素
   - 添加文字说明
   - 使用高亮标注

4. **测试不同设备**
   - 在不同分辨率下查看
   - 确保在移动端也能看清

---

**需要帮助？** 如果有任何问题，可以参考其他优秀开源项目的截图方式。
