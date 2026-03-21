---
title: Vision general de herramientas
description: PRX proporciona mas de 46 herramientas integradas organizadas en 12 categorias. Las herramientas son capacidades que el agente puede invocar durante bucles agenticos para interactuar con el SO, la red, la memoria y servicios externos.
---

# Vision general de herramientas

Las herramientas son las capacidades que un agente PRX puede invocar durante su bucle de razonamiento. Cuando el LLM decide que necesita realizar una accion -- ejecutar un comando, leer un archivo, buscar en la web, almacenar un recuerdo -- llama a una herramienta por nombre con argumentos JSON estructurados. PRX ejecuta la herramienta, aplica politicas de seguridad y devuelve el resultado al LLM para el siguiente paso de razonamiento.

PRX incluye **mas de 46 herramientas integradas** en 12 categorias, desde E/S basica de archivos hasta automatizacion de navegador, delegacion multi-agente e integracion del protocolo MCP.

## Arquitectura de herramientas

Cada herramienta implementa el trait `Tool`:

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

Cada herramienta proporciona un JSON Schema para sus parametros, que se envia al LLM como definicion de funcion. El LLM genera llamadas estructuradas y PRX valida los argumentos contra el schema antes de la ejecucion.

## Registro de herramientas: `default_tools()` vs `all_tools()`

PRX usa un sistema de registro de dos niveles:

### `default_tools()` -- Nucleo minimo (3 herramientas)

El conjunto minimo de herramientas para agentes ligeros o restringidos. Siempre disponible, sin configuracion adicional requerida:

| Herramienta | Descripcion |
|------------|-------------|
| `shell` | Ejecucion de comandos de shell con aislamiento sandbox |
| `file_read` | Leer contenido de archivos (con reconocimiento de ACL) |
| `file_write` | Escribir contenido de archivos |

### `all_tools()` -- Registro completo (46+ herramientas)

El conjunto completo de herramientas, ensamblado basandose en tu configuracion. Las herramientas se registran condicionalmente dependiendo de que caracteristicas estan habilitadas:

- **Siempre registradas**: herramientas core, memoria, cron, programacion, git, vision, nodos, pushover, canvas, config proxy, schema
- **Condicionalmente registradas**: navegador (requiere `browser.enabled`), solicitudes HTTP (requiere `http_request.enabled`), busqueda web (requiere `web_search.enabled`), web fetch (requiere `web_search.fetch_enabled` + `browser.allowed_domains`), MCP (requiere `mcp.enabled`), Composio (requiere clave API), delegate/agents_list (requiere definiciones de agentes)

## Referencia por categoria

### Core (3 herramientas) -- Siempre disponibles

Las herramientas fundamentales presentes tanto en `default_tools()` como en `all_tools()`.

| Herramienta | Descripcion |
|------------|-------------|
| `shell` | Ejecutar comandos de shell con aislamiento sandbox configurable (Landlock/Firejail/Bubblewrap/Docker). Timeout de 60s, limite de salida de 1MB, entorno sanitizado. |
| `file_read` | Leer contenido de archivos con validacion de ruta. Cuando la ACL de memoria esta habilitada, bloquea acceso a archivos markdown de memoria para aplicar control de acceso. |
| `file_write` | Escribir contenido en archivos. Sujeto a verificaciones de politica de seguridad. |

### Memoria (5 herramientas)

Operaciones de memoria a largo plazo para almacenar, recuperar y gestionar el conocimiento persistente del agente.

| Herramienta | Descripcion |
|------------|-------------|
| `memory_store` | Almacenar hechos, preferencias o notas en memoria a largo plazo. Soporta categorias: `core` (permanente), `daily` (sesion), `conversation` (contexto de chat) o personalizada. |
| `memory_forget` | Eliminar entradas especificas de la memoria a largo plazo. |
| `memory_get` | Recuperar una entrada de memoria especifica por clave. Con reconocimiento de ACL cuando esta habilitada. |
| `memory_recall` | Recordar memorias por palabra clave o similitud semantica. Deshabilitada cuando la ACL de memoria esta habilitada. |
| `memory_search` | Busqueda de texto completo y vectorial en entradas de memoria. Con reconocimiento de ACL cuando esta habilitada. |

### Cron / Programacion (9 herramientas)

Automatizacion de tareas basada en tiempo y el motor de programacion Xin.

