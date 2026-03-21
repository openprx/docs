---
title: Heartbeat
description: Periodic health checks and status reporting in the PRX cron system.
---

# Heartbeat

The heartbeat is a periodic health check that monitors the PRX daemon's operational status. It runs at a configurable interval (default: 30 seconds) and reports system health.

## What It Checks

- **Daemon process** -- is the daemon responsive
- **Provider connectivity** -- can the configured LLM providers be reached
- **Memory usage** -- is memory consumption within limits
- **Disk space** -- is sufficient disk space available for data storage
- **Active sessions** -- count and status of running agent sessions

## Health Status

The heartbeat publishes status through:

- Log entries at debug level
- The `/health` API endpoint
- Prometheus metrics (when enabled)
- Optional external health check URL

## Configuration

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # optional: POST status to external URL
```

## Related Pages

- [Cron System Overview](./)
- [Observability](/en/prx/observability/)
- [Prometheus Metrics](/en/prx/observability/prometheus)
