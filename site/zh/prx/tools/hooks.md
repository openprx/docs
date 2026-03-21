---
title: Hooks 事件钩子
description: 事件驱动的扩展系统，提供 8 个生命周期事件、Shell 钩子执行、WASM 插件回调、HTTP API 管理和事件总线集成，用于可观测性和自动化。
---

# Hooks 事件钩子

PRX Hooks 是一套事件驱动的扩展系统，允许你对 Agent 执行过程中的生命周期事件做出响应。Agent 循环中的每个关键时刻——启动回合、调用 LLM、执行工具、遇到错误——都会发出一个 Hook 事件。你可以通过 `hooks.json` 配置文件、WASM 插件清单或 HTTP API 将动作绑定到这些事件上。

Hooks 在设计上采用 **fire-and-forget**（发后即忘）模式。它们永远不会阻塞 Agent 循环，不会修改执行流程，也不会将数据注入回对话中。这使得 Hooks 非常适合审计日志、指标采集、外部通知和自动化副作用等场景，而不会给核心 Agent 管道引入延迟或故障点。

PRX 提供三种 Hook 执行后端：

- **Shell 钩子** —— 运行外部命令，通过环境变量、临时文件或 stdin 传递事件负载。在 `hooks.json` 中配置。
- **WASM 插件钩子** —— 调用 WASM 插件导出的 `on-event` 函数。在插件的 `plugin.toml` 清单中声明。
- **事件总线钩子** —— 发布到内部事件总线的 `prx.lifecycle.<event>` 主题。始终活跃，无需配置。

## Hook 事件

PRX 发出 8 个生命周期事件，每个事件携带一个包含上下文相关字段的 JSON 负载。

| 事件 | 触发时机 | 负载字段 |
|------|----------|----------|
| `agent_start` | Agent 循环开始新回合 | `agent` (string), `session` (string) |
| `agent_end` | Agent 循环完成一个回合 | `success` (bool), `messages_count` (number) |
| `llm_request` | 向 LLM 提供商发送请求之前 | `provider` (string), `model` (string), `messages_count` (number) |
| `llm_response` | 收到 LLM 响应之后 | `provider` (string), `model` (string), `duration_ms` (number), `success` (bool) |
| `tool_call_start` | 工具开始执行之前 | `tool` (string), `arguments` (object) |
| `tool_call` | 工具执行完成之后 | `tool` (string), `success` (bool), `output` (string) |
| `turn_complete` | 完整回合结束（所有工具已解析） | _（空对象）_ |
| `error` | 执行过程中发生任何错误 | `component` (string), `message` (string) |

### 负载结构

所有负载都是 JSON 对象。顶层结构包裹了事件特定字段：

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

`event`、`timestamp` 和 `session_id` 字段存在于每个 Hook 事件中。`payload` 对象根据事件类型而异，具体见上表。

## 配置

Shell 钩子在工作区目录（与 `config.toml` 同一目录）下的 `hooks.json` 文件中配置。PRX 监控此文件的变更并**热重载**配置，无需重启。

### 基本结构

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

每个事件名称映射到一个 Hook 动作数组。同一事件可以绑定多个动作，它们并发且独立地执行。

### 完整示例

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## Hook 动作字段

每个 Hook 动作对象支持以下字段：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `command` | string | 是 | -- | 可执行文件的绝对路径，或在净化后的 PATH 中可找到的命令名 |
| `args` | string[] | 否 | `[]` | 传递给命令的参数列表 |
| `env` | object | 否 | `{}` | 合并到净化后执行环境中的附加环境变量 |
| `cwd` | string | 否 | 工作区目录 | 子进程的工作目录 |
| `timeout_ms` | number | 否 | `30000` | 最大执行时间（毫秒）。超时后进程会被强制终止 (SIGKILL) |
| `stdin_json` | bool | 否 | `false` | 设为 `true` 时，完整的事件负载 JSON 会通过 stdin 管道传给进程 |

### `command` 字段说明

