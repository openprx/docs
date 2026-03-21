---
title: Motor de politicas
description: Motor de politicas de seguridad declarativo para controlar el acceso a herramientas del agente y el flujo de datos en PRX.
---

# Motor de politicas

El motor de politicas es un sistema de reglas declarativo que controla que herramientas puede usar un agente, a que archivos puede acceder y que solicitudes de red puede realizar. Las politicas se evaluan antes de cada llamada a herramienta.

## Vision general

Las politicas se definen como reglas con condiciones y acciones:

- **Reglas de permitir** -- permiten explicitamente operaciones especificas
- **Reglas de denegar** -- bloquean explicitamente operaciones especificas
- **Accion por defecto** -- se aplica cuando ninguna regla coincide (denegar por defecto)

## Formato de politicas

```toml
[security.policy]
default_action = "deny"

[[security.policy.rules]]
name = "allow-read-workspace"
action = "allow"
tools = ["fs_read"]
paths = ["/home/user/workspace/**"]

[[security.policy.rules]]
name = "block-sensitive-dirs"
action = "deny"
tools = ["fs_read", "fs_write"]
paths = ["/etc/**", "/root/**", "**/.ssh/**"]

[[security.policy.rules]]
name = "allow-http-approved-domains"
action = "allow"
tools = ["http_request"]
domains = ["api.github.com", "api.openai.com"]
```

## Evaluacion de reglas

Las reglas se evaluan en orden. La primera regla que coincida determina la accion. Si ninguna regla coincide, se aplica la accion por defecto.

## Politicas integradas

PRX incluye politicas por defecto razonables que:

- Bloquean acceso a directorios del sistema y archivos sensibles
- Requieren aprobacion explicita para operaciones destructivas
- Limitan la tasa de solicitudes de red
- Registran todas las ejecuciones de herramientas para auditoria

## Paginas relacionadas

- [Vision general de seguridad](./)
- [Sandbox](./sandbox)
- [Modelo de amenazas](./threat-model)
