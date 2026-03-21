---
title: OpenTelemetry
description: Distributed tracing with OpenTelemetry in PRX for span-level analysis.
---

# OpenTelemetry

PRX supports OpenTelemetry (OTLP) for distributed tracing. Traces provide span-level visibility into agent operations, including LLM calls, tool executions, and memory operations.

## Overview

Each agent operation creates a trace with nested spans:

```
Session
  └── Turn
       ├── Memory Recall (span)
       ├── LLM Request (span)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (span)
            ├── Policy Check
            └── Sandbox Run
```

## Configuration

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC endpoint
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 to 1.0
```

## Supported Backends

PRX can export traces to any OTLP-compatible backend:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (via OTLP collector)

## Span Attributes

Common attributes attached to spans:

| Attribute | Description |
|-----------|-------------|
| `prx.session_id` | Agent session identifier |
| `prx.provider` | LLM provider name |
| `prx.model` | Model identifier |
| `prx.tool` | Tool name (for tool spans) |
| `prx.tokens.input` | Input token count |
| `prx.tokens.output` | Output token count |

## Related Pages

- [Observability Overview](./)
- [Prometheus Metrics](./prometheus)
