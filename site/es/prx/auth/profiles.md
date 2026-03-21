---
title: Perfiles de proveedores
description: Perfiles de autenticacion con nombre para gestionar multiples cuentas de proveedores en PRX.
---

# Perfiles de proveedores

Los perfiles de proveedores te permiten configurar multiples contextos de autenticacion para el mismo proveedor. Esto es util cuando tienes cuentas separadas para uso personal y laboral, o al cambiar entre claves API de desarrollo y produccion.

## Vision general

Un perfil es una configuracion con nombre que incluye:

- Identificador del proveedor
- Credenciales de autenticacion (clave API o tokens OAuth2)
- Preferencias de modelo
- Sobreescrituras de limites de velocidad

## Configuracion

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## Cambiar de perfil

```bash
# Use a specific profile
prx chat --profile work

# Set default profile
prx auth set-default work

# List profiles
prx auth profiles
```

## Variables de entorno

Los perfiles pueden referenciar variables de entorno para credenciales:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## Paginas relacionadas

- [Vision general de autenticacion](./)
- [Flujos OAuth2](./oauth2)
- [Gestion de secretos](/es/prx/security/secrets)
