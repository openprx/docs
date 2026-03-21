---
title: Compatible personalizado
description: Configurar cualquier endpoint de API compatible con OpenAI como proveedor LLM en PRX
---

# Compatible personalizado

> Conecta PRX a cualquier API LLM que siga el formato de Chat Completions de OpenAI. Funciona con LiteLLM, vLLM, Groq, Mistral, xAI, Venice, Vercel AI, Cloudflare AI, HuggingFace Inference y cualquier otro servicio compatible con OpenAI.

## Requisitos previos

- Una API LLM en ejecucion que implemente el formato de Chat Completions de OpenAI (`/v1/chat/completions` o `/chat/completions`)
- Una clave API (si el servicio lo requiere)

## Configuracion rapida

### 1. Identificar tu endpoint

Determina la URL base y el metodo de autenticacion de tu API. Por ejemplo:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- vLLM local: `http://localhost:8000/v1`
- Proxy LiteLLM: `http://localhost:4000`

### 2. Configurar

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. Verificar

```bash
prx doctor models
```

## Proveedores compatibles integrados

PRX incluye alias preconfigurados para servicios populares compatibles con OpenAI:

| Nombre del proveedor | Alias | URL base | Estilo de auth |
|--------------------|-------|----------|--------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | configurable | Bearer |
| vLLM | `vllm`, `v-llm` | configurable | Bearer |
| HuggingFace | `huggingface`, `hf` | configurable | Bearer |

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | opcional | Clave de autenticacion API |
| `api_url` | string | requerido | URL base del endpoint de la API |
| `model` | string | requerido | Nombre/ID del modelo a usar |
| `auth_style` | string | `"bearer"` | Estilo de cabecera de autenticacion (ver abajo) |

### Estilos de autenticacion

| Estilo | Formato de cabecera | Uso |
|--------|-------------------|-----|
| `bearer` | `Authorization: Bearer <key>` | La mayoria de proveedores (por defecto) |
| `x-api-key` | `x-api-key: <key>` | Algunos proveedores chinos |
| `custom` | Nombre de cabecera personalizado | Casos especiales |

## Caracteristicas

### Deteccion automatica de endpoint

PRX automaticamente agrega `/chat/completions` a tu URL base. No necesitas incluir la ruta del endpoint:

```toml
# Correct - PRX appends /chat/completions
api_url = "https://api.groq.com/openai/v1"

# Also correct - explicit path works too
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Llamada nativa a herramientas

Las herramientas se envian en el formato estandar de llamada a funciones de OpenAI. El proveedor soporta `tool_choice: "auto"` y deserializa correctamente las respuestas estructuradas de `tool_calls`.

### Soporte de vision

Para modelos con capacidad de vision, las imagenes incrustadas en mensajes como marcadores `[IMAGE:data:image/png;base64,...]` se convierten automaticamente al formato de vision de OpenAI con bloques de contenido `image_url`.

### Soporte de streaming

El proveedor compatible soporta streaming SSE para entrega de tokens en tiempo real.

### Fusion de mensajes del sistema

Algunos proveedores (ej., MiniMax) rechazan mensajes `role: system`. PRX puede fusionar automaticamente el contenido del mensaje del sistema en el primer mensaje del usuario.

### Modo forzado HTTP/1.1

Algunos proveedores (notablemente DashScope/Qwen) requieren HTTP/1.1 en lugar de HTTP/2. PRX detecta automaticamente estos endpoints y fuerza HTTP/1.1.

## Configuracion avanzada

### Servidor LLM local (vLLM, llama.cpp, etc.)

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# No api_key needed for local servers
```

### Proxy LiteLLM

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### Multiples proveedores personalizados

Usa el router de modelos para configurar multiples proveedores compatibles:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## Solucion de problemas

### Conexion rechazada

Asegurate de que el endpoint de la API es alcanzable:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- Verifica que tu clave API es correcta
- Comprueba que el estilo de autenticacion coincide con tu proveedor (Bearer vs x-api-key)
- Algunos proveedores requieren cabeceras adicionales; usa un alias de proveedor con nombre si esta disponible

### "role: system" rechazado

Si tu proveedor no soporta mensajes del sistema, PRX deberia manejar esto automaticamente para proveedores conocidos. Para endpoints personalizados, esta es una limitacion del proveedor. Solucion: incluir instrucciones del sistema en el primer mensaje del usuario.

### El streaming no funciona

No todas las APIs compatibles con OpenAI soportan streaming. Si el streaming falla, PRX recurre al modo sin streaming automaticamente.

### Modelo no encontrado

Verifica el nombre/ID exacto del modelo que tu proveedor espera. Diferentes proveedores usan diferentes convenciones de nomenclatura:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

Consulta la documentacion de tu proveedor para los identificadores correctos de modelo.
