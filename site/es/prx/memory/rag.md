---
title: Generacion Aumentada por Recuperacion (RAG)
description: Como PRX usa embeddings y busqueda de memoria para inyectar contexto relevante en los prompts del LLM antes de la generacion.
---

# Generacion Aumentada por Recuperacion (RAG)

PRX implementa Generacion Aumentada por Recuperacion (RAG) para mejorar las respuestas del LLM con contexto relevante de la memoria y almacenes de conocimiento del agente. En lugar de depender unicamente del conocimiento parametrico del LLM, RAG recupera documentos pertinentes y los inyecta en el prompt -- reduciendo alucinaciones y fundamentando las respuestas en informacion factual y actualizada.

## Vision general

El pipeline RAG se ejecuta antes de cada llamada LLM en el bucle del agente:

```
User Message
    │
    ▼
┌──────────────────────────┐
│  1. Query Formulation     │  Extract search terms from the
│                           │  user message + conversation context
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  2. Embedding Generation  │  Convert query to a vector using
│                           │  the configured embedding provider
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  3. Memory Search         │  Search across memory backends:
│                           │  vector similarity + full-text
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  4. Relevance Filtering   │  Score and filter results above
│                           │  the relevance threshold
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  5. Context Injection     │  Format results and inject into
│                           │  the system prompt / context window
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  6. LLM Generation        │  Model generates response with
│                           │  full context available
└──────────────────────────┘
```

## Configuracion

Habilita RAG en `config.toml`:

```toml
[memory]
backend = "embeddings"  # RAG requires the embeddings backend

[memory.embeddings]
# Embedding provider: "openai" | "ollama" | "local"
provider = "openai"
model = "text-embedding-3-small"
dimensions = 1536

# Vector store backend
vector_store = "sqlite"  # "sqlite" | "postgres" | "qdrant"

[rag]
enabled = true

# Maximum number of retrieved chunks to inject into context.
max_results = 10

# Minimum relevance score (0.0 to 1.0) for a chunk to be included.
relevance_threshold = 0.3

# Maximum total tokens allocated for RAG context.
# Prevents context window overflow.
max_context_tokens = 4000

# Strategy for selecting which chunks to include when
# max_context_tokens would be exceeded.
# "top_k" -- highest relevance scores first
# "mmr" -- maximal marginal relevance (diversity + relevance)
selection_strategy = "top_k"
```

### Proveedores de embeddings

PRX soporta multiples proveedores de embeddings:

| Proveedor | Modelo | Dimensiones | Notas |
|-----------|--------|-------------|-------|
| OpenAI | text-embedding-3-small | 1536 | Mejor relacion calidad/costo |
| OpenAI | text-embedding-3-large | 3072 | Mayor calidad |
| Ollama | nomic-embed-text | 768 | Local, sin costo de API |
| Ollama | mxbai-embed-large | 1024 | Local, mayor calidad |
| Local | fastembed | 384 | Incluido, sin red |

Configura el proveedor de embeddings:

```toml
# OpenAI embeddings
[memory.embeddings]
provider = "openai"
model = "text-embedding-3-small"
api_key = "${OPENAI_API_KEY}"

# Ollama embeddings (local)
[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
endpoint = "http://localhost:11434"

# Built-in local embeddings (no external service)
[memory.embeddings]
provider = "local"
model = "fastembed"
```

## Estrategias de fragmentacion

Antes de que los documentos puedan ser embebidos y buscados, deben dividirse en fragmentos. PRX soporta varias estrategias de fragmentacion:

| Estrategia | Descripcion | Ideal para |
|-----------|-------------|------------|
| `fixed_size` | Dividir en conteos fijos de tokens con superposicion | Documentos uniformes |
| `sentence` | Dividir en limites de oraciones | Prosa y texto natural |
| `paragraph` | Dividir en limites de parrafos | Documentos estructurados |
| `semantic` | Dividir en limites de temas usando embeddings | Documentos largos y variados |
| `recursive` | Division jerarquica (encabezado > parrafo > oracion) | Markdown/codigo |

