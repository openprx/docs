---
title: Anthropic
description: Configurar Anthropic Claude como proveedor LLM en PRX
---

# Anthropic

> Accede a modelos Claude (Opus, Sonnet, Haiku) via la API de mensajes de Anthropic con uso nativo de herramientas, vision, cache de prompts y auto-renovacion de tokens OAuth.

## Requisitos previos

- Una clave API de Anthropic de [console.anthropic.com](https://console.anthropic.com/), **o**
- Un token OAuth de Claude Code (auto-detectado desde `~/.claude/.credentials.json`)

## Configuracion rapida

### 1. Obtener clave API

1. Registrarse en [console.anthropic.com](https://console.anthropic.com/)
2. Navegar a **API Keys** en el panel
3. Hacer clic en **Create Key** y copiar la clave (comienza con `sk-ant-`)

### 2. Configurar

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

O establecer la variable de entorno:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

| Modelo | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|--------|-------------------|-------|
| `claude-opus-4-20250514` | 200K | Si | Si | Mas capaz, mejor para razonamiento complejo |
| `claude-sonnet-4-20250514` | 200K | Si | Si | Mejor equilibrio de velocidad y capacidad |
| `claude-haiku-3-5-20241022` | 200K | Si | Si | Mas rapido, mas economico |
| `claude-sonnet-4-6` | 200K | Si | Si | Ultima version de Sonnet |
| `claude-opus-4-6` | 200K | Si | Si | Ultima version de Opus |

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | requerido | Clave API de Anthropic (`sk-ant-...`) o token OAuth |
| `api_url` | string | `https://api.anthropic.com` | URL base personalizada de la API (para proxies) |
| `model` | string | `claude-sonnet-4-20250514` | Modelo por defecto a usar |

## Caracteristicas

### Llamada nativa a herramientas

PRX envia definiciones de herramientas en el formato nativo de Anthropic con `input_schema`, evitando la conversion con perdidas del formato OpenAI a Anthropic. Los resultados de herramientas se envuelven correctamente como bloques de contenido `tool_result`.

### Vision (analisis de imagenes)

Las imagenes incrustadas en mensajes como marcadores `[IMAGE:data:image/png;base64,...]` se convierten automaticamente a bloques de contenido `image` nativos de Anthropic con los campos `media_type` y `source_type` apropiados. Se soportan imagenes de hasta 20 MB (se registra una advertencia para payloads que excedan este tamano).

### Cache de prompts

PRX aplica automaticamente el cache efimero de prompts de Anthropic para reducir costos y latencia:

- **Prompts del sistema** mas grandes que ~1024 tokens (3 KB) reciben un bloque `cache_control`
- **Conversaciones** con mas de 4 mensajes no del sistema tienen el ultimo mensaje en cache
- **Definiciones de herramientas** tienen la ultima herramienta marcada con `cache_control: ephemeral`

No se requiere configuracion; el cache se aplica de forma transparente.

### Auto-renovacion de token OAuth

Cuando se usan credenciales de Claude Code, PRX automaticamente:

1. Detecta tokens OAuth en cache desde `~/.claude/.credentials.json`
2. Renueva proactivamente los tokens 90 segundos antes de expirar
3. Reintenta ante respuestas 401 con un token fresco
4. Persiste las credenciales renovadas de vuelta al disco

Esto significa que `prx` puede usar un inicio de sesion existente de Claude Code con cero configuracion adicional.

### Integracion con Claude Code

PRX reconoce las siguientes fuentes de autenticacion de Anthropic:

| Fuente | Deteccion |
|--------|-----------|
| Clave API directa | Prefijo `sk-ant-api-...`, enviada via cabecera `x-api-key` |
| Token de configuracion OAuth | Prefijo `sk-ant-oat01-...`, enviado via `Authorization: Bearer` con cabecera `anthropic-beta` |
| Credencial en cache de Claude Code | `~/.claude/.credentials.json` con `access_token` + `refresh_token` |
| Variable de entorno | `ANTHROPIC_API_KEY` |

### URL base personalizada

Para enrutar a traves de un proxy o endpoint alternativo:

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## Alias del proveedor

Los siguientes nombres resuelven al proveedor Anthropic:

- `anthropic`
- `claude-code`
- `claude-cli`

## Solucion de problemas

### "Anthropic credentials not set"

PRX no pudo encontrar ninguna autenticacion. Asegurate de que uno de estos este configurado:

1. Variable de entorno `ANTHROPIC_API_KEY`
2. `api_key` en `config.toml` bajo `[providers.anthropic]`
3. Un `~/.claude/.credentials.json` valido de Claude Code

### 401 Unauthorized

- **Clave API**: Verifica que comienza con `sk-ant-api-` y no ha expirado
- **Token OAuth**: Ejecuta `prx auth login --provider anthropic` para re-autenticar, o reinicia Claude Code para renovar el token
- **Problema de proxy**: Si usas un `api_url` personalizado, confirma que el proxy reenvie correctamente la cabecera `x-api-key` o `Authorization`

### Payload de imagen demasiado grande

Anthropic recomienda imagenes menores a 20 MB en forma codificada en base64. Redimensiona o comprime imagenes grandes antes de enviar.

### El cache de prompts no funciona

El cache es automatico pero requiere:
- Prompt del sistema > 3 KB para activar cache a nivel de sistema
- Mas de 4 mensajes no del sistema para activar cache de conversacion
- Version de API `2023-06-01` (establecida automaticamente por PRX)
