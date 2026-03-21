---
title: SQLite Storage
description: Configure and tune the SQLite storage backend for PRX-Memory with vector columns and indexed queries.
---

# SQLite Storage

The SQLite backend provides a robust, file-based storage engine with ACID transactions, indexed queries, and built-in vector column support. It is the recommended backend for production deployments with up to 100,000 memories.

## Configuration

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

The database file is created automatically on first run. All tables, indexes, and vector columns are initialized by PRX-Memory.

## Schema Overview

The SQLite backend stores memories in a structured schema:

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Unique memory identifier |
| `text` | TEXT | Memory content |
| `scope` | TEXT | Memory scope (global, project, etc.) |
| `tags` | TEXT | JSON array of tags |
| `importance` | REAL | Importance score (0.0--1.0) |
| `created_at` | TEXT | ISO 8601 timestamp |
| `updated_at` | TEXT | ISO 8601 timestamp |
| `embedding` | BLOB | Vector embedding (if enabled) |
| `metadata` | TEXT | Additional JSON metadata |

## Vector Storage

When embedding is enabled, vector data is stored as BLOB columns in the same table as the memory entry. This co-location simplifies queries and avoids join overhead.

Vector similarity search uses brute-force cosine similarity computation over the stored vectors. For datasets under 100,000 entries, this provides sub-second query times (p95 under 123ms based on benchmarks).

## Maintenance

### Compaction

Over time, deletions and updates can leave fragmented space. Use `memory_compact` to reclaim space:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_compact",
    "arguments": {}
  }
}
```

### Backup

The SQLite database file can be backed up by simply copying the file while the server is stopped:

```bash
cp ./data/memory.db ./data/memory.db.backup
```

::: warning
Do not copy the database file while the server is running. SQLite uses write-ahead logging (WAL) and a file copy during writes may produce a corrupt backup. Stop the server first or use the `memory_export` tool for a safe export.
:::

### Migration from JSON

To migrate from the JSON backend to SQLite:

1. Export your memories using `memory_export`.
2. Change the backend configuration to SQLite.
3. Import the exported data using `memory_import`.

Or use the `memory_migrate` tool for a direct migration.

## Next Steps

- [Vector Search](./vector-search) -- How similarity search works internally
- [Storage Overview](./index) -- Compare all backends
- [Configuration Reference](../configuration/) -- All environment variables
