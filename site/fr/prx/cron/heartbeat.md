---
title: Battement de coeur
description: Periodic health checks and status reporting in le PRX cron system.
---

# Heartbeat

The heartbeat is a periodic health check qui surveille the PRX daemon's operational status. It runs at a configurable interval (par defaut : 30 seconds) and reports system health.

## What It Checks

- **Daemon process** -- is le daemon responsive
- **Provider connectivity** -- can the configured LLM fournisseurs be reached
- **Memory usage** -- is memory consumption within limits
- **Disk space** -- is sufficient disk space available for data storage
- **Active sessions** -- count and status of running session d'agents

## Health Status

The heartbeat publishes status through:

- Log entries at debug level
- The `/health` API endpoint
- Prometheus metrics (lorsqu'active)
- Optionnel external health check URL

## Configuration

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # optional: POST status to external URL
```

## Voir aussi Pages

- [Cron System Overview](./)
- [Observability](/fr/prx/observability/)
- [Prometheus Metrics](/fr/prx/observability/prometheus)
