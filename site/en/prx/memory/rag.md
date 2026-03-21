---
title: Retrieval-Augmented Generation (RAG)
description: How PRX uses embeddings and memory search to inject relevant context into LLM prompts before generation.
---

# Retrieval-Augmented Generation (RAG)

PRX implements Retrieval-Augmented Generation (RAG) to enhance LLM responses with relevant context from the agent's memory and knowledge stores. Instead of relying solely on the LLM's parametric knowledge, RAG retrieves pertinent documents and injects them into the prompt -- reducing hallucinations and grounding responses in factual, up-to-date information.

## Overview

The RAG pipeline runs before every LLM call in the agent loop:

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

## Configuration

Enable RAG in `config.toml`:

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

### Embedding Providers

PRX supports multiple embedding providers:

| Provider | Model | Dimensions | Notes |
|----------|-------|------------|-------|
| OpenAI | text-embedding-3-small | 1536 | Best quality/cost ratio |
| OpenAI | text-embedding-3-large | 3072 | Highest quality |
| Ollama | nomic-embed-text | 768 | Local, no API cost |
| Ollama | mxbai-embed-large | 1024 | Local, higher quality |
| Local | fastembed | 384 | Bundled, no network |

Configure the embedding provider:

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

## Chunking Strategies

Before documents can be embedded and searched, they must be split into chunks. PRX supports several chunking strategies:

| Strategy | Description | Best For |
|----------|-------------|----------|
| `fixed_size` | Split at fixed token counts with overlap | Uniform documents |
| `sentence` | Split at sentence boundaries | Prose and natural text |
| `paragraph` | Split at paragraph boundaries | Structured documents |
| `semantic` | Split at topic boundaries using embeddings | Long, varied documents |
| `recursive` | Hierarchical splitting (heading > paragraph > sentence) | Markdown/code |

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

## Retrieval Pipeline

### Steps 1-3: Query, Embed, Search

The RAG module extracts a search query from the user's latest message (optionally reformulated via LLM with `query_reformulation = true`), converts it to a vector using the embedding provider, and searches across all memory backends simultaneously -- vector similarity (cosine) and full-text search (FTS5/pg_trgm). Results are merged and deduplicated.

### Step 4: Relevance Filtering

Each result receives a relevance score between 0.0 and 1.0. Results below `relevance_threshold` are discarded. The scoring considers:

- Vector cosine similarity (primary signal)
- Full-text match score (boost factor)
- Recency (newer memories get a slight boost)
- Source priority (core memories ranked higher than conversation)

### Step 5: Context Injection

Filtered results are formatted with structured XML tags (`<context><memory source="..." relevance="...">`) and injected into the LLM prompt. The total injected context is capped at `max_context_tokens` to prevent context window overflow.

## Selection Strategies

### Top-K

The default strategy. Selects the K highest-scoring chunks that fit within `max_context_tokens`. Simple and predictable, but may return redundant results when multiple chunks cover the same topic.

### Maximal Marginal Relevance (MMR)

MMR balances relevance with diversity. It iteratively selects chunks that are both relevant to the query and different from already-selected chunks:

```toml
[rag]
selection_strategy = "mmr"

# Lambda controls the relevance-diversity tradeoff.
# 1.0 = pure relevance (same as top_k)
# 0.0 = pure diversity
mmr_lambda = 0.7
```

MMR is recommended when the knowledge base contains overlapping or redundant information.

## Indexing Documents

### Automatic Indexing

Memories stored via the `memory_store` tool are automatically embedded and indexed. No additional configuration is required.

### Manual Document Ingestion

For bulk document ingestion, use the CLI:

```bash
# Index a single file or directory
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# Re-index all documents (rebuilds embeddings)
prx rag reindex
```

Supported formats: Markdown (`.md`), plain text (`.txt`), PDF (`.pdf`), HTML (`.html`), and source code (`.rs`, `.py`, `.js`).

## Performance Tuning

| Parameter | Recommendation |
|-----------|----------------|
| `chunk_size` | 256-512 tokens for Q&A, 512-1024 for summarization |
| `chunk_overlap` | 10-20% of chunk_size |
| `max_results` | 5-15 for most use cases |
| `relevance_threshold` | 0.3-0.5 (tune based on quality) |

## Security Notes

- RAG context is injected into the LLM prompt. Ensure that stored documents do not contain sensitive data unless the agent is authorized to access it.
- When `memory.acl_enabled = true`, RAG respects access control lists. Only memories accessible to the current principal are retrieved.
- Embedding API calls transmit document content to the embedding provider. For sensitive data, use a local embedding provider (`ollama` or `local`).

## Related Pages

- [Memory System](/en/prx/memory/)
- [Embeddings](/en/prx/memory/embeddings)
- [Vector Search](/en/prx/memory/vector-search)
- [SQLite Backend](/en/prx/memory/sqlite)
- [PostgreSQL Backend](/en/prx/memory/postgres)