| Herramienta | Descripcion |
|------------|-------------|
| `cron` | Punto de entrada cron heredado -- crear o gestionar tareas programadas. |
| `cron_add` | Agregar un nuevo trabajo cron con expresion cron, comando y descripcion opcional. |
| `cron_list` | Listar todos los trabajos cron registrados con sus horarios y estado. |
| `cron_remove` | Eliminar un trabajo cron por ID. |
| `cron_update` | Actualizar el horario, comando o configuracion de un trabajo cron existente. |
| `cron_run` | Disparar manualmente un trabajo cron inmediatamente. |
| `cron_runs` | Ver historial de ejecucion y registros de ejecuciones de trabajos cron. |
| `schedule` | Programar una tarea unica o recurrente con expresiones de tiempo en lenguaje natural. |
| `xin` | El motor de programacion Xin -- programacion avanzada de tareas con cadenas de dependencia y ejecucion condicional. |

### Navegador / Vision (5 herramientas)

Automatizacion web y procesamiento de imagenes. Las herramientas de navegador requieren `[browser] enabled = true`.

| Herramienta | Descripcion |
|------------|-------------|
| `browser` | Automatizacion completa de navegador con backends intercambiables (CLI agent-browser, Rust nativo, sidecar computer-use). Soporta navegacion, llenado de formularios, clics, capturas de pantalla y acciones a nivel de SO. |
| `browser_open` | Apertura simple de URL en el navegador. Restringida por dominio via `browser.allowed_domains`. |
| `screenshot` | Capturar capturas de pantalla de la pantalla actual o ventanas especificas. |
| `image` | Procesar y transformar imagenes (redimensionar, recortar, convertir formatos). |
| `image_info` | Extraer metadatos y dimensiones de archivos de imagen. |

### Red (4 herramientas)

Solicitudes HTTP, busqueda web, web fetch e integracion del protocolo MCP.

| Herramienta | Descripcion |
|------------|-------------|
| `http_request` | Realizar solicitudes HTTP a APIs. Denegar por defecto: solo los `allowed_domains` son alcanzables. Timeout y tamano maximo de respuesta configurables. |
| `web_search_tool` | Buscar en la web via DuckDuckGo (gratis, sin clave) o Brave Search (requiere clave API). |
| `web_fetch` | Obtener y extraer contenido de paginas web. Requiere `web_search.fetch_enabled` y `browser.allowed_domains` configurados. |
| `mcp` | Cliente del Model Context Protocol -- conectar a servidores MCP externos (transportes stdio o HTTP) e invocar sus herramientas. Soporta descubrimiento local de `mcp.json` en el espacio de trabajo. |

### Mensajeria (2 herramientas)

Enviar mensajes de vuelta a traves de canales de comunicacion.

| Herramienta | Descripcion |
|------------|-------------|
| `message_send` | Enviar un mensaje (texto, multimedia, voz) a cualquier canal configurado y destinatario. Enruta automaticamente al canal activo. |
| `gateway` | Acceso de bajo nivel al gateway para enviar mensajes sin procesar a traves del gateway HTTP/WebSocket Axum. |

### Sesiones / Agentes (8 herramientas)

Orquestacion multi-agente: generar sub-agentes, delegar tareas y gestionar sesiones concurrentes.

| Herramienta | Descripcion |
|------------|-------------|
| `sessions_spawn` | Generar un sub-agente asincrono que se ejecuta en segundo plano. Retorna inmediatamente con un ID de ejecucion; el resultado se anuncia automaticamente al completarse. Soporta acciones `history` y `steer`. |
| `sessions_send` | Enviar un mensaje a una sesion de sub-agente en ejecucion. |
| `sessions_list` | Listar todas las sesiones activas de sub-agentes con estado. |
| `sessions_history` | Ver el registro de conversacion de una ejecucion de sub-agente. |
| `session_status` | Verificar el estado de una sesion especifica. |
| `subagents` | Gestionar el pool de sub-agentes -- listar, detener o inspeccionar sub-agentes. |
| `agents_list` | Listar todos los agentes delegados configurados con sus modelos y capacidades. Solo registrada cuando se definen agentes en la configuracion. |
| `delegate` | Delegar una tarea a un agente con nombre con su propio proveedor, modelo y conjunto de herramientas. Soporta credenciales de respaldo y bucles agenticos aislados. |

### Dispositivos remotos (2 herramientas)

Interactuar con nodos remotos y notificaciones push.

| Herramienta | Descripcion |
|------------|-------------|
| `nodes` | Gestionar y comunicarse con nodos PRX remotos en un despliegue distribuido. |
| `pushover` | Enviar notificaciones push via el servicio Pushover. |

### Git (1 herramienta)

Operaciones de control de versiones.

| Herramienta | Descripcion |
|------------|-------------|
| `git_operations` | Realizar operaciones Git (status, diff, commit, push, pull, log, branch) en el repositorio del espacio de trabajo. |

### Configuracion (2 herramientas)

Gestion de configuracion en tiempo de ejecucion.

| Herramienta | Descripcion |
|------------|-------------|
| `config_reload` | Recargar en caliente el archivo de configuracion PRX sin reiniciar el proceso. |
| `proxy_config` | Ver y modificar la configuracion de proxy/red en tiempo de ejecucion. |

