---
title: Referencia de API
description: Referencia completa de la API REST del gateway de PRX -- sesiones, canales, hooks, MCP, plugins, skills, estado, configuracion y logs.
---

# Referencia de API

Esta pagina documenta todos los endpoints de la API REST expuestos por el gateway de PRX. La API esta construida sobre Axum y usa JSON para los cuerpos de solicitud y respuesta. Todos los endpoints tienen el prefijo `/api/v1`.

## URL base

```
http://127.0.0.1:3120/api/v1
```

El host y puerto son configurables:

```toml
[gateway]
host = "127.0.0.1"
port = 3120
```

## Autenticacion

Todos los endpoints de la API requieren un token bearer a menos que se indique lo contrario.

```bash
curl -H "Authorization: Bearer <token>" http://localhost:3120/api/v1/status
```

Genera un token con:

```bash
prx auth token
```

## Sesiones

Gestionar sesiones del agente -- crear, listar, inspeccionar y terminar.

### POST /api/v1/sessions

Crear una nueva sesion de agente.

**Solicitud:**

```json
{
  "channel": "api",
  "user_id": "user_123",
  "metadata": {
    "source": "web-app"
  }
}
```

**Respuesta (201):**

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

Listar sesiones activas.

**Parametros de consulta:**

| Parametro | Tipo | Por defecto | Descripcion |
|-----------|------|-------------|-------------|
| `status` | `String` | `"active"` | Filtrar por estado: `"active"`, `"idle"`, `"terminated"` |
| `channel` | `String` | *todos* | Filtrar por nombre de canal |
| `limit` | `usize` | `50` | Numero maximo de resultados a devolver |
| `offset` | `usize` | `0` | Desplazamiento de paginacion |

**Respuesta (200):**

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

Obtener informacion detallada sobre una sesion especifica.

**Respuesta (200):**

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

Terminar una sesion.

**Respuesta (204):** Sin contenido.

## Canales

Consultar y gestionar conexiones de canales de mensajeria.

### GET /api/v1/channels

Listar todos los canales configurados y su estado de conexion.

**Respuesta (200):**

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

Reiniciar una conexion de canal especifica.

**Respuesta (200):**

```json
{
  "name": "telegram",
  "status": "reconnecting"
}
```

### GET /api/v1/channels/:name/health

Verificacion de salud para un canal especifico.

**Respuesta (200):**

```json
{
  "name": "telegram",
  "healthy": true,
  "latency_ms": 45,
  "last_message_at": "2026-03-21T10:14:55Z"
}
```

## Hooks

Gestionar endpoints de webhooks para integraciones externas.

### GET /api/v1/hooks

Listar webhooks registrados.

**Respuesta (200):**

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

Registrar un nuevo webhook.

**Solicitud:**

```json
{
  "url": "https://example.com/webhook",
  "events": ["session.created", "message.received"],
  "secret": "whsec_xxxxxxxxxxx"
}
```

**Respuesta (201):**

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

Eliminar un webhook.

**Respuesta (204):** Sin contenido.

## MCP

Gestionar conexiones de servidores de Model Context Protocol.

### GET /api/v1/mcp

Listar servidores MCP conectados.

**Respuesta (200):**

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

Reconectar a un servidor MCP.

**Respuesta (200):**

```json
{
  "name": "filesystem",
  "status": "reconnecting"
}
```

## Plugins

Gestionar plugins WASM.

### GET /api/v1/plugins

Listar plugins instalados y su estado.

**Respuesta (200):**

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

Recargar un plugin (descargar y cargar de nuevo).

**Respuesta (200):**

```json
{
  "name": "weather",
  "status": "loaded",
  "version": "1.2.0"
}
```

### POST /api/v1/plugins/:name/disable

Deshabilitar un plugin sin descargarlo.

**Respuesta (200):**

```json
{
  "name": "weather",
  "status": "disabled"
}
```

## Skills

Consultar skills del agente registrados.

