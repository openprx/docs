---
title: PostgreSQL Memory Backend
description: Remote database memory storage using PostgreSQL for multi-user server deployments.
---

# PostgreSQL Memory Backend

The PostgreSQL backend stores memories in a remote PostgreSQL database, enabling shared memory across multiple users and agent instances. This is the recommended backend for server deployments.

## Overview

The PostgreSQL backend provides:

- Shared memory across multiple PRX instances
- Full-text search via `tsvector` and `pg_trgm`
- Row-level security for multi-tenant isolation
- Horizontal scalability for large deployments

## Configuration

```toml
[memory]
backend = "postgres"

[memory.postgres]
url = "postgresql://prx:password@localhost:5432/prx_memory"
max_connections = 5
schema = "memory"
```

## Multi-User Isolation

When multiple users share a PostgreSQL memory backend, each user's memories are isolated by user ID. The backend uses parameterized queries for all operations to prevent SQL injection.

## Migration

The PostgreSQL backend includes automatic schema migrations that run on startup. No manual migration steps are required.

## Related Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite) -- for local deployments
- [Memory Hygiene](./hygiene)
