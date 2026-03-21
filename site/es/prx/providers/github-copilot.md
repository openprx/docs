---
title: GitHub Copilot
description: Configurar GitHub Copilot como proveedor LLM en PRX
---

# GitHub Copilot

> Accede a modelos de GitHub Copilot Chat via la API de Copilot con autenticacion automatica OAuth device-flow y gestion de tokens.

## Requisitos previos

- Una cuenta de GitHub con una suscripcion activa de **Copilot Individual**, **Copilot Business** o **Copilot Enterprise**
- Opcionalmente, un token de acceso personal de GitHub (de lo contrario, se usa el inicio de sesion interactivo device-flow)

## Configuracion rapida

### 1. Autenticar

En el primer uso, PRX te pedira autenticar via el flujo de codigo de dispositivo de GitHub:

```
GitHub Copilot authentication is required.
Visit: https://github.com/login/device
Code: XXXX-XXXX
Waiting for authorization...
```

Alternativamente, proporciona un token de GitHub directamente:

```bash
export GITHUB_TOKEN="ghp_..."
```

### 2. Configurar

```toml
[default]
provider = "copilot"
model = "gpt-4o"
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

GitHub Copilot proporciona acceso a un conjunto curado de modelos. Los modelos exactos disponibles dependen del nivel de tu suscripcion de Copilot:

| Modelo | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|--------|-------------------|-------|
| `gpt-4o` | 128K | Si | Si | Modelo Copilot por defecto |
| `gpt-4o-mini` | 128K | Si | Si | Mas rapido, economico |
| `claude-sonnet-4` | 200K | Si | Si | Disponible en Copilot Enterprise |
| `o3-mini` | 128K | No | Si | Modelo de razonamiento |

La disponibilidad de modelos puede variar segun tu plan de GitHub Copilot y las ofertas actuales de modelos de GitHub.

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | opcional | Token de acceso personal de GitHub (`ghp_...` o `gho_...`) |
| `model` | string | `gpt-4o` | Modelo por defecto a usar |

## Caracteristicas

### Autenticacion sin configuracion

El proveedor Copilot implementa el mismo flujo OAuth device-code usado por la extension Copilot de VS Code:

1. **Solicitud de codigo de dispositivo**: PRX solicita un codigo de dispositivo a GitHub
2. **Autorizacion del usuario**: Visitas `github.com/login/device` e ingresas el codigo
3. **Intercambio de token**: El token OAuth de GitHub se intercambia por una clave API de Copilot de corta duracion
4. **Cache automatico**: Los tokens se almacenan en `~/.config/openprx/copilot/` con permisos de archivo seguros (0600)
5. **Auto-renovacion**: Las claves API de Copilot expiradas se re-intercambian automaticamente sin re-autenticacion

### Almacenamiento seguro de tokens

Los tokens se almacenan con seguridad estricta:
- Directorio: `~/.config/openprx/copilot/` con permisos 0700
- Archivos: `access-token` y `api-key.json` con permisos 0600
- En plataformas no Unix, se usa la creacion estandar de archivos

### Llamada nativa a herramientas

Las herramientas se envian en formato compatible con OpenAI via la API de Chat Completions de Copilot (`/chat/completions`). El proveedor soporta `tool_choice: "auto"` para seleccion automatica de herramientas.

## Solucion de problemas

### "Failed to get Copilot API key (401/403)"

Tu token OAuth de GitHub puede haber expirado o tu suscripcion de Copilot esta inactiva:
- Asegurate de que tu cuenta de GitHub tiene una suscripcion activa de Copilot
- PRX limpia automaticamente el token de acceso en cache ante 401/403 y volvera a solicitar inicio de sesion device-flow

### "Timed out waiting for GitHub authorization"

El flujo device-code tiene un timeout de 15 minutos. Si expira:
- Ejecuta tu comando PRX de nuevo para obtener un nuevo codigo
- Asegurate de visitar la URL correcta e ingresar el codigo exacto mostrado

### Modelos no disponibles

Los modelos disponibles dependen del nivel de tu suscripcion de Copilot:
- **Copilot Individual**: GPT-4o, GPT-4o-mini
- **Copilot Business/Enterprise**: Puede incluir modelos adicionales como Claude

Verifica tu suscripcion en [github.com/settings/copilot](https://github.com/settings/copilot).
