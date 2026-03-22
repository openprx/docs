---
title: Modelos de Embedding
description: "Modelos de embedding soportados por PRX-Memory incluyendo OpenAI-compatible, Jina y Gemini."
---

# Modelos de Embedding

PRX-Memory soporta múltiples proveedores de embedding a través del crate `prx-memory-embed`. Cada proveedor implementa el mismo trait adaptador, lo que permite cambios sin problemas.

## OpenAI-Compatible

Cualquier API compatible con OpenAI puede usarse como proveedor de embedding. Esto incluye el propio OpenAI, así como endpoints compatibles auto-alojados.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_api_key
PRX_EMBED_MODEL=text-embedding-3-small
# PRX_EMBED_BASE_URL=https://custom-endpoint.example.com  # Optional
```

| Modelo | Dimensiones | Notas |
|--------|------------|-------|
| `text-embedding-3-small` | 1536 | Buen equilibrio calidad/costo |
| `text-embedding-3-large` | 3072 | Mayor calidad, más caro |
| `text-embedding-ada-002` | 1536 | Modelo heredado |

## Jina AI

Jina ofrece modelos de embedding optimizados para texto de código y multilingüe.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| Modelo | Dimensiones | Notas |
|--------|------------|-------|
| `jina-embeddings-v3` | 1024 | Última generación, multilingüe |
| `jina-embeddings-v2-base-en` | 768 | Optimizado para inglés |
| `jina-embeddings-v2-base-code` | 768 | Optimizado para código |

::: tip
La clave de API de Jina puede usarse tanto para embedding como para reranking. Establece `JINA_API_KEY` una vez para cubrir ambos.
:::

## Google Gemini

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| Modelo | Dimensiones | Notas |
|--------|------------|-------|
| `text-embedding-004` | 768 | Modelo de embedding Gemini más reciente |
| `embedding-001` | 768 | Modelo de embedding original |

## Elegir un Modelo

| Prioridad | Proveedor Recomendado | Modelo |
|-----------|----------------------|--------|
| Mejor calidad general | OpenAI | `text-embedding-3-large` |
| Multilingüe | Jina | `jina-embeddings-v3` |
| Optimizado para código | Jina | `jina-embeddings-v2-base-code` |
| Costo/calidad equilibrado | OpenAI | `text-embedding-3-small` |
| Auto-alojado / personalizado | openai-compatible | Cualquier endpoint compatible |

## Cambiar de Modelo

Cuando cambias modelos de embedding, los vectores existentes quedan desactualizados porque han sido calculados con un modelo diferente. Usa `memory_reembed` para recalcularlos:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

Esto re-embebe todas las entradas de memoria con el modelo configurado actualmente.

## Siguientes Pasos

- [Procesamiento en Batch](./batch-processing) -- Embeber grandes conjuntos de datos eficientemente
- [Motor de Reranking](../reranking/) -- Segunda etapa de recuperación
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno
