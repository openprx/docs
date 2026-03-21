---
title: Storage Backends
description: PRX-Memory storage backend overview, including JSON file-based storage, SQLite with vector extensions, and optional LanceDB.
---

# Storage Backends

PRX-Memory supports multiple storage backends for persisting memories and their vector embeddings. The `prx-memory-storage` crate provides a unified interface that all backends implement.

## Available Backends

| Backend | Config Value | Vector Support | Persistence | Best For |
|---------|-------------|----------------|-------------|----------|
| JSON | `json` | Embedded in entries | File-based | Development, small datasets |
| SQLite | `sqlite` | Built-in vector columns | File-based | Production, medium datasets |
| LanceDB | `lancedb` | Native vector index | Directory-based | Large datasets, fast ANN search |

::: tip Default Backend
The default backend is JSON (`PRX_MEMORY_BACKEND=json`), which requires no additional setup. For production deployments, SQLite is recommended.
:::

## JSON Backend

The simplest backend stores all memories in a single JSON file. It is ideal for development, testing, and small memory sets (under 10,000 entries).

```bash
PRX_MEMORY_BACKEND=json
PRX_MEMORY_DB=./data/memory-db.json
```

**Advantages:**
- Zero setup -- just specify a file path.
- Human-readable -- inspect and edit with any text editor.
- Portable -- copy the file to move your entire memory database.

**Limitations:**
- Entire file is loaded into memory on startup.
- Write operations rewrite the full file.
- No indexed vector search -- brute-force scan for similarity.

## SQLite Backend

SQLite provides ACID transactions, indexed queries, and built-in vector column support for efficient similarity search.

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

See [SQLite Storage](./sqlite) for detailed configuration.

## LanceDB Backend (Optional)

LanceDB provides native approximate nearest neighbor (ANN) vector search with columnar storage. Enable it with the `lancedb-backend` feature flag:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

```bash
PRX_MEMORY_BACKEND=lancedb
PRX_MEMORY_DB=./data/lancedb
```

::: warning Feature Flag Required
LanceDB support is not included in the default build. You must enable the `lancedb-backend` feature flag at compile time.
:::

## Choosing a Backend

| Scenario | Recommended Backend |
|----------|-------------------|
| Local development | JSON |
| Production with <100k entries | SQLite |
| Production with >100k entries | LanceDB |
| Need human-readable storage | JSON |
| Need ACID transactions | SQLite |
| Need fast ANN vector search | LanceDB |

## Storage Operations

PRX-Memory provides tools for storage maintenance:

| Tool | Description |
|------|-------------|
| `memory_export` | Export all memories to a portable format |
| `memory_import` | Import memories from an export |
| `memory_migrate` | Migrate between storage backends |
| `memory_compact` | Optimize storage and reclaim space |
| `memory_reembed` | Re-embed all memories with a new model |

## Next Steps

- [SQLite Storage](./sqlite) -- SQLite configuration and tuning
- [Vector Search](./vector-search) -- How vector similarity search works
- [Configuration Reference](../configuration/) -- All environment variables
