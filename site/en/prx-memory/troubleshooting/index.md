---
title: Troubleshooting
description: Common PRX-Memory issues and solutions for configuration, embedding, reranking, storage, and MCP integration.
---

# Troubleshooting

This page covers common issues encountered when running PRX-Memory, along with their causes and solutions.

## Configuration Issues

### "PRX_EMBED_API_KEY is not configured"

**Cause:** A remote semantic recall was requested but no embedding API key was set.

**Solution:** Set the embedding provider and API key:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

Or use a provider-specific fallback key:

```bash
JINA_API_KEY=your_api_key
```

::: tip
If you do not need semantic search, PRX-Memory works without embedding configuration using lexical matching only.
:::

### "Unsupported rerank provider"

**Cause:** The `PRX_RERANK_PROVIDER` variable contains an unrecognized value.

**Solution:** Use one of the supported values:

```bash
PRX_RERANK_PROVIDER=jina        # or cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**Cause:** The `PRX_EMBED_PROVIDER` variable contains an unrecognized value.

**Solution:** Use one of the supported values:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # or jina, gemini
```

## Session Issues

### "session_expired"

**Cause:** An HTTP streaming session exceeded its TTL without being renewed.

**Solution:** Either renew the session before expiry or increase the TTL:

```bash
# Renew the session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Or increase the TTL (default: 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## Storage Issues

### Database file not found

**Cause:** The path specified in `PRX_MEMORY_DB` does not exist or is not writable.

**Solution:** Ensure the directory exists and the path is correct:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
Use absolute paths to avoid issues with working directory changes.
:::

### Large JSON database slow to load

**Cause:** The JSON backend loads the entire file into memory on startup. For databases with over 10,000 entries, this can be slow.

**Solution:** Migrate to the SQLite backend:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Use the `memory_migrate` tool to transfer existing data.

## Observability Issues

### Metrics cardinality overflow alert

**Cause:** Too many distinct label values in recall scope, category, or rerank provider dimensions.

**Solution:** Increase the cardinality limits or normalize your inputs:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

When limits are exceeded, new label values are silently dropped and counted in `prx_memory_metrics_label_overflow_total`.

### Alert thresholds too sensitive

**Cause:** Default alert thresholds may trigger false positives during initial deployment.

**Solution:** Adjust thresholds based on your expected error rates:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## Build Issues

### LanceDB feature not available

**Cause:** The `lancedb-backend` feature was not enabled at compile time.

**Solution:** Rebuild with the feature flag:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Compilation errors on Linux

**Cause:** Missing system dependencies for building native code.

**Solution:** Install build dependencies:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## Health Check

Use the HTTP health endpoint to verify the server is running correctly:

```bash
curl -sS http://127.0.0.1:8787/health
```

Check metrics for operational status:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## Validation Commands

Run the full validation suite to verify your installation:

```bash
# Multi-client validation
./scripts/run_multi_client_validation.sh

# Soak test (60 seconds, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## Getting Help

- **Repository:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **Documentation:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
