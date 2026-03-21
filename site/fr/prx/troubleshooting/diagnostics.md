---
title: Diagnostics
description: Detailed diagnostic procedures and tools for debugging PRX issues.
---

# Diagnostics

This page covers advanced diagnostic procedures for investigating PRX issues that are pas resolved par le basic troubleshooting steps.

## Diagnostic Commands

### prx doctor

The comprehensive health check:

```bash
prx doctor
```

Output includes:
- Configuration validation results
- Provider connectivity tests
- System dependency checks
- Resource usage summary

### prx debug

Enable debug-level logging for detailed operation traces:

```bash
PRX_LOG=debug prx daemon
```

Or set in config:

```toml
[observability]
log_level = "debug"
```

### prx info

Display system information:

```bash
prx info
```

Shows:
- PRX version and build info
- OS and architecture
- Configured fournisseurs and their status
- Memory backend type and size
- Plugin count and status

## Log Analysis

PRX logs are structured JSON (when `log_format = "json"`). Key fields to look for:

| Champ | Description |
|-------|-------------|
| `level` | Log level (debug, info, warn, error) |
| `target` | Rust module path |
| `session_id` | Associated session ID |
| `fournisseur` | LLM fournisseur involved |
| `duration_ms` | Operation duration |
| `error` | Error details (if applicable) |

## Network Diagnostics

Test fournisseur connectivity:

```bash
# Test Anthropic API
prx provider test anthropic

# Test all configured providers
prx provider test --all

# Check network from sandbox
prx sandbox test-network
```

## Performance Profiling

Enable the metrics endpoint and use Prometheus/Grafana for performance analysis:

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

Key metrics to monitor:
- `prx_llm_request_duration_seconds` -- LLM latency
- `prx_sessions_active` -- concurrent sessions
- `prx_memory_usage_bytes` -- memory consumption

## Voir aussi Pages

- [Troubleshooting Overview](./)
- [Observability](/fr/prx/observability/)
- [Prometheus Metrics](/fr/prx/observability/prometheus)
