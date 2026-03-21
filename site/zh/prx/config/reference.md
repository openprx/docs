---
title: 完整配置参考
description: PRX 所有配置项的完整参考文档，含字段类型、默认值和说明。
---

# 完整配置参考

本页列出 `config.toml` 中所有可用配置项。配置文件路径默认为 `~/.openprx/config.toml`。

## 顶层字段 {#default}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `api_key` | `string?` | - | 所选提供商的 API Key。可被 `OPENPRX_API_KEY` 等环境变量覆盖 |
| `api_url` | `string?` | - | 提供商 API 的 Base URL 覆盖（如远程 Ollama: `http://10.0.0.1:11434`） |
| `default_provider` | `string?` | `"openrouter"` | 默认提供商 ID 或别名（`anthropic`、`openai`、`ollama`、`gemini` 等） |
| `default_model` | `string?` | - | 默认模型名（如 `anthropic/claude-sonnet-4-6`） |
| `default_temperature` | `f64` | `0.7` | 模型温度参数（0.0 - 2.0） |

```toml
default_provider = "anthropic"
default_model = "claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]` - 网关服务器 {#gateway}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `host` | `string` | `"127.0.0.1"` | 网关绑定地址 |
| `port` | `u16` | `16830` | 网关监听端口 |
| `require_pairing` | `bool` | `true` | 是否要求配对认证才接受请求 |
| `allow_public_bind` | `bool` | `false` | 允许绑定非本地地址（无隧道时） |
| `pair_rate_limit_per_minute` | `u32` | `10` | `/pair` 端点每分钟每客户端最大请求数 |
| `webhook_rate_limit_per_minute` | `u32` | `60` | `/webhook` 端点每分钟每客户端最大请求数 |
| `api_rate_limit_per_minute` | `u32` | `60` | `/api/*` 端点每分钟每 token 最大请求数 |
| `trust_forwarded_headers` | `bool` | `false` | 信任 `X-Forwarded-For` 头（仅在反向代理后启用） |
| `rate_limit_max_keys` | `usize` | `10000` | 速率限制器最大跟踪客户端数 |
| `idempotency_ttl_secs` | `u64` | `300` | Webhook 幂等键 TTL（秒） |
| `idempotency_max_keys` | `usize` | `10000` | 内存中最大幂等键数量 |
| `request_timeout_secs` | `u64` | `60` | HTTP 请求超时（秒） |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
request_timeout_secs = 60
```

## `[channels_config]` - 消息渠道 {#channels-config}

### `[channels_config.telegram]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bot_token` | `string` | *必填* | Telegram Bot API Token（从 @BotFather 获取） |
| `allowed_users` | `string[]` | `[]` | 允许的用户 ID 或用户名列表。空数组 = 拒绝所有 |
| `stream_mode` | `"off" \| "partial"` | `"off"` | 流式输出模式：`off` 发送完整消息，`partial` 逐步编辑消息 |
| `draft_update_interval_ms` | `u64` | `1000` | 流式模式下消息编辑的最小间隔（毫秒） |
| `interrupt_on_new_message` | `bool` | `false` | 新消息是否中断当前请求并重新开始 |
| `mention_only` | `bool` | `false` | 群组中仅在被 @提及 时才回复 |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["12345678", "username"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bot_token` | `string` | *必填* | Discord Bot Token（从 Developer Portal 获取） |
| `guild_id` | `string?` | - | 可选，限制机器人只在指定服务器中运行 |
| `allowed_users` | `string[]` | `[]` | 允许的 Discord 用户 ID 列表。空数组 = 拒绝所有 |
| `listen_to_bots` | `bool` | `false` | 是否处理其他机器人的消息（自身消息始终忽略） |
| `mention_only` | `bool` | `false` | 仅在被 @提及 时回复 |

```toml
[channels_config.discord]
bot_token = "MTk4..."
guild_id = "123456789012345678"
allowed_users = ["987654321012345678"]
listen_to_bots = false
mention_only = true
```

### `[channels_config.slack]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `bot_token` | `string` | *必填* | Slack Bot OAuth Token（`xoxb-...`） |
| `app_token` | `string?` | - | Slack App-Level Token（`xapp-...`，Socket Mode 需要） |
| `channel_id` | `string?` | - | 限制机器人到单个频道 |
| `allowed_users` | `string[]` | `[]` | 允许的 Slack 用户 ID |
| `mention_only` | `bool` | `false` | 仅在群组中被提及时回复 |

### 其他渠道

PRX 还支持以下渠道配置，结构与上述类似：

- `[channels_config.whatsapp]` - WhatsApp Cloud API
- `[channels_config.signal]` - Signal 消息
- `[channels_config.imessage]` - iMessage（仅 macOS）
- `[channels_config.matrix]` - Matrix 协议
- `[channels_config.email]` - 邮件收发
- `[channels_config.lark]` - 飞书 / Lark
- `[channels_config.dingtalk]` - 钉钉
- `[channels_config.mattermost]` - Mattermost
- `[channels_config.nextcloud_talk]` - Nextcloud Talk
- `[channels_config.irc]` - IRC 协议
- `[channels_config.linq]` - Linq Partner API
- `[channels_config.qq]` - QQ 官方机器人

详见各渠道的 [专页文档](/zh/prx/channels/)。

## `[memory]` - 记忆系统 {#memory}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backend` | `string` | `"sqlite"` | 记忆后端：`sqlite`、`markdown`、`postgres`、`lucid`、`none` |
| `auto_save` | `bool` | `true` | 自动保存用户对话输入到记忆 |
| `acl_enabled` | `bool` | `false` | 启用记忆访问控制列表（ACL） |
| `hygiene_enabled` | `bool` | `true` | 启用记忆清理（归档 + 保留策略） |
| `archive_after_days` | `u32` | `7` | 多少天后归档旧文件 |
| `purge_after_days` | `u32` | `30` | 多少天后清除归档文件 |
| `conversation_retention_days` | `u32` | `3` | SQLite 后端：对话记录保留天数 |
| `daily_retention_days` | `u32` | `7` | SQLite 后端：每日记录保留天数 |
| `embedding_provider` | `string` | `"none"` | 嵌入向量提供商：`none`、`openai`、`custom:URL` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | 嵌入模型名称 |
| `embedding_dimensions` | `usize` | `1536` | 嵌入向量维度 |
| `vector_weight` | `f64` | `0.7` | 混合搜索中向量相似度权重（0.0 - 1.0） |
| `keyword_weight` | `f64` | `0.3` | 混合搜索中关键词 BM25 权重（0.0 - 1.0） |
| `min_relevance_score` | `f64` | `0.4` | 最低相关性分数阈值 |
| `embedding_cache_size` | `usize` | `10000` | 嵌入缓存 LRU 最大条目数 |
| `snapshot_enabled` | `bool` | `false` | 启用核心记忆定期导出到 MEMORY_SNAPSHOT.md |
| `snapshot_on_hygiene` | `bool` | `false` | 在清理周期中执行快照 |
| `auto_hydrate` | `bool` | `true` | brain.db 缺失时自动从快照恢复 |
| `sqlite_open_timeout_secs` | `u64?` | - | SQLite 打开超时（秒），None = 无限等待 |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]` - LLM 路由器 {#router}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用启发式路由 |
| `alpha` | `f32` | `0.0` | 相似度评分权重 |
| `beta` | `f32` | `0.5` | 能力评分权重 |
| `gamma` | `f32` | `0.3` | Elo 评分权重 |
| `delta` | `f32` | `0.1` | 成本惩罚系数 |
| `epsilon` | `f32` | `0.1` | 延迟惩罚系数 |
| `knn_enabled` | `bool` | `false` | 启用 KNN 语义路由历史 |
| `knn_min_records` | `usize` | `10` | KNN 生效所需的最小历史记录数 |
| `knn_k` | `usize` | `7` | 最近邻投票数量 |

### `[router.automix]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用 Automix 自适应升级 |
| `confidence_threshold` | `f32` | `0.7` | 置信度升级阈值 |