```toml
[rag.chunking]
strategy = "recursive"

# Target chunk size in tokens.
chunk_size = 512

# Overlap between adjacent chunks (prevents losing context at boundaries).
chunk_overlap = 64

# For recursive strategy: separators in priority order.
separators = ["\n## ", "\n### ", "\n\n", "\n", ". "]
```

## Pipeline de recuperacion

### Pasos 1-3: Consulta, embedding, busqueda

El modulo RAG extrae una consulta de busqueda del mensaje mas reciente del usuario (opcionalmente reformulada via LLM con `query_reformulation = true`), la convierte en un vector usando el proveedor de embeddings, y busca a traves de todos los backends de memoria simultaneamente -- similitud vectorial (coseno) y busqueda de texto completo (FTS5/pg_trgm). Los resultados se fusionan y deduplican.

### Paso 4: Filtrado por relevancia

Cada resultado recibe una puntuacion de relevancia entre 0.0 y 1.0. Los resultados por debajo de `relevance_threshold` se descartan. La puntuacion considera:

- Similitud coseno vectorial (senal principal)
- Puntuacion de coincidencia de texto completo (factor de impulso)
- Recencia (memorias mas nuevas reciben un ligero impulso)
- Prioridad de fuente (memorias centrales clasificadas mas alto que las de conversacion)

### Paso 5: Inyeccion de contexto

Los resultados filtrados se formatean con etiquetas XML estructuradas (`<context><memory source="..." relevance="...">`) y se inyectan en el prompt del LLM. El contexto total inyectado se limita a `max_context_tokens` para prevenir desbordamiento de la ventana de contexto.

## Estrategias de seleccion

### Top-K

La estrategia por defecto. Selecciona los K fragmentos de mayor puntuacion que caben dentro de `max_context_tokens`. Simple y predecible, pero puede devolver resultados redundantes cuando multiples fragmentos cubren el mismo tema.

### Relevancia Marginal Maxima (MMR)

MMR equilibra relevancia con diversidad. Selecciona iterativamente fragmentos que son tanto relevantes para la consulta como diferentes de los fragmentos ya seleccionados:

```toml
[rag]
selection_strategy = "mmr"

# Lambda controls the relevance-diversity tradeoff.
# 1.0 = pure relevance (same as top_k)
# 0.0 = pure diversity
mmr_lambda = 0.7
```

MMR se recomienda cuando la base de conocimiento contiene informacion superpuesta o redundante.

## Indexacion de documentos

### Indexacion automatica

Las memorias almacenadas via la herramienta `memory_store` se convierten automaticamente en embeddings y se indexan. No se requiere configuracion adicional.

### Ingesta manual de documentos

Para ingesta masiva de documentos, usa el CLI:

```bash
# Index a single file or directory
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# Re-index all documents (rebuilds embeddings)
prx rag reindex
```

Formatos soportados: Markdown (`.md`), texto plano (`.txt`), PDF (`.pdf`), HTML (`.html`) y codigo fuente (`.rs`, `.py`, `.js`).

## Ajuste de rendimiento

| Parametro | Recomendacion |
|-----------|---------------|
| `chunk_size` | 256-512 tokens para preguntas y respuestas, 512-1024 para resumen |
| `chunk_overlap` | 10-20% del chunk_size |
| `max_results` | 5-15 para la mayoria de casos de uso |
| `relevance_threshold` | 0.3-0.5 (ajustar segun calidad) |

## Notas de seguridad

- El contexto RAG se inyecta en el prompt del LLM. Asegurate de que los documentos almacenados no contengan datos sensibles a menos que el agente este autorizado a acceder a ellos.
- Cuando `memory.acl_enabled = true`, RAG respeta las listas de control de acceso. Solo se recuperan memorias accesibles para el principal actual.
- Las llamadas a la API de embeddings transmiten el contenido del documento al proveedor de embeddings. Para datos sensibles, usa un proveedor de embeddings local (`ollama` o `local`).

## Paginas relacionadas

- [Sistema de memoria](/es/prx/memory/)
- [Embeddings](/es/prx/memory/embeddings)
- [Busqueda vectorial](/es/prx/memory/vector-search)
- [Backend SQLite](/es/prx/memory/sqlite)
- [Backend PostgreSQL](/es/prx/memory/postgres)
