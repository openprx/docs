---
title: Tuneles y travesia NAT
description: Vision general del sistema de tuneles de PRX para exponer instancias locales del agente a webhooks externos, canales y servicios.
---

# Tuneles y travesia NAT

Los agentes PRX frecuentemente necesitan recibir conexiones entrantes -- callbacks de webhooks de GitHub, actualizaciones de Telegram, eventos de Slack, o comunicacion entre nodos. Cuando se ejecuta detras de un NAT o firewall, el subsistema de tuneles proporciona ingreso automatico estableciendo una conexion saliente a un proveedor de tuneles y mapeando una URL publica a tu instancia PRX local.

## Por que importan los tuneles

Muchas caracteristicas de PRX requieren un endpoint accesible publicamente:

- **Canales de webhooks** -- Telegram, Discord, Slack y GitHub envian eventos a una URL que proporcionas. Sin un endpoint publico, estos canales no pueden entregar mensajes a tu agente.
- **Callbacks OAuth2** -- Los flujos de autenticacion de proveedores redirigen el navegador a una URL local. Los tuneles hacen que esto funcione incluso cuando PRX se ejecuta en una red privada.
- **Comunicacion nodo a nodo** -- Los despliegues distribuidos de PRX necesitan que los nodos se alcancen entre si. Los tuneles conectan nodos a traves de diferentes redes.
- **Alojamiento de servidor MCP** -- Cuando PRX actua como servidor MCP para clientes externos, el tunel proporciona el endpoint publico.

## Backends soportados

PRX incluye cuatro backends de tuneles y un fallback sin operacion:

| Backend | Proveedor | Nivel gratuito | Dominio personalizado | Auth requerida | Zero-trust |
|---------|-----------|----------------|----------------------|----------------|------------|
| [Cloudflare Tunnel](./cloudflare) | Cloudflare | Si | Si (con zona) | Si (`cloudflared`) | Si |
| [Tailscale Funnel](./tailscale) | Tailscale | Si (personal) | Via MagicDNS | Si (cuenta Tailscale) | Si |
| [ngrok](./ngrok) | ngrok | Si (limitado) | Si (pago) | Si (token auth) | No |
| Comando personalizado | Cualquiera | Depende | Depende | Depende | Depende |
| Ninguno | -- | -- | -- | -- | -- |

## Arquitectura

El subsistema de tuneles esta construido alrededor del trait `Tunnel`:

```rust
#[async_trait]
pub trait Tunnel: Send + Sync {
    /// Start the tunnel and return the public URL.
    async fn start(&mut self) -> Result<String>;

    /// Stop the tunnel and clean up resources.
    async fn stop(&mut self) -> Result<()>;

    /// Check if the tunnel is healthy and the public URL is reachable.
    async fn health_check(&self) -> Result<bool>;
}
```

Cada backend implementa este trait. La struct `TunnelProcess` gestiona el proceso hijo subyacente (ej., `cloudflared`, `tailscale`, `ngrok`) -- manejando la creacion, captura de stdout/stderr, apagado graceful y reinicio automatico ante fallos.

```
┌─────────────────────────────────────────────┐
│                PRX Gateway                   │
│            (localhost:8080)                   │
└──────────────────┬──────────────────────────┘
                   │ (local)
┌──────────────────▼──────────────────────────┐
│              TunnelProcess                   │
│  ┌──────────────────────────────────┐       │
│  │  cloudflared / tailscale / ngrok │       │
│  │  (child process)                 │       │
│  └──────────────┬───────────────────┘       │
└─────────────────┼───────────────────────────┘
                  │ (outbound TLS)
┌─────────────────▼───────────────────────────┐
│         Tunnel Provider Edge Network         │
│    https://your-agent.example.com            │
└──────────────────────────────────────────────┘
```

## Configuracion

Configura el tunel en `config.toml`:

```toml
[tunnel]
# Backend selection: "cloudflare" | "tailscale" | "ngrok" | "custom" | "none"
backend = "cloudflare"

# Local address that the tunnel will forward traffic to.
# This should match your gateway listen address.
local_addr = "127.0.0.1:8080"

# Health check interval in seconds. The tunnel is restarted if
# the health check fails consecutively for `max_failures` times.
health_check_interval_secs = 30
max_failures = 3

# Auto-detect: if backend = "auto", PRX probes for available
# tunnel binaries in order: cloudflared, tailscale, ngrok.
# Falls back to "none" with a warning if nothing is found.
```

### Configuracion especifica por backend

