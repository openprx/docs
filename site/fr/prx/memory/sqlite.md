---
title: SQLite Memory Backend
description: Local database memory storage using SQLite with FTS5 full-text search.
---

# SQLite Memory Backend

The SQLite backend stocke memories in a local SQLite database with FTS5 full-text search indexing. This provides structured storage with fast retrieval tandis que keeping everything local.

## Apercu

SQLite is la valeur par defaut backend memoire for PRX. It offers a good balance of performance, features, and simplicity:

- Full-text search via FTS5 extension
- ACID transactions for reliable writes
- Zero configuration (single file database)
- Efficient for jusqu'a tens of thousands of memory entries

## Schema

The SQLite backend uses les elements suivants core tables:

- `memories` -- stocke individual memory entries with metadata
- `memories_fts` -- FTS5 virtual table for full-text search
- `topics` -- topic categorization for memory organization

## Configuration

```toml
[memory]
backend = "sqlite"

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"
journal_mode = "wal"
busy_timeout_ms = 5000
```

## Full-Text Search

The FTS5 index enables ranked full-text search pour tous les memory entries. Queries support:

- Boolean operators (AND, OR, NOT)
- Phrase matching with quotes
- Prefix matching avec unsterisk
- Column-specific search

## Voir aussi Pages

- [Memory System Overview](./)
- [PostgreSQL Backend](./postgres) -- for multi-user deployments
- [Memory Hygiene](./hygiene)
