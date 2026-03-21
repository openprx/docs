---
title: 会话与代理
description: PRX 的会话和代理工具支持多 Agent 编排，包括派生子 Agent、委托任务、管理并发会话和查看对话历史。
---

# 会话与代理

会话和代理工具是 PRX 多 Agent 编排系统的核心。通过这些工具，一个 Agent 可以派生异步子 Agent、向运行中的子 Agent 发送消息、管理并发会话、将复杂任务委托给专门的 Agent。这是 PRX 实现"主进程规划、子进程执行"工作模式的基础。

PRX 的多 Agent 架构分为两层：**会话管理**（sessions_spawn/send/list/history 等）负责低层的进程生命周期和通信；**委托系统**（delegate/agents_list）提供高层的任务分配和 Agent 路由。两者协同工作，支持从简单的并行任务到复杂的依赖链和条件执行。

这组工具在 `all_tools()` 模式下注册。其中 `delegate` 和 `agents_list` 仅在 `config.toml` 中定义了 Agent 配置时才可用。

## 配置

### 会话配置

```toml
[sessions]
max_concurrent = 10          # 最大并发子 Agent 数量
default_timeout_secs = 300   # 子 Agent 默认超时（5分钟）
history_retention = 100      # 保留的历史会话数量
auto_announce = true         # 子 Agent 完成后自动回报结果
```

### 委托 Agent 定义

```toml
# 研究员 Agent
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "你是一个研究助手。负责搜索和整理信息。"
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]

# 代码审查 Agent
[agents.code_reviewer]
provider = "openai"
model = "gpt-4o"
system_prompt = "你是一个代码审查专家。仔细检查代码质量和安全性。"
agentic = true
max_iterations = 5
allowed_tools = ["file_read", "shell"]

# 轻量级 Agent（使用更快的模型）
[agents.quick_helper]
provider = "openai"
model = "gpt-4o-mini"
system_prompt = "你是一个快速助手。简洁高效地完成任务。"
agentic = false
max_iterations = 3
allowed_tools = ["shell", "file_read"]
```

### 工具策略

```toml
[security.tool_policy.groups]
sessions = "allow"         # 组级别允许所有会话工具

[security.tool_policy.tools]
delegate = "allow"         # 允许委托
sessions_spawn = "allow"   # 允许派生子 Agent
```

## 使用方法

### sessions_spawn — 派生子 Agent

派生一个异步子 Agent 在后台运行，立即返回运行 ID：

```json
{
  "tool": "sessions_spawn",
  "arguments": {
    "task": "搜索最近一周关于 Rust async 的博客文章，整理一份摘要",
    "agent": "researcher",
    "notify": true
  }
}
```

返回：

```json
{
  "run_id": "sess_abc123",
  "status": "running",
  "message": "子 Agent 已启动，完成后会自动通知"
}
```

### sessions_send — 向子 Agent 发消息

向运行中的子 Agent 发送补充指令或信息：

```json
{
  "tool": "sessions_send",
  "arguments": {
    "run_id": "sess_abc123",
    "message": "重点关注 Tokio 1.36 的变更"
  }
}
```

### sessions_list — 列出会话

```json
{
  "tool": "sessions_list",
  "arguments": {}
}
```

返回：

```json
{
  "sessions": [
    {"run_id": "sess_abc123", "agent": "researcher", "status": "running", "elapsed": "45s"},
    {"run_id": "sess_def456", "agent": "code_reviewer", "status": "completed", "elapsed": "2m30s"}
  ]
}
```

### sessions_history — 查看对话日志

```json
{
  "tool": "sessions_history",
  "arguments": {
    "run_id": "sess_abc123"
  }
}
```

### delegate — 委托任务

将任务委托给指定的 Agent，同步等待结果：

```json
{
  "tool": "delegate",
  "arguments": {
    "agent": "code_reviewer",
    "task": "审查 src/tools/shell.rs 中的安全性问题，特别关注命令注入风险",
    "context": {
      "file": "src/tools/shell.rs"
    }
  }
}
```

### agents_list — 列出可用 Agent

```json
{
  "tool": "agents_list",
  "arguments": {}
}
```

