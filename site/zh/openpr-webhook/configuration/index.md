# 配置参考

OpenPR-Webhook 使用单一 TOML 配置文件。默认从当前目录加载 `config.toml`。你可以通过第一个命令行参数指定自定义路径。

## 完整配置模板

```toml
# ─── 服务器 ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # 绑定地址和端口

# ─── 安全 ─────────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 密钥（支持轮换）
allow_unsigned = false                     # 允许未签名的请求（默认：false）

# ─── 特性标志 ─────────────────────────────────────────────
[features]
tunnel_enabled = false                 # 启用 WSS 隧道子系统（默认：false）
cli_enabled = false                    # 启用 CLI 代理执行器（默认：false）
callback_enabled = false               # 启用状态转换回调（默认：false）

# ─── 运行时调优 ───────────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # 最大并发 CLI 任务数（默认：1）
http_timeout_secs = 15                 # HTTP 客户端超时（默认：15）
tunnel_reconnect_backoff_max_secs = 60 # 隧道最大重连退避时间（默认：60）

# ─── WSS 隧道 ─────────────────────────────────────────────
[tunnel]
enabled = false                        # 启用此隧道实例（默认：false）
url = "wss://control.example.com/ws"   # WebSocket URL
agent_id = "my-agent"                  # 代理标识符
auth_token = "bearer-token"            # Bearer 认证令牌
reconnect_secs = 3                     # 基础重连间隔（默认：3）
heartbeat_secs = 20                    # 心跳间隔（默认：20，最小 3）
hmac_secret = "envelope-signing-key"   # 信封 HMAC 签名密钥
require_inbound_sig = false            # 要求入站消息签名（默认：false）

# ─── 代理 ─────────────────────────────────────────────────

# --- OpenClaw 代理 ---
[[agents]]
id = "notify-signal"
name = "Signal 通知"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX 代理（HTTP API 模式） ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX 代理（CLI 模式） ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook 代理 ---
[[agents]]
id = "forward-slack"
name = "Slack 转发"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # 可选：对出站请求签名

# --- Custom 代理 ---
[[agents]]
id = "custom-script"
name = "自定义脚本"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI 代理 ---
[[agents]]
id = "ai-coder"
name = "AI 编码代理"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "修复工单 {issue_id}: {title}\n背景: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
skip_callback_state = false               # 设为 true 时由 AI 通过 MCP 管理状态
# mcp_instructions = "..."               # 自定义 MCP 指令（覆盖默认值）
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config 路径

[agents.cli.env_vars]                      # 代理级环境变量
# OPENPR_API_URL = "http://localhost:3000"
# OPENPR_BOT_TOKEN = "opr_xxx"
```

## 各节详解

### `[server]`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `listen` | String | 是 | -- | TCP 绑定地址，格式为 `host:port` |

### `[security]`

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `webhook_secrets` | 字符串数组 | 否 | `[]` | 入站验证的 HMAC-SHA256 密钥列表。支持多密钥以实现密钥轮换。 |
| `allow_unsigned` | Boolean | 否 | `false` | 接受未签名请求，跳过签名验证。**不建议在生产环境使用。** |

**签名验证**按以下顺序检查两个请求头：
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

请求头值应为 `sha256={hex摘要}` 格式。服务会依次尝试 `webhook_secrets` 中的每个密钥，直到匹配成功。

### `[features]`

所有特性标志默认为 `false`。这种纵深防御策略确保危险功能必须显式启用。

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `tunnel_enabled` | Boolean | `false` | 启用 WSS 隧道子系统 |
| `cli_enabled` | Boolean | `false` | 启用 CLI 代理执行器 |
| `callback_enabled` | Boolean | `false` | 启用状态转换回调 |

### `[runtime]`

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `cli_max_concurrency` | Integer | `1` | 最大并发 CLI 代理任务数 |
| `http_timeout_secs` | Integer | `15` | 出站 HTTP 请求超时（Webhook 转发、回调、Signal API） |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | 隧道最大重连退避间隔 |

### `[tunnel]`

详细文档请参阅 [WSS 隧道](../tunnel/index.md)。

### `[[agents]]`

详细文档请参阅[代理类型](../agents/index.md)和[执行器详解](../agents/executors.md)。

## 环境变量

| 变量 | 说明 |
|------|------|
| `OPENPR_WEBHOOK_SAFE_MODE` | 设为 `1`、`true`、`yes` 或 `on` 可强制禁用隧道、CLI 和回调功能，无论配置文件如何设置。用于紧急锁定场景。 |
| `RUST_LOG` | 控制日志详细程度。默认：`openpr_webhook=info`。示例：`openpr_webhook=debug`、`openpr_webhook=trace` |

### 代理级环境变量

CLI 代理支持通过 `[agents.cli.env_vars]` 注入自定义环境变量。这些变量会传入执行器子进程，适用于提供 MCP 认证所需的凭据：

| 变量 | 说明 |
|------|------|
| `OPENPR_API_URL` | OpenPR API 基础 URL（供 MCP server 使用） |
| `OPENPR_BOT_TOKEN` | 机器人认证令牌（`opr_` 前缀） |
| `OPENPR_WORKSPACE_ID` | 目标工作区 UUID |

## 安全模式

设置 `OPENPR_WEBHOOK_SAFE_MODE=1` 后将禁用以下功能：

- CLI 代理执行（`cli_enabled` 强制为 `false`）
- 回调发送（`callback_enabled` 强制为 `false`）
- WSS 隧道（`tunnel_enabled` 强制为 `false`）

非危险代理（openclaw、openprx、webhook、custom）不受影响，继续正常工作。这允许你在不修改配置文件的情况下快速锁定服务。

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## 最小配置

最小有效配置：

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

这会启动一个无代理、无签名验证的服务。仅适用于开发环境。

## 生产环境清单

- [ ] 在 `webhook_secrets` 中设置至少一个密钥
- [ ] 设置 `allow_unsigned = false`
- [ ] 配置至少一个代理
- [ ] 如使用 CLI 代理：设置 `cli_enabled = true` 并检查执行器白名单
- [ ] 如使用隧道：使用 `wss://`（非 `ws://`），设置 `hmac_secret` 和 `require_inbound_sig = true`
- [ ] 设置 `RUST_LOG=openpr_webhook=info`（生产环境避免 `debug`/`trace` 以保证性能）
- [ ] 考虑先以 `OPENPR_WEBHOOK_SAFE_MODE=1` 运行，验证非 CLI 功能正常后再完整启用
