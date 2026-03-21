---
title: prx cron — 定时任务管理
description: 配置和管理 OpenPRX 定时任务，支持 cron 表达式、一次性定时、固定间隔和延迟执行。
---

# prx cron

配置和管理定时任务。支持四种调度方式：

- **Cron 表达式** — 标准 5 字段格式（分 时 日 月 周），适合周期性任务
- **一次性定时** (`add-at`) — RFC 3339 时间戳，适合精确时间点任务
- **固定间隔** (`add-every`) — 毫秒间隔，适合心跳/轮询类任务
- **延迟执行** (`once`) — 人类可读的延迟时间（如 30m/2h/1d），适合临时提醒

## 用法

```bash
prx cron <COMMAND>
```

## 子命令

| 子命令 | 说明 |
|--------|------|
| `list` | 列出所有定时任务 |
| `add <EXPR> <CMD>` | 添加 cron 定时任务 |
| `add-at <TIME> <CMD>` | 添加一次性定时任务 |
| `add-every <MS> <CMD>` | 添加固定间隔任务 |
| `once <DELAY> <CMD>` | 添加延迟执行任务 |
| `remove <ID>` | 删除定时任务 |
| `update <ID>` | 更新定时任务 |
| `pause <ID>` | 暂停定时任务 |
| `resume <ID>` | 恢复暂停的任务 |

## prx cron list

列出所有已配置的定时任务及其状态。

```bash
prx cron list
```

## prx cron add

使用 cron 表达式添加周期性定时任务。

```bash
prx cron add <EXPRESSION> <COMMAND> [OPTIONS]
```

### 参数

| 参数 | 说明 |
|------|------|
| `EXPRESSION` | 标准 5 字段 cron 表达式：`分 时 日 月 周` |
| `COMMAND` | 要执行的命令/消息 |

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--tz <TIMEZONE>` | — | `UTC` | IANA 时区名称（如 `Asia/Shanghai`、`America/New_York`） |

### 示例

```bash
# 工作日每天上午 9 点发送消息（纽约时间）
prx cron add '0 9 * * 1-5' 'Good morning' --tz America/New_York

# 每 30 分钟检查系统健康
prx cron add '*/30 * * * *' 'Check system health'

# 每天午夜运行备份
prx cron add '0 0 * * *' 'Run daily backup' --tz Asia/Shanghai
```

## prx cron add-at

在指定时间点执行一次性任务。

```bash
prx cron add-at <TIMESTAMP> <COMMAND>
```

### 参数

| 参数 | 说明 |
|------|------|
| `TIMESTAMP` | RFC 3339 格式的时间戳（如 `2025-01-15T14:00:00Z`） |
| `COMMAND` | 要执行的命令/消息 |

### 示例

```bash
prx cron add-at 2025-01-15T14:00:00Z 'Send reminder'
```

## prx cron add-every

添加固定间隔重复执行的任务。

```bash
prx cron add-every <INTERVAL_MS> <COMMAND>
```

### 参数

| 参数 | 说明 |
|------|------|
| `INTERVAL_MS` | 间隔时间（毫秒） |
| `COMMAND` | 要执行的命令/消息 |

### 示例

```bash
# 每 60 秒（60000 毫秒）发送心跳
prx cron add-every 60000 'Ping heartbeat'

# 每 5 分钟检查一次
prx cron add-every 300000 'Check status'
```

## prx cron once

延迟指定时间后执行一次性任务。

```bash
prx cron once <DELAY> <COMMAND>
```

### 参数

| 参数 | 说明 |
|------|------|
| `DELAY` | 人类可读的延迟时间，如 `30m`（30 分钟）、`2h`（2 小时）、`1d`（1 天） |
| `COMMAND` | 要执行的命令/消息 |

### 示例

```bash
# 30 分钟后运行备份
prx cron once 30m 'Run backup in 30 minutes'

# 2 小时后发送提醒
prx cron once 2h 'Meeting reminder'
```

## prx cron remove

删除指定的定时任务。

```bash
prx cron remove <ID>
```

## prx cron update

更新已有定时任务的配置。所有选项均为可选，仅更新指定的字段。

```bash
prx cron update <ID> [OPTIONS]
```

### 选项

| 参数 | 缩写 | 默认值 | 说明 |
|------|------|--------|------|
| `--expression <EXPR>` | — | — | 新的 cron 表达式 |
| `--tz <TIMEZONE>` | — | — | 新的 IANA 时区 |
| `--command <CMD>` | — | — | 新的执行命令 |
| `--name <NAME>` | — | — | 新的任务名称 |

### 示例

```bash
# 修改 cron 表达式和时区
prx cron update task-abc --expression '0 8 * * *' --tz Europe/London

# 仅修改命令
prx cron update task-abc --command 'Updated health check'
```

## prx cron pause / resume

暂停或恢复指定的定时任务。

```bash
prx cron pause <ID>
prx cron resume <ID>
```

暂停后任务不会触发，直到调用 `resume` 恢复。

## Cron 表达式格式

使用标准 5 字段格式：

```
┌───────── 分 (0-59)
│ ┌─────── 时 (0-23)
│ │ ┌───── 日 (1-31)
│ │ │ ┌─── 月 (1-12)
│ │ │ │ ┌─ 周 (0-7, 0 和 7 均为周日)
│ │ │ │ │
* * * * *
```

常用示例：

| 表达式 | 含义 |
|--------|------|
| `*/5 * * * *` | 每 5 分钟 |
| `0 * * * *` | 每小时整点 |
| `0 9 * * 1-5` | 工作日每天 9:00 |
| `0 0 1 * *` | 每月 1 日午夜 |
| `30 2 * * 0` | 每周日 2:30 |

## 相关链接

- [prx daemon](./daemon) — 守护进程（自动运行调度器）
- [工具](../tools/) — 定时任务可调用的工具
