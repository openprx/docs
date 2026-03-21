---
title: Herramienta de navegador
description: Automatizacion completa de navegador con backends intercambiables para navegacion web, interaccion con formularios, capturas de pantalla y navegacion restringida por dominio.
---

# Herramienta de navegador

La herramienta de navegador proporciona a los agentes PRX capacidades completas de automatizacion web -- navegar paginas, llenar formularios, hacer clic en elementos, extraer contenido y capturar pantallas. Usa una arquitectura de backend intercambiable que soporta tres motores de automatizacion y aplica restricciones de dominio para prevenir acceso web no restringido.

Las herramientas de navegador tienen gate de caracteristica y requieren `browser.enabled = true` en la configuracion. Cuando estan habilitadas, PRX registra `browser` y `browser_open` en el registro de herramientas. La herramienta de navegador soporta flujos de trabajo web complejos de multiples pasos, mientras que `browser_open` proporciona una interfaz mas simple para abrir una URL y extraer su contenido.

PRX tambien incluye herramientas relacionadas con vision (`screenshot`, `image`, `image_info`) que complementan la herramienta de navegador para tareas visuales. Las capturas de pantalla capturadas por la herramienta de navegador pueden pasarse a LLMs con capacidad de vision para razonamiento visual.

## Configuracion

```toml
[browser]
enabled = true
backend = "agent_browser"       # "agent_browser" | "rust_native" | "computer_use"
allowed_domains = ["github.com", "docs.rs", "*.openprx.dev", "stackoverflow.com"]
session_name = "default"        # Sesion de navegador con nombre para estado persistente
```

### Opciones de backend

| Backend | Descripcion | Dependencias | Mejor para |
|---------|------------|-------------|----------|
| `agent_browser` | Llama al CLI `agent-browser`, una herramienta externa de navegador headless | Binario `agent-browser` en PATH | Automatizacion web general, sitios con JavaScript pesado |
| `rust_native` | Implementacion de navegador Rust integrada usando Chrome/Chromium headless | Chromium instalado | Automatizacion ligera, sin dependencias externas |
| `computer_use` | Sidecar computer-use para interaccion completa de escritorio | Sidecar computer-use de Anthropic | Interacciones a nivel de SO, flujos de trabajo GUI complejos |

### Restricciones de dominio

La lista `allowed_domains` controla a que dominios puede acceder el navegador. La coincidencia de dominios soporta:

- **Coincidencia exacta**: `"github.com"` coincide solo con `github.com`
- **Comodin de subdominio**: `"*.openprx.dev"` coincide con `docs.openprx.dev`, `api.openprx.dev`, etc.
- **Sin comodin**: Una lista vacia bloquea toda la navegacion del navegador

```toml
[browser]
allowed_domains = [
  "github.com",
  "*.github.com",
  "docs.rs",
  "crates.io",
  "stackoverflow.com",
  "*.openprx.dev"
]
```

## Uso

### Herramienta browser

La herramienta principal `browser` soporta multiples acciones para flujos de trabajo web complejos:

**Navegar a una URL:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "navigate",
    "url": "https://github.com/openprx/prx"
  }
}
```

**Llenar un campo de formulario:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "fill",
    "selector": "#search-input",
    "value": "PRX documentation"
  }
}
```

**Hacer clic en un elemento:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "click",
    "selector": "button[type='submit']"
  }
}
```

**Tomar una captura de pantalla:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "screenshot"
  }
}
```

**Extraer contenido de la pagina:**

```json
{
  "name": "browser",
  "arguments": {
    "action": "content"
  }
}
```

### Herramienta browser_open

Una herramienta simplificada para abrir una URL y devolver su contenido:

```json
{
  "name": "browser_open",
  "arguments": {
    "url": "https://docs.rs/tokio/latest/tokio/"
  }
}
```

### Ejemplo de flujo de trabajo de multiples pasos

Un flujo de trabajo tipico de investigacion podria encadenar multiples acciones del navegador:

1. Navegar a un motor de busqueda
2. Llenar el cuadro de busqueda con una consulta
3. Hacer clic en el boton de busqueda
4. Extraer resultados de la pagina
5. Navegar a un resultado relevante
6. Extraer el contenido detallado
7. Tomar una captura de pantalla como referencia visual

## Parametros

