---
title: Cron System
description: Overview of the PRX cron system for scheduled task execution and heartbeat monitoring.
---

# Cron System

The PRX cron system provides scheduled task execution for the daemon. It handles recurring maintenance tasks, heartbeat monitoring, and user-defined scheduled jobs.

## Overview

The cron system runs as part of the PRX daemon and manages:

- **Heartbeat** -- periodic health checks and status reporting
- **Maintenance tasks** -- memory hygiene, log rotation, cache cleanup
- **User tasks** -- custom scheduled agent actions

## Architecture

```
┌─────────────────────────┐
│     Cron Scheduler       │
│                          │
│  ┌────────────────────┐  │
│  │  Heartbeat (30s)   │  │
│  ├────────────────────┤  │
│  │  Memory Hygiene    │  │
│  ├────────────────────┤  │
│  │  Log Rotation      │  │
│  ├────────────────────┤  │
│  │  User Tasks        │  │
│  └────────────────────┘  │
└─────────────────────────┘
```

## Configuration

```toml
[cron]
enabled = true
timezone = "UTC"

[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"  # cron expression
action = "agent"
prompt = "Generate a daily summary report"
```

## Related Pages

- [Heartbeat](./heartbeat)
- [Built-in Tasks](./tasks)
