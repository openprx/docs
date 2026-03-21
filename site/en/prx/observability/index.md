---
title: Observability
description: Overview of PRX observability features including metrics, tracing, and logging.
---

# Observability

PRX provides comprehensive observability through metrics, distributed tracing, and structured logging. These features enable monitoring, debugging, and performance optimization of agent operations.

## Overview

| Feature | Backend | Purpose |
|---------|---------|---------|
| [Prometheus Metrics](./prometheus) | Prometheus | Quantitative monitoring (request rates, latencies, errors) |
| [OpenTelemetry](./opentelemetry) | OTLP-compatible | Distributed tracing and span-level analysis |
| Structured Logging | stdout/file | Detailed operational logs |

## Quick Start

Enable observability in `config.toml`:

```toml
[observability]
log_level = "info"
log_format = "json"  # "json" | "pretty"

[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"

[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"
```

## Key Metrics

PRX exposes metrics for:

- **Agent performance** -- session duration, turns per session, tool calls
- **LLM provider** -- request latency, token usage, error rates, cost
- **Memory** -- recall latency, store size, compaction frequency
- **System** -- CPU usage, memory consumption, active connections

## Related Pages

- [Prometheus Metrics](./prometheus)
- [OpenTelemetry Tracing](./opentelemetry)
- [Heartbeat](/en/prx/cron/heartbeat)
