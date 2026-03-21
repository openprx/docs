---
title: OpenAI Codex
description: Configurar OpenAI Codex (flujo OAuth2 de GitHub Copilot) como proveedor LLM en PRX
---

# OpenAI Codex

> Accede a los modelos Codex de OpenAI via la API de Respuestas de ChatGPT usando el flujo de autenticacion OAuth2 de GitHub Copilot. Proporciona acceso a modelos GPT-5.x Codex con capacidades de razonamiento y llamada nativa a herramientas.

## Requisitos previos

- Una suscripcion ChatGPT Plus, Team o Enterprise
- Un token OAuth2 existente de Codex CLI o GitHub Copilot, **o** disposicion para ejecutar el flujo `prx auth login`

## Configuracion rapida

### 1. Autenticar

```bash
prx auth login --provider openai-codex
```

Esto inicia el flujo de dispositivo OAuth de GitHub y almacena tokens en `~/.openprx/`.

### 2. Configurar

```toml
[default]
provider = "openai-codex"
model = "gpt-5.3-codex"
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

| Modelo | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|--------|-------------------|-------|
| `gpt-5.3-codex` | 128K | Si | Si | Ultimo modelo Codex, mayor capacidad |
| `gpt-5.2-codex` | 128K | Si | Si | Generacion anterior de Codex |
| `gpt-5.1-codex` | 128K | Si | Si | Version estable de Codex |
| `gpt-5.1-codex-mini` | 128K | Si | Si | Variante mas pequena y rapida de Codex |
| `gpt-5-codex` | 128K | Si | Si | Primera generacion Codex 5 |
| `o3` | 128K | Si | Si | Modelo de razonamiento de OpenAI |
| `o4-mini` | 128K | Si | Si | Modelo de razonamiento mas pequeno |

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `model` | string | `gpt-5.3-codex` | Modelo Codex por defecto a usar |

No se necesita clave API en la configuracion. La autenticacion se maneja a traves del flujo OAuth almacenado en `~/.openprx/`.

## Caracteristicas

### API de Respuestas

A diferencia del proveedor estandar de OpenAI que usa la API de Chat Completions, el proveedor Codex usa la API de Respuestas mas reciente (`/codex/responses`) con:

- Streaming SSE con eventos de texto delta en tiempo real
- Items de salida `function_call` estructurados para uso de herramientas
- Control de esfuerzo de razonamiento (`minimal` / `low` / `medium` / `high` / `xhigh`)
- Resumenes de razonamiento en metadatos de respuesta

### Esfuerzo de razonamiento automatico

PRX ajusta automaticamente el esfuerzo de razonamiento segun el modelo:

| Modelo | `minimal` | `xhigh` |
|--------|-----------|---------|
| `gpt-5.2-codex` / `gpt-5.3-codex` | Limitado a `low` | Permitido |
| `gpt-5.1` | Permitido | Limitado a `high` |
| `gpt-5.1-codex-mini` | Limitado a `medium` | Limitado a `high` |

Sobreescribe con la variable de entorno `ZEROCLAW_CODEX_REASONING_EFFORT`.

### Gestion de tokens OAuth2

PRX gestiona el ciclo de vida completo de OAuth2:

1. **Login**: `prx auth login --provider openai-codex` inicia el flujo de codigo de dispositivo
2. **Almacenamiento de tokens**: Los tokens se almacenan cifrados en `~/.openprx/`
3. **Auto-renovacion**: Los tokens de acceso expirados se renuevan automaticamente usando el token de actualizacion almacenado
4. **Importacion de Codex CLI**: Si tienes una instalacion existente de Codex CLI, PRX puede importar sus tokens automaticamente

## Variables de entorno

| Variable | Descripcion |
|----------|-------------|
| `ZEROCLAW_CODEX_REASONING_EFFORT` | Sobreescribir esfuerzo de razonamiento (`minimal` / `low` / `medium` / `high` / `xhigh`) |
| `ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS` | Timeout de inactividad del stream en segundos (por defecto: 45, minimo: 5) |

## Solucion de problemas

### "OpenAI Codex auth profile not found"

Ejecuta `prx auth login --provider openai-codex` para autenticar. Esto requiere una suscripcion ChatGPT.

### "OpenAI Codex account id not found"

El token JWT no contiene un ID de cuenta. Re-autenticate con `prx auth login --provider openai-codex`.

### Errores de timeout del stream

Si ves `provider_response_timeout kind=stream_idle_timeout`, el modelo esta tardando demasiado en responder. Opciones:
- Aumentar el timeout: `export ZEROCLAW_CODEX_STREAM_IDLE_TIMEOUT_SECS=120`
- Usar un modelo mas rapido como `gpt-5.1-codex-mini`

### Error "payload_too_large"

La respuesta excedio 4 MB. Esto usualmente indica una respuesta del modelo inusualmente grande. Intenta dividir tu solicitud en partes mas pequenas.
