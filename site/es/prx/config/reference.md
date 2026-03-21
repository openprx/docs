---
title: Referencia de configuracion
description: Referencia completa campo por campo de todas las secciones y opciones de configuracion de PRX.
---

# Referencia de configuracion

Esta pagina documenta cada seccion y campo de configuracion en `config.toml` de PRX. Los campos marcados con un valor por defecto pueden omitirse -- PRX usara el valor por defecto.

## Nivel superior (Ajustes por defecto)

Estos campos aparecen en el nivel raiz de `config.toml`, fuera de cualquier encabezado de seccion.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `default_provider` | `string` | `"openrouter"` | ID o alias del proveedor (ej., `"anthropic"`, `"openai"`, `"ollama"`) |
| `default_model` | `string` | `"anthropic/claude-sonnet-4.6"` | Identificador del modelo enrutado a traves del proveedor seleccionado |
| `default_temperature` | `float` | `0.7` | Temperatura de muestreo (0.0--2.0). Menor = mas deterministico |
| `api_key` | `string?` | `null` | Clave API para el proveedor seleccionado. Sobreescrita por variables de entorno especificas del proveedor |
| `api_url` | `string?` | `null` | URL base de sobreescritura para la API del proveedor (ej., endpoint remoto de Ollama) |

```toml
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7
api_key = "sk-ant-..."
```

## `[gateway]`

Servidor gateway HTTP para endpoints de webhook, emparejamiento y la API web.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `host` | `string` | `"127.0.0.1"` | Direccion de enlace. Usa `"0.0.0.0"` para acceso publico |
| `port` | `u16` | `16830` | Puerto de escucha |
| `require_pairing` | `bool` | `true` | Requerir emparejamiento de dispositivo antes de aceptar solicitudes API |
| `allow_public_bind` | `bool` | `false` | Permitir enlazar a direcciones no localhost sin tunel |
| `pair_rate_limit_per_minute` | `u32` | `5` | Solicitudes de emparejamiento maximas por minuto por cliente |
| `webhook_rate_limit_per_minute` | `u32` | `60` | Solicitudes de webhook maximas por minuto por cliente |
| `api_rate_limit_per_minute` | `u32` | `120` | Solicitudes API maximas por minuto por token autenticado |
| `trust_forwarded_headers` | `bool` | `false` | Confiar en cabeceras `X-Forwarded-For` / `X-Real-IP` (habilitar solo detras de proxy inverso) |
| `request_timeout_secs` | `u64` | `300` | Timeout del handler HTTP en segundos |
| `idempotency_ttl_secs` | `u64` | `300` | TTL para claves de idempotencia de webhook |

```toml
[gateway]
host = "127.0.0.1"
port = 16830
require_pairing = true
api_rate_limit_per_minute = 120
```

::: warning
Cambiar `host` o `port` requiere un reinicio completo. Estos valores se enlazan al inicio del servidor y no pueden recargarse en caliente.
:::

## `[channels_config]`

Configuracion de canales de nivel superior. Los canales individuales son subsecciones anidadas.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `cli` | `bool` | `true` | Habilitar el canal CLI interactivo |
| `message_timeout_secs` | `u64` | `300` | Timeout de procesamiento por mensaje (LLM + herramientas) |

### `[channels_config.telegram]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `bot_token` | `string` | *(requerido)* | Token del Bot API de Telegram desde @BotFather |
| `allowed_users` | `string[]` | `[]` | IDs o nombres de usuario de Telegram permitidos. Vacio = denegar todos |
| `mention_only` | `bool` | `false` | En grupos, solo responder a mensajes que mencionen al bot con @ |
| `stream_mode` | `"off" \| "partial"` | `"off"` | Modo streaming: `off` envia respuesta completa, `partial` edita un borrador progresivamente |
| `draft_update_interval_ms` | `u64` | `1000` | Intervalo minimo entre ediciones de borrador (proteccion contra limites de velocidad) |
| `interrupt_on_new_message` | `bool` | `false` | Cancelar respuesta en curso cuando el mismo usuario envia un nuevo mensaje |

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF..."
allowed_users = ["alice", "bob"]
mention_only = true
stream_mode = "partial"
```

### `[channels_config.discord]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `bot_token` | `string` | *(requerido)* | Token del bot de Discord desde el Developer Portal |
| `guild_id` | `string?` | `null` | Restringir a un unico guild (servidor) |
| `allowed_users` | `string[]` | `[]` | IDs de usuario de Discord permitidos. Vacio = denegar todos |
| `listen_to_bots` | `bool` | `false` | Procesar mensajes de otros bots (los propios siempre se ignoran) |
| `mention_only` | `bool` | `false` | Solo responder a @menciones |

