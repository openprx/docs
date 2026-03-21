---
title: Prometheus Metrics
description: Prometheus metrics endpoint and available metrics in PRX.
---

# Prometheus Metrics

PRX exposes a Prometheus-compatible metrics endpoint for integration with monitoring systems like Grafana, Datadog, and AlertManager.

## Endpoint

When enabled, metrics are available at:

```
http://127.0.0.1:9090/metrics
```

## Available Metrics

### Agent Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `prx_sessions_total` | Counter | Total sessions created |
| `prx_sessions_active` | Gauge | Currently active sessions |
| `prx_session_duration_seconds` | Histogram | Session duration |
| `prx_turns_total` | Counter | Total conversation turns |
| `prx_tool_calls_total` | Counter | Total tool calls (by tool name) |

### LLM Provider Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `prx_llm_requests_total` | Counter | Total LLM requests (by provider, model) |
| `prx_llm_request_duration_seconds` | Histogram | LLM request latency |
| `prx_llm_tokens_total` | Counter | Total tokens (input/output, by model) |
| `prx_llm_errors_total` | Counter | LLM errors (by type) |
| `prx_llm_cost_dollars` | Counter | Estimated cost in USD |

### System Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `prx_memory_usage_bytes` | Gauge | Process memory usage |
| `prx_cpu_usage_ratio` | Gauge | Process CPU usage |

## Configuration

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## Related Pages

- [Observability Overview](./)
- [OpenTelemetry Tracing](./opentelemetry)
