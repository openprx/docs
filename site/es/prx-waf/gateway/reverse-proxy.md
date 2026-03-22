---
title: Configuración del Proxy Inverso
description: "Configura PRX-WAF como proxy inverso. Enrutamiento de hosts, backends ascendentes, balanceo de carga, encabezados de solicitud/respuesta y verificaciones de salud."
---

# Configuración del Proxy Inverso

PRX-WAF actúa como proxy inverso, reenviando las solicitudes de los clientes a los servidores backend ascendentes después de pasar por el pipeline de detección WAF. Esta página cubre el enrutamiento de hosts, el balanceo de carga y la configuración del proxy.

## Configuración de Hosts

Cada dominio protegido requiere una entrada de host que mapea las solicitudes entrantes a un backend ascendente. Los hosts pueden configurarse de tres maneras:

### Vía Archivo de Configuración TOML

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### Vía Interfaz de Administración

1. Navega a **Hosts** en la barra lateral
2. Haz clic en **Agregar Host**
3. Completa los detalles del host
4. Haz clic en **Guardar**

### Vía API REST

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## Campos del Host

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `host` | `string` | Sí | El nombre de dominio a coincidir (p. ej., `example.com`) |
| `port` | `integer` | Sí | Puerto en el que escuchar (generalmente `80` o `443`) |
| `remote_host` | `string` | Sí | IP o nombre de host del backend ascendente |
| `remote_port` | `integer` | Sí | Puerto del backend ascendente |
| `ssl` | `boolean` | No | Si el ascendente usa HTTPS (predeterminado: `false`) |
| `guard_status` | `boolean` | No | Habilitar protección WAF para este host (predeterminado: `true`) |

## Balanceo de Carga

PRX-WAF usa balanceo de carga round-robin ponderado entre los backends ascendentes. Cuando se configuran múltiples backends para un host, el tráfico se distribuye proporcionalmente a sus pesos.

::: info
Múltiples backends ascendentes por host pueden configurarse vía la interfaz de administración o la API. El archivo de configuración TOML admite entradas de host con un solo backend.
:::

## Encabezados de Solicitud

PRX-WAF agrega automáticamente encabezados de proxy estándar a las solicitudes reenviadas:

| Encabezado | Valor |
|------------|-------|
| `X-Real-IP` | Dirección IP original del cliente |
| `X-Forwarded-For` | IP del cliente (añadida a la cadena existente) |
| `X-Forwarded-Proto` | `http` o `https` |
| `X-Forwarded-Host` | Valor original del encabezado Host |

## Límite de Tamaño del Cuerpo de la Solicitud

El tamaño máximo del cuerpo de la solicitud está controlado por la configuración de seguridad:

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

Las solicitudes que superan este límite son rechazadas con una respuesta 413 Payload Too Large antes de llegar al pipeline WAF.

## Gestión de Hosts

### Listar Todos los Hosts

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### Actualizar un Host

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### Eliminar un Host

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Reglas Basadas en IP

PRX-WAF admite reglas de lista blanca y lista negra basadas en IP que se evalúan en las Fases 1-4 del pipeline de detección:

```bash
# Add an IP allowlist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Add an IP blocklist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## Próximos Pasos

- [SSL/TLS](./ssl-tls) -- Habilitar HTTPS con Let's Encrypt
- [Descripción General del Gateway](./index) -- Caché de respuestas y túneles inversos
- [Referencia de Configuración](../configuration/reference) -- Todas las claves de configuración del proxy
