---
title: Quick Start
description: Get PRX-Memory running in 5 minutes with stdio or HTTP transport, store your first memory, and recall it with semantic search.
---

# Quick Start

This guide walks you through building PRX-Memory, running the daemon, and performing your first store and recall operations.

## 1. Build the Daemon

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. Start the Server

### Option A: stdio Transport

For direct MCP client integration:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### Option B: HTTP Transport

For network access with health checks and metrics:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

Verify the server is running:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. Configure Your MCP Client

Add PRX-Memory to your MCP client configuration. For example, in Claude Code or Codex:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Replace `/path/to/prx-memory` with the actual path where you cloned the repository.
:::

## 4. Store a Memory

Send a `memory_store` tool call through your MCP client or directly via JSON-RPC:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. Recall Memories

Retrieve relevant memories using `memory_recall`:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

The system returns memories ranked by relevance using a combination of lexical matching, importance scoring, and recency.

## 6. Enable Semantic Search (Optional)

For vector-based semantic recall, configure an embedding provider:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

With embeddings enabled, recall queries use vector similarity in addition to lexical matching, significantly improving retrieval quality for natural language queries.

## 7. Enable Reranking (Optional)

Add a reranker to further improve retrieval precision:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## Available MCP Tools

| Tool | Description |
|------|-------------|
| `memory_store` | Store a new memory entry |
| `memory_recall` | Recall memories by query |
| `memory_update` | Update an existing memory |
| `memory_forget` | Delete a memory entry |
| `memory_export` | Export all memories |
| `memory_import` | Import memories from export |
| `memory_migrate` | Migrate storage format |
| `memory_reembed` | Re-embed memories with new model |
| `memory_compact` | Compact and optimize storage |
| `memory_evolve` | Evolve memory with holdout validation |
| `memory_skill_manifest` | Discover available skills |

## Next Steps

- [Embedding Engine](../embedding/) -- Explore embedding providers and batch processing
- [Reranking](../reranking/) -- Configure second-stage reranking
- [Storage Backends](../storage/) -- Choose between JSON and SQLite storage
- [Configuration Reference](../configuration/) -- All environment variables
