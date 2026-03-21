---
title: 可观测性
description: PRX 可观测性功能概览，包括指标、追踪和日志。
---

# 可观测性

PRX 通过指标、分布式追踪和结构化日志提供全面的可观测性。这些功能支持对 Agent 操作进行监控、调试和性能优化。

## 概述

| 功能 | 后端 | 用途 |
|------|------|------|
| [Prometheus 指标](./prometheus) | Prometheus | 定量监控（请求率、延迟、错误） |
| [OpenTelemetry](./opentelemetry) | OTLP 兼容 | 分布式追踪和 span 级分析 |
| 结构化日志 | stdout/文件 | 详细的运行日志 |

## 快速开始

在 `config.toml` 中启用可观测性：

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

## 关键指标

PRX 暴露以下方面的指标：

- **Agent 性能** -- 会话时长、每会话轮次、工具调用
- **LLM 提供商** -- 请求延迟、token 使用量、错误率、成本
- **记忆** -- 回忆延迟、存储大小、压缩频率
- **系统** -- CPU 使用率、内存消耗、活跃连接

## 相关页面

- [Prometheus 指标](./prometheus)
- [OpenTelemetry 追踪](./opentelemetry)
- [心跳](/zh/prx/cron/heartbeat)
