---
title: 定时任务工具
description: PRX 的定时任务工具集提供 cron 任务管理和高级调度能力，包括 Xin 调度引擎的依赖链和条件执行。
---

# 定时任务工具

PRX 提供 9 个定时任务和调度工具，构成完整的时间驱动自动化体系。从传统的 cron 表达式到自然语言时间描述，从简单的周期执行到带依赖链的复杂工作流，这组工具让 Agent 能够在无人值守的情况下执行定期任务。

定时任务工具分为两个层次：**基础 cron 工具**（cron_add/list/remove/update/run/runs）提供标准的 cron 任务管理；**高级调度工具**（schedule/xin）提供自然语言调度和依赖链执行。两者在 `all_tools()` 模式下始终可用。

Xin 调度引擎是 PRX 的高级调度器，支持任务之间的依赖关系、条件执行、失败重试和并发控制。它适用于需要多步骤协作的复杂自动化场景。

## 配置

在 `config.toml` 中配置定时任务系统：

```toml
[cron]
enabled = true
storage = "sqlite"            # 任务存储后端："memory" | "sqlite" | "file"
storage_path = "~/.prx/cron.db"

# 执行配置
max_concurrent_jobs = 5       # 最大并发执行任务数
default_timeout_secs = 300    # 默认任务超时（5分钟）
retry_on_failure = false      # 失败是否自动重试
max_retries = 3               # 最大重试次数

# Xin 调度引擎
[cron.xin]
enabled = true
dag_max_depth = 10            # 依赖链最大深度
```

工具策略控制：

```toml
[security.tool_policy.groups]
automation = "allow"           # 组级别允许自动化工具

[security.tool_policy.tools]
cron_add = "supervised"        # 添加定时任务需审批
cron_remove = "supervised"     # 删除定时任务需审批
cron_run = "allow"             # 手动触发允许
```

## 使用方法

### cron_add — 添加定时任务

```json
{
  "tool": "cron_add",
  "arguments": {
    "name": "daily_report",
    "schedule": "0 9 * * *",
    "command": "生成今日工作报告并发送到 Telegram",
    "description": "每天早上 9 点生成并发送工作日报",
    "enabled": true
  }
}
```

Cron 表达式快速参考：

```
* * * * *
│ │ │ │ │
│ │ │ │ └── 星期（0-7，0和7都是周日）
│ │ │ └──── 月份（1-12）
│ │ └────── 日（1-31）
│ └──────── 小时（0-23）
└────────── 分钟（0-59）

常用表达式：
  0 9 * * *        每天 9:00
  0 */2 * * *      每 2 小时
  0 9 * * 1-5      工作日 9:00
  */5 * * * *      每 5 分钟
  0 0 1 * *        每月 1 号 0:00
```

### cron_list — 列出定时任务

```json
{
  "tool": "cron_list",
  "arguments": {}
}
```

返回：

```json
{
  "jobs": [
    {
      "id": "job_001",
      "name": "daily_report",
      "schedule": "0 9 * * *",
      "description": "每天早上 9 点生成并发送工作日报",
      "enabled": true,
      "last_run": "2024-01-15T09:00:02Z",
      "next_run": "2024-01-16T09:00:00Z",
      "status": "idle"
    }
  ]
}
```

### cron_remove — 删除定时任务

```json
{
  "tool": "cron_remove",
  "arguments": {
    "id": "job_001"
  }
}
```

### cron_update — 更新定时任务

```json
{
  "tool": "cron_update",
  "arguments": {
    "id": "job_001",
    "schedule": "0 8 * * 1-5",
    "description": "工作日早上 8 点发送日报"
  }
}
```

### cron_run — 手动触发

```json
{
  "tool": "cron_run",
  "arguments": {
    "id": "job_001"
  }
}
```

### cron_runs — 查看执行历史

```json
{
  "tool": "cron_runs",
  "arguments": {
    "id": "job_001",
    "limit": 10
  }
}
```

返回：

```json
{
  "runs": [
    {
      "run_id": "run_abc123",
      "started_at": "2024-01-15T09:00:02Z",
      "finished_at": "2024-01-15T09:00:45Z",
      "status": "success",
      "duration_ms": 43000
    },
    {
      "run_id": "run_def456",
      "started_at": "2024-01-14T09:00:01Z",
      "finished_at": "2024-01-14T09:01:30Z",
      "status": "failed",
      "error": "网络超时"
    }
  ]
}
```

### schedule — 自然语言调度

