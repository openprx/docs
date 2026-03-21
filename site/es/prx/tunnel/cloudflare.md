---
title: Cloudflare Tunnel
description: Integrar PRX con Cloudflare Tunnel para ingreso zero-trust usando cloudflared.
---

# Cloudflare Tunnel

Cloudflare Tunnel (anteriormente Argo Tunnel) crea una conexion cifrada, solo saliente, desde tu instancia PRX a la red de borde de Cloudflare. No se requiere IP publica, puertos de firewall abiertos ni reenvio de puertos. Cloudflare termina TLS y enruta el trafico a tu agente local a traves del tunel.

## Vision general

Cloudflare Tunnel es el backend recomendado para despliegues PRX en produccion porque proporciona:

- **Acceso zero-trust** -- integra con Cloudflare Access para requerir verificacion de identidad antes de alcanzar tu agente
- **Dominios personalizados** -- usa tu propio dominio con certificados HTTPS automaticos
- **Proteccion DDoS** -- el trafico pasa a traves de la red de Cloudflare, protegiendo tu origen
- **Alta fiabilidad** -- Cloudflare mantiene multiples conexiones de borde para redundancia
- **Nivel gratuito** -- Cloudflare Tunnels esta disponible en el plan gratuito

## Prerequisitos

1. Una cuenta de Cloudflare (el nivel gratuito es suficiente)
2. CLI `cloudflared` instalado en la maquina que ejecuta PRX
3. Un dominio agregado a tu cuenta de Cloudflare (para tuneles con nombre)

### Instalar cloudflared

```bash
# Debian / Ubuntu
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg \
  | sudo tee /usr/share/keyrings/cloudflare-main.gpg > /dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] \
  https://pkg.cloudflare.com/cloudflared $(lsb_release -cs) main" \
  | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt update && sudo apt install -y cloudflared

# macOS
brew install cloudflared

# Binary download (all platforms)
# https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
```

## Configuracion

### Tunel rapido (sin dominio requerido)

La configuracion mas simple usa el tunel rapido de Cloudflare, que asigna un subdominio aleatorio `*.trycloudflare.com`. No se necesita configuracion de cuenta de Cloudflare mas alla de instalar `cloudflared`:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
# Quick tunnel mode: no token, no named tunnel.
# A random trycloudflare.com URL is assigned on each start.
mode = "quick"
```

Los tuneles rapidos son ideales para desarrollo y pruebas. La URL cambia en cada reinicio, por lo que necesitaras actualizar los registros de webhooks en consecuencia.

### Tunel con nombre (dominio persistente)

Para produccion, usa un tunel con nombre con un hostname estable:

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"

[tunnel.cloudflare]
mode = "named"

# The tunnel token obtained from `cloudflared tunnel create`.
# Can also be set via CLOUDFLARE_TUNNEL_TOKEN environment variable.
token = "eyJhIjoiNjY..."

# The public hostname that routes to this tunnel.
# Must be configured in the Cloudflare dashboard or via cloudflared CLI.
hostname = "agent.example.com"
```

### Crear un tunel con nombre

```bash
# 1. Authenticate cloudflared with your Cloudflare account
cloudflared tunnel login

# 2. Create a named tunnel
cloudflared tunnel create prx-agent
# Output: Created tunnel prx-agent with id <TUNNEL_ID>

# 3. Create a DNS record pointing to the tunnel
cloudflared tunnel route dns prx-agent agent.example.com

# 4. Get the tunnel token (for config.toml)
cloudflared tunnel token prx-agent
# Output: eyJhIjoiNjY...
```

## Referencia de configuracion

| Parametro | Tipo | Por defecto | Descripcion |
|-----------|------|-------------|-------------|
| `mode` | string | `"quick"` | `"quick"` para URLs aleatorias, `"named"` para hostnames persistentes |
| `token` | string | -- | Token del tunel con nombre (requerido para `mode = "named"`) |
| `hostname` | string | -- | Hostname publico para tunel con nombre |
| `cloudflared_path` | string | `"cloudflared"` | Ruta al binario `cloudflared` |
| `protocol` | string | `"auto"` | Protocolo de transporte: `"auto"`, `"quic"`, `"http2"` |
| `edge_ip_version` | string | `"auto"` | Version IP para conexiones de borde: `"auto"`, `"4"`, `"6"` |
| `retries` | integer | `5` | Numero de reintentos de conexion antes de rendirse |
| `grace_period_secs` | integer | `30` | Segundos a esperar antes de cerrar conexiones activas |
| `metrics_port` | integer | -- | Si se establece, exponer metricas de `cloudflared` en este puerto |
| `log_level` | string | `"info"` | Nivel de log de `cloudflared`: `"debug"`, `"info"`, `"warn"`, `"error"` |