### Integracion de terceros (1 herramienta)

Conectores de plataformas externas.

| Herramienta | Descripcion |
|------------|-------------|
| `composio` | Conectar a mas de 250 aplicaciones y servicios via la plataforma Composio. Requiere una clave API de Composio. |

### Renderizado (2 herramientas)

Generacion de contenido y formateo de salida.

| Herramienta | Descripcion |
|------------|-------------|
| `canvas` | Renderizar contenido estructurado (tablas, graficos, diagramas) para salida visual. |
| `tts` | Texto a voz -- convertir texto en un mensaje de voz y enviarlo a la conversacion actual. Maneja generacion de MP3, conversion a M4A y entrega automaticamente. |

### Admin (1 herramienta)

Schema interno y diagnosticos.

| Herramienta | Descripcion |
|------------|-------------|
| `schema` | Limpieza y normalizacion de JSON Schema para compatibilidad LLM entre proveedores. Resuelve `$ref`, aplana uniones, elimina palabras clave no soportadas. |

## Matriz completa de herramientas

| Herramienta | Categoria | Por defecto | Condicion |
|------------|-----------|-------------|-----------|
| `shell` | Core | Si | Siempre |
| `file_read` | Core | Si | Siempre |
| `file_write` | Core | Si | Siempre |
| `memory_store` | Memoria | -- | `all_tools()` |
| `memory_forget` | Memoria | -- | `all_tools()` |
| `memory_get` | Memoria | -- | `all_tools()` |
| `memory_recall` | Memoria | -- | `all_tools()`, deshabilitada cuando `memory.acl_enabled = true` |
| `memory_search` | Memoria | -- | `all_tools()` |
| `cron` | Cron | -- | `all_tools()` |
| `cron_add` | Cron | -- | `all_tools()` |
| `cron_list` | Cron | -- | `all_tools()` |
| `cron_remove` | Cron | -- | `all_tools()` |
| `cron_update` | Cron | -- | `all_tools()` |
| `cron_run` | Cron | -- | `all_tools()` |
| `cron_runs` | Cron | -- | `all_tools()` |
| `schedule` | Programacion | -- | `all_tools()` |
| `xin` | Programacion | -- | `all_tools()` |
| `browser` | Navegador | -- | `browser.enabled = true` |
| `browser_open` | Navegador | -- | `browser.enabled = true` |
| `screenshot` | Vision | -- | `all_tools()` |
| `image` | Vision | -- | `all_tools()` (implicito, via ImageTool) |
| `image_info` | Vision | -- | `all_tools()` |
| `http_request` | Red | -- | `http_request.enabled = true` |
| `web_search_tool` | Red | -- | `web_search.enabled = true` |
| `web_fetch` | Red | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | Red | -- | `mcp.enabled = true` + servidores definidos |
| `message_send` | Mensajeria | -- | Canal activo (registrada a nivel de gateway) |
| `gateway` | Mensajeria | -- | `all_tools()` |
| `sessions_spawn` | Sesiones | -- | `all_tools()` |
| `sessions_send` | Sesiones | -- | `all_tools()` |
| `sessions_list` | Sesiones | -- | `all_tools()` |
| `sessions_history` | Sesiones | -- | `all_tools()` |
| `session_status` | Sesiones | -- | `all_tools()` |
| `subagents` | Sesiones | -- | `all_tools()` |
| `agents_list` | Agentes | -- | Secciones `[agents.*]` definidas |
| `delegate` | Agentes | -- | Secciones `[agents.*]` definidas |
| `nodes` | Remoto | -- | `all_tools()` |
| `pushover` | Remoto | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | Config | -- | `all_tools()` |
| `proxy_config` | Config | -- | `all_tools()` |
| `composio` | Terceros | -- | `composio.api_key` configurada |
| `canvas` | Renderizado | -- | `all_tools()` |
| `tts` | Renderizado | -- | Canal activo (registrada a nivel de gateway) |
| `schema` | Admin | -- | Interno (modulo de normalizacion de schema) |

## Habilitar y deshabilitar herramientas

### Herramientas con gate de caracteristica

Muchas herramientas se habilitan a traves de sus secciones de configuracion respectivas. Agrega estas a tu `config.toml`:

```toml
# -- Herramientas de navegador ----------------------------------------
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# -- Herramienta de solicitud HTTP ------------------------------------
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# -- Herramienta de busqueda web --------------------------------------
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (gratis) o "brave" (requiere clave API)
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# Tambien habilitar web_fetch para extraccion de contenido de paginas:
fetch_enabled = true
fetch_max_chars = 50000

# -- Integracion Composio ---------------------------------------------
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### Pipeline de politica de herramientas

Para control granular, usa la seccion `[security.tool_policy]` para permitir, denegar o supervisar herramientas individuales o grupos:

```toml
[security.tool_policy]
# Politica por defecto: "allow", "deny" o "supervised"
default = "allow"

# Politicas a nivel de grupo
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# Sobreescrituras por herramienta (mayor prioridad)
[security.tool_policy.tools]
shell = "supervised"     # Requiere aprobacion antes de la ejecucion
gateway = "allow"
composio = "deny"        # Deshabilitar Composio incluso si la clave API esta configurada
```

Orden de resolucion de politica (mayor prioridad primero):
1. Politica por herramienta (`security.tool_policy.tools.<nombre>`)
2. Politica de grupo (`security.tool_policy.groups.<grupo>`)
3. Politica por defecto (`security.tool_policy.default`)

### Restricciones de herramientas para agentes delegados

Al configurar agentes delegados, puedes restringir a que herramientas pueden acceder:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## Integracion de herramientas MCP

PRX implementa el cliente del Model Context Protocol (MCP), permitiendole conectar a servidores MCP externos y exponer sus herramientas al agente.

### Configuracion

Define servidores MCP en `config.toml`:

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### `mcp.json` local del espacio de trabajo

PRX tambien descubre servidores MCP desde un archivo `mcp.json` local del espacio de trabajo, siguiendo el mismo formato que VS Code y Claude Desktop:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

Los comandos en `mcp.json` estan restringidos a una lista blanca de lanzadores seguros: `npx`, `node`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `docker`, `cargo`, `go`, `ruby`, `php`, `dotnet`, `java`.

### Descubrimiento dinamico de herramientas

Las herramientas MCP se descubren en tiempo de ejecucion via el metodo de protocolo `tools/list`. Las herramientas de cada servidor MCP tienen namespace y se exponen al LLM como funciones invocables. La herramienta `mcp` soporta un hook `refresh()` que re-descubre herramientas antes de cada turno del agente.

Las variables de entorno peligrosas (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH`, etc.) se eliminan automaticamente de los procesos del servidor MCP.

## Seguridad: Sandbox y ACL

### Sandboxing de herramientas

La herramienta `shell` ejecuta comandos dentro de un sandbox configurable. PRX soporta 4 backends de sandbox mas un fallback sin operacion:

```toml
[security.sandbox]
enabled = true           # None = auto-detectar, true/false = explicito
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Argumentos personalizados de Firejail (cuando backend = "firejail")
firejail_args = ["--net=none", "--noroot"]
```

| Backend | Plataforma | Nivel de aislamiento | Notas |
|---------|-----------|---------------------|-------|
| Landlock | Linux (LSM del kernel) | Sistema de archivos | Nativo del kernel, sin dependencias extra |
| Firejail | Linux | Completo (red, sistema de archivos, PID) | Espacio de usuario, ampliamente disponible |
| Bubblewrap | Linux, macOS | Basado en namespaces | Namespaces de usuario, ligero |
| Docker | Cualquiera | Contenedor | Aislamiento completo de contenedor |
| None | Cualquiera | Solo capa de aplicacion | Sin aislamiento a nivel de SO |

El modo auto-detectar (`backend = "auto"`) busca backends disponibles en orden: Landlock, Firejail, Bubblewrap, Docker, y luego recurre a None con una advertencia.

### Sanitizacion del entorno shell

La herramienta `shell` solo pasa una lista blanca estricta de variables de entorno a los procesos hijo: `PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`. Las claves API, tokens y secretos nunca se exponen.

### ACL de memoria

Cuando `memory.acl_enabled = true`, el control de acceso se aplica en las operaciones de memoria:

- `file_read` bloquea el acceso a archivos markdown de memoria
- `memory_recall` se deshabilita completamente (se elimina del registro de herramientas)
- `memory_get` y `memory_search` aplican restricciones de acceso por principal

### Politica de seguridad

Cada llamada a herramienta pasa por la capa `SecurityPolicy` antes de la ejecucion. El motor de politicas puede:

- Bloquear operaciones basandose en reglas de politica de herramientas
- Requerir aprobacion del supervisor para herramientas `supervised`
- Auditar todas las invocaciones de herramientas
- Aplicar limites de tasa y restricciones de recursos

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## Extender: Escribir herramientas personalizadas

Para agregar una nueva herramienta:

1. Crear un nuevo modulo en `src/tools/` implementando el trait `Tool`
2. Registrarlo en `all_tools_with_runtime_ext()` en `src/tools/mod.rs`
3. Agregar las entradas `pub mod` y `pub use` en `mod.rs`

Ejemplo:

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "Does something useful."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "The input value" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("Processed: {input}"),
            error: None,
        })
    }
}
```

Consulta la seccion 7.3 de `AGENTS.md` para la guia completa de cambios.
