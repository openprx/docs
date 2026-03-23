---
title: 因果树引擎
description: PRX 因果树引擎 (CTE) 概览 — 投机性多分支预测，包含预演、评分和自动熔断器。
---

# 因果树引擎

因果树引擎 (Causal Tree Engine, CTE) 是一个投机执行系统，在提交最终响应之前并行评估多种响应策略。它集成在 PRX Agent 管线中，位于意图分类和 LLM 调用之间。

> **默认关闭。** CTE 是可选功能 — 在配置中设置 `causal_tree.enabled = true` 来启用。

## 工作流程

```text
快照 → 展开 → 预演 → 评分 → 选择 → 反馈
```

1. **快照 (Snapshot)** — 捕获当前因果状态（会话上下文、预算、约束条件）
2. **展开 (Expand)** — 生成候选分支（如：直接回答、工具调用、子代理委托）
3. **预演 (Rehearse)** — 对有潜力的分支进行轻量级"试运行"，默认只读模式
4. **评分 (Score)** — 通过置信度、成本、延迟的加权组合对分支排名
5. **选择 (Select)** — 如果最高分分支达到阈值则提交；否则回退
6. **反馈 (Feedback)** — 记录决策日志，用于可观测性和未来学习

## 何时启用 CTE

CTE 对复杂的多步骤 Agent 任务最有价值，在这些场景中选错策略会浪费大量 Token 或时间。对于简单问答场景，额外开销可能不值得。

| 场景 | 建议 |
|------|------|
| 简单问答、闲聊 | 保持 CTE **关闭** |
| 多步骤工具调用工作流 | 启用 CTE |
| 自主 Agent 任务（Xin / 自进化） | 启用 CTE |
| 成本敏感部署 | 启用 CTE 并收紧 `extra_token_ratio_limit` |

## 快速开始

在 PRX 配置文件（`~/.openprx/config.toml`）中添加：

```toml
[causal_tree]
enabled = true
```

所有其他参数都有合理的默认值。完整参数列表请参阅[配置参考](./configuration)。

## 架构

```text
                    ┌──────────────────────────────┐
                    │       CausalTreeEngine        │
                    │       (管线编排器)              │
                    └──┬───┬───┬───┬───┬───┬───────┘
                       │   │   │   │   │   │
                    快照 展开 预演 评分 选择 反馈
                       │   │   │   │   │   │
                       ▼   ▼   ▼   ▼   ▼   ▼
                    State Expander Engine Scorer Selector Writer
```

所有组件通过 `Arc<dyn Trait>` 注入，支持运行时多态。引擎使用**组合模式**而非超级 trait，避免"上帝对象"反模式。

## 熔断器

CTE 内置熔断器防止级联故障：

- 连续 `circuit_breaker_threshold` 次失败后（默认：5 次），CTE 触发熔断，所有请求绕过它
- 经过 `circuit_breaker_cooldown_secs`（默认：60 秒）后，熔断器允许重试
- 单次成功运行即可重置失败计数器

## 指标

CTE 跟踪关键性能指标：

| 指标 | 描述 |
|------|------|
| `hit_at_1_ratio` | 首选分支正确的比例 |
| `hit_at_3_ratio` | 正确分支在前 3 候选中的比例 |
| `wasted_speculation_ratio` | 执行了但未使用的预演比例 |
| `commit_success_rate` | 成功提交百分比 |
| `avg_extra_latency_ms` | 每次运行的平均额外延迟 |
| `circuit_breaker_trips` | 熔断器触发次数 |

通过 `causal_tree.write_metrics = true`（默认启用）开启指标收集。

## 相关页面

- [配置参考](./configuration)
- [Agent 运行时](/zh/prx/agent/runtime)
- [LLM 路由器](/zh/prx/router/)
- [可观测性](/zh/prx/observability/)
