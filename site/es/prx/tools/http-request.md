---
title: Solicitud HTTP
description: Realizar solicitudes HTTP a APIs con lista de dominios permitidos, limites de tamano de respuesta configurables y aplicacion de timeout.
---

# Solicitud HTTP

La herramienta `http_request` permite a los agentes PRX realizar solicitudes HTTP directas a APIs externas. Esta disenada para interacciones API estructuradas -- obtener datos JSON, llamar endpoints REST, publicar webhooks -- en lugar de navegacion web general. La herramienta aplica una politica de dominio denegar-por-defecto: solo los dominios explicitamente listados en `allowed_domains` son alcanzables.

La solicitud HTTP tiene gate de caracteristica y requiere `http_request.enabled = true` en la configuracion. La herramienta soporta todos los metodos HTTP estandar (GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS), cabeceras personalizadas, cuerpos de solicitud y timeouts configurables.

## Configuracion

```toml
[http_request]
enabled = true
allowed_domains = [
  "api.github.com",
  "api.openai.com",
  "api.anthropic.com",
  "httpbin.org"
]
max_response_size = 1000000   # Tamano maximo del cuerpo de respuesta en bytes (1 MB)
timeout_secs = 30             # Timeout de solicitud en segundos
```

## Parametros

| Parametro | Tipo | Requerido | Por defecto | Descripcion |
|-----------|------|-----------|-------------|-------------|
| `method` | `string` | No | `"GET"` | Metodo HTTP: `"GET"`, `"POST"`, `"PUT"`, `"PATCH"`, `"DELETE"`, `"HEAD"`, `"OPTIONS"` |
| `url` | `string` | Si | -- | La URL completa a solicitar. El dominio debe estar en `allowed_domains`. |
| `headers` | `object` | No | `{}` | Mapa clave-valor de cabeceras HTTP a incluir |
| `body` | `string` | No | -- | Cuerpo de solicitud (para metodos POST, PUT, PATCH) |
| `timeout_secs` | `integer` | No | Valor de config (`30`) | Sobreescritura de timeout por solicitud en segundos |

## Seguridad

### Denegar por defecto

La herramienta usa un modelo de seguridad denegar-por-defecto. Si un dominio no esta listado explicitamente en `allowed_domains`, la solicitud se bloquea antes de que se haga cualquier conexion de red. Esto previene SSRF, exfiltracion de datos y DNS rebinding.

### Soporte de proxy

Cuando `[proxy]` esta configurado, las solicitudes HTTP se enrutan a traves del proxy configurado:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

## Relacionado

- [Busqueda web](/es/prx/tools/web-search) -- buscar en la web y obtener contenido de paginas
- [Herramienta de navegador](/es/prx/tools/browser) -- automatizacion completa de navegador para paginas web
- [Integracion MCP](/es/prx/tools/mcp) -- conectar a herramientas externas via protocolo MCP
- [Vision general de herramientas](/es/prx/tools/) -- todas las herramientas y sistema de registro
