---
title: Configuration Reference
description: Complete reference for all PRX-Memory environment variables covering transport, storage, embedding, reranking, governance, and observability.
---

# Configuration Reference

PRX-Memory is configured entirely through environment variables. This page documents every variable grouped by category.

## Transport

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | Server transport mode |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | HTTP server bind address |

## Storage

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | Storage backend |
| `PRX_MEMORY_DB` | file/directory path | -- | Database file or directory path |

## Embedding

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | -- | Embedding provider |
| `PRX_EMBED_API_KEY` | API key string | -- | Embedding provider API key |
| `PRX_EMBED_MODEL` | model name | provider-specific | Embedding model name |
| `PRX_EMBED_BASE_URL` | URL | provider-specific | Custom API endpoint URL |

### Provider Fallback Keys

If `PRX_EMBED_API_KEY` is not set, the system checks these provider-specific keys:

| Provider | Fallback Key |
|----------|-------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## Reranking

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | Rerank provider |
| `PRX_RERANK_API_KEY` | API key string | -- | Rerank provider API key |
| `PRX_RERANK_MODEL` | model name | provider-specific | Rerank model name |
| `PRX_RERANK_ENDPOINT` | URL | provider-specific | Custom rerank endpoint |
| `PRX_RERANK_API_VERSION` | version string | -- | API version (pinecone-compatible only) |

### Provider Fallback Keys

If `PRX_RERANK_API_KEY` is not set, the system checks these provider-specific keys:

| Provider | Fallback Key |
|----------|-------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## Standardization

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | Standardization profile |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | tag string | `prx-memory` | Default project tag |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | tag string | `mcp` | Default tool tag |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | tag string | `general` | Default domain tag |

## Streaming Sessions

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | milliseconds | `300000` | Stream session time-to-live |

## Observability

### Cardinality Controls

| Variable | Default | Description |
|----------|---------|-------------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | Max distinct scope labels in metrics |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | Max distinct category labels in metrics |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | Max distinct rerank provider labels |

### Alert Thresholds

| Variable | Default | Description |
|----------|---------|-------------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | Tool error ratio warning threshold |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | Tool error ratio critical threshold |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | Remote warning ratio warning threshold |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | Remote warning ratio critical threshold |

## Example: Minimal Configuration

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## Example: Full Production Configuration

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## Next Steps

- [Installation](../getting-started/installation) -- Build and install PRX-Memory
- [MCP Integration](../mcp/) -- Configure your MCP client
- [Troubleshooting](../troubleshooting/) -- Common configuration issues
