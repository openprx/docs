---
title: Lucid.so Memory Backend
description: Cloud-based AI-powered memory layer using the Lucid.so external service.
---

# Lucid.so Memory Backend

The Lucid backend connects PRX to [Lucid.so](https://lucid.so), an AI-powered memory service that provides managed storage, semantic search, and automatic memory organization. It serves as an alternative to the local SQLite and PostgreSQL backends for teams that prefer a hosted solution.

## Overview

Lucid.so is a cloud-hosted memory platform designed for AI agents. It handles:

- Persistent memory storage with automatic deduplication
- Semantic search powered by hosted embedding models
- Automatic topic clustering and memory organization
- Cross-session memory sharing across multiple agent instances
- Memory lifecycle management with configurable retention policies

Unlike the local backends (SQLite, PostgreSQL), Lucid requires no database management. Memories are stored in Lucid's infrastructure and accessed via their REST API.

## When to Use Lucid

| Scenario | Recommended Backend |
|----------|-------------------|
| Single-user local agent | SQLite |
| Multi-user on-premise deployment | PostgreSQL |
| Cloud-first team, minimal ops overhead | **Lucid** |
| Cross-device memory sharing | **Lucid** |
| Air-gapped or offline environments | SQLite or PostgreSQL |
| Full control over data residency | SQLite or PostgreSQL |

## Prerequisites

- A Lucid.so account (sign up at [lucid.so](https://lucid.so))
- An API key from the Lucid dashboard
- A workspace ID (created automatically on first use, or specify an existing one)

## Quick Setup

### 1. Obtain API Credentials

1. Sign in to the [Lucid Dashboard](https://app.lucid.so)
2. Navigate to "Settings" then "API Keys"
3. Create a new API key with "Memory Read/Write" permissions
4. Copy the API key and your workspace ID

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

This tests connectivity to the Lucid API and verifies that the API key has the required permissions.

## Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `api_key` | `String` | *required* | Lucid.so API key with memory read/write permissions |
| `workspace_id` | `String` | *auto-created* | Workspace ID for memory isolation. Omit to auto-create on first use |
| `base_url` | `String` | `"https://api.lucid.so/v1"` | Lucid API base URL. Override for self-hosted or regional endpoints |
| `timeout_secs` | `u64` | `30` | HTTP request timeout in seconds |
| `max_retries` | `u32` | `3` | Maximum retry attempts for transient failures |
| `retry_backoff_ms` | `u64` | `500` | Initial backoff delay between retries (exponential) |
| `batch_size` | `usize` | `50` | Number of memories to send per batch write request |
| `top_k` | `usize` | `10` | Default number of results to return for recall queries |
| `similarity_threshold` | `f64` | `0.5` | Minimum similarity score (0.0--1.0) for recall results |
| `auto_topics` | `bool` | `true` | Enable Lucid's automatic topic clustering |
| `retention_days` | `u64` | `0` | Auto-delete memories older than N days. 0 = keep forever |

## How It Works

### Memory Storage

When the agent stores a memory, PRX sends it to the Lucid API:

1. The memory text and metadata are sent as a POST request to `/memories`
2. Lucid embeds the text using its hosted embedding model
3. The memory is indexed for both keyword and semantic search
4. If `auto_topics` is enabled, Lucid assigns topic labels automatically

### Memory Recall

When the agent needs context, PRX queries Lucid:

1. The current conversation context is sent as a recall query
2. Lucid performs a hybrid search (semantic similarity + keyword matching)
3. Results are ranked by relevance and filtered by `similarity_threshold`
4. The top-K results are returned with their text, metadata, and relevance scores

### Memory Organization

Lucid provides server-side memory management:

- **Deduplication** -- near-duplicate memories are merged automatically
- **Topic clustering** -- memories are grouped into topics without manual categorization
- **Compaction** -- old or low-relevance memories can be summarized and consolidated
- **Retention** -- expired memories are purged according to `retention_days`

## Comparison with Local Backends

| Feature | SQLite | PostgreSQL | Lucid |
|---------|--------|-----------|-------|
| Setup complexity | None | Moderate | Minimal (API key) |
| Data residency | Local | Self-hosted | Cloud (Lucid servers) |
| Semantic search | Via embeddings add-on | Via pgvector add-on | Built-in |
| Auto-deduplication | No | No | Yes |
| Auto-topic clustering | No | No | Yes |
| Cross-device sharing | No | Yes (network) | Yes (cloud) |
| Offline operation | Yes | Yes | No |
| Cost | Free | Free (self-hosted) | Free tier + paid plans |
| Scalability | ~100K memories | Millions | Millions (managed) |

## Environment Variables

For CI/CD or containerized deployments, credentials can be set via environment variables:

```bash
export PRX_MEMORY_LUCID_API_KEY="luc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export PRX_MEMORY_LUCID_WORKSPACE_ID="ws_abc123"
```

Environment variables take precedence over config file values.

## Error Handling

The Lucid backend handles transient errors gracefully:

- **Network failures** -- retried up to `max_retries` times with exponential backoff
- **Rate limiting** -- 429 responses trigger automatic backoff using the `Retry-After` header
- **Authentication errors** -- logged as errors; the agent continues without memory rather than crashing
- **Timeout** -- requests exceeding `timeout_secs` are cancelled and retried

When Lucid is unreachable, PRX degrades gracefully: the agent operates without memory recall until connectivity is restored. No memories are lost -- pending writes are queued and flushed when the connection recovers.

## Limitations

- Requires internet connectivity; not suitable for air-gapped environments
- Memory data is stored on Lucid's infrastructure; review their data processing agreement for compliance
- The free tier has storage and query limits (check Lucid's pricing page for current details)
- Latency is higher than local backends due to network round-trips (typically 50--200ms per query)
- Self-hosted Lucid deployments require a separate license

## Troubleshooting

### "Authentication failed" error

- Verify the API key is correct and has not been revoked in the Lucid dashboard
- Ensure the API key has "Memory Read/Write" permissions
- Check that the `base_url` points to the correct Lucid endpoint

### Memory recall returns no results

- Verify that memories have been stored by checking the Lucid dashboard
- Lower the `similarity_threshold` (e.g., to `0.3`) to see if results are being filtered
- Check that the `workspace_id` matches the workspace where memories were stored

### High latency on recall queries

- Reduce `top_k` to return fewer results per query
- Check your network latency to the Lucid API endpoint
- Consider using a regional `base_url` if Lucid offers endpoints closer to your deployment

### Memories are not persisting across sessions

- Confirm that `backend = "lucid"` is set in the `[memory]` section
- Verify the `workspace_id` is consistent across all agent instances
- Check PRX logs for write errors that may indicate failed persistence

## Related Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite) -- local single-file alternative
- [PostgreSQL Backend](./postgres) -- self-hosted multi-user alternative
- [Embeddings Backend](./embeddings) -- local vector-based semantic memory
- [Memory Hygiene](./hygiene) -- compaction and cleanup strategies
