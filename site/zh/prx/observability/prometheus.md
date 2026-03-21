---
title: Prometheus 指标
description: PRX 的 Prometheus 指标端点和可用指标。
---

# Prometheus 指标

PRX 暴露 Prometheus 兼容的指标端点，用于与 Grafana、Datadog 和 AlertManager 等监控系统集成。

## 端点

启用后，指标可在以下地址访问：

```
http://127.0.0.1:9090/metrics
```

## 可用指标

### Agent 指标

| 指标 | 类型 | 描述 |
|------|------|------|
| `prx_sessions_total` | Counter | 创建的总会话数 |
| `prx_sessions_active` | Gauge | 当前活跃会话 |
| `prx_session_duration_seconds` | Histogram | 会话时长 |
| `prx_turns_total` | Counter | 总对话轮次 |
| `prx_tool_calls_total` | Counter | 总工具调用（按工具名） |

### LLM 提供商指标

| 指标 | 类型 | 描述 |
|------|------|------|
| `prx_llm_requests_total` | Counter | 总 LLM 请求（按提供商、模型） |
| `prx_llm_request_duration_seconds` | Histogram | LLM 请求延迟 |
| `prx_llm_tokens_total` | Counter | 总 token 数（输入/输出，按模型） |
| `prx_llm_errors_total` | Counter | LLM 错误（按类型） |
| `prx_llm_cost_dollars` | Counter | 预估成本（美元） |

### 系统指标

| 指标 | 类型 | 描述 |
|------|------|------|
| `prx_memory_usage_bytes` | Gauge | 进程内存使用 |
| `prx_cpu_usage_ratio` | Gauge | 进程 CPU 使用率 |

## 配置

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## 相关页面

- [可观测性概览](./)
- [OpenTelemetry 追踪](./opentelemetry)