```toml
[channels_config.discord]
bot_token = "MTIz..."
guild_id = "987654321"
allowed_users = ["111222333"]
mention_only = true
```

### `[channels_config.slack]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `bot_token` | `string` | *(requerido)* | Token OAuth del bot de Slack (`xoxb-...`) |
| `app_token` | `string?` | `null` | Token de nivel de aplicacion para Socket Mode (`xapp-...`) |
| `channel_id` | `string?` | `null` | Restringir a un unico canal |
| `allowed_users` | `string[]` | `[]` | IDs de usuario de Slack permitidos. Vacio = denegar todos |
| `mention_only` | `bool` | `false` | Solo responder a @menciones en grupos |

### `[channels_config.lark]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `app_id` | `string` | *(requerido)* | App ID de Lark/Feishu |
| `app_secret` | `string` | *(requerido)* | App Secret de Lark/Feishu |
| `encrypt_key` | `string?` | `null` | Clave de cifrado de eventos |
| `verification_token` | `string?` | `null` | Token de verificacion de eventos |
| `allowed_users` | `string[]` | `[]` | IDs de usuario permitidos. Vacio = denegar todos |
| `use_feishu` | `bool` | `false` | Usar endpoints API de Feishu (China) en lugar de Lark (internacional) |
| `receive_mode` | `"websocket" \| "webhook"` | `"websocket"` | Modo de recepcion de mensajes |
| `port` | `u16?` | `null` | Puerto de escucha de webhook (solo para modo webhook) |
| `mention_only` | `bool` | `false` | Solo responder a @menciones |

PRX tambien soporta estos canales adicionales (configurados bajo `[channels_config.*]`):

- **Matrix** -- `homeserver`, `access_token`, listas de salas permitidas
- **Signal** -- via API REST de signal-cli
- **WhatsApp** -- Cloud API o modo Web
- **iMessage** -- solo macOS, listas de contactos permitidos
- **DingTalk** -- Stream Mode con `client_id` / `client_secret`
- **QQ** -- SDK oficial de bot con `app_id` / `app_secret`
- **Email** -- IMAP/SMTP
- **IRC** -- Servidor, canal, nick
- **Mattermost** -- URL + token de bot
- **Nextcloud Talk** -- URL base + token de aplicacion
- **Webhook** -- Webhooks entrantes genericos

## `[memory]`

Backend de memoria para historial de conversacion, conocimiento y embeddings.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `backend` | `string` | `"sqlite"` | Tipo de backend: `"sqlite"`, `"lucid"`, `"postgres"`, `"markdown"`, `"none"` |
| `auto_save` | `bool` | `true` | Guardar automaticamente la entrada de conversacion del usuario en memoria |
| `acl_enabled` | `bool` | `false` | Habilitar listas de control de acceso de memoria |
| `hygiene_enabled` | `bool` | `true` | Ejecutar archivado periodico y limpieza de retencion |
| `archive_after_days` | `u32` | `7` | Archivar archivos diarios/de sesion mas antiguos que esto |
| `purge_after_days` | `u32` | `30` | Purgar archivos archivados mas antiguos que esto |
| `conversation_retention_days` | `u32` | `3` | SQLite: eliminar filas de conversacion mas antiguas que esto |
| `daily_retention_days` | `u32` | `7` | SQLite: eliminar filas diarias mas antiguas que esto |
| `embedding_provider` | `string` | `"none"` | Proveedor de embeddings: `"none"`, `"openai"`, `"custom:<URL>"` |
| `embedding_model` | `string` | `"text-embedding-3-small"` | Nombre del modelo de embeddings |
| `embedding_dimensions` | `usize` | `1536` | Dimensiones del vector de embeddings |
| `vector_weight` | `f64` | `0.7` | Peso de similitud vectorial en busqueda hibrida (0.0--1.0) |
| `keyword_weight` | `f64` | `0.3` | Peso de busqueda por palabras clave BM25 (0.0--1.0) |
| `min_relevance_score` | `f64` | `0.4` | Puntuacion hibrida minima para incluir memoria en contexto |
| `embedding_cache_size` | `usize` | `10000` | Entradas maximas de cache de embeddings antes de eviccion LRU |
| `snapshot_enabled` | `bool` | `false` | Exportar memorias centrales a `MEMORY_SNAPSHOT.md` |
| `snapshot_on_hygiene` | `bool` | `false` | Ejecutar snapshot durante pasadas de higiene |
| `auto_hydrate` | `bool` | `true` | Cargar automaticamente desde snapshot cuando falta `brain.db` |

```toml
[memory]
backend = "sqlite"
auto_save = true
embedding_provider = "openai"
embedding_model = "text-embedding-3-small"
embedding_dimensions = 1536
vector_weight = 0.7
keyword_weight = 0.3
```

## `[router]`

