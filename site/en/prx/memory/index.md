---
title: Memory System
description: Overview of the PRX memory system with 5 storage backends for persistent agent context.
---

# Memory System

PRX provides a flexible memory system that allows agents to persist and recall context across conversations. The memory system supports 5 storage backends, each optimized for different deployment scenarios.

## Overview

The memory system serves three primary functions:

- **Recall** -- retrieve relevant past interactions and facts before each LLM call
- **Store** -- persist important information extracted from conversations
- **Compact** -- summarize and compress old memories to fit within context limits

## Storage Backends

| Backend | Persistence | Search | Best For |
|---------|------------|--------|----------|
| [Markdown](./markdown) | File-based | Full-text grep | Single-user CLI, version-controlled memory |
| [SQLite](./sqlite) | Local database | FTS5 full-text | Local deployments, small teams |
| [PostgreSQL](./postgres) | Remote database | pg_trgm + FTS | Multi-user server deployments |
| [Embeddings](./embeddings) | Vector store | Semantic similarity | RAG-style retrieval, large knowledge bases |
| In-memory | None (session only) | Linear scan | Ephemeral sessions, testing |

## Configuration

Select and configure the memory backend in `config.toml`:

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## Memory Lifecycle

1. **Extraction** -- after each conversation turn, the system extracts key facts
2. **Deduplication** -- new facts are compared against existing memories
3. **Storage** -- unique facts are persisted to the configured backend
4. **Recall** -- before each LLM call, relevant memories are retrieved
5. **Hygiene** -- periodic maintenance compacts and prunes stale entries

## Related Pages

- [Markdown Backend](./markdown)
- [SQLite Backend](./sqlite)
- [PostgreSQL Backend](./postgres)
- [Embeddings Backend](./embeddings)
- [Memory Hygiene](./hygiene)
