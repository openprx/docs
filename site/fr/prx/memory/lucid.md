---
title: Lucid.so Memory Backend
description: Cloud-based AI-powered memory layer using le Lucid.so external service.
---

# Lucid.so Memory Backend

Le backend Lucid connecte PRX a [Lucid.so](https://lucid.so), un service de memoire alimente par l'IA qui fournit managed storage, semantic search, and automatic memory organization. It serves comme unn alternative vers le local SQLite and PostgreSQL backends for teams that prefer a hosted solution.

## Apercu

Lucid.so is a cloud-hosted memory platform designed for AI agents. It handles:

- Persistent memory storage avec unutomatic deduplication
- Semantic search powered by hosted embedding models
- Automatic topic clustering and memory organization
- Cross-session memory sharing a travers plusieurs agent instances
- Memory lifecycle management with configurable retention policies

Unlike the local backends (SQLite, PostgreSQL), Lucid necessite no database management. Memories are stocke dans Lucid's infrastructure and accessed via their REST API.

## When to Use Lucid

| Scenario | Recommended Backend |
|----------|-------------------|
| Single-user local agent | SQLite |
| Multi-user on-premise deployment | PostgreSQL |
| Cloud-first team, minimal ops overhead | **Lucid** |
| Cross-device memory sharing | **Lucid** |
| Air-gapped or offline environments | SQLite or PostgreSQL |
| Full control over data residency | SQLite or PostgreSQL |

## Prerequis

- A Lucid.so account (sign up at [lucid.so](https://lucid.so))
- An API key depuis le Lucid dashboard
- A espace de travail ID (created automatically a la premiere utilisation, or specify an existing one)

## Quick Setup

### 1. Obtain API Credentials

1. Sign in vers le [Lucid Dashboard](https://app.lucid.so)
2. Navigate to "Settings" then "API Keys"
3. Create un nouveau API key with "Memory Read/Write" permissions
4. Copy l'API key and your espace de travail ID

### 2. Configure

```toml
[memory]
backend = "lucid"

[memory.lucid]
api_key = "luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
workspace_id = "ws_abc123"
```

### 3. Verify

```bash
prx doctor memory
```

Cela teste la connectivite avec l'API Lucid et verifie que la cle API dispose des permissions requises.

## Configuration Reference

| Champ | Type | Defaut | Description |
|-------|------|---------|-------------|
| `api_key` | `String` | *required* | Lucid.so API key with memory read/write permissions |
| `espace de travail_id` | `String` | *auto-created* | Workspace ID for memory isolation. Omit to auto-create a la premiere utilisation |
| `base_url` | `String` | `"https://api.lucid.so/v1"` | Lucid API base URL. Override for self-hosted or regional endpoints |
| `timeout_secs` | `u64` | `30` | HTTP request timeout in seconds |
| `max_retries` | `u32` | `3` | Maximum retry attempts for transient failures |
| `retry_backoff_ms` | `u64` | `500` | Initial backoff delay between retries (exponential) |
| `batch_size` | `usize` | `50` | Number of memories to send per batch write request |
| `top_k` | `usize` | `10` | Defaut number of results to retour for recall interroge |
| `similarity_threshold` | `f64` | `0.5` | Minimum similarity score (0.0--1.0) for recall results |
| `auto_topics` | `bool` | `true` | Enable Lucid's automatic topic clustering |
| `retention_days` | `u64` | `0` | Auto-delete memories older than N days. 0 = keep forever |

## Fonctionnement

### Memory Storage

When l'agent stocke a memory, PRX envoie it vers le Lucid API:

1. Le texte et les metadonnees du souvenir sont envoyes dans une requete POST to `/memories`
2. Lucid embeds the text using its hosted embedding model
3. Le souvenir est indexe pour la recherche par mots-cles et semantique
4. If `auto_topics` est active, Lucid assigns topic labels automatically

### Memory Recall

When l'agent needs context, PRX interroge Lucid:

1. The current conversation context is sent comme un recall query
2. Lucid performs a hybrid search (semantic similarity + keyword matching)
3. Results are ranked by relevance and filtered by `similarity_threshold`
4. Les K meilleurs resultats sont retournes avec leur texte, metadonnees et scores de pertinence

### Memory Organization

Lucid provides server-side memory management:

- **Deduplication** -- near-duplicate memories are merged automatically
- **Topic clustering** -- memories are grouped into topics without manual categorization
- **Compaction** -- old or low-relevance memories peut etre summarized and consolidated
- **Retention** -- expired memories are purged according to `retention_days`

## Comparison with Local Backends

| Feature | SQLite | PostgreSQL | Lucid |
|---------|--------|-----------|-------|
| Setup complexity | Aucun | Moderate | Minimal (API key) |
| Data residency | Local | Self-hosted | Cloud (Lucid servers) |
| Semantic search | Via embeddings add-on | Via pgvector add-on | Built-in |
| Auto-deduplication | Non | Non | Oui |
| Auto-topic clustering | Non | Non | Oui |
| Cross-device sharing | Non | Oui (network) | Oui (cloud) |
| Offline operation | Oui | Oui | Non |
| Cost | Free | Free (self-hosted) | Free tier + paid plans |
| Scalability | ~100K memories | Millions | Millions (managed) |

## Environment Variables

For CI/CD or containerized deployments, credentials peut etre set via variables d'environnement:

```bash
export PRX_MEMORY_LUCID_API_KEY="luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export PRX_MEMORY_LUCID_WORKSPACE_ID="ws_abc123"
```

Environment variables take precedence over config file values.

## Error Handling

The Lucid backend handles transient errors gracefully:

- **Network failures** -- retried jusqu'a `max_retries` times with exponential backoff
- **Rate limiting** -- 429 responses trigger automatic backoff en utilisant le `Retry-After` header
- **Authenticatien cas d'erreurs** -- logged as errors; l'agent continues without memory plutot que crashing
- **Timeout** -- requests exceeding `timeout_secs` are cancelled and retried

When Lucid is unreachable, PRX degrades gracefully: l'agent opere without memory recall until connectivity is restored. Non memories are lost -- pending writes are queued et flushed when la connexion recovers.

## Limiteations

- Requires internet connectivity; not suitable for air-gapped environments
- Memory data is stored on Lucid's infrastructure; review their data processing agreement for compliance
- The free tier has storage and query limits (check Lucid's pricing page for current details)
- Latency is higher than local backends en raison de network round-trips (typically 50--200ms per query)
- Self-hosted Lucid deployments require un separe license

## Depannage

### "Authentication failed" error

- Verify l'API key is correct and has not been revoked in the Lucid dashboard
- Ensure l'API key has "Memory Read/Write" permissions
- Verifiez que the `base_url` points vers le correct Lucid endpoint

### Memory recall retours no results

- Verifiez que memories ont ete stored by checking the Lucid dashboard
- Lower the `similarity_threshold` (e.g., to `0.3`) to see if results are being filtered
- Verifiez que the `espace de travail_id` matches the espace de travail where memories were stored

### High latency on recall queries

- Reduce `top_k` to retour fewer results per query
- Check your network latency vers le Lucid API endpoint
- Consider using a regional `base_url` if Lucid offers endpoints closer to your deployment

### Memories are not persisting across sessions

- Confirm that `backend = "lucid"` is set in the `[memory]` section
- Verify the `espace de travail_id` is consistent pour tous les agent instances
- Check PRX logs for write errors that may indicate failed persistence

## Voir aussi Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite) -- local single-file alternative
- [PostgreSQL Backend](./postgres) -- self-hosted multi-user alternative
- [Embeddings Backend](./embeddings) -- local vector-based semantic memory
- [Memory Hygiene](./hygiene) -- compaction and cleanup strategies
