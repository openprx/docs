---
title: Modelos de Reranking
description: "Modelos de reranking soportados por PRX-Memory incluyendo proveedores Jina, Cohere y Pinecone."
---

# Modelos de Reranking

PRX-Memory soporta múltiples proveedores de reranking a través del crate `prx-memory-rerank`. Cada proveedor implementa el mismo trait adaptador, lo que permite cambios sin problemas.

## Jina AI

Jina ofrece modelos de reranking cross-encoder con soporte multilingüe.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| Modelo | Notas |
|--------|-------|
| `jina-reranker-v2-base-multilingual` | Cross-encoder multilingüe |
| `jina-reranker-v1-base-en` | Optimizado para inglés |

::: info
El reranking de Jina puede usar la misma clave de API que el embedding de Jina. Establece `JINA_API_KEY` una vez para cubrir ambos.
:::

## Cohere

Cohere proporciona reranking de alta calidad a través de su API Rerank.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| Modelo | Notas |
|--------|-------|
| `rerank-v3.5` | Modelo más reciente, mejor calidad |
| `rerank-english-v3.0` | Optimizado para inglés |
| `rerank-multilingual-v3.0` | Soporte multilingüe |

## Pinecone

Pinecone ofrece reranking como parte de su API de inferencia.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

Para endpoints personalizados compatibles con Pinecone:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## Elegir un Reranker

| Prioridad | Proveedor Recomendado | Modelo |
|-----------|----------------------|--------|
| Mejor calidad | Cohere | `rerank-v3.5` |
| Multilingüe | Jina | `jina-reranker-v2-base-multilingual` |
| Integrado con Pinecone | Pinecone | `bge-reranker-v2-m3` |
| Sin reranking necesario | -- | `PRX_RERANK_PROVIDER=none` |

## Combinar Embedding y Reranking

Una configuración de alta calidad habitual combina embeddings de Jina con reranking de Cohere:

```bash
# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

Esta configuración aprovecha los rápidos embeddings multilingües de Jina para recuperación amplia y el reranker de alta precisión de Cohere para la ordenación final.

## Siguientes Pasos

- [Modelos de Embedding](../embedding/models) -- Opciones de modelos de embedding de primera etapa
- [Referencia de Configuración](../configuration/) -- Todas las variables de entorno
