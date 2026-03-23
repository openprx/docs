---
title: Referencia de Executors
description: "Documentación detallada de los 5 tipos de executor en OpenPR-Webhook: openclaw, openprx, webhook, custom y cli."
---

# Referencia de Executors

Esta página documenta los 5 tipos de executor en detalle, incluyendo sus campos de configuración, comportamiento y ejemplos.

## openclaw

Envía notificaciones a través de plataformas de mensajería (Signal, Telegram) mediante la herramienta CLI de OpenClaw.

**Cómo funciona:** Construye un comando de shell que invoca el binario de OpenClaw con argumentos `--channel`, `--target` y `--message`.

**Configuración:**

```toml
[[agents]]
id = "my-openclaw"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {key}: {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"   # Path to the OpenClaw binary
channel = "signal"                     # Channel: "signal" or "telegram"
target = "+1234567890"                 # Phone number, group ID, or channel name
```

**Campos:**

| Campo | Requerido | Descripción |
|-------|----------|-------------|
| `command` | Sí | Ruta al binario CLI de OpenClaw |
| `channel` | Sí | Canal de mensajería (`signal`, `telegram`) |
| `target` | Sí | Identificador del destinatario (número de teléfono, ID de grupo, etc.) |

---

## openprx

Envía mensajes a través de la infraestructura de mensajería OpenPRX. Soporta dos modos: API HTTP (daemon Signal) o comando CLI.

**Modo 1: API Signal (preferido)**

Envía un POST JSON a un daemon de API REST signal-cli:

```toml
[[agents]]
id = "my-openprx"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"  # signal-cli REST API base URL
account = "+1234567890"                 # Sender phone number
target = "+0987654321"                  # Recipient phone number or UUID
channel = "signal"                      # Default: "signal"
```

La solicitud HTTP enviada a la API Signal:

```
POST {signal_api}/api/v1/send/{account}
Content-Type: application/json

{
  "recipients": ["{target}"],
  "message": "..."
}
```

**Modo 2: Comando CLI**

Recurre a ejecutar un comando de shell si `signal_api` no está establecido:

```toml
[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"
```

**Campos:**

| Campo | Requerido | Descripción |
|-------|----------|-------------|
| `signal_api` | No | URL base de la API HTTP del daemon Signal |
| `account` | No | Número de teléfono de la cuenta (usado con `signal_api`) |
| `target` | Sí | Número de teléfono o UUID del destinatario |
| `channel` | No | Nombre del canal (predeterminado: `signal`) |
| `command` | No | Comando CLI (respaldo cuando `signal_api` no está establecido) |

Se debe proporcionar al menos uno de `signal_api` o `command`.

---

## webhook

Reenvía el payload completo del webhook tal como está a un endpoint HTTP. Útil para integrarse con Slack, Discord, APIs personalizadas o encadenar a otro servicio webhook.

**Cómo funciona:** Envía un POST JSON a la URL configurada con el payload original. Opcionalmente firma las solicitudes salientes con HMAC-SHA256.

```toml
[[agents]]
id = "slack-forward"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-signing-secret"  # Optional: sign outbound requests
```

**Campos:**

| Campo | Requerido | Descripción |
|-------|----------|-------------|
| `url` | Sí | URL de destino |
| `secret` | No | Secreto HMAC-SHA256 para firma saliente (enviado como encabezado `X-Webhook-Signature`) |

Cuando se establece `secret`, la solicitud saliente incluye un encabezado `X-Webhook-Signature: sha256=...` calculado sobre el cuerpo JSON, permitiendo al receptor verificar la autenticidad.

---

## custom

Ejecuta un comando de shell arbitrario, pasando el mensaje formateado como argumento. Útil para integraciones personalizadas, registro o activación de scripts externos.

**Cómo funciona:** Ejecuta `sh -c '{command} "{message}"'` donde `{message}` es la plantilla renderizada con caracteres especiales escapados.