```json
{
  "tool": "schedule",
  "arguments": {
    "task": "检查 GitHub 仓库的新 issue 并分类",
    "when": "every 30 minutes during business hours",
    "recurring": true
  }
}
```

支持的自然语言表达：

- `in 5 minutes` — 5 分钟后执行
- `tomorrow at 9am` — 明天早上 9 点
- `every hour` — 每小时
- `every weekday at 8:30` — 工作日 8:30
- `every 30 minutes during business hours` — 工作时间内每 30 分钟

### xin — Xin 调度引擎

```json
{
  "tool": "xin",
  "arguments": {
    "action": "create_dag",
    "dag": {
      "name": "release_pipeline",
      "tasks": [
        {
          "id": "test",
          "command": "cargo test",
          "timeout": 300
        },
        {
          "id": "build",
          "command": "cargo build --release",
          "depends_on": ["test"],
          "timeout": 600
        },
        {
          "id": "deploy",
          "command": "发布到生产环境",
          "depends_on": ["build"],
          "condition": "build.exit_code == 0"
        }
      ]
    }
  }
}
```

## 参数

### cron_add 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `name` | string | 是 | — | 任务名称 |
| `schedule` | string | 是 | — | Cron 表达式 |
| `command` | string | 是 | — | 要执行的命令或任务描述 |
| `description` | string | 否 | — | 任务说明 |
| `enabled` | boolean | 否 | `true` | 是否启用 |
| `timeout` | integer | 否 | 配置值 | 超时秒数 |

### cron_update 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 任务 ID |
| `schedule` | string | 否 | 新的 cron 表达式 |
| `command` | string | 否 | 新的命令 |
| `description` | string | 否 | 新的说明 |
| `enabled` | boolean | 否 | 是否启用 |

### cron_remove / cron_run 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `id` | string | 是 | 任务 ID |

### cron_runs 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | string | 是 | — | 任务 ID |
| `limit` | integer | 否 | `20` | 返回记录数上限 |

### schedule 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `task` | string | 是 | — | 任务描述 |
| `when` | string | 是 | — | 自然语言时间表达 |
| `recurring` | boolean | 否 | `false` | 是否为周期性任务 |

### xin 参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `action` | string | 是 | 操作类型：`create_dag`、`run_dag`、`status`、`cancel` |
| `dag` | object | 条件 | DAG 定义（`create_dag` 时必填） |
| `dag_id` | string | 条件 | DAG ID（`run_dag`、`status`、`cancel` 时必填） |

## Xin 调度引擎

Xin 是 PRX 内置的高级调度引擎，支持有向无环图（DAG）任务编排：

### 核心特性

- **依赖链** — 任务可以声明对其他任务的依赖，自动按拓扑序执行
- **条件执行** — 任务可以根据前置任务的结果决定是否执行
- **并发控制** — 无依赖关系的任务自动并行执行
- **失败重试** — 支持配置重试次数和退避策略
- **超时控制** — 每个任务独立的超时设置

### DAG 执行流程

```
test ─┐
      ├─→ build ─→ deploy
lint ─┘           ↑
                  │ (condition: build.success)
```

在上述 DAG 中：
1. `test` 和 `lint` 并行执行（无依赖）
2. `build` 等待 `test` 和 `lint` 都完成
3. `deploy` 仅在 `build` 成功时执行

## 安全性

### 任务权限

定时任务以 PRX Agent 的权限执行，继承 Agent 的工具策略和沙箱配置。建议：

- 对 `cron_add` 和 `cron_remove` 设置 `supervised` 策略
- 限制定时任务可使用的工具范围
- 定期审查已注册的定时任务列表

### 超时保护

所有定时任务都有超时限制，防止任务卡死或无限运行：

```toml
[cron]
default_timeout_secs = 300   # 默认 5 分钟
```

### 并发限制

`max_concurrent_jobs` 防止过多任务同时执行导致资源耗尽。超过限制的任务会排队等待。

### 审计日志

所有定时任务操作（创建、删除、执行、失败）都会记录在审计日志中，方便追溯和问题排查。

## 相关文档

- [工具概览](/zh/prx/tools/) — 所有工具的分类参考
- [定时任务系统](/zh/prx/cron/) — 定时任务架构概览
- [心跳检查](/zh/prx/cron/heartbeat/) — 系统心跳和健康检查
- [任务管理](/zh/prx/cron/tasks/) — 任务类型和执行策略
- [配置参考](/zh/prx/config/reference/) — 完整 config.toml 参考
