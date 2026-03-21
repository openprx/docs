---
title: Middleware
description: Pila de middleware del gateway para autenticacion, limitacion de velocidad, CORS y registro.
---

# Middleware

El gateway de PRX usa una pila de middleware componible para manejar preocupaciones transversales como autenticacion, limitacion de velocidad, CORS y registro de solicitudes.

## Pila de middleware

Las solicitudes pasan a traves de la pila de middleware en orden:

1. **Registro de solicitudes** -- registrar solicitudes entrantes con temporizacion
2. **CORS** -- manejar cabeceras de intercambio de recursos entre origenes
3. **Autenticacion** -- validar tokens bearer o claves API
4. **Limitacion de velocidad** -- aplicar limites de solicitudes por cliente
5. **Enrutamiento de solicitudes** -- despachar al manejador apropiado

## Middleware de autenticacion

```toml
[gateway.auth]
enabled = true
method = "bearer"  # "bearer" | "api_key" | "none"
token_secret = "your-secret-key"
```

## Limitacion de velocidad

```toml
[gateway.rate_limit]
enabled = true
requests_per_minute = 60
burst_size = 10
```

## CORS

```toml
[gateway.cors]
allowed_origins = ["https://app.example.com"]
allowed_methods = ["GET", "POST", "PUT", "DELETE"]
allowed_headers = ["Authorization", "Content-Type"]
max_age_secs = 86400
```

## Registro de solicitudes

Todas las solicitudes a la API se registran con metodo, ruta, codigo de estado y tiempo de respuesta. El nivel de log es configurable:

```toml
[gateway.logging]
level = "info"  # "debug" | "info" | "warn" | "error"
format = "json"  # "json" | "pretty"
```

## Paginas relacionadas

- [Vision general del gateway](./)
- [API HTTP](./http-api)
- [Seguridad](/es/prx/security/)
