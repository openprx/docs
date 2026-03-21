---
title: 心跳
description: PRX 定时任务系统中的定期健康检查和状态报告。
---

# 心跳

心跳是监控 PRX 守护进程运行状态的定期健康检查。它以可配置的间隔（默认：30 秒）运行并报告系统健康状况。

## 检查内容

- **守护进程** -- 守护进程是否响应
- **提供商连接** -- 配置的 LLM 提供商是否可达
- **内存使用** -- 内存消耗是否在限制范围内
- **磁盘空间** -- 数据存储是否有足够的磁盘空间
- **活跃会话** -- 运行中的 Agent 会话计数和状态

## 健康状态

心跳通过以下方式发布状态：

- Debug 级别的日志条目
- `/health` API 端点
- Prometheus 指标（启用时）
- 可选的外部健康检查 URL

## 配置

```toml
[cron.heartbeat]
interval_secs = 30
check_providers = true
check_disk_space = true
disk_space_threshold_mb = 100
external_health_url = ""  # 可选：向外部 URL POST 状态
```

## 相关页面

- [定时任务系统概览](./)
- [可观测性](/zh/prx/observability/)
- [Prometheus 指标](/zh/prx/observability/prometheus)
