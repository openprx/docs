---
title: Proveedores LLM
description: Vision general de los 9+ proveedores LLM soportados por PRX, incluyendo matriz de capacidades, configuracion, cadenas de respaldo y enrutamiento.
---

# Proveedores LLM

PRX se conecta a modelos de lenguaje grandes a traves de **proveedores** -- backends intercambiables que implementan el trait `Provider`. Cada proveedor maneja autenticacion, formato de solicitudes, streaming y clasificacion de errores para una API LLM especifica.

PRX incluye 9 proveedores integrados, un endpoint compatible con OpenAI para servicios de terceros, e infraestructura para cadenas de respaldo y enrutamiento inteligente.

## Matriz de capacidades

| Proveedor | Modelos clave | Streaming | Vision | Uso de herramientas | OAuth | Auto-alojado |
|-----------|--------------|-----------|--------|-------------------|-------|-------------|
| [Anthropic](/es/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | Si | Si | Si | Si (Claude Code) | No |
| [OpenAI](/es/prx/providers/openai) | GPT-4o, o1, o3 | Si | Si | Si | No | No |
| [Google Gemini](/es/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | Si | Si | Si | Si (Gemini CLI) | No |
| [OpenAI Codex](/es/prx/providers/openai-codex) | Modelos Codex | Si | No | Si | Si | No |
| [GitHub Copilot](/es/prx/providers/github-copilot) | Modelos Copilot Chat | Si | No | Si | Si (Device Flow) | No |
| [Ollama](/es/prx/providers/ollama) | Llama 3, Mistral, Qwen, cualquier GGUF | Si | Depende del modelo | Si | No | Si |
| [AWS Bedrock](/es/prx/providers/aws-bedrock) | Claude, Titan, Llama | Si | Depende del modelo | Depende del modelo | AWS IAM | No |
| [GLM](/es/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | Si | Depende del modelo | Depende del modelo | Si (Minimax/Qwen) | No |
| [OpenRouter](/es/prx/providers/openrouter) | 200+ modelos de multiples proveedores | Si | Depende del modelo | Depende del modelo | No | No |
| [Compatible personalizado](/es/prx/providers/custom-compatible) | Cualquier API compatible con OpenAI | Si | Depende del endpoint | Depende del endpoint | No | Si |

## Configuracion rapida

Los proveedores se configuran en `~/.config/openprx/config.toml` (o `~/.openprx/config.toml`). Como minimo, establece el proveedor por defecto y proporciona una clave API:

```toml
# Select the default provider and model
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (can also be set via ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."
```

Para proveedores auto-alojados como Ollama, especifica el endpoint:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

Cada proveedor resuelve su clave API de (en orden):

1. El campo `api_key` en `config.toml`
2. Variable de entorno especifica del proveedor (ej., `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`)
3. La variable de entorno generica `API_KEY`

Consulta [Variables de entorno](/es/prx/config/environment) para la lista completa de variables soportadas.

## Cadenas de respaldo con ReliableProvider

PRX envuelve las llamadas a proveedores en una capa `ReliableProvider` que proporciona:

- **Reintento automatico** con backoff exponencial para fallos transitorios (5xx, limites de velocidad 429, timeouts de red)
- **Cadenas de respaldo** -- cuando el proveedor primario falla, las solicitudes se enrutan automaticamente al siguiente proveedor en la cadena
- **Deteccion de errores no reintentables** -- errores de cliente como claves API invalidas (401/403) y modelos desconocidos (404) fallan rapido sin desperdiciar reintentos

Configura la confiabilidad en la seccion `[reliability]`:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

Cuando el proveedor primario (ej., Anthropic) devuelve un error transitorio, PRX reintenta hasta `max_retries` veces con backoff. Si todos los reintentos se agotan, pasa al primer proveedor de respaldo. La cadena de respaldo continua hasta obtener una respuesta exitosa o agotar todos los proveedores.

### Clasificacion de errores

El ReliableProvider clasifica errores en dos categorias:

- **Reintentables**: HTTP 5xx, 429 (limite de velocidad), 408 (timeout), errores de red
- **No reintentables**: HTTP 4xx (excepto 429/408), claves API invalidas, modelos desconocidos, respuestas malformadas

Los errores no reintentables omiten los reintentos y pasan inmediatamente al siguiente proveedor, evitando latencia desperdiciada.

## Integracion con el router

Para configuraciones avanzadas multi-modelo, PRX soporta un router LLM heuristico que selecciona el proveedor y modelo optimo por solicitud basandose en:

- **Puntuacion de capacidades** -- emparejar la complejidad de la consulta con las fortalezas del modelo
- **Calificacion Elo** -- rastrear el rendimiento del modelo a lo largo del tiempo
- **Optimizacion de costos** -- preferir modelos mas baratos para consultas simples
- **Ponderacion de latencia** -- considerar el tiempo de respuesta
- **Enrutamiento semantico KNN** -- usar embeddings de consultas historicas para enrutamiento basado en similitud
- **Escalacion Automix** -- comenzar con un modelo barato y escalar a un modelo premium cuando la confianza es baja

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

Consulta [Configuracion del router](/es/prx/router/) para detalles completos.

## Paginas de proveedores

- [Anthropic (Claude)](/es/prx/providers/anthropic)
- [OpenAI](/es/prx/providers/openai)
- [Google Gemini](/es/prx/providers/google-gemini)
- [OpenAI Codex](/es/prx/providers/openai-codex)
- [GitHub Copilot](/es/prx/providers/github-copilot)
- [Ollama](/es/prx/providers/ollama)
- [AWS Bedrock](/es/prx/providers/aws-bedrock)
- [GLM (Zhipu / Minimax / Moonshot / Qwen / Z.AI)](/es/prx/providers/glm)
- [OpenRouter](/es/prx/providers/openrouter)
- [Endpoint compatible personalizado](/es/prx/providers/custom-compatible)