返回所有已配置的 Agent 及其能力：

```json
{
  "agents": [
    {
      "name": "researcher",
      "model": "claude-sonnet-4-20250514",
      "tools": ["web_search_tool", "web_fetch", "file_read", "memory_store"],
      "agentic": true
    },
    {
      "name": "code_reviewer",
      "model": "gpt-4o",
      "tools": ["file_read", "shell"],
      "agentic": true
    }
  ]
}
```

## 参数

### sessions_spawn 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `task` | string | 是 | — | 子 Agent 要执行的任务描述 |
| `agent` | string | 否 | 默认 Agent | 使用的 Agent 名称（对应 `[agents.xxx]` 配置） |
| `notify` | boolean | 否 | `true` | 完成后是否自动通知主 Agent |
| `timeout` | integer | 否 | 配置值 | 超时秒数 |

### sessions_send 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `run_id` | string | 是 | 目标子 Agent 的运行 ID |
| `message` | string | 是 | 要发送的消息 |

### sessions_list 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `status` | string | 否 | — | 按状态过滤：`running`、`completed`、`failed` |

### sessions_history 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `run_id` | string | 是 | 要查看历史的运行 ID |

### delegate 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `agent` | string | 是 | — | 委托目标 Agent 名称 |
| `task` | string | 是 | — | 任务描述 |
| `context` | object | 否 | `{}` | 上下文信息（键值对） |

### agents_list 参数

此工具无参数。

## 工作模式

### 并行子 Agent

主 Agent 同时派生多个子 Agent 处理不同任务：

```
主 Agent
  ├─ sessions_spawn → 子 Agent A（搜索文档）
  ├─ sessions_spawn → 子 Agent B（审查代码）
  └─ sessions_spawn → 子 Agent C（运行测试）
      │
      ├─ 子 Agent A 完成 → 自动通知
      ├─ 子 Agent B 完成 → 自动通知
      └─ 子 Agent C 完成 → 自动通知
          │
          └─ 主 Agent 汇总结果
```

### 同步委托

主 Agent 将任务委托给专门的 Agent，同步等待结果：

```
主 Agent → delegate(code_reviewer, "审查安全性") → 等待 → 获取结果 → 继续推理
```

### 引导式交互

主 Agent 可以在子 Agent 运行过程中发送补充指令：

```
主 Agent → sessions_spawn(researcher, "调研 WASM 生态")
         → sessions_send(run_id, "重点关注 WASI Preview 2")
         → sessions_send(run_id, "对比 Wasmtime 和 Wasmer")
         → 子 Agent 完成 → 获取结果
```

## 安全性

### 工具隔离

每个委托 Agent 只能使用 `allowed_tools` 中定义的工具。这确保了：

- 研究 Agent 不能执行 shell 命令
- 代码审查 Agent 不能修改文件
- 轻量 Agent 不能访问网络

```toml
[agents.researcher]
allowed_tools = ["web_search_tool", "web_fetch"]  # 仅搜索能力
```

### 资源限制

子 Agent 受 `max_iterations` 限制，防止无限循环：

```toml
[agents.researcher]
max_iterations = 10   # 最多 10 次工具调用
```

全局并发限制防止资源耗尽：

```toml
[sessions]
max_concurrent = 10   # 最多 10 个并发子 Agent
```

### 凭据隔离

委托 Agent 支持独立的 API 凭据（`fallback_credentials`），确保不同 Agent 使用不同的 API 密钥，避免凭据共享风险。

### 信息流控制

子 Agent 完成后的结果会自动传回主 Agent（当 `auto_announce = true`）。但子 Agent 之间默认无法直接通信，所有信息必须经过主 Agent 中转。这种星型拓扑确保主 Agent 对信息流拥有完全控制权。

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [Agent 运行时](/zh/prx/agent/runtime/) — Agent 执行模型详解
- [子 Agent](/zh/prx/agent/subagents/) — 子 Agent 架构和生命周期
- [会话 Worker](/zh/prx/agent/session-worker/) — 后台会话处理
- [安全策略](/zh/prx/security/policy-engine/) — 工具策略管道详解
