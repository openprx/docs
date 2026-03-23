---
title: CTE 配置参考
description: PRX 因果树引擎完整配置参考。
---

# CTE 配置参考

因果树引擎通过 PRX 配置文件中的 `[causal_tree]` 段落进行配置。

> **CTE 默认关闭。** 以下所有参数仅在 `causal_tree.enabled = true` 时生效。

## 完整示例

```toml
[causal_tree]
enabled = true                  # 主开关（默认：false）

# 评分权重（三者之和应为 1.0）
w_confidence = 0.50             # 置信度维度权重
w_cost = 0.25                   # 成本惩罚权重
w_latency = 0.25                # 延迟惩罚权重

# 日志
write_decision_log = true       # 记录每次 CTE 决策（默认：true）
write_metrics = true            # 收集 CTE 指标（默认：true）

[causal_tree.policy]
max_branches = 3                # 最大候选分支数
commit_threshold = 0.62         # 提交分支的最低分数
extra_token_ratio_limit = 0.35  # CTE 开销与基准 Token 的最大比率
extra_latency_budget_ms = 300   # 最大额外延迟预算（毫秒）
rehearsal_timeout_ms = 5000     # 单次预演超时（毫秒）
default_side_effect_mode = "read_only"  # 预演副作用模式
circuit_breaker_threshold = 5   # 触发熔断的连续失败次数
circuit_breaker_cooldown_secs = 60  # 熔断后冷却时间（秒）
```

## 参数详解

### 顶层参数

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | bool | `false` | 主开关。设为 `false` 时 CTE 完全跳过。 |
| `w_confidence` | f32 | `0.50` | 置信度维度的评分权重。值越高，越偏向模型有把握的分支。 |
| `w_cost` | f32 | `0.25` | 成本惩罚的评分权重。值越高，对昂贵分支的惩罚越重。 |
| `w_latency` | f32 | `0.25` | 延迟惩罚的评分权重。值越高，对慢分支的惩罚越重。 |
| `write_decision_log` | bool | `true` | 启用后，每次 CTE 决策会通过 `tracing::info!` 输出结构化日志。 |
| `write_metrics` | bool | `true` | 启用后，收集 CTE 性能指标（命中率、延迟等）。 |

### 策略参数 (`[causal_tree.policy]`)

| 参数 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `max_branches` | usize | `3` | 展开器每次请求生成的最大候选分支数。 |
| `commit_threshold` | f32 | `0.62` | 提交分支所需的最低综合分数。低于此分数的分支将被拒绝。 |
| `extra_token_ratio_limit` | f32 | `0.35` | CTE 额外消耗的 Token 与基准请求 Token 的最大比率。超过此值触发降级。 |
| `extra_latency_budget_ms` | u64 | `300` | CTE 管线允许增加的最大延迟（毫秒）。 |
| `rehearsal_timeout_ms` | u64 | `5000` | 单次预演运行的超时时间（毫秒）。 |
| `default_side_effect_mode` | string | `"read_only"` | 预演的副作用模式。可选值：`"read_only"`、`"dry_run"`、`"live"`。 |
| `circuit_breaker_threshold` | u32 | `5` | CTE 连续失败多少次后触发熔断器。 |
| `circuit_breaker_cooldown_secs` | u64 | `60` | 熔断器保持开启状态的持续时间（秒），之后允许重试。 |

### 评分权重

三个评分权重（`w_confidence`、`w_cost`、`w_latency`）之和应为 `1.0`。每个分支的综合分数计算公式：

```
score = w_confidence * confidence - w_cost * normalized_cost - w_latency * normalized_latency
```

**调优建议：**

- **成本敏感** — 提高 `w_cost`（如 `0.40`），降低 `w_confidence`（如 `0.40`）
- **延迟敏感** — 提高 `w_latency`（如 `0.40`）
- **质量优先** — 提高 `w_confidence`（如 `0.70`），降低其他权重

### 副作用模式

| 模式 | 描述 |
|------|------|
| `read_only` | 预演不能执行任何写操作。最安全的选项。 |
| `dry_run` | 预演模拟写操作但不持久化。 |
| `live` | 预演可以执行真实写操作。谨慎使用。 |

## 最简配置

仅启用 CTE，使用全部默认值：

```toml
[causal_tree]
enabled = true
```

## 相关页面

- [因果树引擎概述](./)
- [完整配置参考](/zh/prx/config/reference)
