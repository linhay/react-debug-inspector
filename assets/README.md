# 占位符说明

此目录用于存放项目的演示资源（截图、GIF 等）。

## 📁 文件结构

```
assets/
├── README.md                    # 本文件
├── screenshot-initial.png       # 初始状态截图
├── screenshot-active.png        # 激活状态截图
├── screenshot-copied.png        # 复制成功截图
├── screenshot-debug-info.png    # 调试信息截图
├── demo-basic.gif              # 基本使用演示
└── demo-advanced.gif           # 高级功能演示
```

## 📸 如何添加截图

1. 将文件放入此目录
2. 在 README.md 中引用

## 🎨 文件规范

- **格式**: PNG (截图) / GIF (动画)
- **大小**: 截图 < 500KB, GIF < 5MB
- **分辨率**: 1200-1600px 宽度
- **命名**: 使用描述性的英文名称

## 🔗 在 README 中引用

```markdown
![初始状态](./assets/screenshot-initial.png)
![基本使用](./assets/demo-basic.gif)
```

## 📝 待添加的资源

- [ ] screenshot-initial.png - 初始状态
- [ ] screenshot-active.png - 激活状态
- [ ] screenshot-copied.png - 复制成功
- [ ] screenshot-debug-info.png - 调试信息
- [ ] demo-basic.gif - 基本使用流程
- [ ] demo-advanced.gif - 高级功能展示

## 💡 提示

在添加资源前，请先优化文件大小：
- PNG: 使用 TinyPNG 或 ImageOptim
- GIF: 使用 gifsicle 或 ezgif.com
