---
title: LLM 路由器
description: PRX 智能 LLM 路由器概览，用于模型选择、成本优化和质量平衡。
---

# LLM 路由器

PRX 路由器是一个智能模型选择系统，为每个请求自动选择最佳的 LLM 提供商和模型。它使用多种路由策略平衡质量、成本和延迟。

## 概述

路由器根据以下因素从配置的模型中动态选择，而不是始终使用单一模型：

- 查询复杂度和类型
- 模型能力评分和 Elo 排名
- 成本约束
- 延迟要求
- 历史性能数据

## 路由策略

| 策略 | 描述 | 最适场景 |
|------|------|---------|
| [启发式](./heuristic) | 基于查询特征的规则评分 | 简单设置，行为可预测 |
| [KNN](./knn) | 与历史成功查询的语义相似度 | 学习型路由，高准确率 |
| [Automix](./automix) | 先用便宜模型，低置信度时升级 | 成本优化 |

## 配置

```toml
[router]
enabled = true
strategy = "heuristic"  # "heuristic" | "knn" | "automix"
default_model = "anthropic/claude-sonnet-4-6"

[router.models]
cheap = "anthropic/claude-haiku"
standard = "anthropic/claude-sonnet-4-6"
premium = "anthropic/claude-opus-4-6"
```

## 相关页面

- [启发式路由](./heuristic)
- [KNN 路由](./knn)
- [Automix 路由](./automix)
- [LLM 提供商](/zh/prx/providers/)