Router heuristico de LLM para despliegues multi-modelo. Puntua modelos candidatos usando una formula ponderada que combina capacidad, calificacion Elo, costo y latencia.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar enrutamiento heuristico |
| `alpha` | `f32` | `0.0` | Peso de puntuacion de similitud |
| `beta` | `f32` | `0.5` | Peso de puntuacion de capacidad |
| `gamma` | `f32` | `0.3` | Peso de puntuacion Elo |
| `delta` | `f32` | `0.1` | Coeficiente de penalizacion de costo |
| `epsilon` | `f32` | `0.1` | Coeficiente de penalizacion de latencia |
| `knn_enabled` | `bool` | `false` | Habilitar enrutamiento semantico KNN desde historial |
| `knn_min_records` | `usize` | `10` | Registros minimos de historial antes de que KNN afecte el enrutamiento |
| `knn_k` | `usize` | `7` | Numero de vecinos mas cercanos para votacion |

### `[router.automix]`

Politica de escalamiento adaptativo: comienza con un modelo economico, escala a premium cuando cae la confianza.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar escalamiento Automix |
| `confidence_threshold` | `f32` | `0.7` | Escalar cuando la confianza cae por debajo de esto (0.0--1.0) |
| `cheap_model_tiers` | `string[]` | `[]` | Niveles de modelo considerados "economico-primero" |
| `premium_model_id` | `string` | `""` | Modelo usado para escalamiento |

```toml
[router]
enabled = true
beta = 0.5
gamma = 0.3
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

## `[security]`

Seguridad a nivel de SO: sandboxing, limites de recursos y logging de auditoria.

### `[security.sandbox]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool?` | `null` (auto-detectar) | Habilitar aislamiento sandbox |
| `backend` | `string` | `"auto"` | Backend: `"auto"`, `"landlock"`, `"firejail"`, `"bubblewrap"`, `"docker"`, `"none"` |
| `firejail_args` | `string[]` | `[]` | Argumentos personalizados de Firejail |

### `[security.resources]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `max_memory_mb` | `u32` | `512` | Memoria maxima por comando (MB) |
| `max_cpu_time_seconds` | `u64` | `60` | Tiempo maximo de CPU por comando |
| `max_subprocesses` | `u32` | `10` | Numero maximo de subprocesos |
| `memory_monitoring` | `bool` | `true` | Habilitar monitoreo de uso de memoria |

### `[security.audit]`

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar logging de auditoria |
| `log_path` | `string` | `"audit.log"` | Ruta del archivo de log de auditoria (relativa al directorio de config) |
| `max_size_mb` | `u32` | `100` | Tamano maximo del log antes de rotacion |
| `sign_events` | `bool` | `false` | Firmar eventos con HMAC para evidencia de manipulacion |

```toml
[security.sandbox]
backend = "landlock"

[security.resources]
max_memory_mb = 1024
max_cpu_time_seconds = 120

[security.audit]
enabled = true
sign_events = true
```

## `[observability]`

Backend de metricas y trazado distribuido.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `backend` | `string` | `"none"` | Backend: `"none"`, `"log"`, `"prometheus"`, `"otel"` |
| `otel_endpoint` | `string?` | `null` | URL del endpoint OTLP (ej., `"http://localhost:4318"`) |
| `otel_service_name` | `string?` | `null` | Nombre del servicio para el colector OTel (por defecto `"prx"`) |

```toml
[observability]
backend = "otel"
otel_endpoint = "http://localhost:4318"
otel_service_name = "prx-production"
```

## `[mcp]`

Integracion del servidor [Model Context Protocol](https://modelcontextprotocol.io/). PRX actua como cliente MCP, conectandose a servidores MCP externos para herramientas adicionales.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar integracion de cliente MCP |

### `[mcp.servers.<nombre>]`

Cada servidor nombrado es una subseccion bajo `[mcp.servers]`.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Interruptor de habilitacion por servidor |
| `transport` | `"stdio" \| "http"` | `"stdio"` | Tipo de transporte |
| `command` | `string?` | `null` | Comando para modo stdio |
| `args` | `string[]` | `[]` | Argumentos del comando para modo stdio |
| `url` | `string?` | `null` | URL para transporte HTTP |
| `env` | `map<string, string>` | `{}` | Variables de entorno para modo stdio |
| `startup_timeout_ms` | `u64` | `10000` | Timeout de inicio |
| `request_timeout_ms` | `u64` | `30000` | Timeout por solicitud |
| `tool_name_prefix` | `string` | `"mcp"` | Prefijo para nombres de herramientas expuestas |
| `allow_tools` | `string[]` | `[]` | Lista blanca de herramientas (vacio = todas) |
| `deny_tools` | `string[]` | `[]` | Lista negra de herramientas |

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]