### `[[router.models]]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `model_id` | `string` | *必填* | 模型 ID（不含提供商前缀） |
| `provider` | `string` | *必填* | 提供商 ID |
| `cost_per_million_tokens` | `f32` | `0.0` | 每百万 token 的 USD 成本 |
| `max_context` | `usize` | `128000` | 最大上下文窗口（token 数） |
| `latency_ms` | `u32` | `2000` | 平均延迟（毫秒） |
| `categories` | `string[]` | `[]` | 能力类别：`conversation`、`code`、`analysis` |
| `elo_rating` | `f32` | `1000.0` | 初始 Elo 评分 |

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7

[[router.models]]
model_id = "claude-sonnet-4-6"
provider = "anthropic"
cost_per_million_tokens = 3.0
max_context = 200000
latency_ms = 1500
categories = ["code", "analysis"]
elo_rating = 1200.0

[[router.models]]
model_id = "gpt-4o-mini"
provider = "openai"
cost_per_million_tokens = 0.15
max_context = 128000
latency_ms = 800
categories = ["conversation"]
elo_rating = 900.0
```

## `[security]` - 安全策略 {#security}

### `[security.sandbox]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool?` | `null`（自动检测） | 启用沙箱隔离 |
| `backend` | `string` | `"auto"` | 沙箱后端：`auto`、`landlock`、`firejail`、`bubblewrap`、`docker`、`none` |
| `firejail_args` | `string[]` | `[]` | 自定义 Firejail 参数 |

### `[security.resources]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_memory_mb` | `u32` | `512` | 每条命令最大内存（MB） |
| `max_cpu_time_seconds` | `u64` | `60` | 每条命令最大 CPU 时间（秒） |
| `max_subprocesses` | `u32` | `10` | 最大子进程数 |
| `memory_monitoring` | `bool` | `true` | 启用内存监控 |

### `[security.audit]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `true` | 启用审计日志 |
| `log_path` | `string` | `"audit.log"` | 审计日志路径（相对于 openprx 目录） |

