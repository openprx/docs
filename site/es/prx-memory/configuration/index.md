---
title: Referencia de Configuración
description: "Referencia completa de todas las variables de entorno de PRX-Memory que cubren transporte, almacenamiento, embedding, reranking, gobernanza y observabilidad."
---

# Referencia de Configuración

PRX-Memory se configura enteramente a través de variables de entorno. Esta página documenta cada variable agrupada por categoría.

## Transporte

| Variable | Valores | Predeterminado | Descripción |
|----------|---------|----------------|-------------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | Modo de transporte del servidor |
| `PRX_MEMORY_HTTP_ADDR` | `host:puerto` | `127.0.0.1:8787` | Dirección de enlace del servidor HTTP |

## Almacenamiento

| Variable | Valores | Predeterminado | Descripción |
|----------|---------|----------------|-------------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | Backend de almacenamiento |
| `PRX_MEMORY_DB` | ruta de archivo/directorio | -- | Ruta del archivo o directorio de base de datos |

## Embedding

| Variable | Valores | Predeterminado | Descripción |
|----------|---------|----------------|-------------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | -- | Proveedor de embedding |
| `PRX_EMBED_API_KEY` | string de clave API | -- | Clave de API del proveedor de embedding |
| `PRX_EMBED_MODEL` | nombre del modelo | específico del proveedor | Nombre del modelo de embedding |
| `PRX_EMBED_BASE_URL` | URL | específico del proveedor | URL del endpoint personalizado de la API |

### Claves de Respaldo de Proveedor

Si `PRX_EMBED_API_KEY` no está establecido, el sistema verifica estas claves específicas del proveedor:

| Proveedor | Clave de Respaldo |
|-----------|------------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## Reranking

| Variable | Valores | Predeterminado | Descripción |
|----------|---------|----------------|-------------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | Proveedor de reranking |
| `PRX_RERANK_API_KEY` | string de clave API | -- | Clave de API del proveedor de reranking |
| `PRX_RERANK_MODEL` | nombre del modelo | específico del proveedor | Nombre del modelo de reranking |
| `PRX_RERANK_ENDPOINT` | URL | específico del proveedor | Endpoint de reranking personalizado |
| `PRX_RERANK_API_VERSION` | string de versión | -- | Versión de la API (solo pinecone-compatible) |

### Claves de Respaldo de Proveedor

Si `PRX_RERANK_API_KEY` no está establecido, el sistema verifica estas claves específicas del proveedor:

| Proveedor | Clave de Respaldo |
|-----------|------------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## Estandarización

| Variable | Valores | Predeterminado | Descripción |
|----------|---------|----------------|-------------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | Perfil de estandarización |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | string de etiqueta | `prx-memory` | Etiqueta de proyecto por defecto |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | string de etiqueta | `mcp` | Etiqueta de herramienta por defecto |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | string de etiqueta | `general` | Etiqueta de dominio por defecto |

## Sesiones de Streaming

| Variable | Valores | Predeterminado | Descripción |
|----------|---------|----------------|-------------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | milisegundos | `300000` | Tiempo de vida de la sesión de streaming |

## Observabilidad

### Controles de Cardinalidad

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | Máximo de etiquetas de alcance distintas en métricas |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | Máximo de etiquetas de categoría distintas en métricas |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | Máximo de etiquetas de proveedor de reranking distintas |

### Umbrales de Alerta

| Variable | Predeterminado | Descripción |
|----------|----------------|-------------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | Umbral de advertencia para ratio de error de herramientas |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | Umbral crítico para ratio de error de herramientas |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | Umbral de advertencia para ratio de advertencia remota |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | Umbral crítico para ratio de advertencia remota |

## Ejemplo: Configuración Mínima

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## Ejemplo: Configuración Completa de Producción

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## Siguientes Pasos

- [Instalación](../getting-started/installation) -- Compilar e instalar PRX-Memory
- [Integración MCP](../mcp/) -- Configurar tu cliente MCP
- [Resolución de Problemas](../troubleshooting/) -- Problemas comunes de configuración
