---
title: المهام المدمجة
description: مرجع المهام المجدولة المدمجة في نظام cron الخاص بـ PRX.
---

# المهام المدمجة

يتضمن PRX عدة مهام cron مدمجة تتعامل مع الصيانة الروتينية. تعمل هذه المهام تلقائيًا عند تمكين نظام cron.

## مرجع المهام

| Task | Default Schedule | Description |
|------|-----------------|-------------|
| `heartbeat` | Every 30s | System health check |
| `memory-hygiene` | Daily at 3:00 | Compact and prune memory entries |
| `log-rotation` | Daily at 0:00 | Rotate and compress old log files |
| `cache-cleanup` | Hourly | Remove expired cache entries |
| `metrics-export` | Every 5m | Export metrics to configured backends |
| `signature-update` | Every 6h | Update threat signatures (if PRX-SD integration enabled) |

## الإعدادات

يمكن تمكين/تعطيل كل مهمة مدمجة وإعادة جدولة كل منها بشكل مستقل:

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

## المهام المخصصة

بالإضافة إلى المهام المدمجة، يمكنك تعريف مهام وكيل مخصصة تنفذ prompt وفق جدول:

```toml
[[cron.tasks]]
name = "weekly-cleanup"
schedule = "0 2 * * 0"  # Sundays at 2:00 AM
action = "agent"
prompt = "Review and archive old conversation logs"
timeout_secs = 300
```

## صفحات ذات صلة

- [نظرة عامة على نظام Cron](./)
- [نبضة الحياة](./heartbeat)
- [نظافة الذاكرة](/ar/prx/memory/hygiene)
