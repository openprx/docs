---
title: Built-in Tasks
description: Reference for built-in scheduled tasks in the PRX cron system.
---

# Built-in Tasks

PRX includes several built-in cron tasks that handle routine maintenance. These tasks run automatically when the cron system is enabled.

## Task Reference

| Task | Default Schedule | Description |
|------|-----------------|-------------|
| `heartbeat` | Every 30s | System health check |
| `memory-hygiene` | Daily at 3:00 | Compact and prune memory entries |
| `log-rotation` | Daily at 0:00 | Rotate and compress old log files |
| `cache-cleanup` | Hourly | Remove expired cache entries |
| `metrics-export` | Every 5m | Export metrics to configured backends |
| `signature-update` | Every 6h | Update threat signatures (if PRX-SD integration enabled) |

## Configuration

Each built-in task can be individually enabled/disabled and rescheduled:

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

## Custom Tasks

In addition to built-in tasks, you can define custom agent tasks that execute a prompt on a schedule:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # Sundays at 2:00 AM
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## Related Pages

- [Cron System Overview](./)
- [Heartbeat](./heartbeat)
- [Memory Hygiene](/en/prx/memory/hygiene)