`command` 字段在执行前会经过安全验证。它不能包含 shell 元字符（`;`、`|`、`&`、`` ` ``、`$()`）——这些会被拒绝以防止 shell 注入。如果需要 shell 特性，请将其封装在脚本文件中，然后将 `command` 指向该脚本。

相对路径会基于工作区目录解析。但为了可预测性，推荐使用绝对路径。

## 负载传递

Hook 动作通过三个通道同时接收事件负载。这种冗余设计确保任何语言编写的脚本都能通过最方便的方式访问数据。

### 1. 环境变量 (`ZERO_HOOK_PAYLOAD`)

负载 JSON 字符串设置为 `ZERO_HOOK_PAYLOAD` 环境变量。这是 shell 脚本最简单的访问方式：

```bash
#!/bin/bash
# 从环境变量读取负载
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**大小限制**：8 KB。如果序列化后的负载超过 8 KB，环境变量**不会被设置**，负载只能通过临时文件和 stdin 通道获取。

### 2. 临时文件 (`ZERO_HOOK_PAYLOAD_FILE`)

负载被写入一个临时文件，文件路径设置在 `ZERO_HOOK_PAYLOAD_FILE` 环境变量中。临时文件在 Hook 进程退出后自动删除。

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

此通道没有大小限制，是处理可能较大的负载（例如包含详细输出的 `tool_call`）的推荐方式。

### 3. 标准输入 (stdin)

当 Hook 动作中 `stdin_json` 设为 `true` 时，负载 JSON 通过 stdin 管道传给进程。这对原生从 stdin 读取的命令很有用，如 `curl -d @-` 或 `jq`。

