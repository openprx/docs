# 代理类型

代理（Agent）是 OpenPR-Webhook 的核心分发单元。每个代理定义了如何处理匹配到的 Webhook 事件。你可以在单个部署中配置多个代理，事件会根据 Webhook 负载中的 `bot_context` 路由到相应的代理。

## 概览

| 类型 | 应用场景 | 是否需要特性标志 |
|------|----------|-----------------|
| `openclaw` | 通过 OpenClaw CLI 发送 Signal/Telegram 通知 | 否 |
| `openprx` | 通过 OpenPRX Signal API 或 CLI 发送消息 | 否 |
| `webhook` | 将事件转发到 HTTP 端点（Slack、Discord 等） | 否 |
| `custom` | 执行自定义 Shell 命令 | 否 |
| `cli` | 运行 AI 编码代理（codex、claude-code、opencode） | 是（`cli_enabled`） |

## 代理配置结构

每个代理都有以下通用字段：

```toml
[[agents]]
id = "unique-id"              # 唯一标识符，用于匹配
name = "易于理解的名称"        # 显示名称，也用于匹配
agent_type = "openclaw"       # 类型：openclaw、openprx、webhook、custom、cli
message_template = "..."      # 可选：自定义消息模板
```

然后根据 `agent_type` 提供对应的配置块：

- `[agents.openclaw]` -- openclaw 代理
- `[agents.openprx]` -- openprx 代理
- `[agents.webhook]` -- webhook 代理
- `[agents.custom]` -- custom 代理
- `[agents.cli]` -- cli 代理

## 消息模板

`message_template` 字段支持占位符，在发送时会被 Webhook 负载中的实际值替换：

| 占位符 | 数据来源 | 示例 |
|--------|----------|------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `修复登录问题` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | 自动派生 | `issue/123` |

默认模板（适用于 openclaw、openprx、webhook、custom）：

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## 代理匹配逻辑

当收到 `bot_context.is_bot_task = true` 的 Webhook 事件时：

1. 服务提取 `bot_context.bot_name` 和 `bot_context.bot_agent_type`
2. 在所有代理中搜索 `id` 精确匹配或 `name` 不区分大小写匹配 `bot_name` 的代理
3. 如果名称不匹配，则回退到第一个 `agent_type` 与 `bot_agent_type` 相同的代理
4. 如果没有任何代理匹配，事件会被确认接收但不会执行分发

## 多代理配置示例

```toml
# 代理 1：通过 Telegram 发送通知
[[agents]]
id = "notify-tg"
name = "Telegram 通知"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# 代理 2：转发到 Slack
[[agents]]
id = "notify-slack"
name = "Slack 转发"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# 代理 3：带 MCP 闭环的 AI 编码代理
[[agents]]
id = "coder"
name = "AI 编码代理"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
skip_callback_state = true  # AI 通过 MCP 直接更新状态

[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
```

在此配置中，OpenPR 可以通过在 Webhook 负载中设置 `bot_name` 字段，将不同事件路由到不同代理。

## 下一步

- [执行器详解](executors.md) -- 每种执行器的详细文档
- [配置参考](../configuration/index.md) -- 完整的 TOML 配置说明