## Acceso zero-trust

Cloudflare Access agrega una capa de identidad frente a tu tunel. Los usuarios deben autenticarse (via SSO, OTP por email o tokens de servicio) antes de alcanzar tu instancia PRX.

### Configurar politicas de acceso

1. Navega al panel de Cloudflare Zero Trust
2. Crea una Aplicacion de Access para el hostname de tu tunel
3. Agrega una Politica de Access con los requisitos de identidad deseados

```
Cloudflare Access Policy Example:
  Application: agent.example.com
  Rule: Allow
  Include:
    - Email ends with: @yourcompany.com
    - Service Token: prx-webhook-token
```

Los tokens de servicio son utiles para remitentes automatizados de webhooks (GitHub, Slack) que no pueden realizar autenticacion interactiva. Configura el token en los headers de tu proveedor de webhooks:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

## Verificaciones de salud

PRX monitorea la salud del Cloudflare Tunnel mediante:

1. Verificar que el proceso hijo `cloudflared` este en ejecucion
2. Enviar un HTTP GET a la URL publica y verificar una respuesta 2xx
3. Parsear las metricas de `cloudflared` (si `metrics_port` esta configurado) para el estado de conexion

Si el tunel se vuelve no saludable, PRX registra una advertencia e intenta reiniciar `cloudflared`. El reinicio sigue una estrategia de backoff exponencial: 5s, 10s, 20s, 40s, hasta un maximo de 5 minutos entre intentos.

## Logs y depuracion

stdout y stderr de `cloudflared` son capturados por `TunnelProcess` y escritos al log de PRX a nivel `DEBUG`. Para aumentar la verbosidad:

```toml
[tunnel.cloudflare]
log_level = "debug"
```

Mensajes de log comunes y sus significados:

| Mensaje de log | Significado |
|----------------|------------|
| `Connection registered` | Tunel establecido al borde de Cloudflare |
| `Retrying connection` | Conexion al borde caida, intentando reconexion |
| `Serve tunnel error` | Error fatal, el tunel se reiniciara |
| `Registered DNS record` | Ruta DNS creada exitosamente |

## Ejemplo: Configuracion completa de produccion

```toml
[tunnel]
backend = "cloudflare"
local_addr = "127.0.0.1:8080"
health_check_interval_secs = 30
max_failures = 3

[tunnel.cloudflare]
mode = "named"
token = "${CLOUDFLARE_TUNNEL_TOKEN}"
hostname = "agent.mycompany.com"
protocol = "quic"
retries = 5
grace_period_secs = 30
log_level = "info"
```

```bash
# Set the token via environment variable
export CLOUDFLARE_TUNNEL_TOKEN="eyJhIjoiNjY..."

# Start PRX -- tunnel starts automatically
prx start
```

## Notas de seguridad

- El token del tunel otorga acceso completo al tunel con nombre. Almacenalo en el gestor de secretos de PRX o pasalo via variable de entorno. Nunca lo incluyas en el control de versiones.
- Los tuneles rapidos no soportan politicas de Access. Usa tuneles con nombre para produccion.
- `cloudflared` se ejecuta como un proceso hijo con los mismos permisos de usuario que PRX. Considera ejecutar PRX bajo una cuenta de servicio dedicada con privilegios minimos.
- Todo el trafico entre `cloudflared` y el borde de Cloudflare esta cifrado con TLS 1.3 o QUIC.

## Paginas relacionadas

- [Vision general de tuneles](./)
- [Tailscale Funnel](./tailscale)
- [ngrok](./ngrok)
- [Vision general de seguridad](/es/prx/security/)
- [Gestion de secretos](/es/prx/security/secrets)
