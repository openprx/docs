---
title: API-Referenz
description: Vollstandige REST-API-Referenz fur das PRX-Gateway -- Sitzungen, Kanale, Hooks, MCP, Plugins, Skills, Status, Konfiguration und Protokolle.
---

# API-Referenz

Diese Seite dokumentiert alle REST-API-Endpunkte, die vom PRX-Gateway bereitgestellt werden. Die API basiert auf Axum und verwendet JSON fur Anfrage- und Antwortkorper. Alle Endpunkte sind mit `/api/v1` prafixt.

## Basis-URL

```
http://127.0.0.1:3120/api/v1
```

Host und Port sind konfigurierbar:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## Authentifizierung

Alle API-Endpunkte erfordern ein Bearer-Token, sofern nicht anders angegeben.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

Token generieren mit:

```bash
prx auth token
```

## Sitzungen

Agenten-Sitzungen verwalten -- erstellen, auflisten, inspizieren und beenden.

### POST /api/v1/sessions

Eine neue Agenten-Sitzung erstellen.

**Anfrage:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**Antwort (201):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "metadata": {
    "source": "web-app"
  }
}
```

### GET /api/v1/sessions

Aktive Sitzungen auflisten.

**Abfrageparameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|-------------|
| `status` | `String` | `"active"` | Nach Status filtern: `"active"`, `"idle"`, `"terminated"` |
| `channel` | `String` | *alle* | Nach Kanalnamen filtern |
| `limit` | `usize` | `50` | Maximale zuruckzugebende Ergebnisse |
| `offset` | `usize` | `0` | Paginierungs-Offset |

**Antwort (200):**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "channel": "api",
      "user_id": "user_123",
      "status": "active",
      "created_at": "2026-03-21T10:00:00Z",
      "last_activity": "2026-03-21T10:15:00Z"
    }
  ],
  "total": 1
}
```

### GET /api/v1/sessions/:id

Detaillierte Informationen uber eine bestimmte Sitzung abrufen.

**Antwort (200):**

```json
{
  "id": "sess_abc123",
  "channel": "api",
  "user_id": "user_123",
  "status": "active",
  "created_at": "2026-03-21T10:00:00Z",
  "last_activity": "2026-03-21T10:15:00Z",
  "turn_count": 12,
  "token_usage": {
    "input": 4500,
    "output": 3200
  },
  "metadata": {
    "source": "web-app"
  }
}
```

### DELETE /api/v1/sessions/:id

Eine Sitzung beenden.

**Antwort (204):** Kein Inhalt.

## Kanale

Messaging-Kanal-Verbindungen abfragen und verwalten.

### GET /api/v1/channels

Alle konfigurierten Kanale und ihren Verbindungsstatus auflisten.

**Antwort (200):**

```json
{
  "channels": [
    {
      "name": "telegram",
      "status": "connected",
      "connected_at": "2026-03-21T08:00:00Z",
      "active_sessions": 3
    },
    {
      "name": "discord",
      "status": "disconnected",
      "error": "Invalid bot token"
    }
  ]
}
```

### POST /api/v1/channels/:name/restart

Eine bestimmte Kanalverbindung neu starten.

