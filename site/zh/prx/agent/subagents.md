---
title: 子 Agent
description: PRX 如何生成子 Agent 进行并行任务执行，包括并发限制和深度控制。
---

# 子 Agent

PRX 支持在运行中的 Agent 会话内生成子 Agent（子代理）。这实现了并行任务分解，父 Agent 可以将工作委派给并发运行的专用子 Agent。

## 概述

子 Agent 是轻量级的 Agent 实例，具有以下特点：

- 共享父级的提供商配置和凭证
- 拥有独立的对话历史和记忆范围
- 在父级的沙箱策略内执行
- 完成后将结果报告给父级

## 生成模型

父 Agent 可以通过内置的 `spawn_agent` 工具生成子 Agent。每个子 Agent 接收：

- 任务描述（系统提示词覆盖）
- 可选的允许工具集（父级工具的子集）
- 最大轮次预算

```
父 Agent
  ├── 子 Agent 1（研究任务）
  ├── 子 Agent 2（代码生成）
  └── 子 Agent 3（验证）
```

## 并发限制

为防止资源耗尽，PRX 强制执行并发限制：

```toml
[agent.subagents]
max_concurrent = 4
max_depth = 3
max_total_spawns = 20
child_timeout_secs = 300
```

- **max_concurrent** -- 同时运行的最大子 Agent 数量
- **max_depth** -- 最大嵌套深度（子 Agent 生成子 Agent）
- **max_total_spawns** -- 每个根会话的总生成预算
- **child_timeout_secs** -- 单个子 Agent 执行的超时时间

## 深度控制

每个子 Agent 追踪其深度级别。当达到最大深度时，`spawn_agent` 工具会从子 Agent 的可用工具中移除，阻止进一步嵌套。

## 结果聚合

当所有子 Agent 完成后，它们的结果被收集并作为工具调用结果呈现给父 Agent。父 Agent 可以将输出综合为最终响应。

## 相关页面

- [Agent 运行时](./runtime) -- 架构概览
- [Agent 循环](./loop) -- 核心执行周期
- [会话 Worker](./session-worker) -- 进程隔离
