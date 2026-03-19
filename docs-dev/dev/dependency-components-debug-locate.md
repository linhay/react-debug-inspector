# 依赖组件定位能力说明（含接入方案）

## 结论先行
当前默认能力下，`@linhey/react-debug-inspector` **不直接支持**定位 `node_modules` 内部组件源码。

原因：
1. 本工具通过 Babel/Transform 给 JSX 注入 `data-debug`。
2. 依赖包通常已编译，不再经过你的注入链路。
3. Vite 方案中默认跳过 `node_modules`。

因此，默认可稳定定位的是你项目源码中的组件与标签；对第三方依赖组件，通常只能定位到你的调用层。

## 适用目标
如果你希望定位“依赖组件内部”，建议按“白名单转译 + 注入”方式，仅对指定依赖启用，避免性能和兼容性风险。

## 方案 A（推荐）：只定位业务调用层
适用场景：日常排查、低风险、零侵入。

做法：
1. 保持现有配置不变。
2. 在业务中对复杂依赖组件做一层 wrapper（你自己的组件）。
3. 通过 wrapper 上的 `data-debug` 快速回到业务源码。

优点：
1. 稳定。
2. 对构建性能影响小。
3. 不容易引入第三方包兼容问题。

## 方案 B：依赖白名单转译并注入（进阶）
适用场景：必须定位某几个依赖内部 JSX。

### B1. Next.js（Turbopack/Webpack）建议
在 `next.config.js` 使用 `transpilePackages` 只转译特定依赖：

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    'your-ui-lib',
  ],
};

module.exports = nextConfig;
```

并保持 `.babelrc`：

```json
{
  "presets": ["next/babel"],
  "plugins": ["module:@linhey/react-debug-inspector"]
}
```

### B2. Vite 建议
如果需要处理某依赖源码，建议在你自己的 Vite 插件层做白名单（不要全量放开 `node_modules`）。

思路示例（伪代码）：

```ts
const allowDeps = [/node_modules\/your-ui-lib\//];
const isAllowedDep = allowDeps.some((rule) => rule.test(id));

if (id.includes('node_modules') && !isAllowedDep) return null;
```

## 风险与边界
1. 构建/热更新会变慢。
2. 部分依赖已产出非 JSX 或高度编译产物，注入收益有限。
3. 第三方包源码结构变化会导致定位路径不稳定。
4. 依赖包的 sourcemap 质量会影响可读性。

## 验收建议（BDD）
### 场景 1：白名单外依赖不注入
- **Given** 仅配置 `your-ui-lib` 为白名单
- **When** 启动开发环境
- **Then** 非白名单依赖不出现 `data-debug`

### 场景 2：白名单依赖注入成功
- **Given** `your-ui-lib` 已加入白名单并参与转译
- **When** 渲染其组件
- **Then** 页面可观测到来自依赖组件的 `data-debug`

### 场景 3：业务调用层可兜底定位
- **Given** 依赖内部无法稳定注入
- **When** 通过 wrapper 渲染依赖组件
- **Then** 仍可通过 wrapper 的 `data-debug` 回到业务源码定位问题

## 给 AI 代理的执行指令（可直接粘贴）
1. 先识别项目构建栈（Next 或 Vite）。
2. 默认采用“方案 A”，除非用户明确要求定位依赖内部。
3. 若用户要求依赖内部定位，仅对白名单依赖启用转译与注入。
4. 输出必须包含：
   - 修改文件清单
   - 白名单依赖列表
   - 开发环境验证结果（至少 1 个依赖组件 `data-debug` 证据）
   - 性能与兼容性风险说明
