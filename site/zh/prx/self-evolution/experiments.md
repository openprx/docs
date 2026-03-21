---
title: 实验追踪与适应度
description: PRX 自进化系统的 A/B 测试框架、适应度评分模型和收敛判断机制。
---

# 实验追踪与适应度

PRX 自进化系统使用实验框架来验证变更效果。每个进化提案在正式采纳前都通过 A/B 测试评估，使用适应度评分量化效果，并基于统计收敛判断是否保留变更。

## 概述

实验追踪系统由三个核心组件构成：

- **A/B 测试引擎** -- 将流量分配到对照组和实验组，收集对比数据
- **适应度评分器** -- 基于多维指标计算提案的综合适应度分数
- **收敛判断器** -- 使用统计检验判断实验结果是否显著

## A/B 测试

### 工作原理

进化提案通过 A/B 测试验证效果。系统维护当前版本（对照组 A）和提案版本（实验组 B），将请求随机分配到两组：

```
用户请求
    │
    ├─── 50% ──► 对照组 A (当前版本)
    │                 │
    │                 ├─► 收集指标
    │                 │
    └─── 50% ──► 实验组 B (提案版本)
                      │
                      ├─► 收集指标
                      │
                      ▼
                 统计比较 → 判断收敛 → 采纳/回滚
```

### 流量分配

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `random` | 完全随机分配 | 默认，适合大多数场景 |
| `sticky` | 同一用户始终分配到同一组 | 需要一致体验时 |
| `gradual` | 实验组流量从小逐步增大 | 高风险变更，渐进验证 |

### 配置

```toml
[self_evolution.experiments]
enabled = true
traffic_split = 0.5
split_strategy = "random"
min_sample_size = 100
max_duration_hours = 168
auto_conclude = true
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `true` | 启用实验框架（自进化开启时默认启用） |
| `traffic_split` | f64 | `0.5` | 实验组流量比例（0.0 - 1.0） |
| `split_strategy` | String | `"random"` | 分配策略：`"random"` / `"sticky"` / `"gradual"` |
| `min_sample_size` | usize | `100` | 每组最少样本数才进行统计检验 |
| `max_duration_hours` | u64 | `168` | 实验最长持续时间（小时），超时自动结束 |
| `auto_conclude` | bool | `true` | 达到统计显著性时自动结束实验 |

## 适应度评分

适应度评分是一个综合指标，量化进化提案的整体效果。分数范围为 0.0（最差）到 1.0（最佳）。

### 评分维度

适应度由多个加权维度组合计算：

```
fitness = w1 × quality + w2 × efficiency + w3 × satisfaction + w4 × safety
```

| 维度 | 默认权重 | 指标来源 | 说明 |
|------|----------|----------|------|
| `quality` | 0.35 | 任务完成率、回答准确度 | Agent 输出质量 |
| `efficiency` | 0.25 | 平均响应时间、Token 消耗 | 资源利用效率 |
| `satisfaction` | 0.25 | 用户反馈信号、会话持续率 | 用户满意度 |
| `safety` | 0.15 | 策略违规率、错误率 | 安全与稳定性 |

### 指标采集

| 指标 | 类型 | 采集方式 |
|------|------|----------|
| `task_completion_rate` | f64 | 工具调用成功完成的比例 |
| `response_accuracy` | f64 | LLM 自评 + 用户反馈加权 |
| `avg_response_time_ms` | u64 | 从接收消息到发送回复的平均耗时 |
| `tokens_per_task` | f64 | 每次任务消耗的平均 Token 数 |
| `session_continue_rate` | f64 | 用户在同一会话中继续对话的比例 |
| `user_feedback_score` | f64 | 显式用户反馈（如 thumbs up/down） |
| `policy_violation_rate` | f64 | 策略引擎拒绝操作的频率 |
| `error_rate` | f64 | 工具执行和 LLM 调用的错误率 |

### 配置

```toml
[self_evolution.fitness]
quality_weight = 0.35
efficiency_weight = 0.25
satisfaction_weight = 0.25
safety_weight = 0.15
baseline_window_hours = 168
min_data_points = 50
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `quality_weight` | f64 | `0.35` | 质量维度权重 |
| `efficiency_weight` | f64 | `0.25` | 效率维度权重 |
| `satisfaction_weight` | f64 | `0.25` | 满意度维度权重 |
| `safety_weight` | f64 | `0.15` | 安全维度权重 |
| `baseline_window_hours` | u64 | `168` | 基线计算的时间窗口（小时） |
| `min_data_points` | usize | `50` | 计算适应度所需的最少数据点 |

## 收敛判断

实验需要在统计上显著才能做出采纳或拒绝的决策。PRX 使用以下方法判断收敛：

### 统计检验

- **Welch t-test** -- 比较两组适应度分数的均值差异
- **显著性水平** -- 默认 p-value 阈值为 0.05
- **效应量** -- 使用 Cohen's d 评估实际差异大小

### 收敛条件

实验在满足以下所有条件时自动结束：

1. 两组均达到最小样本量（`min_sample_size`）
2. p-value 低于显著性阈值
3. 效应量超过最小效应阈值

### 决策规则

| 条件 | 决策 |
|------|------|
| 实验组显著优于对照组 | 采纳提案（`confirmed`） |
| 实验组显著劣于对照组 | 拒绝提案并回滚（`rolled_back`） |
| 无显著差异且超时 | 拒绝提案（`rejected`，保守策略） |

### 配置

```toml
[self_evolution.convergence]
significance_level = 0.05
min_effect_size = 0.2
early_stop_on_regression = true
regression_threshold = -0.1
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `significance_level` | f64 | `0.05` | 统计显著性 p-value 阈值 |
| `min_effect_size` | f64 | `0.2` | 最小 Cohen's d 效应量 |
| `early_stop_on_regression` | bool | `true` | 检测到退化时提前终止实验 |
| `regression_threshold` | f64 | `-0.1` | 退化阈值，低于此值触发提前终止 |

## CLI 操作

```bash
# 查看正在运行的实验
prx evolution experiments --active

# 查看实验详情
prx evolution experiment exp_20260321_001

# 手动结束实验
prx evolution experiment exp_20260321_001 --conclude

# 查看适应度报告
prx evolution fitness --layer L2 --last 30d

# 查看收敛状态
prx evolution convergence exp_20260321_001
```

## 使用方法

### 启用实验追踪

确保自进化系统已开启：

```toml
[self_evolution]
enabled = true

[self_evolution.experiments]
enabled = true
```

### 观察实验进展

```bash
# 实时监控实验指标
prx evolution watch exp_20260321_001

# 查看两组的指标对比
prx evolution compare exp_20260321_001
```

### 调优建议

- **低流量场景** -- 增大 `max_duration_hours`，降低 `min_sample_size`
- **高风险变更** -- 使用 `gradual` 分配策略，设置较大的 `min_effect_size`
- **快速迭代** -- 降低 `significance_level` 到 0.1（接受更高的假阳性风险）

## 相关文档

- [自进化概览](./)
- [进化流水线](./pipeline) -- 四阶段流水线详解
- [决策日志](./decision-log) -- 决策记录与回滚
- [安全与回滚](./safety) -- 回滚保护和完整性检查
- [L2: 提示词优化](./l2-prompt) -- 提示词层进化（A/B 测试的主要用户）
