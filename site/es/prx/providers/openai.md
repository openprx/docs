---
title: OpenAI
description: Configurar OpenAI como proveedor LLM en PRX
---

# OpenAI

> Accede a modelos GPT via la API de Chat Completions de OpenAI con llamada nativa a funciones, vision y soporte para modelos de razonamiento.

## Requisitos previos

- Una clave API de OpenAI de [platform.openai.com](https://platform.openai.com/)

## Configuracion rapida

### 1. Obtener clave API

1. Registrarse en [platform.openai.com](https://platform.openai.com/)
2. Navegar a **API Keys** en la barra lateral izquierda
3. Hacer clic en **Create new secret key** y copiarla (comienza con `sk-`)

### 2. Configurar

```toml
[default]
provider = "openai"
model = "gpt-4o"

[providers.openai]
api_key = "${OPENAI_API_KEY}"
```

O establecer la variable de entorno:

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. Verificar

```bash
prx doctor models
```

## Modelos disponibles

| Modelo | Contexto | Vision | Uso de herramientas | Notas |
|--------|----------|--------|-------------------|-------|
| `gpt-4o` | 128K | Si | Si | Mejor modelo de proposito general |
| `gpt-4o-mini` | 128K | Si | Si | Mas pequeno, rapido y economico |
| `gpt-4-turbo` | 128K | Si | Si | Modelo insignia de generacion anterior |
| `o3` | 128K | Si | Si | Modelo de razonamiento |
| `o4-mini` | 128K | Si | Si | Modelo de razonamiento mas pequeno |
| `gpt-4` | 8K | No | Si | GPT-4 original |

## Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `api_key` | string | requerido | Clave API de OpenAI (`sk-...`) |
| `api_url` | string | `https://api.openai.com/v1` | URL base personalizada de la API |
| `model` | string | `gpt-4o` | Modelo por defecto a usar |

## Caracteristicas

### Llamada nativa a funciones

PRX envia herramientas en el formato nativo `function` de OpenAI. Las definiciones de herramientas incluyen `name`, `description` y `parameters` (JSON Schema). El proveedor soporta `tool_choice: "auto"` para seleccion automatica de herramientas.

### Vision

Los modelos con capacidad de vision (GPT-4o, GPT-4o-mini) pueden analizar imagenes incluidas en la conversacion. Las imagenes se envian en linea a traves del formato de mensaje estandar.

### Soporte para modelos de razonamiento

Para modelos de razonamiento (o1, o3, o4-mini), PRX maneja automaticamente el fallback de `reasoning_content`. Cuando el modelo devuelve salida en `reasoning_content` en lugar de `content`, PRX extrae el texto de razonamiento de forma transparente.

### Conversaciones multi-turno

El historial completo de conversacion se preserva y envia a la API, incluyendo prompts del sistema, mensajes del usuario, respuestas del asistente y pares de llamada/resultado de herramientas en el formato estructurado nativo de OpenAI.

### URL base personalizada

Para usar un proxy, Azure OpenAI o cualquier endpoint compatible con OpenAI:

```toml
[providers.openai]
api_key = "${OPENAI_API_KEY}"
api_url = "https://my-proxy.example.com/v1"
```

### Precalentamiento de conexion

Al iniciar, PRX envia una solicitud ligera `GET /models` para establecer TLS y pooling de conexiones HTTP/2, reduciendo la latencia en la primera solicitud real.

## Solucion de problemas

### "OpenAI API key not set"

Establece la variable de entorno `OPENAI_API_KEY` o agrega `api_key` a `[providers.openai]` en tu `config.toml`.

### 429 Rate Limit

OpenAI aplica limites de tokens y solicitudes por minuto. Soluciones:
- Esperar y reintentar (PRX maneja esto automaticamente con el wrapper de proveedor confiable)
- Actualizar tu plan de OpenAI para limites de velocidad mas altos
- Usar `fallback_providers` para recurrir a otro proveedor durante la limitacion de velocidad

### Respuesta vacia de modelos de razonamiento

Si usas o1/o3/o4-mini y obtienes respuestas vacias, este es el comportamiento esperado cuando la salida del modelo esta completamente en `reasoning_content`. PRX automaticamente recurre a `reasoning_content` cuando `content` esta vacio.
