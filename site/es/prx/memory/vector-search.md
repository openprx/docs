---
title: Busqueda vectorial y procesamiento de texto
description: Busqueda vectorial basada en embeddings, estrategias de fragmentacion de texto, extraccion de temas y filtrado de contenido en la memoria de PRX.
---

# Busqueda vectorial y procesamiento de texto

PRX incluye un pipeline de procesamiento de texto que potencia la recuperacion semantica de memoria. Este pipeline maneja la fragmentacion de texto, embedding vectorial, extraccion de temas y filtrado de contenido -- transformando texto de conversacion crudo en entradas de memoria organizadas y buscables.

## Arquitectura

El pipeline de procesamiento de texto consiste en cuatro etapas, cada una configurable de forma independiente:

```
Raw Text
  │
  ▼
┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ Chunker  │───►│ Embedder  │───►│  Topic    │───►│ Filter   │
│          │    │           │    │ Extractor │    │          │
└──────────┘    └───────────┘    └───────────┘    └──────────┘
  Split text      Vectorize       Classify         Decide if
  into chunks     each chunk      by topic         worth saving
```

## Busqueda vectorial

La busqueda vectorial permite la recuperacion por similitud semantica -- encontrar memorias conceptualmente relacionadas con una consulta incluso cuando las palabras exactas difieren.

### Como funciona

1. **Indexacion** -- cada fragmento de memoria se convierte en un vector denso (ej., 768 dimensiones)
2. **Almacenamiento** -- los vectores se almacenan en un indice vectorial (sqlite-vec, pgvector o en memoria)
3. **Consulta** -- la consulta de busqueda se convierte en embedding usando el mismo modelo
4. **Recuperacion** -- el indice devuelve los K vectores principales por similitud de coseno
5. **Reclasificacion** -- opcionalmente, los resultados se reclasifican usando un cross-encoder para mayor precision

### Configuracion

```toml
[memory.vector]
enabled = true
index_type = "sqlite-vec"       # "sqlite-vec", "pgvector", or "memory"
similarity_metric = "cosine"    # "cosine", "dot_product", or "euclidean"
top_k = 10
similarity_threshold = 0.5
rerank = false
rerank_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"
```

### Tipos de indice

| Tipo de indice | Almacenamiento | Persistencia | Ideal para |
|---------------|----------------|-------------|------------|
| `sqlite-vec` | Archivo local | Si | Usuario unico, despliegues locales |
| `pgvector` | PostgreSQL | Si | Multi-usuario, despliegues en produccion |
| `memory` | En proceso | No (solo sesion) | Pruebas y sesiones efimeras |

### Referencia de configuracion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar la busqueda vectorial |
| `index_type` | `String` | `"sqlite-vec"` | Backend del indice vectorial |
| `similarity_metric` | `String` | `"cosine"` | Metrica de distancia para comparacion de similitud |
| `top_k` | `usize` | `10` | Numero de resultados a devolver por consulta |
| `similarity_threshold` | `f64` | `0.5` | Puntuacion minima de similitud (0.0--1.0) para incluir en resultados |
| `rerank` | `bool` | `false` | Habilitar reclasificacion con cross-encoder para precision mejorada |
| `rerank_model` | `String` | `""` | Nombre del modelo cross-encoder (solo usado cuando `rerank = true`) |
| `ef_search` | `usize` | `64` | Parametro de busqueda HNSW (mayor = mas preciso, mas lento) |

## Fragmentacion de texto

Antes del embedding, el texto largo debe dividirse en fragmentos mas pequenos. PRX proporciona dos estrategias de fragmentacion: consciente de tokens y semantica.

### Fragmentacion consciente de tokens

La fragmentacion consciente de tokens divide el texto en limites de tokens para asegurar que cada fragmento quepa dentro de la ventana de contexto del modelo de embeddings. Respeta limites de palabras y oraciones para evitar cortar a mitad de palabra.

```toml
[memory.chunker]
strategy = "token"
max_tokens = 512
overlap_tokens = 64
tokenizer = "cl100k_base"     # OpenAI-compatible tokenizer
```

El algoritmo:

1. Tokeniza el texto de entrada usando el tokenizador configurado
2. Divide en fragmentos de como maximo `max_tokens` tokens
3. Cada fragmento se superpone con el anterior en `overlap_tokens` para preservar contexto en los limites
4. Los limites de fragmentos se ajustan para alinearse con saltos de oracion o parrafo cuando es posible

### Fragmentacion semantica

La fragmentacion semantica usa similitud de embeddings para encontrar limites naturales de tema en el texto. En lugar de dividir en conteos fijos de tokens, detecta donde cambia el tema.

```toml
[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3
```

El algoritmo:

1. Dividir el texto en oraciones
2. Computar embeddings para cada oracion
3. Calcular similitud de coseno entre oraciones consecutivas
4. Cuando la similitud cae por debajo de `breakpoint_threshold`, insertar un limite de fragmento
5. Fusionar fragmentos pequenos (por debajo de `min_tokens`) con fragmentos adyacentes

### Referencia de configuracion de fragmentacion

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `strategy` | `String` | `"token"` | Estrategia de fragmentacion: `"token"` o `"semantic"` |
| `max_tokens` | `usize` | `512` | Tokens maximos por fragmento |
| `overlap_tokens` | `usize` | `64` | Superposicion entre fragmentos consecutivos (solo estrategia token) |
| `tokenizer` | `String` | `"cl100k_base"` | Nombre del tokenizador para conteo de tokens |
| `min_tokens` | `usize` | `64` | Tokens minimos por fragmento (solo estrategia semantica) |
| `breakpoint_threshold` | `f64` | `0.3` | Umbral de caida de similitud para limites de tema (solo estrategia semantica) |

