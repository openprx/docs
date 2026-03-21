---
title: Embeddings Memory Backend
description: Vector-based semantic memory using embeddings for RAG-style retrieval.
---

# Embeddings Memory Backend

The embeddings backend stocke memories as vector embeddings, enabling semantic similarity search. This est le plus powerful recall mechanism, allowing agents to find contextually relevant memories even when exact keywords ne faites pas match.

## Apercu

The embeddings backend:

- Converts memory text into dense vector representations
- Stores vectors in a local or remote vector database
- Retrieves memories by cosine similarity vers le current query
- Supports multiple embedding fournisseurs (Ollama, OpenAI, etc.)

## Fonctionnement

1. When a memory is stored, its text est envoye a an embedding model
2. Le resultating vector is stored alongside the original text
3. During recall, the current context is embedded and compared against stored vectors
4. The top-K most similar memories are retournes

## Configuration

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

## Supported Embedding Providers

| Provider | Model | Dimensions |
|----------|-------|-----------|
| Ollama | nomic-embed-text | 768 |
| OpenAI | text-embedding-3-small | 1536 |
| OpenAI | text-embedding-3-large | 3072 |

## Voir aussi Pages

- [Memory System Overview](./)
- [SQLite Backend](./sqlite)
- [Memory Hygiene](./hygiene)