```toml
[[agents]]
id = "custom-logger"
name = "Log to File"
agent_type = "custom"
message_template = "{event} | {key} | {title}"

[agents.custom]
command = "/usr/local/bin/log-event.sh"
args = ["--format", "json"]  # Optional additional arguments
```

**Campos:**

| Campo | Requerido | Descripción |
|-------|----------|-------------|
| `command` | Sí | Ruta al ejecutable o comando de shell |
| `args` | No | Argumentos adicionales de línea de comandos |

**Nota de seguridad:** El executor custom ejecuta comandos de shell. Asegúrate de que la ruta del comando sea de confianza y no controlable por el usuario.

---

## cli

Ejecuta agentes de codificación IA para procesar incidencias. Este es el tipo de executor más poderoso, diseñado para generación automatizada de código y resolución de incidencias.

**Requiere:** `features.cli_enabled = true` en la configuración. Bloqueado cuando `OPENPR_WEBHOOK_SAFE_MODE=1`.

**Executors soportados (lista blanca):**

| Executor | Binario | Patrón de Comando |
|----------|--------|-----------------|
| `codex` | `codex` | `codex exec --full-auto "{prompt}"` |
| `claude-code` | `claude` | `claude --print --permission-mode bypassPermissions [--mcp-config path] "{prompt}"` |
| `opencode` | `opencode` | `opencode run "{prompt}"` |

Cualquier executor que no esté en esta lista blanca es rechazado.

**Configuración:**

```toml
[features]
cli_enabled = true
callback_enabled = true  # Required for state transitions

[[agents]]
id = "my-coder"
name = "Code Agent"
agent_type = "cli"

[agents.cli]
executor = "claude-code"               # One of: codex, claude-code, opencode
workdir = "/opt/projects/backend"      # Working directory for the CLI tool
timeout_secs = 900                     # Timeout in seconds (default: 900)
max_output_chars = 12000               # Max chars to capture from stdout/stderr (default: 12000)
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"

# State transitions (requires callback_enabled)
update_state_on_start = "in_progress"  # Set issue state when task starts
update_state_on_success = "done"       # Set issue state on success
update_state_on_fail = "todo"          # Set issue state on failure/timeout

# Callback configuration
callback = "mcp"                       # Callback mode: "mcp" or "api"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"        # Optional Bearer token for callback

# Bucle cerrado MCP (v0.3.0+)
skip_callback_state = true             # Omitir actualizaciones de estado en callbacks (la IA gestiona vía MCP)
# mcp_instructions = "..."            # Instrucciones MCP personalizadas (reemplaza las predeterminadas)
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config path

# Variables de entorno por agente
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_xxx"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**Campos:**

| Campo | Requerido | Predeterminado | Descripción |
|-------|----------|---------|-------------|
| `executor` | Sí | -- | Nombre de la herramienta CLI (`codex`, `claude-code`, `opencode`) |
| `workdir` | No | -- | Directorio de trabajo |
| `timeout_secs` | No | 900 | Tiempo de espera del proceso |
| `max_output_chars` | No | 12000 | Límite de captura de cola de salida |
| `prompt_template` | No | `Fix issue {issue_id}: {title}\nContext: {reason}` | Prompt enviado a la herramienta CLI |
| `update_state_on_start` | No | -- | Estado de la incidencia al iniciar la tarea |
| `update_state_on_success` | No | -- | Estado de la incidencia al completarse con éxito |
| `update_state_on_fail` | No | -- | Estado de la incidencia al fallar o expirar |
| `callback` | No | `mcp` | Protocolo de callback (`mcp` o `api`) |
| `callback_url` | No | -- | URL a la que enviar callbacks |
| `callback_token` | No | -- | Token Bearer para auth del callback |
| `skip_callback_state` | No | `false` | Omitir actualizaciones de estado en callbacks (cuando la IA gestiona el estado vía MCP) |
| `mcp_instructions` | No | integrado | Instrucciones de herramientas MCP personalizadas añadidas al prompt |
| `mcp_config_path` | No | -- | Ruta al archivo de configuración MCP (pasado a claude-code vía `--mcp-config`) |
| `env_vars` | No | `{}` | Variables de entorno adicionales inyectadas en el subproceso del executor |

**Marcadores de posición del prompt template (específicos de cli):**

| Marcador | Fuente |
|----------|--------|
| `{issue_id}` | `payload.data.issue.id` |
| `{title}` | `payload.data.issue.title` |
| `{reason}` | `payload.bot_context.trigger_reason` |

**Payload de callback (modo MCP):**

Cuando `callback = "mcp"`, el servicio envía un POST estilo JSON-RPC a `callback_url`:

```json
{
  "method": "issue.comment",
  "params": {
    "issue_id": "42",
    "run_id": "run-1711234567890",
    "executor": "claude-code",
    "status": "success",
    "summary": "cli execution completed",
    "exit_code": 0,
    "duration_ms": 45000,
    "stdout_tail": "...",
    "stderr_tail": "...",
    "state": "done"
  }
}
```

**Ciclo de vida de transición de estado:**

```
Evento recibido
    |
    v
