---
title: Vision general de canales
description: PRX se conecta a 19 plataformas de mensajeria. Vision general de todos los canales, matriz de comparacion, patrones de configuracion y politicas de DM.
---

# Canales

Los canales son integraciones de plataformas de mensajeria que conectan PRX con el mundo exterior. Cada canal implementa una interfaz unificada para enviar y recibir mensajes, manejar medios, gestionar indicadores de escritura y realizar comprobaciones de salud. PRX puede ejecutar multiples canales simultaneamente desde un unico proceso demonio.

## Canales soportados

PRX soporta 19 canales de mensajeria que abarcan plataformas de consumo, herramientas empresariales, protocolos de codigo abierto e interfaces para desarrolladores.

### Matriz de comparacion de canales

| Canal | DM | Grupo | Medios | Voz | E2EE | Plataforma | Estado |
|-------|:--:|:-----:|:------:|:---:|:----:|------------|:------:|
| [Telegram](./telegram) | Si | Si | Si | No | No | Multiplataforma | Estable |
| [Discord](./discord) | Si | Si | Si | No | No | Multiplataforma | Estable |
| [Slack](./slack) | Si | Si | Si | No | No | Multiplataforma | Estable |
| [WhatsApp](./whatsapp) | Si | Si | Si | No | Si | Cloud API | Estable |
| [WhatsApp Web](./whatsapp-web) | Si | Si | Si | No | Si | Multi-dispositivo | Beta |
| [Signal](./signal) | Si | Si | Si | No | Si | Multiplataforma | Estable |
| [iMessage](./imessage) | Si | Si | Si | No | Si | Solo macOS | Beta |
| [Matrix](./matrix) | Si | Si | Si | No | Si | Federado | Estable |
| [Email](./email) | Si | No | Si | No | No | IMAP/SMTP | Estable |
| [Lark / Feishu](./lark) | Si | Si | Si | No | No | Multiplataforma | Estable |
| [DingTalk](./dingtalk) | Si | Si | Si | No | No | Multiplataforma | Estable |
| [QQ](./qq) | Si | Si | Si | No | No | Multiplataforma | Beta |
| [Mattermost](./mattermost) | Si | Si | Si | No | No | Auto-alojado | Estable |
| [Nextcloud Talk](./nextcloud-talk) | Si | Si | Si | No | No | Auto-alojado | Beta |
| [IRC](./irc) | Si | Si | No | No | No | Federado | Estable |
| [LINQ](./linq) | Si | Si | Si | No | No | API de socio | Alpha |
| [CLI](./cli) | Si | No | No | No | N/A | Terminal | Estable |
| Terminal | Si | No | No | No | N/A | Terminal | Estable |
| Wacli | Si | Si | Si | No | Si | JSON-RPC | Beta |

**Leyenda:**
- **Estable** -- Listo para produccion, completamente probado
- **Beta** -- Funcional con limitaciones conocidas
- **Alpha** -- Experimental, la API puede cambiar

## Patron de configuracion comun

Todos los canales se configuran bajo la seccion `[channels]` de `~/.config/openprx/openprx.toml`. Cada canal tiene su propia subseccion con ajustes especificos de la plataforma.

### Estructura basica

```toml
[channels]
# Habilitar el canal CLI integrado (por defecto: true)
cli = true

# Timeout de procesamiento por mensaje en segundos (por defecto: 300)
message_timeout_secs = 300

# ── Telegram ──────────────────────────────────────────────
[channels.telegram]
bot_token = "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
allowed_users = ["alice", "bob"]
stream_mode = "edit"            # "edit" | "append" | "none"
mention_only = false

# ── Discord ───────────────────────────────────────────────
[channels.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXX"
guild_id = "1234567890"         # opcional: restringir a un servidor
allowed_users = []              # vacio = permitir todos
listen_to_bots = false
mention_only = false

# ── Slack ─────────────────────────────────────────────────
[channels.slack]
bot_token = "xoxb-..."
app_token = "xapp-..."
allowed_users = []
mention_only = true
```

### Ejemplos especificos por canal

**Lark / Feishu:**

```toml
[channels.lark]
app_id = "cli_xxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = []
use_feishu = false              # true para Feishu (China), false para Lark (Internacional)
receive_mode = "websocket"      # "websocket" | "webhook"
mention_only = false
```

**Signal:**

```toml
[channels.signal]
phone_number = "+1234567890"
signal_cli_path = "/usr/local/bin/signal-cli"
allowed_users = ["+1987654321"]
```

**Matrix (con E2EE):**

```toml
[channels.matrix]
homeserver_url = "https://matrix.org"
username = "@prx-bot:matrix.org"
password = "secure-password"
allowed_users = ["@alice:matrix.org"]
```

**Email (IMAP/SMTP):**

```toml
[channels.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 587
username = "prx-bot@gmail.com"
password = "app-specific-password"
allowed_from = ["alice@example.com"]
```

