---
title: OpenTelemetry
description: PRX 中使用 OpenTelemetry 的分布式追踪，实现 span 级分析。
---

# OpenTelemetry

PRX 支持 OpenTelemetry (OTLP) 分布式追踪。追踪提供 span 级别的 Agent 操作可见性，包括 LLM 调用、工具执行和记忆操作。

## 概述

每个 Agent 操作创建一个包含嵌套 span 的 trace：

```
Session
  └── Turn
       ├── 记忆回忆 (span)
       ├── LLM 请求 (span)
       │    ├── Token 流式传输
       │    └── 响应解析
       └── 工具执行 (span)
            ├── 策略检查
            └── 沙箱运行
```

## 配置

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC 端点
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 到 1.0
```

## 支持的后端

PRX 可以将追踪数据导出到任何 OTLP 兼容的后端：

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray（通过 OTLP collector）

## Span 属性

附加到 span 的常用属性：

| 属性 | 描述 |
|------|------|
| `prx.session_id` | Agent 会话标识符 |
| `prx.provider` | LLM 提供商名称 |
| `prx.model` | 模型标识符 |
| `prx.tool` | 工具名称（工具 span） |
| `prx.tokens.input` | 输入 token 数 |
| `prx.tokens.output` | 输出 token 数 |

## 相关页面

- [可观测性概览](./)
- [Prometheus 指标](./prometheus)