```bash
#!/bin/bash
# 从 stdin 读取（需要在 hook 配置中设置 stdin_json: true）
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## 环境变量

除了 `ZERO_HOOK_PAYLOAD` 和 `ZERO_HOOK_PAYLOAD_FILE` 之外，每个 Hook 进程还会收到以下环境变量：

| 变量 | 说明 | 示例 |
|------|------|------|
| `ZERO_HOOK_EVENT` | 触发此 Hook 的事件名称 | `tool_call` |
| `ZERO_HOOK_SESSION` | 当前会话标识符 | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | 事件的 ISO 8601 时间戳 | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | 完整负载的 JSON 字符串（超过 8 KB 时省略） | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | 包含负载的临时文件路径 | `/tmp/prx-hook-a1b2c3.json` |

执行环境在 Hook 进程启动前会被**净化**。敏感和危险的环境变量会被剥离（参见下方[安全性](#安全性)），只有上述变量加上 Hook 动作中 `env` 指定的覆盖值可用。

## WASM 插件钩子

WASM 插件可以通过导出 PRX WIT (WebAssembly Interface Types) 接口定义的 `on-event` 函数来订阅 Hook 事件。

### WIT 接口

```wit
interface hooks {
    /// 当订阅的事件触发时调用。
    /// 成功返回 Ok(())，失败返回 Err(message)。
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

`event` 参数是事件名称（例如 `"tool_call"`），`payload-json` 是序列化为 JSON 字符串的完整负载，与 shell 钩子收到的内容完全一致。

### 事件订阅模式

插件在 `plugin.toml` 清单中使用模式匹配声明要接收的事件：

| 模式 | 匹配范围 | 示例 |
|------|----------|------|
| 精确匹配 | 单个特定事件 | `"tool_call"` |
| 通配符后缀 | 匹配某前缀的所有事件 | `"prx.lifecycle.*"` |
| 全局 | 所有事件 | `"*"` |

### 插件清单示例

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "将所有生命周期事件记录到审计追踪"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

单个插件可以声明多个 `[[capabilities]]` 块，使用不同的事件模式。所有匹配事件的并集决定插件实际接收哪些事件。

### 执行模型

WASM 插件钩子在 WASM 沙箱中运行，与其他插件函数具有相同的资源限制：

- **内存限制**：由插件资源配置定义（默认 64 MB）
- **执行超时**：与 shell 钩子的 `timeout_ms` 相同（默认 30 秒）
- **无文件系统访问**：除非通过 WASI 能力显式授权
- **无网络访问**：除非通过能力标志显式授权

如果 WASM 钩子返回 `Err(message)`，错误会被记录但不影响 Agent 循环。钩子始终是 fire-and-forget 模式。

## 事件总线集成

每个 Hook 事件会自动发布到内部事件总线的 `prx.lifecycle.<event>` 主题。无论是否配置了 shell 或 WASM 钩子，这都会发生。

### 主题格式

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### 订阅类型

内部组件和插件可以使用三种模式订阅事件总线主题：

- **精确匹配**：`prx.lifecycle.tool_call` —— 只接收 `tool_call` 事件
- **通配符**：`prx.lifecycle.*` —— 接收所有生命周期事件
- **层级匹配**：`prx.*` —— 接收所有 PRX 域事件（lifecycle、metrics 等）

### 负载限制

| 约束 | 值 |
|------|----|
| 最大负载大小 | 64 KB |
| 最大递归深度 | 8 层 |
| 分发模型 | Fire-and-forget（异步） |
| 投递保证 | At-most-once（至多一次） |

如果一个 Hook 事件触发了另一个 Hook 事件（例如 Hook 脚本调用了一个工具，该工具发出 `tool_call`），递归计数器会递增。达到 8 层深度时，后续事件发射会被静默丢弃，以防止无限循环。

## HTTP API

可以通过 HTTP API 以编程方式管理 Hooks。所有端点都需要认证，返回 JSON 响应。

### 列出所有 Hooks

```
GET /api/hooks
```

响应：

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### 创建 Hook

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

响应（201 Created）：

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### 更新 Hook

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

响应（200 OK）：返回更新后的 Hook 对象。

### 删除 Hook

```
DELETE /api/hooks/hook_02
```

响应（204 No Content）：成功时返回空响应体。

### 切换 Hook 状态

```
PATCH /api/hooks/hook_01/toggle
```

响应（200 OK）：

```json
{
  "id": "hook_01",
  "enabled": false
}
```

此端点翻转 `enabled` 状态。禁用的 Hook 保留在配置中，但在其事件触发时不会执行。

## 安全性

Hook 执行受到多项安全措施的约束，以防止权限提升、数据泄露和拒绝服务攻击。

### 被阻止的环境变量

以下环境变量会从 Hook 执行环境中剥离，并且无法通过 Hook 动作的 `env` 字段覆盖：

| 变量 | 原因 |
|------|------|
| `LD_PRELOAD` | 库注入攻击向量 |
| `LD_LIBRARY_PATH` | 库搜索路径篡改 |
| `DYLD_INSERT_LIBRARIES` | macOS 库注入 |
| `DYLD_LIBRARY_PATH` | macOS 库路径篡改 |
| `PATH` | 防止 PATH 劫持；提供最小化的安全 PATH |
| `HOME` | 防止主目录欺骗 |

### 输入验证

- **空字节拒绝**：`command`、`args`、`env` 键或 `env` 值中包含空字节（`\0`）的内容会被拒绝。这防止了可能在操作系统层面截断字符串的空字节注入攻击。
- **Shell 元字符拒绝**：`command` 字段不能包含 `;`、`|`、`&`、`` ` ``、`$(` 或其他 shell 元字符。即使命令意外地通过 shell 传递，这也能防止 shell 注入。
- **路径穿越**：`cwd` 字段会被验证，确保它不会通过 `..` 组件逃逸出工作区目录。

### 超时执行

每个 Hook 进程都受配置的 `timeout_ms`（默认 30 秒）限制。如果进程超时：

1. 向进程发送 `SIGTERM`
2. 经过 5 秒宽限期后发送 `SIGKILL`
3. 该 Hook 在内部指标中被标记为超时
4. Agent 循环**不受影响**

### 资源隔离

当沙箱后端处于活动状态时，Hook 进程继承与 shell 工具执行相同的 cgroup 和命名空间限制。在 Docker 沙箱模式下，Hook 默认在没有网络访问的独立容器中运行。

## 示例

### 审计日志钩子

将每次工具调用记录到文件中，用于合规审计：

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh`：

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### 错误通知钩子

将错误事件发送到 Slack 频道：

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### LLM 延迟指标钩子

跟踪 LLM 响应时间用于监控仪表板：

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py`：

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# 推送到 StatsD、Prometheus pushgateway 或任何指标后端
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### 会话生命周期追踪

追踪 Agent 会话的开始和结束，用于使用量分析：

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## 相关文档

- [Shell 命令执行](/zh/prx/tools/shell) —— Hook 经常封装的 shell 工具
- [MCP 集成](/zh/prx/tools/mcp) —— 发出 `tool_call` 事件的外部工具协议
- [插件系统](/zh/prx/plugins/) —— 包含 Hook 能力的 WASM 插件系统
- [可观测性](/zh/prx/observability/) —— 与 Hook 互补的指标和追踪
- [安全](/zh/prx/security/) —— 管理 Hook 执行的沙箱和策略引擎
