---
title: 浏览器工具
description: PRX 的浏览器工具提供全功能网页自动化能力，支持可插拔后端、域名限制和截图功能。
---

# 浏览器工具

浏览器工具为 PRX Agent 提供网页自动化能力，包括页面导航、表单填写、元素点击、内容提取和截图。PRX 的浏览器实现采用可插拔后端架构，支持三种不同的自动化引擎，适应从轻量级页面交互到完整的 computer-use 场景。

浏览器工具包含 `browser`（全功能自动化）、`browser_open`（简单 URL 打开）、`screenshot`（屏幕截图）、`image`（图像处理）和 `image_info`（图像元数据提取）五个工具。其中 `browser` 和 `browser_open` 需要显式启用，而 `screenshot`、`image` 和 `image_info` 在 `all_tools()` 模式下始终可用。

所有浏览器操作都受域名白名单限制——Agent 只能访问配置中明确允许的域名，防止访问不安全的网站或泄露内部网络信息。

## 配置

在 `config.toml` 中启用和配置浏览器工具：

```toml
[browser]
enabled = true

# 可插拔后端选择
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# 域名白名单（必填）
allowed_domains = [
    "github.com",
    "stackoverflow.com",
    "docs.rs",
    "*.openprx.dev",
    "*.wikipedia.org"
]

# 浏览器行为配置
headless = true             # 无头模式
timeout_secs = 30           # 页面加载超时
viewport_width = 1280       # 视口宽度
viewport_height = 720       # 视口高度
user_agent = "PRX-Agent/1.0"

# 截图配置
screenshot_format = "png"   # "png" | "jpeg" | "webp"
screenshot_quality = 80     # JPEG/WebP 质量（1-100）
max_screenshot_size = 5242880  # 最大截图文件大小（5MB）
```

### 后端特定配置

```toml
# agent-browser CLI 后端
[browser.agent_browser]
binary_path = "/usr/local/bin/agent-browser"
extra_args = ["--disable-gpu"]

# Rust 原生后端
[browser.rust_native]
chromium_path = "/usr/bin/chromium"

# computer-use 边车后端
[browser.computer_use]
sidecar_url = "http://localhost:8080"
```

## 使用方法

### browser — 全功能自动化

`browser` 工具支持多种操作类型：

```json
{
  "tool": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

支持的操作：

```json
// 导航到 URL
{"action": "navigate", "url": "https://github.com"}

// 点击元素
{"action": "click", "selector": "#submit-button"}

// 填写表单
{"action": "fill", "selector": "#search-input", "value": "PRX agent"}

// 提取页面文本
{"action": "extract_text", "selector": "article.main-content"}

// 获取页面截图
{"action": "screenshot"}

// 执行 JavaScript
{"action": "evaluate", "script": "document.title"}

// 等待元素出现
{"action": "wait_for", "selector": ".results-loaded", "timeout": 10}
```

### browser_open — 简单打开 URL

```json
{
  "tool": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio"
  }
}
```

### screenshot — 屏幕截图

```json
{
  "tool": "screenshot",
  "arguments": {
    "target": "screen",
    "format": "png"
  }
}
```

### image — 图像处理

```json
{
  "tool": "image",
  "arguments": {
    "action": "resize",
    "path": "/tmp/screenshot.png",
    "width": 800,
    "height": 600
  }
}
```

### image_info — 图像元数据

```json
{
  "tool": "image_info",
  "arguments": {
    "path": "/tmp/photo.jpg"
  }
}
```

## 参数

### browser 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型：`navigate`、`click`、`fill`、`extract_text`、`screenshot`、`evaluate`、`wait_for` |
| `url` | string | 条件 | 目标 URL（`navigate` 操作必填） |
| `selector` | string | 条件 | CSS 选择器（`click`、`fill`、`extract_text`、`wait_for` 操作必填） |
| `value` | string | 条件 | 输入值（`fill` 操作必填） |
| `script` | string | 条件 | JavaScript 代码（`evaluate` 操作必填） |
| `timeout` | integer | 否 | 操作超时秒数（默认 30） |

### browser_open 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `url` | string | 是 | 要打开的 URL（必须在 `allowed_domains` 中） |

### screenshot 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `target` | string | 否 | `"screen"` | 截图目标：`screen`（全屏）或 `window`（当前窗口） |
| `format` | string | 否 | `"png"` | 图片格式 |
| `path` | string | 否 | 自动生成 | 保存路径 |

### image 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作：`resize`、`crop`、`convert` |
| `path` | string | 是 | 源图像路径 |
| `width` | integer | 条件 | 目标宽度（`resize` 必填） |
| `height` | integer | 条件 | 目标高度（`resize` 必填） |
| `format` | string | 条件 | 目标格式（`convert` 必填） |

### image_info 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `path` | string | 是 | 图像文件路径 |

## 可插拔后端

PRX 的浏览器工具支持三种自动化后端：

| 后端 | 说明 | 适用场景 |
|------|------|----------|
| `agent_browser` | 通过 agent-browser CLI 工具驱动浏览器 | 生产环境，功能最全 |
| `rust_native` | 纯 Rust 实现的 CDP（Chrome DevTools Protocol）客户端 | 轻量部署，无额外依赖 |
| `computer_use` | 通过边车服务实现 OS 级操作 | 需要鼠标/键盘模拟的场景 |

### agent_browser 后端

最推荐的后端。通过独立的 `agent-browser` CLI 进程与 Chromium 交互，支持：

- 多标签页管理
- Cookie 和会话持久化
- 网络请求拦截
- 完整的 DOM 操作

### rust_native 后端

纯 Rust 实现，直接通过 CDP 协议与 Chromium 通信。优势是零额外依赖，劣势是功能集相对有限。

### computer_use 后端

通过边车（sidecar）服务实现操作系统级的浏览器控制，包括鼠标移动、键盘输入、屏幕识别等。适用于需要模拟真实用户操作的复杂场景。

## 安全性

### 域名白名单

浏览器工具的核心安全机制是域名白名单。所有导航请求都会检查目标 URL 是否在 `allowed_domains` 列表中：

```toml
[browser]
allowed_domains = ["github.com", "*.example.com"]
```

- 不在白名单中的域名会被立即拒绝
- 支持通配符匹配（`*.example.com` 匹配所有子域名）
- 重定向也受白名单限制——如果重定向目标不在白名单中，请求会被中止

### 无头模式

生产环境强烈建议使用无头模式（`headless = true`），避免：

- 视觉信息泄露
- 用户交互干扰
- 减少攻击面

### JavaScript 执行限制

`evaluate` 操作允许执行任意 JavaScript，这是一个高权限功能。建议：

```toml
[security.tool_policy.tools]
browser = "supervised"   # 对浏览器操作启用监督
```

### 资源限制

浏览器操作可能消耗大量资源。通过以下配置限制：

- `timeout_secs` — 防止长时间运行的页面加载
- `max_screenshot_size` — 限制截图文件大小
- `[security.resources]` — 全局内存和 CPU 限制

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [网页搜索](/zh/prx/tools/web-search/) — DuckDuckGo 和 Brave Search 集成
- [HTTP 请求](/zh/prx/tools/http-request/) — 直接 API 调用
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
