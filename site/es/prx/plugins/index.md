---
title: Sistema de plugins
description: Vision general del sistema de plugins basado en WASM de PRX para extender las capacidades del agente.
---

# Sistema de plugins

PRX soporta un sistema de plugins WebAssembly (WASM) que permite extender las capacidades del agente sin modificar la base de codigo principal. Los plugins se ejecutan en un runtime WASM aislado con acceso controlado a funciones del host.

## Vision general

El sistema de plugins proporciona:

- **Ejecucion aislada** -- los plugins se ejecutan en WASM con aislamiento de memoria
- **API de funciones del host** -- acceso controlado a HTTP, sistema de archivos y estado del agente
- **Recarga en caliente** -- cargar y descargar plugins sin reiniciar el daemon
- **Soporte multi-lenguaje** -- escribe plugins en Rust, Go, C o cualquier lenguaje que compile a WASM

## Tipos de plugins

| Tipo | Descripcion | Ejemplo |
|------|-------------|---------|
| **Plugins de herramientas** | Agregar nuevas herramientas al agente | Integraciones de API personalizadas |
| **Plugins de canal** | Agregar nuevos canales de mensajeria | Plataforma de chat personalizada |
| **Plugins de filtro** | Pre/post-procesar mensajes | Moderacion de contenido |
| **Plugins de proveedor** | Agregar nuevos proveedores LLM | Endpoints de modelos personalizados |

## Inicio rapido

```bash
# Install a plugin from a URL
prx plugin install https://example.com/my-plugin.wasm

# List installed plugins
prx plugin list

# Enable/disable a plugin
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## Configuracion

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## Paginas relacionadas

- [Arquitectura](./architecture)
- [Guia del desarrollador](./developer-guide)
- [Funciones del host](./host-functions)
- [PDK (Kit de desarrollo de plugins)](./pdk)
- [Ejemplos](./examples)