### GET /api/v1/skills

Listar todos los skills disponibles.

**Respuesta (200):**

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

## Estado

Informacion de estado y salud del sistema.

### GET /api/v1/status

Obtener el estado general del sistema.

**Respuesta (200):**

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

Verificacion de salud ligera (adecuada para sondas de balanceador de carga).

**Respuesta (200):**

```json
{
  "healthy": true
}
```

## Configuracion

Leer y actualizar la configuracion en tiempo de ejecucion.

### GET /api/v1/config

Obtener la configuracion actual del runtime (los secretos estan redactados).

**Respuesta (200):**

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

Actualizar valores de configuracion en tiempo de ejecucion. Los cambios se aplican via recarga en caliente.

**Solicitud:**

```json
{
  "agent.max_turns": 100,
  "memory.top_k": 15
}
```

**Respuesta (200):**

```json
{
  "updated": ["agent.max_turns", "memory.top_k"],
  "reload_required": false
}
```

Algunos cambios de configuracion requieren un reinicio completo y no pueden recargarse en caliente. La respuesta lo indica con `"reload_required": true`.

## Logs

Consultar logs del agente y diagnosticos.

### GET /api/v1/logs

Transmitir o consultar entradas de log recientes.

**Parametros de consulta:**

| Parametro | Tipo | Por defecto | Descripcion |
|-----------|------|-------------|-------------|
| `level` | `String` | `"info"` | Nivel minimo de log: `"trace"`, `"debug"`, `"info"`, `"warn"`, `"error"` |
| `module` | `String` | *todos* | Filtrar por nombre de modulo (ej., `"agent"`, `"channel::telegram"`) |
| `since` | `String` | *hace 1 hora* | Marca de tiempo ISO 8601 o duracion (ej., `"1h"`, `"30m"`) |
| `limit` | `usize` | `100` | Numero maximo de entradas a devolver |
| `stream` | `bool` | `false` | Cuando es true, devuelve un stream de Server-Sent Events |

**Respuesta (200):**

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

Stream de Server-Sent Events para seguimiento de logs en tiempo real.

```bash
curl -N -H "Authorization: Bearer <token>" \
  http://localhost:3120/api/v1/logs/stream?level=info
```

## Respuestas de error

Todos los endpoints devuelven errores en un formato consistente:

```json
{
  "error": {
    "code": "not_found",
    "message": "Session sess_xyz not found",
    "details": null
  }
}
```

| Estado HTTP | Codigo de error | Descripcion |
|-------------|----------------|-------------|
| 400 | `bad_request` | Parametros o cuerpo de solicitud invalidos |
| 401 | `unauthorized` | Token bearer faltante o invalido |
| 403 | `forbidden` | El token carece de los permisos requeridos |
| 404 | `not_found` | El recurso no existe |
| 409 | `conflict` | Conflicto de estado del recurso (ej., sesion ya terminada) |
| 429 | `rate_limited` | Demasiadas solicitudes; reintentar despues del retraso indicado |
| 500 | `internal_error` | Error inesperado del servidor |

## Limitacion de velocidad

La API aplica limites de velocidad por token:

| Grupo de endpoints | Limite |
|-------------------|-------|
| Sesiones (escritura) | 10 solicitudes/segundo |
| Sesiones (lectura) | 50 solicitudes/segundo |
| Configuracion (escritura) | 5 solicitudes/segundo |
| Todos los demas endpoints | 30 solicitudes/segundo |

Las cabeceras de limite de velocidad se incluyen en todas las respuestas:

```
X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1711015230
```

## Paginas relacionadas

- [Vision general del gateway](./)
- [API HTTP](./http-api) -- vision general de la capa de API HTTP
- [WebSocket](./websocket) -- API WebSocket en tiempo real
- [Webhooks](./webhooks) -- configuracion de webhooks salientes
- [Middleware](./middleware) -- pipeline de middleware de solicitud/respuesta
