---
title: Schnellstart
description: "PRX-Memory in 5 Minuten mit stdio- oder HTTP-Transport starten, erste Erinnerung speichern und mit semantischer Suche abrufen."
---

# Schnellstart

Dieser Leitfaden führt durch das Erstellen von PRX-Memory, das Ausführen des Daemons und die Durchführung erster Store- und Recall-Operationen.

## 1. Daemon erstellen

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. Server starten

### Option A: stdio-Transport

Für direkte MCP-Client-Integration:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### Option B: HTTP-Transport

Für Netzwerkzugriff mit Integritätsprüfungen und Metriken:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

Überprüfen, ob der Server läuft:

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. MCP-Client konfigurieren

PRX-Memory zur MCP-Client-Konfiguration hinzufügen. Zum Beispiel in Claude Code oder Codex:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
`/path/to/prx-memory` durch den tatsächlichen Pfad ersetzen, wo das Repository geklont wurde.
:::

## 4. Erinnerung speichern

Einen `memory_store`-Tool-Aufruf über den MCP-Client oder direkt via JSON-RPC senden:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. Erinnerungen abrufen

Relevante Erinnerungen mit `memory_recall` abrufen:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

Das System gibt Erinnerungen zurück, geordnet nach Relevanz unter Verwendung einer Kombination aus lexikalischem Matching, Wichtigkeitsbewertung und Aktualität.

## 6. Semantische Suche aktivieren (Optional)

Für vektorbasiertes semantisches Recall einen Embedding-Provider konfigurieren:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

Mit aktivierten Embeddings verwenden Recall-Abfragen Vektorähnlichkeit zusätzlich zu lexikalischem Matching und verbessern die Retrieval-Qualität für Abfragen in natürlicher Sprache erheblich.

## 7. Reranking aktivieren (Optional)

Einen Reranker hinzufügen, um die Retrieval-Präzision weiter zu verbessern:

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## Verfügbare MCP-Tools

| Tool | Beschreibung |
|------|-------------|
| `memory_store` | Einen neuen Speichereintrag speichern |
| `memory_recall` | Erinnerungen nach Abfrage abrufen |
| `memory_update` | Einen vorhandenen Speichereintrag aktualisieren |
| `memory_forget` | Einen Speichereintrag löschen |
| `memory_export` | Alle Erinnerungen exportieren |
| `memory_import` | Erinnerungen aus einem Export importieren |
| `memory_migrate` | Speicherformat migrieren |
| `memory_reembed` | Erinnerungen mit neuem Modell neu einbetten |
| `memory_compact` | Speicher komprimieren und optimieren |
| `memory_evolve` | Speicher mit Holdout-Validierung entwickeln |
| `memory_skill_manifest` | Verfügbare Skills entdecken |

## Nächste Schritte

- [Embedding-Engine](../embedding/) -- Embedding-Provider und Stapelverarbeitung erkunden
- [Reranking](../reranking/) -- Zweistufiges Reranking konfigurieren
- [Speicher-Backends](../storage/) -- Zwischen JSON- und SQLite-Speicher wählen
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen
