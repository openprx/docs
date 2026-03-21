---
title: 自进化系统
description: PRX 三层自进化系统概览，实现 Agent 自主改进。
---

# 自进化系统

PRX 包含一个三层自进化系统，使 Agent 能够随时间自主改善其行为。系统持续分析 Agent 性能并应用渐进式改进 -- 从记忆优化到提示词调优再到策略级策略变更。

## 概述

自进化分为三个层次，每个层次在不同的抽象级别上运作：

| 层级 | 范围 | 频率 | 风险 |
|------|------|------|------|
| [L1: 记忆](./l1-memory) | 记忆压缩、主题聚类 | 每次会话 | 低 |
| [L2: 提示词](./l2-prompt) | 系统提示词优化、A/B 测试 | 每天/每周 | 中 |
| [L3: 策略](./l3-strategy) | 工具策略、路由规则、治理调优 | 每周/每月 | 高 |

## 架构

```
┌───────────────────────────────────────┐
│           自进化引擎                    │
│                                        │
│  L3: 策略层    ← 低频率                 │
│    ├── 工具策略调优                     │
│    ├── 路由优化                         │
│    └── 治理参数调整                     │
│                                        │
│  L2: 提示词层  ← 中频率                 │
│    ├── 系统提示词精炼                   │
│    └── A/B 测试框架                     │
│                                        │
│  L1: 记忆层    ← 高频率                 │
│    ├── 记忆压缩                         │
│    └── 主题聚类                         │
└───────────────────────────────────────┘
```

## 安全优先

每个进化提案在执行前都会通过安全流水线。详见 [安全](./safety) 了解回滚保护和完整性检查。

## 配置

```toml
[self_evolution]
enabled = false  # 仅 opt-in
auto_apply = false  # 默认需要手动批准

[self_evolution.l1]
enabled = true
schedule = "after_session"

[self_evolution.l2]
enabled = false
schedule = "weekly"

[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
```

## 相关页面

- [L1: 记忆压缩](./l1-memory)
- [L2: 提示词优化](./l2-prompt)
- [L3: 策略调优](./l3-strategy)
- [进化流水线](./pipeline)
- [安全与回滚](./safety)
