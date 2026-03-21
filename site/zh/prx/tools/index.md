---
title: 工具概览
description: PRX 提供 46+ 内置工具，分为 12 个类别。工具是 Agent 在推理循环中可以调用的能力，用于与操作系统、网络、记忆和外部服务交互。
---

# 工具概览

工具（Tools）是 PRX Agent 在推理循环中可以调用的能力。当 LLM 决定需要执行某个动作——运行命令、读取文件、搜索网页、存储记忆——它会以结构化 JSON 参数调用相应的工具。PRX 执行工具、应用安全策略，然后将结果返回给 LLM 进行下一步推理。

PRX 内置 **46+ 工具**，涵盖 12 个类别，从基础文件 I/O 到浏览器自动化、多 Agent 委托和 MCP 协议集成。

## 工具架构

每个工具都实现 `Tool` trait：

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

每个工具提供参数的 JSON Schema，作为函数定义发送给 LLM。LLM 生成结构化调用，PRX 在执行前根据 Schema 验证参数。

## 工具注册表：`default_tools()` vs `all_tools()`

PRX 使用双层注册表系统：

### `default_tools()` — 最小核心（3 个工具）

用于轻量级或受限 Agent 的最小工具集。始终可用，无需额外配置：

| 工具 | 说明 |
|------|------|
| `shell` | Shell 命令执行，带沙箱隔离 |
| `file_read` | 读取文件内容（支持 ACL） |
| `file_write` | 写入文件内容 |

### `all_tools()` — 完整注册表（46+ 工具）

完整工具集，根据配置条件组装。工具按功能开关条件注册：

- **始终注册**：核心工具、记忆、定时任务、调度、Git、视觉、节点、推送通知、画布、代理配置、模式处理
- **条件注册**：浏览器（需 `browser.enabled`）、HTTP 请求（需 `http_request.enabled`）、网页搜索（需 `web_search.enabled`）、网页获取（需 `web_search.fetch_enabled` + `browser.allowed_domains`）、MCP（需 `mcp.enabled`）、Composio（需 API 密钥）、委托/Agent 列表（需定义 Agent 配置）

## 分类参考

### 核心（3 个工具）— 始终可用

基础工具，同时存在于 `default_tools()` 和 `all_tools()` 中。

| 工具 | 说明 |
|------|------|
| `shell` | 执行 Shell 命令，支持可配置的沙箱隔离（Landlock/Firejail/Bubblewrap/Docker）。60 秒超时，1MB 输出上限，环境变量已净化。 |
| `file_read` | 读取文件内容并验证路径。当启用记忆 ACL 时，阻止访问记忆 Markdown 文件以强制执行访问控制。 |
| `file_write` | 写入文件内容。受安全策略检查约束。 |

### 记忆（5 个工具）

长期记忆操作，用于存储、检索和管理 Agent 的持久化知识。

| 工具 | 说明 |
|------|------|
| `memory_store` | 在长期记忆中存储事实、偏好或笔记。支持分类：`core`（永久）、`daily`（会话）、`conversation`（对话上下文）或自定义分类。 |
| `memory_forget` | 从长期记忆中删除特定条目。 |
| `memory_get` | 按键检索特定记忆条目。启用 ACL 时支持访问控制。 |
| `memory_recall` | 按关键词或语义相似度回忆记忆。当 `memory.acl_enabled = true` 时此工具被禁用。 |
| `memory_search` | 对记忆条目进行全文搜索和向量搜索。启用 ACL 时支持访问控制。 |

### 定时任务 / 调度（9 个工具）

基于时间的任务自动化和 Xin 调度引擎。

| 工具 | 说明 |
|------|------|
| `cron` | 传统 cron 入口——创建或管理定时任务。 |
| `cron_add` | 添加新的 cron 任务，包含 cron 表达式、命令和可选描述。 |
| `cron_list` | 列出所有已注册的 cron 任务及其调度和状态。 |
| `cron_remove` | 按 ID 删除 cron 任务。 |
| `cron_update` | 更新现有 cron 任务的调度、命令或设置。 |
| `cron_run` | 立即手动触发一个 cron 任务。 |
| `cron_runs` | 查看 cron 任务的执行历史和日志。 |
| `schedule` | 使用自然语言时间表达式调度一次性或周期性任务。 |
| `xin` | Xin 调度引擎——支持依赖链和条件执行的高级任务调度。 |

### 浏览器 / 视觉（5 个工具）

网页自动化和图像处理。浏览器工具需要 `[browser] enabled = true`。

| 工具 | 说明 |
|------|------|
| `browser` | 全功能浏览器自动化，支持可插拔后端（agent-browser CLI、Rust 原生、computer-use 边车）。支持导航、表单填写、点击、截图和操作系统级操作。 |
| `browser_open` | 在浏览器中打开 URL。通过 `browser.allowed_domains` 限制域名。 |
| `screenshot` | 捕获当前屏幕或特定窗口的截图。 |
| `image` | 处理和转换图像（调整大小、裁剪、格式转换）。 |
| `image_info` | 从图像文件中提取元数据和尺寸信息。 |

### 网络（4 个工具）

HTTP 请求、网页搜索、网页获取和 MCP 协议集成。

| 工具 | 说明 |
|------|------|
| `http_request` | 发起 HTTP 请求访问 API。默认拒绝：仅 `allowed_domains` 中的域名可达。可配置超时和最大响应大小。 |
| `web_search_tool` | 通过 DuckDuckGo（免费，无需密钥）或 Brave Search（需 API 密钥）搜索网页。 |
| `web_fetch` | 获取并提取网页内容。需要同时设置 `web_search.fetch_enabled` 和 `browser.allowed_domains`。 |
| `mcp` | MCP（模型上下文协议）客户端——连接外部 MCP 服务器（stdio 或 HTTP 传输）并调用其工具。支持工作区本地 `mcp.json` 自动发现。 |

### 消息（2 个工具）

通过通信渠道发送消息。

| 工具 | 说明 |
|------|------|
| `message_send` | 向任何已配置的渠道和接收者发送消息（文本、媒体、语音）。自动路由到当前活跃渠道。 |
| `gateway` | 底层网关访问，通过 Axum HTTP/WebSocket 网关发送原始消息。 |

### 会话 / Agent（8 个工具）

多 Agent 编排：派生子 Agent、委托任务、管理并发会话。

| 工具 | 说明 |
|------|------|
| `sessions_spawn` | 派生一个异步子 Agent 在后台运行。立即返回运行 ID；完成后自动回报结果。支持 `history` 和 `steer` 操作。 |
| `sessions_send` | 向运行中的子 Agent 会话发送消息。 |
| `sessions_list` | 列出所有活跃的子 Agent 会话及状态。 |
| `sessions_history` | 查看子 Agent 运行的对话日志。 |
| `session_status` | 检查特定会话的状态。 |
| `subagents` | 管理子 Agent 池——列出、停止或检查子 Agent。 |
| `agents_list` | 列出所有已配置的委托 Agent 及其模型和能力。仅在配置中定义了 Agent 时注册。 |
| `delegate` | 将任务委托给指定的 Agent，该 Agent 拥有独立的提供商、模型和工具集。支持备用凭据和隔离的 Agent 循环。 |

### 远程设备（2 个工具）

与远程节点交互和推送通知。

| 工具 | 说明 |
|------|------|
| `nodes` | 在分布式部署中管理和通信远程 PRX 节点。 |
| `pushover` | 通过 Pushover 服务发送推送通知。 |

### Git（1 个工具）

版本控制操作。

| 工具 | 说明 |
|------|------|
| `git_operations` | 在工作区仓库中执行 Git 操作（status、diff、commit、push、pull、log、branch）。 |

### 配置（2 个工具）

运行时配置管理。

| 工具 | 说明 |
|------|------|
| `config_reload` | 热重载 PRX 配置文件，无需重启进程。 |
| `proxy_config` | 在运行时查看和修改代理/网络配置。 |

### 第三方集成（1 个工具）

外部平台连接器。

| 工具 | 说明 |
|------|------|
| `composio` | 通过 Composio 平台连接 250+ 应用和服务。需要 Composio API 密钥。 |

### 渲染（2 个工具）

内容生成和输出格式化。

| 工具 | 说明 |
|------|------|
| `canvas` | 渲染结构化内容（表格、图表、图示）用于视觉输出。 |
| `tts` | 文字转语音——将文本转换为语音消息并发送到当前对话。自动处理 MP3 生成、M4A 转换和投递。 |

