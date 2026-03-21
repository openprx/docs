# 执行器详解

本页详细记录所有 5 种执行器类型的配置字段、运行行为和使用示例。

## openclaw

通过 OpenClaw CLI 工具发送即时通讯通知（Signal、Telegram）。

**工作原理：** 构造 Shell 命令，调用 OpenClaw 二进制文件，传入 `--channel`、`--target` 和 `--message` 参数。

**配置示例：**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal 通知"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # OpenClaw 二进制文件路径
channel = "signal"                     # 通道："signal" 或 "telegram"
target = "+1234567890"                 # 手机号、群组 ID 或频道名称
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `command` | 是 | OpenClaw CLI 二进制文件路径 |
| `channel` | 是 | 消息通道（`signal`、`telegram`） |
| `target` | 是 | 接收者标识（手机号、群组 ID 等） |

---

## openprx

通过 OpenPRX 消息基础设施发送消息。支持两种模式：HTTP API（Signal 守护进程）和 CLI 命令。

**模式一：Signal API（推荐）**

向 signal-cli REST API 守护进程发送 JSON POST 请求：

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST API 基础 URL
account = "+1234567890"                 # 发送者手机号
target = "+0987654321"                  # 接收者手机号或 UUID
channel = "signal"                      # 默认值："signal"
```

发送到 Signal API 的 HTTP 请求：

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**模式二：CLI 命令**

当未设置 `signal_api` 时，回退到执行 Shell 命令：

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `signal_api` | 否 | Signal 守护进程 HTTP API 基础 URL |
| `account` | 否 | 账户手机号（配合 `signal_api` 使用） |
| `target` | 是 | 接收者手机号或 UUID |
| `channel` | 否 | 通道名称（默认：`signal`） |
| `command` | 否 | CLI 命令（`signal_api` 未设置时的回退方案） |

`signal_api` 和 `command` 至少需要提供一个。

---

## webhook

将完整的 Webhook 负载原样转发到 HTTP 端点。适合对接 Slack、Discord、自定义 API 或链式 Webhook 服务。

**工作原理：** 向配置的 URL 发送 JSON POST 请求，携带原始负载。可选对出站请求进行 HMAC-SHA256 签名。

```toml
[[agents]]
id = "slack-forward"
name = "Slack 转发"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # 可选：对出站请求签名
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `url` | 是 | 目标 URL |
| `secret` | 否 | 出站 HMAC-SHA256 签名密钥（通过 `X-Webhook-Signature` 请求头发送） |

设置 `secret` 后，出站请求会携带 `X-Webhook-Signature: sha256=...` 请求头，其值基于 JSON 请求体计算，接收端可据此验证请求来源的真实性。

---

## custom

执行自定义 Shell 命令，将格式化后的消息作为参数传入。适用于自定义集成、日志记录或触发外部脚本。

**工作原理：** 运行 `sh -c '{command} "{message}"'`，其中 `{message}` 是经过特殊字符转义的模板渲染结果。

```toml
[[agents]]
id = "custom-logger"
name = "日志记录"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # 可选：额外的命令行参数
```

**字段说明：**

| 字段 | 必填 | 说明 |
|------|------|------|
| `command` | 是 | 可执行文件路径或 Shell 命令 |
| `args` | 否 | 额外的命令行参数 |

**安全提示：** custom 执行器直接运行 Shell 命令。请确保命令路径可信且不受用户输入控制。

---

## cli

运行 AI 编码代理来处理工单。这是最强大的执行器类型，专为自动化代码生成和工单解决而设计。

**前提条件：** 配置中须设置 `features.cli_enabled = true`。当环境变量 `OPENPR_WEBHOOK_SAFE_MODE=1` 时会被阻止。

**支持的执行器（白名单）：**

| 执行器 | 二进制文件 | 命令格式 |
|--------|-----------|----------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

不在此白名单中的执行器会被拒绝。

**配置示例：**

```toml
[features]
cli_enabled = true
callback_enabled = true  # 状态转换所需

[[agents]]
id = "my-coder"
name = "AI 编码代理"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # codex、claude-code 或 opencode
workdir = "/opt/projects/backend"      # CLI 工具的工作目录
timeout_secs = 900                     # 超时时间，单位秒（默认：900）
max_output_chars = 12000               # 截取 stdout/stderr 的最大字符数（默认：12000）
prompt_template = "修复工单 {issue_id}: {title}\n背景: {reason}"

# 状态转换（需要 callback_enabled）
update_state_on_start = "in_progress"  # 任务开始时设置工单状态
update_state_on_success = "done"       # 成功时设置工单状态
update_state_on_fail = "todo"          # 失败/超时时设置工单状态

# 回调配置
callback = "mcp"                       # 回调模式："mcp" 或 "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # 可选：回调认证的 Bearer Token
```

**字段说明：**

| 字段 | 必填 | 默认值 | 说明 |
|------|------|--------|------|
| `executor` | 是 | -- | CLI 工具名称（`codex`、`claude-code`、`opencode`） |
| `workdir` | 否 | -- | 工作目录 |
| `timeout_secs` | 否 | 900 | 进程超时时间 |
| `max_output_chars` | 否 | 12000 | 输出尾部截取上限 |
| `prompt_template` | 否 | `Fix issue {issue_id}: {title}\nContext: {reason}` | 发送给 CLI 工具的提示词 |
| `update_state_on_start` | 否 | -- | 任务开始时的工单状态 |
| `update_state_on_success` | 否 | -- | 成功时的工单状态 |
| `update_state_on_fail` | 否 | -- | 失败或超时时的工单状态 |
| `callback` | 否 | `mcp` | 回调协议（`mcp` 或 `api`） |
| `callback_url` | 否 | -- | 回调目标 URL |
| `callback_token` | 否 | -- | 回调认证 Bearer Token |

**提示词模板占位符（cli 专用）：**

| 占位符 | 数据来源 |
|--------|----------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**回调负载（MCP 模式）：**

当 `callback = "mcp"` 时，服务向 `callback_url` 发送类 JSON-RPC 风格的 POST 请求：

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**状态转换生命周期：**

```
事件接收
    |
    v
[update_state_on_start] --> 工单状态 = "in_progress"
    |
    v
CLI 工具运行（最长 timeout_secs）
    |
    +-- 成功 --> [update_state_on_success] --> 工单状态 = "done"
    |
    +-- 失败 --> [update_state_on_fail] --> 工单状态 = "todo"
    |
    +-- 超时 --> [update_state_on_fail] --> 工单状态 = "todo"
```