```toml
[security.sandbox]
enabled = true
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120
max_subprocesses = 20

[security.audit]
enabled = true
log_path = "audit.log"
```

## `[observability]` - 可观测性 {#observability}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `backend` | `string` | `"none"` | 后端类型：`none`、`log`、`prometheus`、`otel` |
| `otel_endpoint` | `string?` | - | OTLP 端点（如 `http://localhost:4318`），仅 `otel` 后端使用 |
| `otel_service_name` | `string?` | - | 上报给 OTel 收集器的服务名，默认 `"prx"` |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]` - Model Context Protocol {#mcp}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用 MCP 客户端集成 |
| `servers` | `map<string, McpServer>` | `{}` | 命名的 MCP 服务器定义 |

### MCP 服务器配置

每个 MCP 服务器支持以下字段：

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `command` | `string` | *必填* | 启动 MCP 服务器的命令 |
| `args` | `string[]` | `[]` | 命令参数 |
| `env` | `map<string, string>` | `{}` | 环境变量 |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }
```

## `[browser]` - 浏览器自动化 {#browser}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用浏览器工具 |
| `allowed_domains` | `string[]` | `[]` | 允许访问的域名白名单 |
| `session_name` | `string?` | - | 浏览器会话名称 |
| `backend` | `string` | `"agent_browser"` | 后端：`agent_browser`、`rust_native`、`computer_use`、`auto` |
| `native_headless` | `bool` | `true` | 原生后端无头模式 |
| `native_webdriver_url` | `string` | `"http://127.0.0.1:9515"` | WebDriver 端点 URL |
| `native_chrome_path` | `string?` | - | Chrome/Chromium 可执行文件路径 |

```toml
[browser]
enabled = true
backend = "rust_native"
native_headless = true
allowed_domains = ["github.com", "docs.rs"]
```

