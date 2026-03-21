---
title: Gestion de secretos
description: Almacenamiento seguro y control de acceso para claves API y credenciales en PRX.
---

# Gestion de secretos

PRX proporciona almacenamiento seguro para datos sensibles como claves API, tokens y credenciales. Los secretos se cifran en reposo y se acceden a traves de una API controlada.

## Vision general

El sistema de secretos:

- Cifra secretos en reposo usando AES-256-GCM
- Deriva claves de cifrado de una contrasena maestra o el llavero del sistema
- Proporciona inyeccion de variables de entorno para ejecucion de herramientas
- Soporta rotacion y expiracion de secretos

## Almacenamiento

Los secretos se almacenan en un archivo cifrado en `~/.local/share/openprx/secrets.enc`. La clave de cifrado se deriva de:

1. Llavero del sistema (preferido, cuando esta disponible)
2. Contrasena maestra (prompt interactivo)
3. Variable de entorno `PRX_MASTER_KEY` (para automatizacion)

## Configuracion

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## Comandos CLI

```bash
prx secret set OPENAI_API_KEY      # Establecer un secreto (solicita el valor)
prx secret get OPENAI_API_KEY      # Recuperar un secreto
prx secret list                    # Listar nombres de secretos (no valores)
prx secret delete OPENAI_API_KEY   # Eliminar un secreto
prx secret rotate                  # Rotar la clave maestra
```

## Paginas relacionadas

- [Vision general de seguridad](./)
- [Autenticacion](/es/prx/auth/)