Cada backend tiene su propia seccion de configuracion. Consulta las paginas individuales de cada backend para detalles:

- [Cloudflare Tunnel](./cloudflare) -- `[tunnel.cloudflare]`
- [Tailscale Funnel](./tailscale) -- `[tunnel.tailscale]`
- [ngrok](./ngrok) -- `[tunnel.ngrok]`

### Backend de comando personalizado

Para proveedores de tuneles no soportados nativamente, usa el backend `custom`:

```toml
[tunnel]
backend = "custom"

[tunnel.custom]
# The command to run. Must accept traffic on local_addr and print
# the public URL to stdout within startup_timeout_secs.
command = "bore"
args = ["local", "8080", "--to", "bore.pub"]
startup_timeout_secs = 15

# Optional: regex to extract the public URL from stdout.
# The first capture group is used as the URL.
url_pattern = "listening at (https?://[\\S]+)"
```

## Auto-deteccion

Cuando `backend = "auto"`, PRX busca binarios de tuneles en `$PATH` en este orden:

1. `cloudflared` -- preferido por sus capacidades zero-trust
2. `tailscale` -- preferido para redes mesh privadas
3. `ngrok` -- ampliamente disponible, configuracion facil

Si no se encuentra ninguno, el tunel se deshabilita y PRX registra una advertencia. Los canales dependientes de webhooks no funcionaran sin un tunel o una IP publica.

## Ciclo de vida de TunnelProcess

La struct `TunnelProcess` gestiona el ciclo de vida del proceso hijo:

| Fase | Descripcion |
|------|-------------|
| **Spawn** | Iniciar el binario del tunel con los argumentos configurados |
| **Extraccion de URL** | Parsear stdout para la URL publica (dentro de `startup_timeout_secs`) |
| **Monitoreo** | Verificaciones de salud periodicas via HTTP GET a la URL publica |
| **Reinicio** | Si `max_failures` verificaciones de salud consecutivas fallan, detener y reiniciar |
| **Apagado** | Enviar SIGTERM, esperar 5 segundos, luego SIGKILL si sigue ejecutandose |

## Variables de entorno

La configuracion del tunel tambien puede establecerse via variables de entorno, que tienen precedencia sobre `config.toml`:

| Variable | Descripcion |
|----------|-------------|
| `PRX_TUNNEL_BACKEND` | Sobreescribir el backend del tunel |
| `PRX_TUNNEL_LOCAL_ADDR` | Sobreescribir la direccion de reenvio local |
| `PRX_TUNNEL_URL` | Omitir el inicio del tunel y usar esta URL |
| `CLOUDFLARE_TUNNEL_TOKEN` | Token de Cloudflare Tunnel |
| `NGROK_AUTHTOKEN` | Token de autenticacion de ngrok |

Establecer `PRX_TUNNEL_URL` es util cuando ya tienes un proxy reverso o balanceador de carga exponiendo PRX publicamente. El subsistema de tuneles omitira la gestion del proceso y usara la URL proporcionada directamente.

## Consideraciones de seguridad

- **Terminacion TLS** -- Todos los backends soportados terminan TLS en el borde del proveedor. El trafico entre el proveedor y tu instancia PRX local viaja a traves de un tunel cifrado.
- **Control de acceso** -- Cloudflare y Tailscale soportan politicas de acceso basadas en identidad. Usalas cuando expongas endpoints sensibles del agente.
- **Almacenamiento de credenciales** -- Los tokens de tuneles y claves de autenticacion se almacenan en el gestor de secretos de PRX. Nunca los incluyas en el control de versiones.
- **Aislamiento de procesos** -- `TunnelProcess` se ejecuta como un proceso hijo separado. No comparte memoria con el runtime del agente PRX.

## Solucion de problemas

| Sintoma | Causa | Resolucion |
|---------|-------|------------|
| El tunel inicia pero los webhooks fallan | URL no propagada a la configuracion del canal | Verifica que `tunnel.public_url` este siendo usada por el canal |
| El tunel se reinicia repetidamente | La verificacion de salud apunta al endpoint incorrecto | Verifica que `local_addr` coincida con la direccion de escucha de tu gateway |
| Error "binary not found" | CLI del tunel no instalado | Instala el binario apropiado (`cloudflared`, `tailscale`, `ngrok`) |
| Timeout durante la extraccion de URL | El binario del tunel tarda demasiado en iniciar | Aumenta `startup_timeout_secs` |

## Paginas relacionadas

- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Configuracion del gateway](/es/prx/gateway)
- [Vision general de seguridad](/es/prx/security/)