### 管理（1 个工具）

内部模式和诊断。

| 工具 | 说明 |
|------|------|
| `schema` | JSON Schema 清理和规范化，用于跨提供商 LLM 兼容性。解析 `$ref`、展平联合类型、剥离不支持的关键字。 |

## 完整工具矩阵

| 工具 | 类别 | 默认 | 启用条件 |
|------|------|------|----------|
| `shell` | 核心 | 是 | 始终 |
| `file_read` | 核心 | 是 | 始终 |
| `file_write` | 核心 | 是 | 始终 |
| `memory_store` | 记忆 | -- | `all_tools()` |
| `memory_forget` | 记忆 | -- | `all_tools()` |
| `memory_get` | 记忆 | -- | `all_tools()` |
| `memory_recall` | 记忆 | -- | `all_tools()`，当 `memory.acl_enabled = true` 时禁用 |
| `memory_search` | 记忆 | -- | `all_tools()` |
| `cron` | 定时 | -- | `all_tools()` |
| `cron_add` | 定时 | -- | `all_tools()` |
| `cron_list` | 定时 | -- | `all_tools()` |
| `cron_remove` | 定时 | -- | `all_tools()` |
| `cron_update` | 定时 | -- | `all_tools()` |
| `cron_run` | 定时 | -- | `all_tools()` |
| `cron_runs` | 定时 | -- | `all_tools()` |
| `schedule` | 调度 | -- | `all_tools()` |
| `xin` | 调度 | -- | `all_tools()` |
| `browser` | 浏览器 | -- | `browser.enabled = true` |
| `browser_open` | 浏览器 | -- | `browser.enabled = true` |
| `screenshot` | 视觉 | -- | `all_tools()` |
| `image` | 视觉 | -- | `all_tools()` |
| `image_info` | 视觉 | -- | `all_tools()` |
| `http_request` | 网络 | -- | `http_request.enabled = true` |
| `web_search_tool` | 网络 | -- | `web_search.enabled = true` |
| `web_fetch` | 网络 | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | 网络 | -- | `mcp.enabled = true` + 已定义服务器 |
| `message_send` | 消息 | -- | 渠道活跃（网关级注册） |
| `gateway` | 消息 | -- | `all_tools()` |
| `sessions_spawn` | 会话 | -- | `all_tools()` |
| `sessions_send` | 会话 | -- | `all_tools()` |
| `sessions_list` | 会话 | -- | `all_tools()` |
| `sessions_history` | 会话 | -- | `all_tools()` |
| `session_status` | 会话 | -- | `all_tools()` |
| `subagents` | 会话 | -- | `all_tools()` |
| `agents_list` | Agent | -- | 已定义 `[agents.*]` 配置 |
| `delegate` | Agent | -- | 已定义 `[agents.*]` 配置 |
| `nodes` | 远程 | -- | `all_tools()` |
| `pushover` | 远程 | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | 配置 | -- | `all_tools()` |
| `proxy_config` | 配置 | -- | `all_tools()` |
| `composio` | 第三方 | -- | `composio.api_key` 已设置 |
| `canvas` | 渲染 | -- | `all_tools()` |
| `tts` | 渲染 | -- | 渠道活跃（网关级注册） |
| `schema` | 管理 | -- | 内部使用（Schema 规范化模块） |

## 启用和禁用工具

### 功能开关工具

许多工具通过各自的配置节启用。在 `config.toml` 中添加：

```toml
# ── 浏览器工具 ─────────────────────────────────────────────────
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# ── HTTP 请求工具 ──────────────────────────────────────────────
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# ── 网页搜索工具 ──────────────────────────────────────────────
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo"（免费）或 "brave"（需 API 密钥）
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# 同时启用网页获取，用于页面内容提取：
fetch_enabled = true
fetch_max_chars = 50000

# ── Composio 集成 ─────────────────────────────────────────────
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### 工具策略管道

对于细粒度控制，使用 `[security.tool_policy]` 配置节来允许、拒绝或监督单个工具或工具组：

```toml
[security.tool_policy]
# 默认策略："allow"、"deny" 或 "supervised"
default = "allow"

