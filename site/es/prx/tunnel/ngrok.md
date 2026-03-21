---
title: Integracion ngrok
description: Exponer tu agente PRX a internet usando ngrok para desarrollo rapido y pruebas de webhooks.
---

# Integracion ngrok

ngrok es un servicio de tuneles popular que crea ingreso seguro a tu instancia PRX local. Es la forma mas rapida de comenzar con webhooks e integraciones externas -- un solo comando te da una URL HTTPS publica apuntando a tu agente local.

## Vision general

ngrok es mas adecuado para:

- **Desarrollo y pruebas** -- obtener una URL publica en segundos sin configuracion de cuenta
- **Prototipado de webhooks** -- probar rapidamente integraciones con Telegram, Discord, GitHub o Slack
- **Demos y presentaciones** -- compartir una URL publica temporal para mostrar tu agente
- **Entornos donde Cloudflare o Tailscale no estan disponibles**

Para despliegues en produccion, considera [Cloudflare Tunnel](./cloudflare) o [Tailscale Funnel](./tailscale) que ofrecen mejor fiabilidad, dominios personalizados y controles de acceso zero-trust.

## Prerequisitos

1. CLI de ngrok instalado en la maquina que ejecuta PRX
2. Una cuenta de ngrok con un token de autenticacion (el nivel gratuito es suficiente)

### Instalar ngrok

```bash
# Debian / Ubuntu (via snap)
sudo snap install ngrok

# macOS
brew install ngrok

# Binary download (all platforms)
# https://ngrok.com/download

# Authenticate (one-time setup)
ngrok config add-authtoken <YOUR_AUTH_TOKEN>
```