[mcp.servers.remote-api]
transport = "http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 60000
```

## `[browser]`

Configuracion de la herramienta de automatizacion de navegador.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar la herramienta `browser_open` |
| `allowed_domains` | `string[]` | `[]` | Dominios permitidos (coincidencia exacta o por subdominio) |
| `session_name` | `string?` | `null` | Sesion de navegador con nombre para automatizacion |

```toml
[browser]
enabled = true
allowed_domains = ["docs.rs", "github.com", "*.example.com"]
```

## `[web_search]`

Configuracion de herramientas de busqueda web y fetch de URL.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar la herramienta `web_search` |
| `provider` | `string` | `"duckduckgo"` | Proveedor de busqueda: `"duckduckgo"` (gratuito) o `"brave"` (requiere clave API) |
| `brave_api_key` | `string?` | `null` | Clave API de Brave Search |
| `max_results` | `usize` | `5` | Resultados maximos por busqueda (1--10) |
| `timeout_secs` | `u64` | `15` | Timeout de solicitud |
| `fetch_enabled` | `bool` | `true` | Habilitar la herramienta `web_fetch` |
| `fetch_max_chars` | `usize` | `10000` | Caracteres maximos devueltos por `web_fetch` |

```toml
[web_search]
enabled = true
provider = "brave"
brave_api_key = "BSA..."
max_results = 5
fetch_enabled = true
```

## `[xin]`

Motor de tareas autonomas Xin (corazon/mente) -- programa y ejecuta tareas en segundo plano incluyendo evolucion, comprobaciones de aptitud y operaciones de higiene.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar el motor de tareas Xin |
| `interval_minutes` | `u32` | `5` | Intervalo de tick en minutos (minimo 1) |
| `max_concurrent` | `usize` | `4` | Ejecuciones concurrentes maximas de tareas por tick |
| `max_tasks` | `usize` | `128` | Tareas totales maximas en el almacen |
| `stale_timeout_minutes` | `u32` | `60` | Minutos antes de marcar una tarea en ejecucion como obsoleta |
| `builtin_tasks` | `bool` | `true` | Auto-registrar tareas integradas del sistema |
| `evolution_integration` | `bool` | `false` | Permitir que Xin gestione la programacion de evolucion/aptitud |

```toml
[xin]
enabled = true
interval_minutes = 10
max_concurrent = 4
builtin_tasks = true
evolution_integration = true
```

## `[cost]`

Limites de gasto y precios por modelo para seguimiento de costos.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar seguimiento de costos |
| `daily_limit_usd` | `f64` | `10.0` | Limite de gasto diario en USD |
| `monthly_limit_usd` | `f64` | `100.0` | Limite de gasto mensual en USD |
| `warn_at_percent` | `u8` | `80` | Advertir cuando el gasto alcance este porcentaje del limite |
| `allow_override` | `bool` | `false` | Permitir solicitudes que excedan el presupuesto con la opcion `--override` |

```toml
[cost]
enabled = true
daily_limit_usd = 25.0
monthly_limit_usd = 500.0
warn_at_percent = 80
```

## `[reliability]`

Configuracion de cadena de reintentos y respaldo para acceso resiliente a proveedores.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `max_retries` | `u32` | `3` | Intentos maximos de reintento para fallos transitorios |
| `fallback_providers` | `string[]` | `[]` | Lista ordenada de nombres de proveedores de respaldo |

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

## `[secrets]`

Almacen de credenciales cifrado usando ChaCha20-Poly1305.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `encrypt` | `bool` | `true` | Habilitar cifrado para claves API y tokens en la configuracion |

## `[auth]`

Ajustes de importacion de credenciales externas.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `codex_auth_json_auto_import` | `bool` | `true` | Auto-importar credenciales OAuth de Codex CLI `auth.json` |
| `codex_auth_json_path` | `string` | `"~/.codex/auth.json"` | Ruta al archivo auth de Codex CLI |

## `[proxy]`

Configuracion de proxy de salida HTTP/HTTPS/SOCKS5.

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `false` | Habilitar proxy |
| `http_proxy` | `string?` | `null` | URL del proxy HTTP |
| `https_proxy` | `string?` | `null` | URL del proxy HTTPS |
| `all_proxy` | `string?` | `null` | Proxy de respaldo para todos los esquemas |
| `no_proxy` | `string[]` | `[]` | Lista de exclusion (mismo formato que `NO_PROXY`) |
| `scope` | `string` | `"zeroclaw"` | Alcance: `"environment"`, `"zeroclaw"`, `"services"` |
| `services` | `string[]` | `[]` | Selectores de servicios cuando el alcance es `"services"` |

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1", "*.internal"]
scope = "zeroclaw"
```
