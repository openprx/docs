---
title: Backend de memoria de embeddings
description: Memoria semantica basada en vectores usando embeddings para recuperacion estilo RAG.
---

# Backend de memoria de embeddings

El backend de embeddings almacena memorias como embeddings vectoriales, habilitando busqueda por similitud semantica. Este es el mecanismo de recuperacion mas potente, permitiendo a los agentes encontrar memorias contextualmente relevantes incluso cuando las palabras clave exactas no coinciden.

## Vision general

El backend de embeddings:

- Convierte el texto de memoria en representaciones vectoriales densas
- Almacena vectores en una base de datos vectorial local o remota
- Recupera memorias por similitud de coseno con la consulta actual
- Soporta multiples proveedores de embeddings (Ollama, OpenAI, etc.)

## Como funciona

1. Cuando se almacena una memoria, su texto se envia a un modelo de embeddings
2. El vector resultante se almacena junto al texto original
3. Durante la recuperacion, el contexto actual se convierte en embedding y se compara contra los vectores almacenados
4. Las K memorias mas similares se devuelven

## Configuracion

```toml
[memory]
backend = "embeddings"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
top_k = 10
similarity_threshold = 0.5

[memory.embeddings.store]
type = "sqlite-vec"  # or "pgvector"
path = "~/.local/share/openprx/embeddings.db"
```

## Proveedores de embeddings soportados

| Proveedor | Modelo | Dimensiones |
|-----------|--------|-------------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## Paginas relacionadas

- [Vision general del sistema de memoria](./)
- [Backend SQLite](./sqlite)
- [Higiene de memoria](./hygiene)
