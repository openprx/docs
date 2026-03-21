---
title: 内置任务
description: PRX 定时任务系统中内置计划任务的参考。
---

# 内置任务

PRX 包含多个内置定时任务，处理常规维护。启用定时任务系统后，这些任务会自动运行。

## 任务参考

| 任务 | 默认计划 | 描述 |
|------|---------|------|
| `heartbeat` | 每 30 秒 | 系统健康检查 |
| `memory-hygiene` | 每天 3:00 | 压缩和清理记忆条目 |
| `log-rotation` | 每天 0:00 | 轮转和压缩旧日志文件 |
| `cache-cleanup` | 每小时 | 移除过期缓存条目 |
| `metrics-export` | 每 5 分钟 | 导出指标到配置的后端 |
| `signature-update` | 每 6 小时 | 更新威胁签名（PRX-SD 集成启用时） |

## 配置

每个内置任务可以单独启用/禁用和重新调度：

```toml
[cron.builtin.memory_hygiene]
enabled = true
schedule = "0 3 * * *"

[cron.builtin.log_rotation]
enabled = true
schedule = "0 0 * * *"
max_log_age_days = 30

[cron.builtin.cache_cleanup]
enabled = true
schedule = "0 * * * *"
```

## 自定义任务

除了内置任务外，你还可以定义自定义 Agent 任务，按计划执行提示词：

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # 每周日凌晨 2:00
action = "agent"
prompt = "审查并归档旧对话日志"
timeout_secs = 300
```

## 相关页面

- [定时任务系统概览](./)
- [心跳](./heartbeat)
- [记忆维护](/zh/prx/memory/hygiene)
