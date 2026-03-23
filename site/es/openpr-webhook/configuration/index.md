---
title: Referencia de Configuración
description: "Esquema TOML completo de OpenPR-Webhook incluyendo servidor, seguridad, indicadores de características, runtime, túnel y agentes."
---

# Referencia de Configuración

OpenPR-Webhook usa un único archivo de configuración TOML. Por defecto, busca `config.toml` en el directorio actual. Puedes especificar una ruta personalizada como primer argumento de línea de comandos.

## Esquema Completo

```toml
# ─── Server ───────────────────────────────────────────────
[server]
listen = "0.0.0.0:9000"               # Bind address and port

# ─── Security ─────────────────────────────────────────────
[security]
webhook_secrets = ["secret1", "secret2"]  # HMAC-SHA256 secrets (supports rotation)
allow_unsigned = false                     # Allow unsigned webhook requests (default: false)

# ─── Feature Flags ────────────────────────────────────────
[features]
tunnel_enabled = false                 # Enable WSS tunnel subsystem (default: false)
cli_enabled = false                    # Enable CLI agent executor (default: false)
callback_enabled = false               # Enable state-transition callbacks (default: false)

# ─── Runtime Tuning ───────────────────────────────────────
[runtime]
cli_max_concurrency = 1               # Max concurrent CLI tasks (default: 1)
http_timeout_secs = 15                 # HTTP client timeout (default: 15)
tunnel_reconnect_backoff_max_secs = 60 # Max tunnel reconnect backoff (default: 60)

# ─── WSS Tunnel ───────────────────────────────────────────
[tunnel]
enabled = false                        # Enable this tunnel instance (default: false)
url = "wss://control.example.com/ws"   # WebSocket URL
agent_id = "my-agent"                  # Agent identifier
auth_token = "bearer-token"            # Bearer auth token
reconnect_secs = 3                     # Base reconnect interval (default: 3)
heartbeat_secs = 20                    # Heartbeat interval (default: 20, min: 3)
hmac_secret = "envelope-signing-key"   # Envelope HMAC signing secret
require_inbound_sig = false            # Require inbound message signatures (default: false)

# ─── Agents ───────────────────────────────────────────────

# --- OpenClaw Agent ---
[[agents]]
id = "notify-signal"
name = "Signal Notifier"
agent_type = "openclaw"
message_template = "[{project}] {event}: {key} {title}"

[agents.openclaw]
command = "/usr/local/bin/openclaw"
channel = "signal"
target = "+1234567890"

# --- OpenPRX Agent (HTTP API mode) ---
[[agents]]
id = "openprx-signal"
name = "OpenPRX Signal"
agent_type = "openprx"

[agents.openprx]
signal_api = "http://127.0.0.1:8686"
account = "+1234567890"
target = "+0987654321"
channel = "signal"

# --- OpenPRX Agent (CLI mode) ---
[[agents]]
id = "openprx-cli"
name = "OpenPRX CLI"
agent_type = "openprx"

[agents.openprx]
command = "openprx message send"
channel = "signal"
target = "+0987654321"

# --- Webhook Agent ---
[[agents]]
id = "forward-slack"
name = "Slack Forwarder"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/T.../B.../xxx"
secret = "outbound-hmac-secret"        # Optional: sign outbound requests

# --- Custom Agent ---
[[agents]]
id = "custom-script"
name = "Custom Script"
agent_type = "custom"
message_template = "{event}|{key}|{title}"

[agents.custom]
command = "/usr/local/bin/handle-event.sh"
args = ["--format", "json"]

# --- CLI Agent ---
[[agents]]
id = "ai-coder"
name = "AI Coder"
agent_type = "cli"

[agents.cli]
executor = "claude-code"
workdir = "/opt/projects/backend"
timeout_secs = 900
max_output_chars = 12000
prompt_template = "Fix issue {issue_id}: {title}\nContext: {reason}"
update_state_on_start = "in_progress"
update_state_on_success = "done"
update_state_on_fail = "todo"
callback = "mcp"
callback_url = "http://127.0.0.1:8090/mcp/rpc"
callback_token = "bearer-token"
skip_callback_state = false               # Establece true cuando la IA gestiona el estado vía MCP
# mcp_instructions = "..."               # Instrucciones MCP personalizadas (reemplaza las predeterminadas)
# mcp_config_path = "/path/to/mcp.json"  # claude-code --mcp-config path

[agents.cli.env_vars]                      # Variables de entorno por agente
# OPENPR_API_URL = "http://localhost:3000"
# OPENPR_BOT_TOKEN = "opr_xxx"
```

## Referencia de Secciones

### `[server]`

