---
title: Automix 路由
description: 成本优化的 LLM 路由，先用便宜模型，低置信度时升级到高级模型。
---

# Automix 路由

Automix 路由器通过先用便宜模型处理每个查询来优化成本，只在初始响应的置信度低于阈值时才升级到高级模型。

## 工作原理

1. **初始查询** -- 将查询发送到便宜模型
2. **置信度检查** -- 评估响应的置信度分数
3. **按需升级** -- 如果置信度低于阈值，使用高级模型重新查询
4. **返回** -- 返回第一个有置信度的响应

## 置信度评分

置信度基于以下因素评估：

- 响应中自报的置信度
- 犹豫性语言的存在（"我不确定"、"可能是"）
- 响应的 token 级熵
- 工具调用成功率

## 配置

```toml
[router]
strategy = "automix"

[router.automix]
enabled = true
confidence_threshold = 0.7
cheap_model = "anthropic/claude-haiku"
premium_model = "anthropic/claude-opus-4-6"
max_escalations = 1
```

## 成本节省

在典型使用中，Automix 将 60-80% 的查询路由到便宜模型，在保持复杂查询质量的同时实现显著的成本节省。

## 相关页面

- [路由器概览](./)
- [启发式路由](./heuristic)
- [KNN 路由](./knn)