**DingTalk:**

```toml
[channels.dingtalk]
app_key = "dingxxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxx"
robot_code = "dingxxxxxxxxx"
allowed_users = []
```

## Politicas de DM

PRX proporciona control detallado sobre quien puede enviar mensajes directos a tu agente. La politica de DM se configura por canal y determina como se manejan los mensajes directos entrantes.

### Tipos de politica

| Politica | Comportamiento |
|----------|----------------|
| `pairing` | Requiere un handshake de emparejamiento antes de aceptar al remitente. El usuario debe completar un flujo de desafio-respuesta para autenticarse. Funcion futura -- actualmente recurre a `allowlist`. |
| `allowlist` | **(Por defecto)** Solo los remitentes listados en el array `allowed_users` del canal pueden interactuar con el agente. Los mensajes de remitentes no listados se ignoran silenciosamente. |
| `open` | Cualquier usuario puede enviar mensajes directos al agente. Usar con precaucion en produccion. |
| `disabled` | Todos los mensajes directos se ignoran. Util cuando PRX solo debe responder en grupos. |

### Configuracion

Las politicas de DM se establecen en el nivel superior de la configuracion de canales:

```toml
[channels]
dm_policy = "allowlist"         # "pairing" | "allowlist" | "open" | "disabled"
```

El array `allowed_users` de cada canal es la lista de permitidos para ese canal:

```toml
[channels.telegram]
bot_token = "..."
allowed_users = ["alice", "bob"]  # Solo estos usuarios pueden enviar DM
```

Cuando `dm_policy = "open"`, el campo `allowed_users` se ignora y todos los remitentes son aceptados.

## Politicas de grupo

Similar a las politicas de DM, PRX controla en que conversaciones grupales participa el agente:

| Politica | Comportamiento |
|----------|----------------|
| `allowlist` | **(Por defecto)** Solo se monitorean los grupos listados en la lista de permitidos del canal. |
| `open` | El agente responde en cualquier grupo al que se agregue. |
| `disabled` | Todos los mensajes de grupo se ignoran. |

```toml
[channels]
group_policy = "allowlist"

[channels.telegram]
bot_token = "..."
# La lista de grupos permitidos se configura por canal
```

## Modo solo-mencion

La mayoria de los canales soportan una opcion `mention_only`. Cuando esta habilitada, el agente solo responde a mensajes que lo mencionan explicitamente (via @mencion, respuesta o disparador especifico de la plataforma). Esto es util en chats grupales para evitar que el agente responda a cada mensaje.

```toml
[channels.discord]
bot_token = "..."
mention_only = true   # Solo responder cuando se mencione con @
```

## Modo de streaming

Algunos canales soportan streaming de respuestas LLM en tiempo real. El ajuste `stream_mode` controla como se muestra la salida en streaming:

| Modo | Comportamiento |
|------|----------------|
| `edit` | Edita el mismo mensaje a medida que llegan los tokens (Telegram, Discord) |
| `append` | Agrega nuevo texto al mensaje |
| `none` | Espera la respuesta completa antes de enviar |

```toml
[channels.telegram]
bot_token = "..."
stream_mode = "edit"
draft_update_interval_ms = 1000   # Con que frecuencia actualizar el borrador (ms)
```

## Agregar un nuevo canal

Los canales de PRX estan basados en el trait `Channel`. Para conectar un nuevo canal:

1. Agrega la configuracion del canal a tu `openprx.toml`
2. Reinicia el demonio: `prx daemon`

Alternativamente, usa el asistente interactivo de canales:

```bash
prx channel add telegram
```

Para listar canales activos:

```bash
prx channel list
```

Para diagnosticar problemas de conectividad de canales:

```bash
prx channel doctor
```

## Arquitectura de canales

Internamente, cada canal:

1. **Escucha** mensajes entrantes de la plataforma (via polling, webhooks o WebSocket)
2. **Filtra** mensajes basandose en politicas de DM/grupo y listas de permitidos
3. **Enruta** los mensajes aceptados al bucle del agente para procesamiento
4. **Envia** la respuesta del agente de vuelta a traves de la API de la plataforma
5. **Reporta** el estado de salud y se reconecta automaticamente con retroceso exponencial

Todos los canales se ejecutan concurrentemente dentro del proceso demonio, compartiendo el runtime del agente, la memoria y los subsistemas de herramientas.

## Siguientes pasos

Elige un canal para conocer su configuracion especifica:

- [Telegram](./telegram) -- Integracion del Bot API
- [Discord](./discord) -- Bot con comandos slash
- [Slack](./slack) -- Aplicacion Slack con Socket Mode
- [WhatsApp](./whatsapp) -- Integracion de Cloud API
- [Signal](./signal) -- Puente Signal CLI
- [Matrix](./matrix) -- Chat federado con E2EE
- [Lark / Feishu](./lark) -- Mensajeria empresarial
- [Email](./email) -- Integracion IMAP/SMTP