Obtener tu token de autenticacion desde el [panel de ngrok](https://dashboard.ngrok.com/get-started/your-authtoken).

## Configuracion

### Configuracion basica

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
# Auth token. Can also be set via NGROK_AUTHTOKEN environment variable.
# If omitted, ngrok uses the token from its local config file.
authtoken = ""

# Region for the tunnel endpoint.
# Options: "us", "eu", "ap", "au", "sa", "jp", "in"
region = "us"
```

### Dominio personalizado (planes de pago)

Los planes de pago de ngrok soportan dominios personalizados persistentes:

```toml
[tunnel]
backend = "ngrok"
local_addr = "127.0.0.1:8080"

[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Custom domain (requires ngrok paid plan)
domain = "agent.example.com"

# Alternatively, use a static ngrok subdomain (free on some plans)
# subdomain = "my-prx-agent"
```

### Dominio reservado

Para URLs estables en el nivel gratuito, ngrok ofrece dominios reservados:

```toml
[tunnel.ngrok]
authtoken = "${NGROK_AUTHTOKEN}"

# Reserved domain assigned by ngrok (e.g., "example-agent.ngrok-free.app")
domain = "example-agent.ngrok-free.app"
```

## Referencia de configuracion

| Parametro | Tipo | Por defecto | Descripcion |
|-----------|------|-------------|-------------|
| `authtoken` | string | -- | Token de autenticacion de ngrok |
| `region` | string | `"us"` | Region del tunel: `"us"`, `"eu"`, `"ap"`, `"au"`, `"sa"`, `"jp"`, `"in"` |
| `domain` | string | -- | Dominio personalizado o dominio reservado (funcion de pago) |
| `subdomain` | string | -- | Subdominio fijo en `ngrok-free.app` |
| `ngrok_path` | string | `"ngrok"` | Ruta al binario `ngrok` |
| `inspect` | boolean | `true` | Habilitar el panel de inspeccion de ngrok (localhost:4040) |
| `log_level` | string | `"info"` | Nivel de log de ngrok: `"debug"`, `"info"`, `"warn"`, `"error"` |
| `metadata` | string | -- | Cadena de metadatos arbitrarios adjunta a la sesion del tunel |
| `basic_auth` | string | -- | HTTP Basic Auth en formato `user:password` |
| `ip_restrictions` | list | `[]` | Lista de rangos CIDR permitidos (ej., `["203.0.113.0/24"]`) |
| `circuit_breaker` | float | -- | Umbral de tasa de error (0.0-1.0) para activar el circuit breaker |
| `compression` | boolean | `false` | Habilitar compresion de respuestas |

## Como PRX gestiona ngrok

Cuando el tunel inicia, PRX genera ngrok como un proceso hijo:

```bash
ngrok http 127.0.0.1:8080 \
  --authtoken=<token> \
  --region=us \
  --log=stdout \
  --log-format=json
```

PRX luego consulta la API local de ngrok (`http://127.0.0.1:4040/api/tunnels`) para obtener la URL publica asignada. Esta URL se almacena y se usa para el registro de webhooks y la configuracion de canales.

### Extraccion de URL

ngrok expone una API local en el puerto 4040. PRX consulta este endpoint con un timeout:

```
GET http://localhost:4040/api/tunnels
```

La respuesta contiene la URL publica:

```json
{
  "tunnels": [
    {
      "public_url": "https://abc123.ngrok-free.app",
      "config": {
        "addr": "http://localhost:8080"
      }
    }
  ]
}
```

Si la API no esta disponible dentro de `startup_timeout_secs`, PRX recurre a parsear stdout para la URL.

## Limitaciones del nivel gratuito

El nivel gratuito de ngrok tiene varias limitaciones a tener en cuenta:

| Limitacion | Nivel gratuito | Impacto en PRX |
|------------|----------------|----------------|
| Tuneles concurrentes | 1 | Solo una instancia PRX por cuenta ngrok |
| Conexiones por minuto | 40 | Puede limitar webhooks de alto trafico |
| Dominios personalizados | No disponible | La URL cambia en cada reinicio |
| Restricciones de IP | No disponible | No se pueden restringir IPs de origen |
| Ancho de banda | Limitado | Las transferencias de archivos grandes pueden ser limitadas |
| Pagina intersticial | Mostrada en primera visita | Puede interferir con algunos proveedores de webhooks |

La pagina intersticial (la pagina de advertencia del navegador de ngrok) no afecta el trafico de API/webhooks -- solo aparece para solicitudes iniciadas por el navegador. Sin embargo, algunos proveedores de webhooks pueden rechazar respuestas que la incluyan. Usa un plan de pago o un backend diferente para produccion.

## Panel de inspeccion de ngrok

Cuando `inspect = true` (el valor por defecto), ngrok ejecuta un panel web local en `http://localhost:4040`. Este panel proporciona:

- **Inspector de solicitudes** -- ver todas las solicitudes entrantes con headers, cuerpo y respuesta
- **Replay** -- reproducir cualquier solicitud para depuracion
- **Estado del tunel** -- salud de la conexion, region y URL publica

Esto es invaluable para depurar integraciones de webhooks durante el desarrollo.

## Consideraciones de seguridad

- **Proteccion del token de autenticacion** -- el token de autenticacion de ngrok otorga acceso de creacion de tuneles a tu cuenta. Almacenalo en el gestor de secretos de PRX o pasalo via la variable de entorno `NGROK_AUTHTOKEN`.
- **Las URLs del nivel gratuito son publicas** -- cualquier persona con la URL puede alcanzar tu agente. Usa `basic_auth` o `ip_restrictions` (pago) para restringir el acceso.
- **Rotacion de URL** -- las URLs del nivel gratuito cambian al reiniciar. Si los proveedores de webhooks cachean la URL anterior, fallaran al entregar eventos. Usa dominios reservados o un backend diferente para URLs estables.
- **Terminacion TLS** -- ngrok termina TLS en su borde. El trafico entre ngrok y tu PRX local viaja a traves de la infraestructura de ngrok.
- **Inspeccion de datos** -- el panel de inspeccion de ngrok muestra cuerpos de solicitudes/respuestas. Deshabilitalo en produccion con `inspect = false` si se transmiten datos sensibles.

## Patron de integracion de webhooks

Un patron comun para desarrollo: iniciar PRX con ngrok, registrar la URL del webhook y probar:

```bash
# 1. Start PRX (tunnel starts automatically)
prx start

# 2. PRX logs the public URL
# [INFO] Tunnel started: https://abc123.ngrok-free.app

# 3. Register the webhook URL with your service
# Telegram: https://abc123.ngrok-free.app/webhook/telegram
# GitHub:   https://abc123.ngrok-free.app/webhook/github

# 4. Inspect requests at http://localhost:4040
```

## Comparacion con otros backends

| Caracteristica | ngrok | Cloudflare Tunnel | Tailscale Funnel |
|----------------|-------|-------------------|------------------|
| Tiempo de configuracion | Segundos | Minutos | Minutos |
| Dominio personalizado | Pago | Gratis (con zona) | Solo MagicDNS |
| Zero-trust | No | Si (Access) | Si (ACLs) |
| Nivel gratuito | Si (limitado) | Si | Si (personal) |
| Panel de inspeccion | Si | No | No |
| Listo para produccion | Planes de pago | Si | Si |

## Solucion de problemas

| Sintoma | Causa | Resolucion |
|---------|-------|------------|
| "authentication failed" | Token de autenticacion invalido o faltante | Ejecutar `ngrok config add-authtoken <token>` |
| URL no detectada | La API de ngrok no responde en :4040 | Verificar que el puerto 4040 no este en uso por otro proceso |
| "tunnel session limit" | El nivel gratuito permite 1 tunel | Detener otras sesiones ngrok o actualizar |
| Webhooks retornan 502 | El gateway PRX no esta escuchando | Verificar que `local_addr` coincida con tu gateway |
| Pagina intersticial mostrada | Advertencia del navegador del nivel gratuito | Usar `--domain` o actualizar a plan de pago |
| Desconexiones aleatorias | Limites de conexion del nivel gratuito | Actualizar o cambiar a Cloudflare/Tailscale |

## Paginas relacionadas

- [Vision general de tuneles](./)
- [Cloudflare Tunnel](./cloudflare)
- [Tailscale Funnel](./tailscale)
- [Vision general de seguridad](/es/prx/security/)
