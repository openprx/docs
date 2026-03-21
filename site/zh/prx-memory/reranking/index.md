---
title: 重排序引擎
description: PRX-Memory 重排序引擎概述，如何提高检索精度以及支持的重排序供应商。
---

# 重排序引擎

重排序是一个可选的第二阶段检索步骤，使用专用的交叉编码器模型对候选结果进行重新排序。虽然基于嵌入的检索速度快，但它基于预计算的向量运作，可能无法捕获细粒度的相关性。重排序对较小的候选集应用更强大的模型，显著提高精度。

## 工作原理

1. **第一阶段（检索）：** 向量相似度搜索返回广泛的候选集（例如，前 50 个）。
2. **第二阶段（重排序）：** 交叉编码器模型对每个候选项与查询进行评分，产生精细排序。
3. **最终结果：** 返回重排序后的 top-k 结果。

```mermaid
graph LR
    QUERY["召回查询"] --> EMBED["嵌入搜索<br/>前 50 个候选"]
    EMBED --> RERANK["重排器<br/>交叉编码器评分"]
    RERANK --> RESULTS["重排序后的 Top-K"]
```

## 为什么重排序很重要

| 指标 | 无重排序 | 有重排序 |
|------|---------|---------|
| 召回覆盖率 | 高（广泛检索） | 相同（不变） |
| Top-5 精度 | 中等 | 显著提升 |
| 延迟 | 较低（~50ms） | 较高（额外 ~150ms） |
| API 成本 | 仅嵌入 | 嵌入 + 重排序 |

重排序在以下场景最有价值：

- 记忆数据库较大（1000+ 条）。
- 查询是模糊的或自然语言形式。
- 结果列表顶部的精度比延迟更重要。

## 支持的供应商

| 供应商 | 配置值 | 说明 |
|--------|-------|------|
| Jina | `PRX_RERANK_PROVIDER=jina` | Jina AI 重排器模型 |
| Cohere | `PRX_RERANK_PROVIDER=cohere` | Cohere 重排 API |
| Pinecone | `PRX_RERANK_PROVIDER=pinecone` | Pinecone 重排服务 |
| Pinecone 兼容 | `PRX_RERANK_PROVIDER=pinecone-compatible` | 自定义 Pinecone 兼容端点 |
| 无 | `PRX_RERANK_PROVIDER=none` | 禁用重排序 |

## 配置

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

::: tip 供应商备用密钥
如果未设置 `PRX_RERANK_API_KEY`，系统会回退到供应商专用密钥：
- Jina：`JINA_API_KEY`
- Cohere：`COHERE_API_KEY`
- Pinecone：`PINECONE_API_KEY`
:::

## 禁用重排序

要在不使用重排序的情况下运行，省略 `PRX_RERANK_PROVIDER` 变量或显式设置：

```bash
PRX_RERANK_PROVIDER=none
```

召回仍然使用词法匹配和向量相似度，不经过重排序阶段。

## 下一步

- [重排序模型](./models) -- 详细的模型对比
- [嵌入引擎](../embedding/) -- 第一阶段检索
- [配置参考](../configuration/) -- 所有环境变量
