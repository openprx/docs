---
title: Flujos OAuth2
description: Flujos de autenticacion OAuth2 soportados por PRX para autorizacion de proveedores LLM.
---

# Flujos OAuth2

PRX implementa flujos de autorizacion OAuth2 para proveedores que soportan autenticacion basada en navegador. Esto permite a los usuarios autenticarse sin gestionar manualmente claves API.

## Flujos soportados

### Flujo de codigo de autorizacion

Usado por Anthropic (Claude Code), Google Gemini CLI y Minimax:

1. PRX abre un navegador hacia la URL de autorizacion del proveedor
2. El usuario otorga permiso
3. El proveedor redirige al servidor de callback local de PRX
4. PRX intercambia el codigo de autorizacion por tokens de acceso y actualizacion
5. Los tokens se almacenan de forma segura para uso futuro

### Flujo de codigo de dispositivo

Usado por GitHub Copilot:

1. PRX solicita un codigo de dispositivo al proveedor
2. El usuario visita una URL e ingresa el codigo de dispositivo
3. PRX sondea la finalizacion de la autorizacion
4. Una vez autorizado, los tokens se reciben y almacenan

## Gestion de tokens

PRX maneja automaticamente:

- Almacenamiento en cache de tokens para evitar autorizaciones repetidas
- Rotacion de tokens de actualizacion cuando los tokens de acceso expiran
- Almacenamiento seguro de tokens (cifrados en reposo)

## Configuracion

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## Comandos CLI

```bash
prx auth login anthropic    # Start OAuth2 flow for Anthropic
prx auth login copilot      # Start device code flow for Copilot
prx auth status              # Show auth status for all providers
prx auth logout anthropic   # Revoke tokens for Anthropic
```

## Paginas relacionadas

- [Vision general de autenticacion](./)
- [Perfiles de proveedores](./profiles)
