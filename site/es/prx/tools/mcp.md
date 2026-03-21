---
title: Integracion MCP
description: Cliente del Model Context Protocol para conectar a servidores MCP externos via transportes stdio o HTTP con descubrimiento dinamico de herramientas y namespacing.
---

# Integracion MCP

PRX implementa un cliente del Model Context Protocol (MCP) que conecta a servidores MCP externos y expone sus herramientas al agente. MCP es un protocolo abierto que estandariza como las aplicaciones LLM se comunican con proveedores de herramientas externos, permitiendo a PRX integrarse con un ecosistema creciente de servidores compatibles con MCP para sistemas de archivos, bases de datos, APIs y mas.

La herramienta `mcp` tiene gate de caracteristica y requiere `mcp.enabled = true` con al menos un servidor definido. PRX soporta transporte stdio (comunicacion con proceso local) y transporte HTTP (comunicacion con servidor remoto). Las herramientas de servidores MCP se descubren dinamicamente en tiempo de ejecucion via el metodo de protocolo `tools/list` y tienen namespace para evitar colisiones con herramientas integradas.

## Configuracion

### Definiciones de servidor en config.toml

```toml
[mcp]
enabled = true

# -- Transporte stdio (proceso local) --------------------------------
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

# -- Transporte HTTP (servidor remoto) --------------------------------
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"
```

### Configuracion por servidor

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar este servidor |
| `transport` | `string` | `"stdio"` | Tipo de transporte: `"stdio"`, `"http"`, `"streamable_http"` |
| `command` | `string` | -- | Comando para transporte stdio |
| `args` | `string[]` | `[]` | Argumentos para el comando stdio |
| `url` | `string` | -- | URL para transporte HTTP |
| `env` | `map` | `{}` | Variables de entorno para proceso stdio |
| `tool_name_prefix` | `string` | `"mcp"` | Prefijo para nombres de herramientas |
| `allow_tools` | `string[]` | `[]` | Lista de herramientas permitidas (vacia = permitir todas las descubiertas) |
| `deny_tools` | `string[]` | `[]` | Lista de herramientas denegadas (tiene precedencia sobre la lista permitida) |

### mcp.json local del espacio de trabajo

PRX descubre servidores MCP desde un archivo `mcp.json` local del espacio de trabajo, siguiendo el mismo formato que VS Code y Claude Desktop. Los comandos en `mcp.json` estan restringidos a una lista blanca de lanzadores seguros.

## Seguridad

### Sanitizacion de variables de entorno

PRX automaticamente elimina variables de entorno peligrosas de los procesos de servidor MCP: `LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH`, `PYTHONSTARTUP`, `RUBYOPT`, `PERL5OPT`.

### Lista blanca de comandos para mcp.json

El formato de archivo `mcp.json` restringe comandos a una lista blanca de lanzadores conocidos y seguros para prevenir ejecucion de binarios arbitrarios.

### Listas de permitir/denegar herramientas

El filtrado de herramientas por servidor controla que herramientas se exponen al agente. La lista de denegar tiene precedencia sobre la lista de permitir.

## Relacionado

- [Referencia de configuracion](/es/prx/config/reference) -- configuraciones `[mcp]` y `[mcp.servers]`
- [Vision general de herramientas](/es/prx/tools/) -- herramientas integradas e integracion MCP
- [Sandbox de seguridad](/es/prx/security/sandbox) -- sandbox para procesos de servidor MCP
- [Gestion de secretos](/es/prx/security/secrets) -- almacenamiento cifrado para credenciales de servidor MCP