## `[web_search]` - 网页搜索 {#web-search}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用网页搜索工具 |
| `provider` | `string` | `"duckduckgo"` | 搜索引擎：`duckduckgo`（免费）或 `brave`（需 API Key） |
| `brave_api_key` | `string?` | - | Brave Search API Key（provider 为 `brave` 时必填） |
| `max_results` | `usize` | `5` | 每次搜索最大结果数（1-10） |
| `timeout_secs` | `u64` | `15` | 请求超时（秒） |
| `fetch_enabled` | `bool` | `true` | 启用 `web_fetch` 工具（获取 URL 内容） |
| `fetch_max_chars` | `usize` | `10000` | `web_fetch` 返回的最大字符数 |

```toml
[web_search]
enabled = true
provider = "duckduckgo"
max_results = 5
fetch_enabled = true
fetch_max_chars = 10000
```

## `[xin]` - 自主任务引擎 {#xin}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用心 (xin) 自主任务引擎 |
| `interval_minutes` | `u32` | `5` | Tick 间隔（分钟，最小 1） |
| `max_concurrent` | `usize` | `4` | 每个 tick 最大并发任务数 |
| `max_tasks` | `usize` | `128` | 任务存储最大条目数 |
| `stale_timeout_minutes` | `u32` | `60` | 运行中任务超过此时间标记为过期（分钟） |
| `builtin_tasks` | `bool` | `true` | 自动注册内置系统任务（进化、适配度、清理、健康检查） |
| `evolution_integration` | `bool` | `false` | 启用记忆进化集成 |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[agent]` - Agent 运行时 {#agent}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `max_tool_iterations` | `usize` | 视配置 | 单轮对话最大工具调用迭代数 |
| `max_history_messages` | `usize` | 视配置 | 上下文中保留的最大历史消息数 |
| `parallel_tools` | `bool` | `false` | 启用并行工具执行 |
| `compact_context` | `bool` | `false` | 启用上下文压缩 |
| `read_only_tool_concurrency_window` | `usize` | 视配置 | 只读工具并发窗口大小 |
| `read_only_tool_timeout_secs` | `u64` | 视配置 | 只读工具超时（秒） |
| `priority_scheduling_enabled` | `bool` | `false` | 启用优先级调度 |
| `low_priority_tools` | `string[]` | `[]` | 低优先级工具列表 |

```toml
[agent]
max_tool_iterations = 50
max_history_messages = 100
parallel_tools = true
compact_context = true
priority_scheduling_enabled = true
low_priority_tools = ["web_search", "web_fetch"]
```

## `[autonomy]` - 自主权控制 {#autonomy}

```toml
[autonomy.scopes]
default = "allow"

[[autonomy.scopes.rules]]
channel = "signal"
chat_type = "group"
tools_deny = ["shell", "file_write"]

[[autonomy.scopes.rules]]
user = "uuid:untrusted-user-uuid"
tools_allow = ["memory_recall"]
```

## `[reliability]` - 可靠性 {#reliability}

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[cost]` - 成本控制 {#cost}

```toml
[cost]
max_cost_per_day_cents = 1000
tracking_enabled = true
```

## `[proxy]` - 代理配置 {#proxy}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | `bool` | `false` | 启用代理 |
| `http_proxy` | `string?` | - | HTTP 代理 URL |
| `https_proxy` | `string?` | - | HTTPS 代理 URL |
| `all_proxy` | `string?` | - | 所有协议的代理 URL |
| `no_proxy` | `string[]` | `[]` | 不走代理的地址列表 |
| `scope` | `string` | `"zeroclaw"` | 代理作用域：`environment`、`zeroclaw`、`services` |
| `services` | `string[]` | `[]` | `scope = "services"` 时的服务选择器列表 |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.local"]
scope = "zeroclaw"
```

## `[secrets]` - 密钥加密 {#secrets}

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `encrypt` | `bool` | `false` | 启用 ChaCha20-Poly1305 密钥加密存储 |

```toml
[secrets]
encrypt = true
```
