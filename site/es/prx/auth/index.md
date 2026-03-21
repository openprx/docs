---
title: Autenticacion
description: Vision general del sistema de autenticacion de PRX incluyendo flujos OAuth2 y perfiles de proveedores.
---

# Autenticacion

PRX soporta multiples mecanismos de autenticacion para proveedores LLM, acceso a la API y comunicacion entre nodos. El sistema de autenticacion maneja flujos OAuth2, gestion de claves API y autenticacion especifica de proveedores.

## Vision general

La autenticacion en PRX opera en multiples niveles:

| Nivel | Mecanismo | Proposito |
|-------|-----------|-----------|
| Autenticacion de proveedor | OAuth2 / Claves API | Autenticarse con proveedores LLM |
| Autenticacion de gateway | Tokens Bearer | Autenticar clientes de la API |
| Autenticacion de nodo | Emparejamiento Ed25519 | Autenticar nodos distribuidos |

## Autenticacion de proveedores

Cada proveedor LLM tiene su propio metodo de autenticacion:

- **Clave API** -- clave estatica pasada en cabeceras de solicitud (la mayoria de proveedores)
- **OAuth2** -- flujo de autorizacion basado en navegador (Anthropic, Google, GitHub Copilot)
- **AWS IAM** -- autenticacion basada en roles para Bedrock

## Configuracion

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## Paginas relacionadas

- [Flujos OAuth2](./oauth2)
- [Perfiles de proveedores](./profiles)
- [Gestion de secretos](/es/prx/security/secrets)
