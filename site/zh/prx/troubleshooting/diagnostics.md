---
title: 诊断
description: 用于调试 PRX 问题的详细诊断流程和工具。
---

# 诊断

本页涵盖高级诊断流程，用于调查基本故障排除步骤无法解决的 PRX 问题。

## 诊断命令

### prx doctor

全面健康检查：

```bash
prx doctor
```

输出包括：
- 配置验证结果
- 提供商连接测试
- 系统依赖检查
- 资源使用摘要

### prx debug

启用 debug 级别日志以获取详细操作追踪：

```bash
PRX_LOG=debug prx daemon
```

或在配置中设置：

```toml
[observability]
log_level = "debug"
```

### prx info

显示系统信息：

```bash
prx info
```

显示：
- PRX 版本和构建信息
- 操作系统和架构
- 已配置提供商及其状态
- 记忆后端类型和大小
- 插件数量和状态

## 日志分析

PRX 日志是结构化 JSON（当 `log_format = "json"` 时）。需要关注的关键字段：

| 字段 | 描述 |
|------|------|
| `level` | 日志级别（debug, info, warn, error） |
| `target` | Rust 模块路径 |
| `session_id` | 关联的会话 ID |
| `provider` | 涉及的 LLM 提供商 |
| `duration_ms` | 操作耗时 |
| `error` | 错误详情（如适用） |

## 网络诊断

测试提供商连接：

```bash
# 测试 Anthropic API
prx provider test anthropic

# 测试所有已配置的提供商
prx provider test --all

# 从沙箱内检查网络
prx sandbox test-network
```

## 性能分析

启用指标端点并使用 Prometheus/Grafana 进行性能分析：

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
```

需要监控的关键指标：
- `prx_llm_request_duration_seconds` -- LLM 延迟
- `prx_sessions_active` -- 并发会话
- `prx_memory_usage_bytes` -- 内存消耗

## 相关页面

- [故障排除概览](./)
- [可观测性](/zh/prx/observability/)
- [Prometheus 指标](/zh/prx/observability/prometheus)