### Elegir una estrategia

| Criterio | Consciente de tokens | Semantica |
|----------|---------------------|-----------|
| Velocidad | Rapida (sin llamadas de embedding durante fragmentacion) | Mas lenta (requiere embedding por oracion) |
| Calidad | Buena para contenido uniforme | Mejor para documentos multi-tema |
| Predictibilidad | Tamanos de fragmento consistentes | Tamanos de fragmento variables |
| Caso de uso | Logs de chat, mensajes cortos | Documentos largos, notas de reuniones |

## Extraccion de temas

PRX extrae automaticamente temas de las entradas de memoria para organizarlas en categorias. Los temas mejoran la recuperacion habilitando busqueda filtrada dentro de dominios especificos.

### Como funciona

1. Despues de la fragmentacion, cada fragmento se analiza por palabras clave de tema y contenido semantico
2. El extractor de temas asigna una o mas etiquetas de tema de una taxonomia configurable
3. Los temas se almacenan junto a la entrada de memoria como metadatos
4. Durante la recuperacion, las consultas pueden filtrar opcionalmente por tema para acotar resultados

### Configuracion

```toml
[memory.topics]
enabled = true
max_topics_per_entry = 3
taxonomy = "auto"               # "auto", "fixed", or "hybrid"
custom_topics = []              # only used when taxonomy = "fixed" or "hybrid"
min_confidence = 0.6
```

### Modos de taxonomia

| Modo | Descripcion |
|------|-------------|
| `auto` | Los temas se generan dinamicamente del contenido. Se crean nuevos temas segun sea necesario. |
| `fixed` | Solo se asignan temas de `custom_topics`. El contenido que no coincide con ningun tema queda sin categorizar. |
| `hybrid` | Prefiere `custom_topics` pero crea nuevos temas cuando el contenido no coincide con ninguna etiqueta existente. |

### Referencia de configuracion de temas

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar la extraccion de temas |
| `max_topics_per_entry` | `usize` | `3` | Etiquetas de tema maximas por entrada de memoria |
| `taxonomy` | `String` | `"auto"` | Modo de taxonomia: `"auto"`, `"fixed"` o `"hybrid"` |
| `custom_topics` | `[String]` | `[]` | Etiquetas de temas personalizadas para taxonomias fixed/hybrid |
| `min_confidence` | `f64` | `0.6` | Puntuacion minima de confianza (0.0--1.0) para asignar un tema |

## Filtrado de contenido

No todos los mensajes valen la pena guardar en memoria a largo plazo. El filtro de contenido aplica heuristicas de autoguardado para decidir que contenido debe persistirse y cual debe descartarse.

### Heuristicas de autoguardado

El filtro evalua cada entrada de memoria candidata contra varios criterios:

| Heuristica | Descripcion | Peso |
|-----------|-------------|------|
| **Densidad de informacion** | Proporcion de tokens unicos sobre tokens totales. Texto de baja densidad (ej., "ok", "gracias") se filtra | Alto |
| **Novedad** | Similitud con memorias existentes. Contenido demasiado similar a lo ya almacenado se omite | Alto |
| **Relevancia** | Similitud semantica con los intereses conocidos del usuario y temas activos | Medio |
| **Accionabilidad** | Presencia de elementos de accion, decisiones o compromisos (ej., "Voy a...", "hagamos...") | Medio |
| **Sesgo de recencia** | El contexto reciente se pondera mas alto para relevancia a corto plazo | Bajo |

Se computa una puntuacion compuesta como suma ponderada. Las entradas que puntuan por debajo del `autosave_threshold` no se persisten.

### Configuracion

```toml
[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85        # skip if >85% similar to existing memory
min_length = 20                 # skip entries shorter than 20 characters
max_length = 10000              # truncate entries longer than 10,000 characters
exclude_patterns = [
    "^(ok|thanks|got it|sure)$",
    "^\\s*$",
]
```

### Referencia de configuracion del filtro

| Campo | Tipo | Por defecto | Descripcion |
|-------|------|-------------|-------------|
| `enabled` | `bool` | `true` | Habilitar o deshabilitar el filtrado de contenido |
| `autosave_threshold` | `f64` | `0.4` | Puntuacion compuesta minima (0.0--1.0) para persistir una memoria |
| `novelty_threshold` | `f64` | `0.85` | Similitud maxima con memorias existentes antes de deduplicacion |
| `min_length` | `usize` | `20` | Longitud minima de caracteres para una entrada de memoria |
| `max_length` | `usize` | `10000` | Longitud maxima de caracteres (entradas mas largas se truncan) |
| `exclude_patterns` | `[String]` | `[]` | Patrones regex para contenido que nunca debe guardarse |

## Ejemplo de pipeline completo

Una configuracion completa combinando las cuatro etapas:

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768

[memory.vector]
enabled = true
index_type = "sqlite-vec"
top_k = 10
similarity_threshold = 0.5

[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3

[memory.topics]
enabled = true
taxonomy = "hybrid"
custom_topics = ["coding", "architecture", "debugging", "planning"]

[memory.filter]
enabled = true
autosave_threshold = 0.4
novelty_threshold = 0.85
```

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Backend de embeddings](./embeddings) -- configuracion del proveedor de embeddings
- [Backend SQLite](./sqlite) -- almacenamiento local para indice sqlite-vec
- [Backend PostgreSQL](./postgres) -- almacenamiento para indice pgvector
- [Higiene de memoria](./hygiene) -- estrategias de compactacion y limpieza
