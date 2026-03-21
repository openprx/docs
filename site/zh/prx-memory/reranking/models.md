---
title: 重排序模型
description: PRX-Memory 支持的重排序模型，包括 Jina、Cohere 和 Pinecone 供应商。
---

# 重排序模型

PRX-Memory 通过 `prx-memory-rerank` crate 支持多个重排序供应商。每个供应商都实现相同的适配器 trait，允许无缝切换。

## Jina AI

Jina 提供支持多语言的交叉编码器重排序模型。

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| 模型 | 备注 |
|------|------|
| `jina-reranker-v2-base-multilingual` | 多语言交叉编码器 |
| `jina-reranker-v1-base-en` | 英语优化 |

::: info
Jina 重排序可以使用与 Jina 嵌入相同的 API 密钥。设置一次 `JINA_API_KEY` 即可覆盖两者。
:::

## Cohere

Cohere 通过其 Rerank API 提供高质量的重排序。

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| 模型 | 备注 |
|------|------|
| `rerank-v3.5` | 最新模型，最佳质量 |
| `rerank-english-v3.0` | 英语优化 |
| `rerank-multilingual-v3.0` | 多语言支持 |

## Pinecone

Pinecone 作为其推理 API 的一部分提供重排序。

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

对于自定义 Pinecone 兼容端点：

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## 选择重排器

| 优先级 | 推荐供应商 | 模型 |
|--------|-----------|------|
| 最佳质量 | Cohere | `rerank-v3.5` |
| 多语言 | Jina | `jina-reranker-v2-base-multilingual` |
| 与 Pinecone 集成 | Pinecone | `bge-reranker-v2-m3` |
| 不需要重排序 | -- | `PRX_RERANK_PROVIDER=none` |

## 组合嵌入和重排序

一个常见的高质量配置是将 Jina 嵌入与 Cohere 重排序配对：

```bash
# 嵌入
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# 重排序
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

这种设置利用 Jina 快速的多语言嵌入进行广泛检索，并利用 Cohere 高精度的重排器进行最终排序。

## 下一步

- [嵌入模型](../embedding/models) -- 第一阶段嵌入模型选项
- [配置参考](../configuration/) -- 所有环境变量
