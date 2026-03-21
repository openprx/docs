---
title: Tailscale Funnel
description: Exponer tu agente PRX a internet usando Tailscale Funnel sobre tu red mesh de Tailscale.
---

# Tailscale Funnel

Tailscale Funnel te permite exponer tu instancia PRX local a la internet publica a traves de la infraestructura de retransmision de Tailscale. A diferencia de un tunel tradicional que requiere una red de borde de terceros, Funnel aprovecha tu mesh de Tailscale existente -- haciendolo una excelente opcion cuando tus nodos PRX ya se comunican a traves de Tailscale.

## Vision general

Tailscale proporciona dos caracteristicas complementarias para la conectividad PRX:

| Caracteristica | Alcance | Caso de uso |
|----------------|---------|-------------|
| **Tailscale Serve** | Privado (solo tailnet) | Exponer PRX a otros dispositivos en tu red Tailscale |
| **Tailscale Funnel** | Publico (internet) | Exponer PRX a webhooks y servicios externos |

PRX usa Funnel para ingreso de webhooks y Serve para comunicacion nodo a nodo dentro de una tailnet.

### Como funciona Funnel

```
External Service (GitHub, Telegram, etc.)
         │
         ▼ HTTPS
┌─────────────────────┐
│  Tailscale DERP Relay│
│  (Tailscale infra)   │
└────────┬────────────┘
         │ WireGuard
┌────────▼────────────┐
│  tailscaled          │
│  (your machine)      │
└────────┬────────────┘
         │ localhost
┌────────▼────────────┐
│  PRX Gateway         │
│  (127.0.0.1:8080)   │
└─────────────────────┘
```

El trafico llega a tu hostname MagicDNS de Tailscale (ej., `prx-host.tailnet-name.ts.net`), se enruta a traves de la red de retransmision DERP de Tailscale sobre WireGuard, y se reenvía al gateway PRX local.

## Prerequisitos

1. Tailscale instalado y autenticado en la maquina que ejecuta PRX
2. Tailscale Funnel habilitado para tu tailnet (requiere aprobacion del administrador)
3. El nodo Tailscale de la maquina debe tener la capacidad Funnel en la politica ACL

### Instalar Tailscale

```bash
# Debian / Ubuntu
curl -fsSL https://tailscale.com/install.sh | sh

# macOS
brew install tailscale

# Authenticate
sudo tailscale up
```

### Habilitar Funnel en la politica ACL

Funnel debe ser explicitamente permitido en la politica ACL de tu tailnet. Agrega lo siguiente a tu archivo ACL de Tailscale (via la consola de administracion):

```json
{
  "nodeAttrs": [
    {
      "target": ["autogroup:member"],
      "attr": ["funnel"]
    }
  ]
}
```

Esto otorga la capacidad Funnel a todos los miembros. Para un control mas estricto, reemplaza `autogroup:member` con usuarios o tags especificos:

```json
{
  "target": ["tag:prx-agent"],
  "attr": ["funnel"]
}
```

## Configuracion

### Configuracion basica de Funnel

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
# Funnel exposes the service to the public internet.
# Set to false to use Serve (tailnet-only access).
funnel = true

# Port to expose via Funnel. Tailscale Funnel supports
# ports 443, 8443, and 10000.
port = 443

# HTTPS is mandatory for Funnel. Tailscale provisions
# a certificate automatically via Let's Encrypt.
```

### Configuracion solo tailnet (Serve)

Para comunicacion privada nodo a nodo sin exposicion publica:

```toml
[tunnel]
backend = "tailscale"
local_addr = "127.0.0.1:8080"

