---
title: Tipos de Agentes
description: "Los agentes son las unidades de despacho centrales en OpenPR-Webhook. Aprende sobre los 5 tipos: openclaw, openprx, webhook, custom y cli."
---

# Tipos de Agentes

Los agentes son las unidades de despacho centrales en OpenPR-Webhook. Cada agente define cómo manejar un evento webhook coincidente. Puedes configurar múltiples agentes en un único despliegue, y los eventos se enrutan al agente apropiado basándose en el `bot_context` del payload webhook.

## Descripción General

| Tipo | Caso de Uso | Requiere Indicador de Característica |
|------|----------|----------------------|
| `openclaw` | Enviar notificaciones vía Signal/Telegram usando OpenClaw CLI | No |
| `openprx` | Enviar mensajes vía API Signal de OpenPRX o CLI | No |
| `webhook` | Reenviar eventos a endpoints HTTP (Slack, Discord, etc.) | No |
| `custom` | Ejecutar comandos de shell arbitrarios | No |
| `cli` | Ejecutar agentes de codificación IA (codex, claude-code, opencode) | Sí (`cli_enabled`) |

## Estructura de Configuración del Agente

Cada agente tiene estos campos comunes:

```toml
[[agents]]
id = "unique-id"              # Unique identifier, used for matching
name = "Human-Readable Name"  # Display name, also used for matching
agent_type = "openclaw"       # One of: openclaw, openprx, webhook, custom, cli
message_template = "..."      # Optional: custom message format
```

Luego, dependiendo de `agent_type`, proporcionas el bloque de configuración específico del tipo:

- `[agents.openclaw]` para agentes openclaw
- `[agents.openprx]` para agentes openprx
- `[agents.webhook]` para agentes webhook
- `[agents.custom]` para agentes custom
- `[agents.cli]` para agentes cli

## Plantillas de Mensajes

El campo `message_template` soporta marcadores de posición que se sustituyen con valores del payload webhook:

| Marcador | Fuente | Ejemplo |
|----------|--------|---------|
| `{event}` | `payload.event` | `issue.updated` |
| `{title}` | `payload.data.issue.title` | `Fix login bug` |
| `{key}` | `payload.data.issue.key` | `PROJ-42` |
| `{issue_id}` | `payload.data.issue.id` | `123` |
| `{reason}` | `payload.bot_context.trigger_reason` | `assigned_to_bot` |
| `{actor}` | `payload.actor.name` | `alice` |
| `{project}` | `payload.project.name` | `backend` |
| `{workspace}` | `payload.workspace.name` | `IM` |
| `{state}` | `payload.data.issue.state` | `in_progress` |
| `{priority}` | `payload.data.issue.priority` | `high` |
| `{url}` | derivado | `issue/123` |

Plantilla predeterminada (para openclaw, openprx, webhook, custom):

```
[{project}] {event}: {key} {title}
{actor} | Trigger: {reason}
```

## Lógica de Coincidencia de Agentes

Cuando llega un evento webhook con `bot_context.is_bot_task = true`:

1. El servicio extrae `bot_context.bot_name` y `bot_context.bot_agent_type`
2. Busca agentes cuyo `id` o `name` (sin distinción de mayúsculas/minúsculas) coincida con `bot_name`
3. Si no hay coincidencia por nombre, recurre al primer agente cuyo `agent_type` coincida con `bot_agent_type`
4. Si ningún agente coincide en absoluto, el evento se reconoce pero no se despacha

## Ejemplo de Múltiples Agentes

```toml
# Agent 1: Notification via Telegram
[[agents]]
id = "notify-tg"
name = "Telegram Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "telegram"
target = "@my-channel"

# Agent 2: Forward to Slack
[[agents]]
id = "notify-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"

# Agent 3: AI coding agent
[[agents]]
id = "coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 600
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
```

En esta configuración, OpenPR puede enrutar diferentes eventos a diferentes agentes estableciendo el campo `bot_name` en el payload webhook.

## Próximos Pasos

- [Referencia de Executors](executors.md) -- documentación detallada para cada tipo de executor
- [Referencia de Configuración](../configuration/index.md) -- esquema TOML completo
