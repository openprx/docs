---
title: OpenRouter
description: Configurar OpenRouter como proveedor LLM en PRX
---

# OpenRouter

> Accede a mas de 200 modelos de multiples proveedores (OpenAI, Anthropic, Google, Meta, Mistral y mas) a traves de una unica clave API e interfaz unificada.

## Requisitos previos

- Una clave API de OpenRouter de [openrouter.ai](https://openrouter.ai/)

## Configuracion rapida

### 1. Obtener clave API

1. Registrarse en [openrouter.ai](https://openrouter.ai/)
2. Ir a **Keys** en tu panel
3. Hacer clic en **Create Key** y copiarla (comienza con `sk-or-`)

### 2. Configurar

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

O establecer la variable de entorno:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

OpenRouter proporciona acceso a cientos de modelos. Algunas opciones populares:

| Modelo | Proveedor | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|----------|--------|-------------------|-------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | Si | Si | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | Si | Si | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | Si | Si | GPT-4o |
| `openai/o3` | OpenAI | 128K | Si | Si | Modelo de razonamiento |
| `google/gemini-2.5-pro` | Google | 1M | Si | Si | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | Si | Si | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | No | Si | Mayor modelo abierto |
| `deepseek/deepseek-chat` | DeepSeek | 128K | No | Si | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | No | Si | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | No | Si | Grok 2 |

Explora la lista completa de modelos en [openrouter.ai/models](https://openrouter.ai/models).

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | requerido | Clave API de OpenRouter (`sk-or-...`) |
| `model` | string | requerido | ID del modelo en formato `proveedor/modelo` |

## Caracteristicas

### Acceso unificado multi-proveedor

Con una unica clave API de OpenRouter, puedes acceder a modelos de OpenAI, Anthropic, Google, Meta, Mistral, Cohere y muchos mas. Esto elimina la necesidad de gestionar multiples claves API.

### API compatible con OpenAI

OpenRouter expone una API de Chat Completions compatible con OpenAI en `https://openrouter.ai/api/v1/chat/completions`.

### Llamada nativa a herramientas

Las herramientas se envian en el formato nativo de llamada a funciones de OpenAI. El proveedor soporta `tool_choice: "auto"` y maneja correctamente las respuestas estructuradas de `tool_calls`.

### Precalentamiento de conexion

Al iniciar, PRX envia una solicitud ligera a `https://openrouter.ai/api/v1/auth/key` para verificar la clave API y establecer pooling de conexiones TLS/HTTP2.

## Proveedor por defecto

OpenRouter es el proveedor por defecto de PRX. Si no se especifica ningun `provider` en tu configuracion, PRX usa OpenRouter por defecto.

## Solucion de problemas

### "OpenRouter API key not set"

Establece la variable de entorno `OPENROUTER_API_KEY` o agrega `api_key` bajo `[providers.openrouter]` en tu `config.toml`. Tambien puedes ejecutar `prx onboard` para configuracion interactiva.

### 402 Payment Required

Tu cuenta de OpenRouter no tiene suficientes creditos. Agrega creditos en [openrouter.ai/credits](https://openrouter.ai/credits).

### Errores especificos del modelo

Diferentes modelos en OpenRouter tienen diferentes capacidades y limites de velocidad. Si un modelo especifico devuelve errores:
- Verifica si el modelo soporta llamada a herramientas (no todos lo hacen)
- Confirma que el modelo no esta deprecado en OpenRouter
- Prueba una variante diferente del modelo

### Respuestas lentas

OpenRouter enruta al proveedor subyacente. El tiempo de respuesta depende de la carga actual del proveedor del modelo, tu distancia geografica al proveedor y el tamano del modelo y longitud de contexto. Considera usar `fallback_providers` para cambiar a una conexion directa al proveedor si OpenRouter es lento.
