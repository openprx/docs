---
title: Supported Embedding Models
description: Embedding models supported by PRX-Memory, including OpenAI-compatible, Jina, and Gemini providers with configuration details.
---

# Supported Embedding Models

PRX-Memory supports three embedding provider families. Each provider connects through the `prx-memory-embed` crate's unified adapter interface.

## OpenAI-Compatible

Any API that follows the OpenAI embedding endpoint format (`/v1/embeddings`) can be used. This includes OpenAI itself, Azure OpenAI, and local inference servers.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optional
```

| Model | Dimensions | Notes |
|-------|-----------|-------|
| `text-embedding-3-small` | 1536 | Good balance of quality and cost |
| `text-embedding-3-large` | 3072 | Highest quality, higher cost |
| `text-embedding-ada-002` | 1536 | Legacy model |

::: tip Local Inference
For privacy-sensitive deployments, point `PRX_EMBED_BASE_URL` to a local inference server running an open-source embedding model (e.g., via Ollama, vLLM, or text-embeddings-inference).
:::

## Jina AI

Jina provides high-quality multilingual embedding models optimized for retrieval tasks.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| Model | Dimensions | Notes |
|-------|-----------|-------|
| `jina-embeddings-v3` | 1024 | Latest multilingual model |
| `jina-embeddings-v2-base-en` | 768 | English-optimized |
| `jina-embeddings-v2-base-code` | 768 | Code-optimized |

::: info Fallback Key
If `PRX_EMBED_API_KEY` is not set, the system checks `JINA_API_KEY` as a fallback.
:::

## Google Gemini

Gemini embedding models are available through the Google AI API.

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| Model | Dimensions | Notes |
|-------|-----------|-------|
| `text-embedding-004` | 768 | Current recommended model |
| `embedding-001` | 768 | Legacy model |

::: info Fallback Key
If `PRX_EMBED_API_KEY` is not set, the system checks `GEMINI_API_KEY` as a fallback.
:::

## Choosing a Model

| Priority | Recommended Model | Provider |
|----------|-------------------|----------|
| Best quality | `text-embedding-3-large` | OpenAI-compatible |
| Best for code | `jina-embeddings-v2-base-code` | Jina |
| Multilingual | `jina-embeddings-v3` | Jina |
| Privacy / local | Any local model via `openai-compatible` | Self-hosted |
| Cost-effective | `text-embedding-3-small` | OpenAI-compatible |

## Switching Models

When switching embedding models, existing vectors become incompatible with the new model's vector space. Use the `memory_reembed` tool to re-embed all stored memories with the new model:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

::: warning
Re-embedding requires API calls for every stored memory. For large databases, this may take significant time and incur API costs. Plan re-embedding during low-usage periods.
:::

## Next Steps

- [Batch Processing](./batch-processing) -- Efficient bulk embedding
- [Reranking Models](../reranking/models) -- Second-stage reranking model options
- [Configuration Reference](../configuration/) -- All environment variables
