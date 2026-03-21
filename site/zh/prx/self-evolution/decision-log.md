---
title: 决策日志
description: PRX 自进化系统的决策记录机制，追踪每次进化操作的推理、结果和回滚信息。
---

# 决策日志

自进化系统中的每个提案和操作都会生成详细的决策日志。决策日志记录了系统为何做出特定变更、变更的效果如何、以及是否需要回滚，为运维和调试提供完整的可追溯性。

## 概述

决策日志服务于三个核心目的：

- **透明性** -- 完整记录每次进化决策的推理过程，解释"为什么"
- **可追溯性** -- 将每次变更与其提案、审批和执行结果关联
- **可逆性** -- 保存足够的信息以支持精确回滚到任意历史状态

## 日志内容

每条决策日志包含以下结构化信息：

### 决策记录结构

```json
{
  "decision_id": "evo_2026032101_001",
  "timestamp": "2026-03-21T08:00:00Z",
  "layer": "L2",
  "phase": "executed",
  "proposal": {
    "title": "优化代码分析提示词",
    "description": "基于近 7 天对话分析，代码审查场景中用户满意度评分低于基线。提议调整系统提示词以改善代码建议的具体性。",
    "trigger": "scheduled",
    "data_points": 342,
    "confidence": 0.78
  },
  "analysis": {
    "baseline_metric": 0.72,
    "expected_improvement": 0.08,
    "risk_assessment": "low",
    "conflict_check": "passed",
    "invariants_verified": true
  },
  "execution": {
    "applied_at": "2026-03-21T08:01:23Z",
    "snapshot_id": "snap_20260321_080000",
    "changes": [
      {
        "type": "prompt_update",
        "target": "system_prompt.code_review",
        "diff": "- Provide general code suggestions\n+ Provide specific, actionable code suggestions with examples"
      }
    ]
  },
  "outcome": {
    "monitored_until": "2026-03-22T08:01:23Z",
    "final_metric": 0.79,
    "improvement": 0.07,
    "status": "confirmed",
    "rollback_triggered": false
  }
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `decision_id` | String | 唯一决策标识符 |
| `timestamp` | String | 决策生成时间（UTC） |
| `layer` | String | 进化层级：`L1` / `L2` / `L3` |
| `phase` | String | 当前阶段：`proposed` / `approved` / `executed` / `confirmed` / `rolled_back` |
| `proposal` | Object | 提案详情（标题、描述、触发器、置信度） |
| `analysis` | Object | 分析结果（基线、预期提升、风险评估） |
| `execution` | Object | 执行信息（时间、快照 ID、变更内容） |
| `outcome` | Object | 结果（监控期、最终指标、是否回滚） |

## 决策阶段流转

```
proposed → approved → executed → confirmed
    │          │          │
    ▼          ▼          ▼
 rejected   rejected   rolled_back
```

每个阶段转换都会追加一条日志记录，完整保留决策的生命周期。

## 日志格式

决策日志以 JSON Lines 格式存储在数据目录中：

```
~/.local/share/openprx/evolution/decisions.jsonl
```

每行一条完整的决策记录。日志文件按月自动轮转。

## 配置

```toml
[self_evolution.decision_log]
enabled = true
log_path = "evolution/decisions.jsonl"
retention_days = 365
include_diffs = true
include_snapshots = true
max_log_size_mb = 500
```

### 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `enabled` | bool | `true` | 启用决策日志（自进化开启时默认启用） |
| `log_path` | String | `"evolution/decisions.jsonl"` | 日志文件路径（相对于 PRX 数据目录） |
| `retention_days` | u32 | `365` | 日志保留天数 |
| `include_diffs` | bool | `true` | 是否在日志中包含变更的 diff 内容 |
| `include_snapshots` | bool | `true` | 是否记录回滚快照的引用 |
| `max_log_size_mb` | u64 | `500` | 单个日志文件最大大小（MB），超出后轮转 |

## 查询与分析

### CLI 查询

```bash
# 查看最近的决策日志
prx evolution decisions --tail 10

# 按层级过滤
prx evolution decisions --layer L2

# 按状态过滤
prx evolution decisions --status rolled_back

# 按时间范围
prx evolution decisions --since "2026-03-01" --until "2026-03-21"

# 查看特定决策详情
prx evolution decision evo_2026032101_001

# 导出决策历史
prx evolution decisions --export decisions-q1.json
```

### 分析决策趋势

```bash
# 查看各层级的决策统计
prx evolution stats

# 输出示例:
# Layer  | Total | Confirmed | Rolled Back | Rejected
# -------|-------|-----------|-------------|--------
# L1     | 142   | 139       | 3           | 0
# L2     | 28    | 22        | 4           | 2
# L3     | 5     | 3         | 1           | 1
```

## 回滚决策

当决策日志记录了 `rolled_back` 状态时，包含完整的回滚信息：

```json
{
  "outcome": {
    "status": "rolled_back",
    "rollback_triggered": true,
    "rollback_reason": "regression_detected",
    "rollback_details": {
      "metric_name": "user_satisfaction",
      "threshold": 0.1,
      "actual_degradation": 0.15,
      "restored_snapshot": "snap_20260321_080000",
      "rolled_back_at": "2026-03-22T04:30:00Z"
    }
  }
}
```

### 手动回滚

基于决策日志中的快照 ID 可以手动回滚到任意历史状态：

```bash
# 回滚最近一次变更
prx evolution rollback

# 回滚到特定快照
prx evolution rollback --snapshot snap_20260321_080000

# 回滚特定决策
prx evolution rollback --decision evo_2026032101_001
```

## 与审计日志的关系

决策日志专注于自进化决策，而[审计日志](/zh/prx/security/audit)覆盖所有安全事件。两者通过 `decision_id` 关联：

- 审计日志中的 `evolution.proposed` / `evolution.applied` / `evolution.rollback` 事件包含对应的 `decision_id`
- 可通过 `decision_id` 在两个日志系统间交叉查询

## 相关文档

- [自进化概览](./)
- [进化流水线](./pipeline) -- 四阶段流水线详解
- [安全与回滚](./safety) -- 回滚保护和完整性检查
- [实验追踪与适应度](./experiments) -- A/B 测试和指标评估
- [审计日志](/zh/prx/security/audit) -- 全局安全事件追踪
