---
title: MCP-Integration
description: "PRX-Memory MCP-Protokoll-Integration, unterstützte Tools, Ressourcen, Vorlagen und Transportmodi."
---

# MCP-Integration

PRX-Memory ist als nativer MCP (Model Context Protocol)-Server aufgebaut. Es stellt Speicheroperationen als MCP-Tools, Governance-Skills als MCP-Ressourcen und Nutzlastvorlagen für standardisierte Speicherinteraktionen bereit.

## Transportmodi

### stdio

Der stdio-Transport kommuniziert über Standard-Ein-/Ausgabe und ist ideal für die direkte Integration mit MCP-Clients wie Claude Code, Codex und OpenClaw.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

Der HTTP-Transport bietet einen netzwerkzugänglichen Server mit zusätzlichen Betriebsendpunkten.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Nur HTTP-Endpunkte:

| Endpunkt | Beschreibung |
|----------|-------------|
| `GET /health` | Integritätsprüfung |
| `GET /metrics` | Prometheus-Metriken |
| `GET /metrics/summary` | JSON-Metriken-Zusammenfassung |
| `POST /mcp/session/renew` | Streaming-Sitzung erneuern |

## MCP-Client-Konfiguration

PRX-Memory zur Konfigurationsdatei des MCP-Clients hinzufügen:

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Absolute Pfade sowohl für `command` als auch für `PRX_MEMORY_DB` verwenden, um Pfadauflösungsprobleme zu vermeiden.
:::

## MCP-Tools

PRX-Memory stellt die folgenden Tools über die MCP-`tools/call`-Schnittstelle bereit:

### Kern-Speicheroperationen

| Tool | Beschreibung |
|------|-------------|
| `memory_store` | Einen neuen Speichereintrag mit Text, Scope, Tags und Metadaten speichern |
| `memory_recall` | Erinnerungen passend zu einer Abfrage mit lexikalischer, Vektor- und neu geordneter Suche abrufen |
| `memory_update` | Einen vorhandenen Speichereintrag aktualisieren |
| `memory_forget` | Einen Speichereintrag nach ID löschen |

### Massenoperationen

| Tool | Beschreibung |
|------|-------------|
| `memory_export` | Alle Erinnerungen in ein portables JSON-Format exportieren |
| `memory_import` | Erinnerungen aus einem Export importieren |
| `memory_migrate` | Zwischen Speicher-Backends migrieren |
| `memory_reembed` | Alle Erinnerungen mit dem aktuellen Embedding-Modell neu einbetten |
| `memory_compact` | Speicher komprimieren und optimieren |

### Evolution

| Tool | Beschreibung |
|------|-------------|
| `memory_evolve` | Speicher mit Train/Holdout-Akzeptanz und Constraint-Gating entwickeln |

### Skill-Entdeckung

| Tool | Beschreibung |
|------|-------------|
| `memory_skill_manifest` | Das Skill-Manifest für Governance-Skills zurückgeben |

## MCP-Ressourcen

PRX-Memory stellt Governance-Skill-Pakete als MCP-Ressourcen bereit:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

Eine spezifische Ressource lesen:

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## Ressourcenvorlagen

Nutzlastvorlagen helfen Clients, standardisierte Speicheroperationen zu erstellen:

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

Eine Vorlage verwenden, um eine Store-Nutzlast zu generieren:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## Streaming-Sitzungen

Der HTTP-Transport unterstützt Server-Sent Events (SSE) für Streaming-Antworten. Sitzungen haben eine konfigurierbare TTL:

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 Minuten
```

Eine Sitzung vor Ablauf erneuern:

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## Standardisierungsprofile

PRX-Memory unterstützt zwei Standardisierungsprofile, die steuern, wie Speichereinträge getaggt und validiert werden:

| Profil | Beschreibung |
|--------|-------------|
| `zero-config` | Minimale Einschränkungen, akzeptiert beliebige Tags und Scopes (Standard) |
| `governed` | Strenge Tag-Normalisierung, Verhältnisbeschränkungen und Qualitätseinschränkungen |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## Nächste Schritte

- [Schnellstart](../getting-started/quickstart) -- Erste Store- und Recall-Operationen
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen
- [Fehlerbehebung](../troubleshooting/) -- Häufige MCP-Probleme