### Parametros de browser

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `action` | `string` | Si | -- | Accion a realizar: `"navigate"`, `"fill"`, `"click"`, `"screenshot"`, `"content"`, `"scroll"`, `"wait"`, `"back"`, `"forward"` |
| `url` | `string` | Condicional | -- | URL a la que navegar (requerida para accion `"navigate"`) |
| `selector` | `string` | Condicional | -- | Selector CSS para el elemento objetivo (requerido para `"fill"`, `"click"`) |
| `value` | `string` | Condicional | -- | Valor a llenar (requerido para accion `"fill"`) |
| `timeout_ms` | `integer` | No | `30000` | Tiempo maximo de espera para que la accion se complete |

### Parametros de browser_open

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `url` | `string` | Si | -- | URL para abrir y extraer contenido |

### Parametros de herramientas de vision

**screenshot:**

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `target` | `string` | No | `"screen"` | Que capturar: `"screen"` o un identificador de ventana |

**image:**

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `action` | `string` | Si | -- | Operacion de imagen: `"resize"`, `"crop"`, `"convert"` |
| `path` | `string` | Si | -- | Ruta al archivo de imagen |

**image_info:**

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `path` | `string` | Si | -- | Ruta al archivo de imagen a inspeccionar |

## Detalles del backend

### agent-browser

El backend `agent_browser` delega a la herramienta CLI externa `agent-browser`, que proporciona un entorno de automatizacion basado en Chrome headless. La comunicacion ocurre sobre stdio con mensajes JSON-RPC.

Ventajas:
- Ejecucion completa de JavaScript
- Persistencia de cookies y sesion
- Soporte de extensiones

### rust_native

El backend `rust_native` usa enlaces Rust para controlar una instalacion local de Chromium/Chrome directamente. Se comunica via el Chrome DevTools Protocol (CDP).

Ventajas:
- Sin dependencia de binario externo (mas alla de Chromium)
- Menor latencia que generar un subproceso
- Integracion mas estrecha con los internos de PRX

### computer_use

El backend `computer_use` aprovecha el sidecar computer-use de Anthropic para realizar interacciones a nivel de SO incluyendo movimiento del raton, entrada de teclado y captura de pantalla. Esto va mas alla de la automatizacion del navegador hacia el control completo del escritorio.

Ventajas:
- Puede interactuar con aplicaciones nativas, no solo navegadores
- Soporta flujos de trabajo GUI complejos
- Maneja popups, dialogos de archivos y prompts del sistema

## Seguridad

### Lista de dominios permitidos

La herramienta de navegador aplica una lista estricta de dominios permitidos. Antes de navegar a cualquier URL:

1. La URL se analiza y se extrae el nombre de host
2. El nombre de host se verifica contra `allowed_domains`
3. Si no se encuentra coincidencia, la navegacion se bloquea y se devuelve un error

Esto previene que el agente acceda a sitios web arbitrarios, lo que podria exponerlo a contenido malicioso o disparar acciones no deseadas en sesiones autenticadas.

### Aislamiento de sesion

Las sesiones de navegador se aislan por nombre. Diferentes sesiones de agente o sub-agentes pueden usar contextos de navegador separados para prevenir fuga de estado (cookies, localStorage, datos de sesion).

### Limites de extraccion de contenido

La extraccion de contenido de paginas esta sujeta al limite `web_search.fetch_max_chars` para prevenir agotamiento de memoria por paginas excesivamente grandes.

### Motor de politicas

Las llamadas a herramientas de navegador pasan por el motor de politicas de seguridad. La herramienta puede ser denegada completamente o supervisada para requerir aprobacion para cada navegacion:

```toml
[security.tool_policy.tools]
browser = "supervised"
browser_open = "allow"
```

### Seguridad de credenciales

La herramienta de navegador no inyecta credenciales ni tokens de autenticacion en las sesiones del navegador. Si el agente necesita autenticarse en un sitio web, debe usar la herramienta de navegador para llenar formularios de inicio de sesion explicitamente, lo cual esta sujeto a politicas de supervision.

## Relacionado

- [Busqueda web](/es/prx/tools/web-search) -- buscar en la web sin automatizacion de navegador
- [Solicitud HTTP](/es/prx/tools/http-request) -- solicitudes HTTP programaticas a APIs
- [Ejecucion shell](/es/prx/tools/shell) -- alternativa para interacciones web basadas en CLI (curl, wget)
- [Sandbox de seguridad](/es/prx/security/sandbox) -- aislamiento de proceso para ejecucion de herramientas
- [Referencia de configuracion](/es/prx/config/reference) -- campos de configuracion `[browser]`
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
