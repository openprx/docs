---
title: Busqueda web
description: Buscar en la web via DuckDuckGo (gratis, sin clave API) o Brave Search (requiere clave API) con limites de resultados y timeouts configurables.
---

# Busqueda web

La herramienta `web_search_tool` permite a los agentes PRX buscar en la web informacion actual. Soporta dos proveedores de busqueda -- DuckDuckGo (gratis, sin clave API requerida) y Brave Search (requiere clave API) -- y devuelve resultados de busqueda estructurados.

La busqueda web tiene gate de caracteristica y requiere `web_search.enabled = true`. Cuando esta habilitada, PRX tambien registra opcionalmente la herramienta `web_fetch` para extraer contenido completo de paginas desde URLs encontradas en resultados de busqueda.

## Configuracion

```toml
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (gratis) o "brave" (requiere clave API)
max_results = 5              # Maximo de resultados por busqueda (1-10)
timeout_secs = 10            # Timeout de solicitud en segundos

# Web fetch (extraccion de contenido de paginas)
fetch_enabled = true         # Habilitar la herramienta web_fetch
fetch_max_chars = 50000      # Maximo de caracteres devueltos por web_fetch
```

### Comparacion de proveedores

| Caracteristica | DuckDuckGo | Brave Search |
|---------------|-----------|-------------|
| Costo | Gratis | Nivel gratuito (2000 consultas/mes), planes de pago disponibles |
| Clave API | No requerida | Requerida (`brave_api_key`) |
| Calidad de resultados | Buena para consultas generales | Mayor calidad, mejor estructurada |
| Privacidad | Centrado en privacidad | Centrado en privacidad |

## Seguridad

### Restricciones de dominio para web_fetch

La herramienta `web_fetch` respeta la lista `browser.allowed_domains`. Esto previene que el agente obtenga contenido de URLs arbitrarias.

```toml
[browser]
allowed_domains = ["docs.rs", "crates.io", "github.com", "*.rust-lang.org"]
```

## Relacionado

- [Solicitud HTTP](/es/prx/tools/http-request) -- solicitudes HTTP programaticas a APIs
- [Herramienta de navegador](/es/prx/tools/browser) -- automatizacion completa de navegador para sitios con JavaScript pesado
- [Gestion de secretos](/es/prx/security/secrets) -- almacenamiento cifrado para claves API
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