**Antwort (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

Gesundheitsprufung fur einen bestimmten Kanal.

**Antwort (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## Hooks

Webhook-Endpunkte fur externe Integrationen verwalten.

### GET /api/v1/hooks

Registrierte Webhooks auflisten.

**Antwort (200):**

```json
{
  "hooks": [
    {
      "id": "hook_001",
      "url": "https://example.com/webhook",
      "events": ["session.created", "session.terminated"],
      "active": true,
      "created_at": "2026-03-20T12:00:00Z"
    }
  ]
}
```

### POST /api/v1/hooks

Einen neuen Webhook registrieren.

**Anfrage:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**Antwort (201):**

```json
{
  "id": "hook_002",
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "active": true,
  "created_at": "2026-03-21T10:20:00Z"
}
```

### DELETE /api/v1/hooks/:id

Einen Webhook entfernen.

**Antwort (204):** Kein Inhalt.

## MCP

Model Context Protocol-Serververbindungen verwalten.

### GET /api/v1/mcp

Verbundene MCP-Server auflisten.

**Antwort (200):**

```json
{
  "servers": [
    {
      "name": "filesystem",
      "transport": "stdio",
      "status": "connected",
      "tools": ["read_file", "write_file", "list_directory"],
      "connected_at": "2026-03-21T08:00:00Z"
    }
  ]
}
```

### POST /api/v1/mcp/:name/reconnect

Erneut mit einem MCP-Server verbinden.

**Antwort (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## Plugins

WASM-Plugins verwalten.

### GET /api/v1/plugins

Installierte Plugins und ihren Status auflisten.

**Antwort (200):**

```json
{
  "plugins": [
    {
      "name": "weather",
      "version": "1.2.0",
      "status": "loaded",
      "capabilities": ["tool:get_weather", "tool:get_forecast"],
      "memory_usage_bytes": 2097152
    }
  ]
}
```

### POST /api/v1/plugins/:name/reload

Ein Plugin neu laden (entladen und erneut laden).

**Antwort (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

Ein Plugin deaktivieren, ohne es zu entladen.

**Antwort (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## Skills

Registrierte Agenten-Skills abfragen.

### GET /api/v1/skills

Alle verfugbaren Skills auflisten.

**Antwort (200):**

```json
{
  "skills": [
    {
      "name": "code_review",
      "source": "builtin",
      "description": "Review code changes and provide feedback",
      "triggers": ["/review", "review this"]
    },
    {
      "name": "summarize",
      "source": "plugin:productivity",
      "description": "Summarize long text or conversations",
      "triggers": ["/summarize", "tldr"]
    }
  ]
}
```

## Status

Systemstatus und Gesundheitsinformationen.

### GET /api/v1/status

Gesamten Systemstatus abrufen.

**Antwort (200):**

```json
{
  "status": "healthy",
  "version": "0.12.0",
  "uptime_secs": 86400,
  "active_sessions": 5,
  "channels": {
    "connected": 3,
    "total": 4
  },
  "plugins": {
    "loaded": 2,
    "total": 2
  },
  "memory": {
    "backend": "sqlite",
    "entries": 1542
  },
  "provider": {
    "name": "anthropic",
    "model": "claude-sonnet-4-20250514"
  }
}
```

### GET /api/v1/status/health

Leichtgewichtige Gesundheitsprufung (geeignet fur Load-Balancer-Probes).

**Antwort (200):**

```json
{
  "healthy": true
}
```

## Konfiguration

Laufzeitkonfiguration lesen und aktualisieren.

### GET /api/v1/config

Die aktuelle Laufzeitkonfiguration abrufen (Geheimnisse werden geschwärzt).

**Antwort (200):**

```json
{
  "agent": {
    "max_turns": 50,
    "max_tool_calls_per_turn": 10,
    "session_timeout_secs": 3600
  },
  "memory": {
    "backend": "sqlite"
  },
  "channels_config": {
    "telegram": {
      "bot_token": "***REDACTED***",
      "allowed_users": ["123456789"]
    }
  }
}
```

### PATCH /api/v1/config

Konfigurationswerte zur Laufzeit aktualisieren. Anderungen werden uber Hot-Reload angewendet.

**Anfrage:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**Antwort (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

Einige Konfigurationsanderungen erfordern einen vollstandigen Neustart und konnen nicht hot-reloaded werden. Die Antwort zeigt dies mit `"reload_required": true` an.

## Protokolle

Agenten-Protokolle und Diagnosen abfragen.

### GET /api/v1/logs

Letzte Protokolleintrage streamen oder abfragen.

**Abfrageparameter:**

| Parameter | Typ | Standard | Beschreibung |
|-----------|-----|----------|-------------|
| `level` | `String` | `"info"` | Minimale Protokollebene: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"` |
| `module` | `String` | *alle* | Nach Modulnamen filtern (z.B. `"agent"`, `"channel::telegram"`) |
| `since` | `String` | *vor 1 Stunde* | ISO-8601-Zeitstempel oder Dauer (z.B. `"1h"`, `"30m"`) |
| `limit` | `usize` | `100` | Maximale zuruckzugebende Eintrage |
| `stream` | `bool` | `false` | Wenn true, wird ein Server-Sent-Events-Stream zuruckgegeben |

**Antwort (200):**

```json
{
  "entries": [
    {
      "timestamp": "2026-03-21T10:15:30.123Z",
      "level": "info",
      "module": "agent::loop",
      "message": "Tool call completed: shell (45ms)",
      "session_id": "sess_abc123"
    }
  ],
  "total": 1
}
```

### GET /api/v1/logs/stream

Server-Sent-Events-Stream fur Echtzeit-Protokollverfolgung.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## Fehlerantworten

Alle Endpunkte geben Fehler in einem einheitlichen Format zuruck:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| HTTP-Status | Fehlercode | Beschreibung |
|-------------|-----------|-------------|
| 400 | `bad_request` | Ungultige Anfrageparameter oder -korper |
| 401 | `unauthorized` | Fehlendes oder ungultiges Bearer-Token |
| 403 | `forbidden` | Token hat nicht die erforderlichen Berechtigungen |
| 404 | `not_found` | Ressource existiert nicht |
| 409 | `conflict` | Ressourcenzustandskonflikt (z.B. Sitzung bereits beendet) |
| 429 | `rate_limited` | Zu viele Anfragen; nach der angegebenen Verzogerung erneut versuchen |
| 500 | `internal_error` | Unerwarteter Serverfehler |

## Ratenlimitierung

Die API erzwingt Ratenlimits pro Token:

| Endpunktgruppe | Limit |
|----------------|-------|
| Sitzungen (Schreiben) | 10 Anfragen/Sekunde |
| Sitzungen (Lesen) | 50 Anfragen/Sekunde |
| Konfiguration (Schreiben) | 5 Anfragen/Sekunde |
| Alle anderen Endpunkte | 30 Anfragen/Sekunde |

Ratenlimit-Header sind in allen Antworten enthalten:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## Verwandte Seiten

- [Gateway-Ubersicht](./)
- [HTTP-API](./http-api) -- Ubersicht uber die HTTP-API-Schicht
- [WebSocket](./websocket) -- Echtzeit-WebSocket-API
- [Webhooks](./webhooks) -- Ausgehende Webhook-Konfiguration
- [Middleware](./middleware) -- Anfrage/Antwort-Middleware-Pipeline
