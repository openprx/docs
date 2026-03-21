---
title: Reranking Models
description: Reranking models supported by PRX-Memory, including Jina, Cohere, and Pinecone providers.
---

# Reranking Models

PRX-Memory supports multiple reranking providers through the `prx-memory-rerank` crate. Each provider implements the same adapter trait, allowing seamless switching.

## Jina AI

Jina offers cross-encoder reranking models with multilingual support.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| Model | Notes |
|-------|-------|
| `jina-reranker-v2-base-multilingual` | Multilingual cross-encoder |
| `jina-reranker-v1-base-en` | English-optimized |

::: info
Jina reranking can use the same API key as Jina embedding. Set `JINA_API_KEY` once to cover both.
:::

## Cohere

Cohere provides high-quality reranking through their Rerank API.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| Model | Notes |
|-------|-------|
| `rerank-v3.5` | Latest model, best quality |
| `rerank-english-v3.0` | English-optimized |
| `rerank-multilingual-v3.0` | Multilingual support |

## Pinecone

Pinecone offers reranking as part of their inference API.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

For custom Pinecone-compatible endpoints:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## Choosing a Reranker

| Priority | Recommended Provider | Model |
|----------|---------------------|-------|
| Best quality | Cohere | `rerank-v3.5` |
| Multilingual | Jina | `jina-reranker-v2-base-multilingual` |
| Integrated with Pinecone | Pinecone | `bge-reranker-v2-m3` |
| No reranking needed | -- | `PRX_RERANK_PROVIDER=none` |

## Combining Embedding and Reranking

A common high-quality configuration pairs Jina embeddings with Cohere reranking:

```bash
# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

This setup leverages Jina's fast multilingual embeddings for broad retrieval and Cohere's high-precision reranker for final ordering.

## Next Steps

- [Embedding Models](../embedding/models) -- First-stage embedding model options
- [Configuration Reference](../configuration/) -- All environment variables
