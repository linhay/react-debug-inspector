# agent-browser Pages 测试案例

适用场景：需要用 `agent-browser` 对 GitHub Pages 演示站或本地 demo 做快速冒烟验证、交互回归、可视化巡检。

## 前置条件

### 线上 Pages

无需本地启动服务，直接访问：

```bash
agent-browser open https://linhay.github.io/react-debug-inspector/
agent-browser wait --load networkidle
agent-browser snapshot -i
```

预期至少能看到：

- `返回 GitHub`
- `Increment`
- `Reset Counter`
- `Open Dialog`
- `🎯`

### 本地 Pages Demo

建议使用独立端口，避免被本机已有 `:5173` 服务污染：

```bash
npm run dev:test-app -- --host 127.0.0.1 --port 4173
```

然后连接本地页面：

```bash
agent-browser open http://127.0.0.1:4173/
agent-browser wait --load networkidle
agent-browser snapshot -i
```

## 案例 1：验证检查器菜单出现

目标：确认点击 `🎯` 后，悬浮元素可以出现扩展复制菜单。

```bash
agent-browser click @e5
agent-browser hover h1
agent-browser wait 300
agent-browser snapshot -i
```

预期新增：

- `复制 ID`
- `复制文案`
- `复制图片`
- `全部复制`

备注：当前实测在本地 demo 中，上述四个按钮均可通过 snapshot 被识别。

## 案例 2：验证“全部复制”入口可点击

目标：确认 Copy Showcase 区块能触发“全部复制”动作。

```bash
agent-browser hover .copy-showcase
agent-browser wait 300
agent-browser snapshot -i
agent-browser click @e9
agent-browser wait 300
```

说明：

- `@e9` 对应 snapshot 中的 `全部复制`
- 该动作本身不会触发页面跳转
- `agent-browser` 默认上下文下不一定有剪贴板读权限，因此更稳妥的检查是确认按钮出现且动作可执行

如果只需要确认当前页面文本结构仍然完整，可附加：

```bash
agent-browser get text body
```

## 案例 3：验证弹窗场景下仍可使用检查器

目标：确认打开对话框后，检查器与复制菜单仍可工作。

```bash
agent-browser open http://127.0.0.1:4173/
agent-browser wait --load networkidle
agent-browser click "text=Open Dialog"
agent-browser wait 300
agent-browser snapshot -i
```

预期包含：

- `Close`
- `🎯`

继续验证检查菜单：

```bash
agent-browser click @e6
agent-browser hover @e5
agent-browser wait 300
agent-browser snapshot -i
```

预期再次看到：

- `复制 ID`
- `复制文案`
- `复制图片`
- `全部复制`

## 案例 4：线上 Pages 基础可用性验证

目标：确认线上站点仍然可加载基础演示元素。

```bash
agent-browser open https://linhay.github.io/react-debug-inspector/
agent-browser wait --load networkidle
agent-browser snapshot -i
```

当前实测结果：

- 可见 `返回 GitHub`
- 可见 `Increment`
- 可见 `Reset Counter`
- 可见 `Open Dialog`
- 可见 `🎯`

## 常见问题

### 1. `snapshot -i` 命中的是别的本地页面

原因：本机已有其他服务占用了 `:5173`，而 Playwright / browser 工具默认可能复用旧服务。

处理：

```bash
npm run dev:test-app -- --host 127.0.0.1 --port 4173
agent-browser open http://127.0.0.1:4173/
```

### 2. 无法直接读取剪贴板内容

现象：执行类似以下命令时报 `readText` 权限错误：

```bash
agent-browser eval "navigator.clipboard.readText().then((t) => console.log(t))"
```

原因：自动化上下文未授予剪贴板读权限。

建议：

- 用 `snapshot -i` 验证菜单是否出现
- 用 `click` + 页面反馈验证动作可执行
- 需要严格校验剪贴板内容时，优先使用仓库内 Playwright 测试