# 组级策略
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# 工具级覆盖（最高优先级）
[security.tool_policy.tools]
shell = "supervised"     # 执行前需要审批
gateway = "allow"
composio = "deny"        # 即使设置了 API 密钥也禁用 Composio
```

策略解析顺序（优先级从高到低）：
1. 工具级策略（`security.tool_policy.tools.<名称>`）
2. 组级策略（`security.tool_policy.groups.<组名>`）
3. 默认策略（`security.tool_policy.default`）

### 委托 Agent 工具限制

配置委托 Agent 时，可以限制其可访问的工具：

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "你是一个研究助手。"
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## MCP 工具集成

PRX 实现了 MCP（模型上下文协议）客户端，允许连接外部 MCP 服务器并将其工具暴露给 Agent。

### 配置

在 `config.toml` 中定义 MCP 服务器：

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### 工作区本地 `mcp.json`

PRX 还会从工作区本地的 `mcp.json` 文件中发现 MCP 服务器，遵循与 VS Code 和 Claude Desktop 相同的格式：

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

`mcp.json` 中的命令被限制在安全启动器白名单内：`npx`、`node`、`python`、`python3`、`uvx`、`uv`、`deno`、`bun`、`docker`、`cargo`、`go`、`ruby`、`php`、`dotnet`、`java`。

### 动态工具发现

MCP 工具在运行时通过 `tools/list` 协议方法发现。每个 MCP 服务器的工具带有命名空间，作为可调用函数暴露给 LLM。`mcp` 工具支持 `refresh()` 钩子，在每个 Agent 轮次前重新发现工具。

危险环境变量（`LD_PRELOAD`、`DYLD_INSERT_LIBRARIES`、`NODE_OPTIONS`、`PYTHONPATH` 等）会从 MCP 服务器进程中自动剥离。

## 安全：沙箱和 ACL

### 工具沙箱

`shell` 工具在可配置的沙箱内执行命令。PRX 支持 4 种沙箱后端加一个无操作回退：

```toml
[security.sandbox]
enabled = true           # None = 自动检测, true/false = 显式设置
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# 自定义 Firejail 参数（当 backend = "firejail" 时）
firejail_args = ["--net=none", "--noroot"]
```

| 后端 | 平台 | 隔离级别 | 说明 |
|------|------|----------|------|
| Landlock | Linux（内核 LSM） | 文件系统 | 内核原生，无额外依赖 |
| Firejail | Linux | 全面（网络、文件系统、PID） | 用户空间，广泛可用 |
| Bubblewrap | Linux, macOS | 基于命名空间 | 用户命名空间，轻量 |
| Docker | 任意 | 容器 | 完整容器隔离 |
| None | 任意 | 仅应用层 | 无操作系统级隔离 |

自动检测模式（`backend = "auto"`）按以下顺序探测可用后端：Landlock、Firejail、Bubblewrap、Docker，最后回退到 None 并发出警告。

### Shell 环境净化

`shell` 工具仅将严格白名单内的环境变量传递给子进程：`PATH`、`HOME`、`TERM`、`LANG`、`LC_ALL`、`LC_CTYPE`、`USER`、`SHELL`、`TMPDIR`。API 密钥、令牌和机密信息永远不会暴露。

### 记忆 ACL

当 `memory.acl_enabled = true` 时，对记忆操作执行访问控制：

- `file_read` 阻止访问记忆 Markdown 文件
- `memory_recall` 完全禁用（从工具注册表中移除）
- `memory_get` 和 `memory_search` 强制执行按主体的访问限制

### 安全策略

每个工具调用在执行前都会通过 `SecurityPolicy` 层。策略引擎可以：

- 根据工具策略规则阻止操作
- 对 `supervised` 工具要求主管审批
- 审计所有工具调用
- 执行速率限制和资源约束

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## 扩展：编写自定义工具

添加新工具的步骤：

1. 在 `src/tools/` 中创建新模块，实现 `Tool` trait
2. 在 `src/tools/mod.rs` 的 `all_tools_with_runtime_ext()` 中注册
3. 在 `mod.rs` 中添加 `pub mod` 和 `pub use` 条目

示例：

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "执行某个有用的操作。"
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "输入值" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("已处理: {input}"),
            error: None,
        })
    }
}
```

详见 `AGENTS.md` 第 7.3 节完整的变更流程。
