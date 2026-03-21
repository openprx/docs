---
title: prx auth
description: Gestionar perfiles de autenticacion OAuth para proveedores de LLM y servicios.
---

# prx auth

Gestiona los perfiles de autenticacion OAuth. PRX usa flujos OAuth2 para proveedores y servicios que los soportan (GitHub Copilot, Google Gemini, etc.). Los perfiles de autenticacion almacenan tokens de forma segura en el almacen de secretos de PRX.

## Uso

```bash
prx auth <SUBCOMANDO> [OPTIONS]
```

## Subcomandos

### `prx auth login`

Autenticarse con un proveedor o servicio.

```bash
prx auth login [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--provider` | `-P` | | Proveedor con el que autenticarse (ej., `github-copilot`, `google-gemini`) |
| `--profile` | | `default` | Perfil con nombre para multiples cuentas |
| `--browser` | | `true` | Abrir navegador para el flujo OAuth |
| `--device-code` | | `false` | Usar flujo de codigo de dispositivo (para entornos sin interfaz grafica) |

```bash
# Iniciar sesion en GitHub Copilot
prx auth login --provider github-copilot

# Flujo de codigo de dispositivo (sin navegador)
prx auth login --provider github-copilot --device-code

# Iniciar sesion con un perfil con nombre
prx auth login --provider google-gemini --profile work
```

El flujo de inicio de sesion:

1. PRX abre un navegador (o muestra un codigo de dispositivo) para la pagina de consentimiento OAuth del proveedor
2. Autorizas PRX en el navegador
3. PRX recibe y almacena de forma segura los tokens de acceso y actualizacion
4. El token se utiliza automaticamente para las llamadas API posteriores

### `prx auth refresh`

Actualizar manualmente un token de acceso expirado.

```bash
prx auth refresh [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--provider` | `-P` | todos | Proveedor a actualizar (actualiza todos si se omite) |
| `--profile` | | `default` | Perfil con nombre a actualizar |

```bash
# Actualizar tokens de todos los proveedores
prx auth refresh

# Actualizar un proveedor especifico
prx auth refresh --provider github-copilot
```

::: tip
La actualizacion de tokens ocurre automaticamente durante la operacion normal. Usa este comando solo para solucionar problemas de autenticacion.
:::

### `prx auth logout`

Eliminar credenciales almacenadas de un proveedor.

```bash
prx auth logout [OPTIONS]
```

| Opcion | Corta | Por defecto | Descripcion |
|--------|-------|-------------|-------------|
| `--provider` | `-P` | | Proveedor del que cerrar sesion (requerido) |
| `--profile` | | `default` | Perfil con nombre del que cerrar sesion |
| `--all` | | `false` | Cerrar sesion de todos los proveedores y perfiles |

```bash
# Cerrar sesion de GitHub Copilot
prx auth logout --provider github-copilot

# Cerrar sesion de todo
prx auth logout --all
```

## Perfiles de autenticacion

Los perfiles permiten multiples cuentas para el mismo proveedor. Esto es util cuando tienes cuentas separadas de trabajo y personales.

```bash
# Iniciar sesion con dos cuentas de Google diferentes
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# Usar un perfil especifico en el chat
prx chat --provider google-gemini  # usa el perfil "default"
```

Establece el perfil activo por proveedor en el archivo de configuracion:

```toml
[providers.google-gemini]
auth_profile = "work"
```

## Almacenamiento de tokens

Los tokens se cifran usando el cifrado ChaCha20-Poly1305 y se almacenan en el almacen de secretos de PRX en `~/.local/share/prx/secrets/`. La clave de cifrado se deriva de la identidad de la maquina.

## Relacionado

- [Vision general de autenticacion](/es/prx/auth/) -- arquitectura de autenticacion
- [Flujo OAuth2](/es/prx/auth/oauth2) -- documentacion detallada del flujo OAuth2
- [Perfiles de autenticacion](/es/prx/auth/profiles) -- gestion de perfiles
- [Almacen de secretos](/es/prx/security/secrets) -- como se almacenan los tokens de forma segura
