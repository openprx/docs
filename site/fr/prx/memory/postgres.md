---
title: PostgreSQL Memory Backend
description: Remote database memory storage using PostgreSQL for multi-user server deployments.
---

# PostgreSQL Memory Backend

The PostgreSQL backend stocke memories in a remote PostgreSQL database, enabling shared memory a travers plusieurs users and agent instances. This est le recommande backend for server deployments.

## Apercu

The PostgreSQL backend provides:

- Shared memory a travers plusieurs PRX instances
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

When multiple users share a PostgreSQL backend memoire, les souvenirs de chaque utilisateur sont isoles par ID utilisateur. Le backend uses parameterized interroge pour tous les operations pour empecher SQL injection.

## Migration

Le backend PostgreSQL inclut des migrations de schema automatiques qui s'executent au demarrage. Non manual migration steps are required.

## Voir aussi Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite) -- for local deployments
- [Memory Hygiene](./hygiene)