[update_state_on_start] --> estado de incidencia = "in_progress"
    |
    v
Herramienta CLI se ejecuta (hasta timeout_secs)
    |
    +-- éxito --> [update_state_on_success] --> estado de incidencia = "done"
    |
    +-- fallo --> [update_state_on_fail] --> estado de incidencia = "todo"
    |
    +-- timeout --> [update_state_on_fail] --> estado de incidencia = "todo"
```

Cuando `skip_callback_state = true`, todas las transiciones de estado anteriores se suprimen — se espera que el agente IA gestione el estado de la incidencia directamente mediante herramientas MCP.

---

### Automatización en Bucle Cerrado MCP

Cuando el agente IA tiene disponibles las herramientas MCP de OpenPR, puede leer de forma autónoma el contexto completo de la incidencia, corregir el problema y escribir los resultados de vuelta — formando un bucle cerrado completo.

**Cómo funciona:**

1. openpr-webhook recibe un evento webhook de tarea de bot
2. Construye un prompt a partir de `prompt_template` y añade instrucciones MCP (predeterminadas o personalizadas)
3. El executor CLI se ejecuta con `env_vars` inyectadas (p. ej., `OPENPR_BOT_TOKEN`)
4. El agente IA usa herramientas MCP para leer detalles de la incidencia, corregir el código, publicar comentarios y actualizar el estado
5. El callback reporta metadatos de ejecución (duración, código de salida) pero omite las actualizaciones de estado

**Instrucciones MCP predeterminadas** (añadidas automáticamente cuando se configuran `mcp_instructions`, `mcp_config_path` o `env_vars`):

```
1. Call work_items.get with work_item_id="{issue_id}" to read full issue details
2. Call comments.list with work_item_id="{issue_id}" to read all comments
3. Call work_items.list_labels with work_item_id="{issue_id}" to read labels
4. After completing the fix, call comments.create to post a summary
5. Call work_items.update to set state to "done" if successful
```

Puedes reemplazarlas con un campo `mcp_instructions` personalizado.

**Variables de entorno** (`env_vars`):

Inyecta variables de entorno por agente en el subproceso del executor. Útil para proporcionar diferentes URLs de API, tokens o IDs de workspace a diferentes agentes:

```toml
[agents.cli.env_vars]
OPENPR_API_URL = "http://localhost:3000"
OPENPR_BOT_TOKEN = "opr_bot_token_here"
OPENPR_WORKSPACE_ID = "e5166fd1-..."
```

**Ruta de configuración MCP** (`mcp_config_path`):

Para el executor `claude-code`, si el agente necesita una configuración MCP no global, especifica la ruta:

```toml
mcp_config_path = "/etc/openpr-webhook/mcp-config.json"
```

Esto añade `--mcp-config /etc/openpr-webhook/mcp-config.json` al comando claude.
