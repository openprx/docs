---
title: Built-in Tasks
description: Reference for built-in taches planifiees in le PRX cron system.
---

# Built-in Tasks

PRX inclut several built-in cron tasks that handle routine maintenance. These tasks run automatiquement lorsque le cron system est active.

## Task Reference

| Task | Defaut Schedule | Description |
|------|-----------------|-------------|
| `heartbeat` | Every 30s | System health check |
| `memory-hygiene` | Daily at 3:00 | Compact and prune memory entries |
| `log-rotation` | Daily at 0:00 | Rotate and compress old log files |
| `cache-cleanup` | Hourly | Remove expired cache entries |
| `metrics-export` | Every 5m | Export metrics pour configurerd backends |
| `signature-update` | Every 6h | Update threat signatures (if PRX-SD integration enabled) |

## Configuration

Each built-in task peut etre individually enabled/disabled and rescheduled:

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

En plus de built-in tasks, you can define custom agent tasks that execute a prompt sur un schedule:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # Sundays at 2:00 AM
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## Voir aussi Pages

- [Cron System Overview](./)
- [Heartbeat](./heartbeat)
- [Memory Hygiene](/fr/prx/memory/hygiene)
