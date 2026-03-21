---
title: GLM (Zhipu AI)
description: Configurar GLM y proveedores de IA chinos relacionados (Minimax, Moonshot, Qwen, Z.AI) en PRX
---

# GLM (Zhipu AI)

> Accede a modelos GLM de Zhipu y una familia de proveedores de IA chinos a traves de una configuracion unificada. Incluye alias para Minimax, Moonshot (Kimi), Qwen (DashScope) y Z.AI.

## Requisitos previos

- Una clave API de Zhipu AI de [open.bigmodel.cn](https://open.bigmodel.cn/) (para modelos GLM), **o**
- Claves API para el proveedor especifico que deseas usar (Minimax, Moonshot, Qwen, etc.)

## Configuracion rapida

### 1. Obtener clave API

1. Registrarse en [open.bigmodel.cn](https://open.bigmodel.cn/)
2. Navegar a la seccion de API Keys
3. Crear una nueva clave (formato: `id.secret`)

### 2. Configurar

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

O establecer la variable de entorno:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

### Modelos GLM

| Modelo | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|--------|-------------------|-------|
| `glm-4-plus` | 128K | Si | Si | Modelo GLM mas capaz |
| `glm-4` | 128K | Si | Si | GLM-4 estandar |
| `glm-4-flash` | 128K | Si | Si | Rapido y economico |
| `glm-4v` | 128K | Si | Si | Optimizado para vision |

### Proveedores con alias

PRX tambien soporta estos proveedores como alias que se enrutan a traves de la interfaz compatible con OpenAI:

| Proveedor | Nombres de alias | URL base | Modelos clave |
|-----------|-----------------|----------|--------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1` (intl), `api.minimaxi.com/v1` (CN) | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1` (intl), `api.moonshot.cn/v1` (CN) | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com` (CN), `dashscope-intl.aliyuncs.com` (intl) | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4` (global), `open.bigmodel.cn/api/coding/paas/v4` (CN) | Modelos de codificacion Z.AI |

## Referencia de configuracion

### GLM (proveedor nativo)

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | requerido | Clave API GLM en formato `id.secret` |
| `model` | string | requerido | Nombre del modelo GLM |

### Proveedores con alias (compatible con OpenAI)

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | requerido | Clave API especifica del proveedor |
| `api_url` | string | auto-detectada | Sobreescritura de la URL base por defecto |
| `model` | string | requerido | Nombre del modelo |

## Caracteristicas

### Autenticacion JWT

GLM usa autenticacion basada en JWT en lugar de claves API simples. PRX automaticamente:

1. Divide la clave API en componentes `id` y `secret`
2. Genera un token JWT con cabecera, payload y firma HMAC-SHA256
3. Almacena el JWT en cache durante 3 minutos (el token expira a los 3.5 minutos)
4. Lo envia como `Authorization: Bearer <jwt>`

### Endpoints regionales

La mayoria de los proveedores con alias ofrecen endpoints tanto internacionales como de China continental:

```toml
# International (default for most)
provider = "moonshot-intl"

# China mainland
provider = "moonshot-cn"

# Explicit regional variants
provider = "qwen-us"      # US region
provider = "qwen-intl"    # International
provider = "qwen-cn"      # China mainland
```

### Soporte OAuth de Minimax

Minimax soporta autenticacion con token OAuth:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

Establece `provider = "minimax-oauth"` o `provider = "minimax-oauth-cn"` para usar OAuth en lugar de autenticacion por clave API.

### Modos OAuth y de codificacion de Qwen

Qwen ofrece modos de acceso adicionales:

- **Qwen OAuth**: `provider = "qwen-oauth"` o `provider = "qwen-code"` para acceso basado en OAuth
- **Qwen Coding**: `provider = "qwen-coding"` o `provider = "dashscope-coding"` para el endpoint de API especializado en codificacion

## Referencia de alias de proveedores

| Alias | Resuelve a | Endpoint |
|-------|-----------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM (global) | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM (CN) | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax (intl) | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax (CN) | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot (CN) | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot (intl) | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen (CN) | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen (intl) | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen (US) | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI (global) | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI (CN) | `open.bigmodel.cn/api/coding/paas/v4` |

## Solucion de problemas

### "GLM API key not set or invalid format"

La clave API de GLM debe estar en formato `id.secret` (contiene exactamente un punto). Verifica el formato de tu clave:
```
abc123.secretXYZ  # correct
abc123secretXYZ   # wrong - missing dot
```

### La generacion de JWT falla

Asegurate de que el reloj de tu sistema es preciso. Los tokens JWT incluyen una marca de tiempo y expiran despues de 3.5 minutos.

### MiniMax rechaza "role: system"

MiniMax no acepta mensajes `role: system`. PRX automaticamente fusiona el contenido del mensaje del sistema en el primer mensaje del usuario cuando se usan proveedores MiniMax.

### Timeout de Qwen/DashScope

La API DashScope de Qwen requiere HTTP/1.1 (no HTTP/2). PRX automaticamente fuerza HTTP/1.1 para endpoints DashScope. Si experimentas timeouts, asegurate de que tu red permite conexiones HTTP/1.1.

### Errores de endpoint regional

Si obtienes errores de conexion, intenta cambiar entre endpoints regionales:
- Usuarios en China: Usa variantes `*-cn`
- Usuarios internacionales: Usa variantes `*-intl` o base
- Usuarios en EE.UU.: Prueba `qwen-us` para Qwen
