---
title: Konfigurationsreferenz
description: "Vollständige Referenz für alle PRX-Memory-Umgebungsvariablen für Transport, Speicher, Embedding, Reranking, Governance und Beobachtbarkeit."
---

# Konfigurationsreferenz

PRX-Memory wird vollständig über Umgebungsvariablen konfiguriert. Diese Seite dokumentiert jede Variable nach Kategorie gruppiert.

## Transport

| Variable | Werte | Standard | Beschreibung |
|----------|-------|---------|-------------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | Server-Transportmodus |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | HTTP-Server-Bind-Adresse |

## Speicher

| Variable | Werte | Standard | Beschreibung |
|----------|-------|---------|-------------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | Speicher-Backend |
| `PRX_MEMORY_DB` | Datei-/Verzeichnispfad | -- | Datenbankdatei- oder Verzeichnispfad |

## Embedding

| Variable | Werte | Standard | Beschreibung |
|----------|-------|---------|-------------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | -- | Embedding-Provider |
| `PRX_EMBED_API_KEY` | API-Schlüssel-String | -- | Embedding-Provider-API-Schlüssel |
| `PRX_EMBED_MODEL` | Modellname | Provider-spezifisch | Embedding-Modellname |
| `PRX_EMBED_BASE_URL` | URL | Provider-spezifisch | Benutzerdefinierte API-Endpunkt-URL |

### Provider-Fallback-Schlüssel

Wenn `PRX_EMBED_API_KEY` nicht gesetzt ist, prüft das System diese provider-spezifischen Schlüssel:

| Provider | Fallback-Schlüssel |
|----------|------------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## Reranking

| Variable | Werte | Standard | Beschreibung |
|----------|-------|---------|-------------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | Rerank-Provider |
| `PRX_RERANK_API_KEY` | API-Schlüssel-String | -- | Rerank-Provider-API-Schlüssel |
| `PRX_RERANK_MODEL` | Modellname | Provider-spezifisch | Rerank-Modellname |
| `PRX_RERANK_ENDPOINT` | URL | Provider-spezifisch | Benutzerdefinierter Rerank-Endpunkt |
| `PRX_RERANK_API_VERSION` | Versions-String | -- | API-Version (nur pinecone-compatible) |

### Provider-Fallback-Schlüssel

Wenn `PRX_RERANK_API_KEY` nicht gesetzt ist, prüft das System diese provider-spezifischen Schlüssel:

| Provider | Fallback-Schlüssel |
|----------|------------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## Standardisierung

| Variable | Werte | Standard | Beschreibung |
|----------|-------|---------|-------------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | Standardisierungsprofil |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | Tag-String | `prx-memory` | Standard-Projekt-Tag |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | Tag-String | `mcp` | Standard-Tool-Tag |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | Tag-String | `general` | Standard-Domänen-Tag |

## Streaming-Sitzungen

| Variable | Werte | Standard | Beschreibung |
|----------|-------|---------|-------------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | Millisekunden | `300000` | Stream-Sitzungs-Time-to-Live |

## Beobachtbarkeit

### Kardinalitätskontrollen

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | Max. verschiedene Scope-Labels in Metriken |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | Max. verschiedene Kategorie-Labels in Metriken |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | Max. verschiedene Rerank-Provider-Labels |

### Alarmschwellenwerte

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | Tool-Fehlerquoten-Warnschwellenwert |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | Tool-Fehlerquoten-Kritisch-Schwellenwert |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | Remote-Warnungsquoten-Warnschwellenwert |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | Remote-Warnungsquoten-Kritisch-Schwellenwert |

## Beispiel: Minimalkonfiguration

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## Beispiel: Vollständige Produktionskonfiguration

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## Nächste Schritte

- [Installation](../getting-started/installation) -- PRX-Memory erstellen und installieren
- [MCP-Integration](../mcp/) -- MCP-Client konfigurieren
- [Fehlerbehebung](../troubleshooting/) -- Häufige Konfigurationsprobleme