[tunnel.tailscale]
funnel = false
port = 443
```

## Referencia de configuracion

| Parametro | Tipo | Por defecto | Descripcion |
|-----------|------|-------------|-------------|
| `funnel` | boolean | `true` | `true` para Funnel publico, `false` para Serve solo tailnet |
| `port` | integer | `443` | Puerto publico (Funnel soporta 443, 8443, 10000) |
| `tailscale_path` | string | `"tailscale"` | Ruta al binario CLI `tailscale` |
| `hostname` | string | auto-detectado | Sobreescribir el hostname MagicDNS |
| `reset_on_stop` | boolean | `true` | Remover la configuracion Funnel/Serve cuando PRX se detiene |
| `background` | boolean | `true` | Ejecutar `tailscale serve` en modo background |

## Como PRX gestiona Tailscale

Cuando el tunel inicia, PRX ejecuta:

```bash
# For Funnel (public)
tailscale funnel --bg --https=443 http://127.0.0.1:8080

# For Serve (private)
tailscale serve --bg --https=443 http://127.0.0.1:8080
```

La flag `--bg` ejecuta serve/funnel en segundo plano dentro del daemon `tailscaled`. PRX no necesita mantener un proceso hijo vivo -- `tailscaled` maneja el reenvio.

Cuando PRX se detiene, limpia ejecutando:

```bash
tailscale funnel --https=443 off
# or
tailscale serve --https=443 off
```

Este comportamiento es controlado por el parametro `reset_on_stop`.

## URL publica

La URL publica para Funnel sigue el patron MagicDNS:

```
https://<machine-name>.<tailnet-name>.ts.net
```

Por ejemplo, si tu maquina se llama `prx-host` y tu tailnet es `example`, la URL es:

```
https://prx-host.example.ts.net
```

PRX detecta automaticamente este hostname parseando la salida de `tailscale status --json` y construye la URL publica completa.

## Verificaciones de salud

PRX monitorea el tunel Tailscale con dos verificaciones:

1. **Estado del daemon Tailscale** -- `tailscale status --json` debe reportar el nodo como conectado
2. **Alcanzabilidad de Funnel** -- HTTP GET a la URL publica debe retornar una respuesta 2xx

Si las verificaciones de salud fallan, PRX intenta reestablecer el Funnel ejecutando el comando `tailscale funnel` nuevamente. Si `tailscaled` mismo esta caido, PRX registra un error y deshabilita el tunel hasta que el daemon se recupere.

## Consideraciones de ACL

Las ACLs de Tailscale controlan que dispositivos pueden comunicarse y cuales pueden usar Funnel. Consideraciones clave para despliegues PRX:

### Restringir Funnel a nodos PRX

Etiqueta tus maquinas PRX y restringe el acceso a Funnel:

```json
{
  "tagOwners": {
    "tag:prx-agent": ["autogroup:admin"]
  },
  "nodeAttrs": [
    {
      "target": ["tag:prx-agent"],
      "attr": ["funnel"]
    }
  ]
}
```

### Permitir trafico nodo a nodo

Para despliegues PRX distribuidos, permite trafico entre nodos PRX:

```json
{
  "acls": [
    {
      "action": "accept",
      "src": ["tag:prx-agent"],
      "dst": ["tag:prx-agent:443"]
    }
  ]
}
```

## Solucion de problemas

| Sintoma | Causa | Resolucion |
|---------|-------|------------|
| "Funnel not available" | La politica ACL no tiene el atributo funnel | Agregar atributo `funnel` al nodo o usuario en ACL |
| Estado "not connected" | `tailscaled` no esta ejecutandose | Iniciar el daemon Tailscale: `sudo tailscale up` |
| Error de certificado | DNS no propagado | Esperar la propagacion MagicDNS (usualmente < 1 minuto) |
| Puerto ya en uso | Otro Serve/Funnel en el mismo puerto | Remover existente: `tailscale funnel --https=443 off` |
| 502 Bad Gateway | El gateway PRX no esta escuchando | Verificar que `local_addr` coincida con la direccion de escucha de tu gateway |

## Paginas relacionadas

- [Vision general de tuneles](./)
- [Cloudflare Tunnel](./cloudflare)
- [ngrok](./ngrok)
- [Emparejamiento de nodos](/es/prx/nodes/pairing)
- [Vision general de seguridad](/es/prx/security/)