| Campo | Tipo | Requerido | Predeterminado | Descripción |
|-------|------|----------|---------|-------------|
| `listen` | String | Sí | -- | Dirección TCP de enlace en formato `host:puerto` |

### `[security]`

| Campo | Tipo | Requerido | Predeterminado | Descripción |
|-------|------|----------|---------|-------------|
| `webhook_secrets` | Array de strings | No | `[]` | Lista de secretos HMAC-SHA256 válidos para verificación entrante. Múltiples secretos soportan la rotación de claves. |
| `allow_unsigned` | Boolean | No | `false` | Aceptar solicitudes sin firmar sin verificación de firma. **No recomendado para producción.** |

**La verificación de firma** comprueba dos encabezados en orden:
1. `X-Webhook-Signature`
2. `X-OpenPR-Signature`

El valor del encabezado debe estar en el formato `sha256={hex-digest}`. El servicio prueba cada secreto en `webhook_secrets` hasta encontrar uno que coincida.

### `[features]`

Todos los indicadores de características tienen valor predeterminado `false`. Este enfoque de defensa en profundidad garantiza que las características peligrosas sean explícitamente habilitadas.

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|---------|-------------|
| `tunnel_enabled` | Boolean | `false` | Habilitar el subsistema de túnel WSS |
| `cli_enabled` | Boolean | `false` | Habilitar el executor de agentes CLI |
| `callback_enabled` | Boolean | `false` | Habilitar callbacks de transición de estado |

### `[runtime]`

| Campo | Tipo | Predeterminado | Descripción |
|-------|------|---------|-------------|
| `cli_max_concurrency` | Integer | `1` | Número máximo de tareas de agente CLI concurrentes |
| `http_timeout_secs` | Integer | `15` | Tiempo de espera para solicitudes HTTP salientes (reenvío de webhooks, callbacks, API Signal) |
| `tunnel_reconnect_backoff_max_secs` | Integer | `60` | Intervalo de retroceso máximo para reconexión del túnel |

### `[tunnel]`

Ver [Túnel WSS](../tunnel/index.md) para documentación detallada.

### `[[agents]]`

Ver [Tipos de Agentes](../agents/index.md) y [Referencia de Executors](../agents/executors.md) para documentación detallada.

## Variables de Entorno

| Variable | Descripción |
|----------|-------------|
| `OPENPR_WEBHOOK_SAFE_MODE` | Establece en `1`, `true`, `yes` o `on` para deshabilitar el túnel, CLI y características de callback independientemente de la configuración. Útil para bloqueo de emergencia. |
| `RUST_LOG` | Controla la verbosidad del registro. Predeterminado: `openpr_webhook=info`. Ejemplos: `openpr_webhook=debug`, `openpr_webhook=trace` |

### Variables de Entorno por Agente

Los agentes CLI soportan inyección de variables de entorno personalizadas mediante `[agents.cli.env_vars]`. Estas se pasan al subproceso del executor y son útiles para proporcionar autenticación MCP:

| Variable | Descripción |
|----------|-------------|
| `OPENPR_API_URL` | URL base de la API de OpenPR (usada por el servidor MCP) |
| `OPENPR_BOT_TOKEN` | Token de autenticación del bot (prefijo `opr_`) |
| `OPENPR_WORKSPACE_ID` | UUID del workspace de destino |

## Modo Seguro

Establecer `OPENPR_WEBHOOK_SAFE_MODE=1` deshabilita:

- Ejecución de agentes CLI (`cli_enabled` forzado a `false`)
- Envío de callbacks (`callback_enabled` forzado a `false`)
- Túnel WSS (`tunnel_enabled` forzado a `false`)

Los agentes no peligrosos (openclaw, openprx, webhook, custom) continúan funcionando normalmente. Esto permite bloquear rápidamente el servicio sin modificar el archivo de configuración.

```bash
OPENPR_WEBHOOK_SAFE_MODE=1 ./openpr-webhook config.toml
```

## Configuración Mínima

La configuración válida más pequeña:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
allow_unsigned = true
```

Esto inicia el servicio sin agentes y sin verificación de firma. Útil solo para desarrollo.

## Lista de Verificación para Producción

- [ ] Establece al menos una entrada en `webhook_secrets`
- [ ] Establece `allow_unsigned = false`
- [ ] Configura al menos un agente
- [ ] Si usas agentes CLI: establece `cli_enabled = true` y revisa la lista blanca de executors
- [ ] Si usas túnel: usa `wss://` (no `ws://`), establece `hmac_secret` y `require_inbound_sig = true`
- [ ] Establece `RUST_LOG=openpr_webhook=info` (evita `debug`/`trace` en producción por rendimiento)
- [ ] Considera ejecutar con `OPENPR_WEBHOOK_SAFE_MODE=1` inicialmente para verificar la funcionalidad no-CLI
