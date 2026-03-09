# Changelog

## [1.1.0] - 2026-03-09

### Added
- **文件路径支持**：`data-debug` 属性现在包含完整的文件相对路径
  - 旧格式：`App:div:42`
  - 新格式：`src/components/App.tsx:App:div:42`
- **优化的显示格式**：悬浮提示使用更友好的格式 `文件名 › 组件 › 标签:行号`
- **完整路径提示**：鼠标悬停在 tooltip 上可以看到完整路径（通过 title 属性）
- **Babel 插件测试**：添加了完整的单元测试覆盖
- **类型定义**：添加 @types/node 依赖以支持 TypeScript 类型检查

### Changed
- Babel 插件重构为使用 `Program` visitor 来获取文件路径信息
- Tooltip 样式调整为 `pointer-events: auto` 以支持 title 提示

### Fixed
- 修复了在没有 process 环境下的类型错误

## [1.0.0] - 2026-03-08

### Added
- 初始版本发布
- Babel 插件自动注入 data-debug 属性
- 浏览器端交互界面（拖拽按钮、高亮遮罩、提示标签）
- 智能定位避开弹窗
- 快捷键支持（Esc 退出）
