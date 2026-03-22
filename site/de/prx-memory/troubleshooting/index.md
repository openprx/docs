---
title: Fehlerbehebung
description: "Häufige PRX-Memory-Probleme und Lösungen für Konfiguration, Embedding, Reranking, Speicher und MCP-Integration."
---

# Fehlerbehebung

Diese Seite behandelt häufige Probleme beim Betrieb von PRX-Memory, zusammen mit ihren Ursachen und Lösungen.

## Konfigurationsprobleme

### "PRX_EMBED_API_KEY is not configured"

**Ursache:** Ein Remote-Semantik-Recall wurde angefordert, aber kein Embedding-API-Schlüssel wurde gesetzt.

**Lösung:** Embedding-Provider und API-Schlüssel setzen:

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

Oder einen provider-spezifischen Fallback-Schlüssel verwenden:

```bash
JINA_API_KEY=your_api_key
```

::: tip
Wenn keine semantische Suche benötigt wird, funktioniert PRX-Memory ohne Embedding-Konfiguration und verwendet nur lexikalisches Matching.
:::

### "Unsupported rerank provider"

**Ursache:** Die Variable `PRX_RERANK_PROVIDER` enthält einen nicht erkannten Wert.

**Lösung:** Einen der unterstützten Werte verwenden:

```bash
PRX_RERANK_PROVIDER=jina        # oder cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**Ursache:** Die Variable `PRX_EMBED_PROVIDER` enthält einen nicht erkannten Wert.

**Lösung:** Einen der unterstützten Werte verwenden:

```bash
PRX_EMBED_PROVIDER=openai-compatible  # oder jina, gemini
```

## Sitzungsprobleme

### "session_expired"

**Ursache:** Eine HTTP-Streaming-Sitzung hat ihre TTL überschritten, ohne erneuert zu werden.

**Lösung:** Entweder die Sitzung vor Ablauf erneuern oder die TTL erhöhen:

```bash
# Sitzung erneuern
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Oder TTL erhöhen (Standard: 300000ms = 5 Minuten)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## Speicherprobleme

### Datenbankdatei nicht gefunden

**Ursache:** Der in `PRX_MEMORY_DB` angegebene Pfad existiert nicht oder ist nicht beschreibbar.

**Lösung:** Sicherstellen, dass das Verzeichnis existiert und der Pfad korrekt ist:

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
Absolute Pfade verwenden, um Probleme mit Arbeitsverzeichnisänderungen zu vermeiden.
:::

### Große JSON-Datenbank lädt langsam

**Ursache:** Das JSON-Backend lädt die gesamte Datei beim Start in den Arbeitsspeicher. Bei Datenbanken mit über 10.000 Einträgen kann dies langsam sein.

**Lösung:** Zum SQLite-Backend migrieren:

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Das `memory_migrate`-Tool verwenden, um vorhandene Daten zu übertragen.

## Beobachtbarkeitsprobleme

### Alarm für Kardinalitätsüberlauf der Metriken

**Ursache:** Zu viele verschiedene Label-Werte in Recall-Scope-, Kategorie- oder Rerank-Provider-Dimensionen.

**Lösung:** Die Kardinalitätslimits erhöhen oder die Eingaben normalisieren:

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

Wenn Limits überschritten werden, werden neue Label-Werte lautlos verworfen und in `prx_memory_metrics_label_overflow_total` gezählt.

### Alarmschwellenwerte zu sensibel

**Ursache:** Standard-Alarmschwellenwerte können während der Erstbereitstellung falsch-positive Alarme auslösen.

**Lösung:** Schwellenwerte basierend auf erwarteten Fehlerquoten anpassen:

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## Build-Probleme

### LanceDB-Feature nicht verfügbar

**Ursache:** Das `lancedb-backend`-Feature wurde zur Kompilierzeit nicht aktiviert.

**Lösung:** Mit dem Feature-Flag neu erstellen:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Kompilierungsfehler unter Linux

**Ursache:** Fehlende Systemabhängigkeiten für die Erstellung von nativem Code.

**Lösung:** Build-Abhängigkeiten installieren:

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## Integritätsprüfung

Den HTTP-Integritäts-Endpunkt verwenden, um zu überprüfen, ob der Server korrekt läuft:

```bash
curl -sS http://127.0.0.1:8787/health
```

Metriken für den Betriebsstatus prüfen:

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## Validierungsbefehle

Die vollständige Validierungssuite ausführen, um die Installation zu verifizieren:

```bash
# Multi-Client-Validierung
./scripts/run_multi_client_validation.sh

# Soak-Test (60 Sekunden, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## Hilfe erhalten

- **Repository:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **Dokumentation:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
