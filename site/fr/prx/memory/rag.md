---
title: Retrieval-Augmented Generation (RAG)
description: How PRX uses embeddings and memory search to inject relevant context into LLM prompts before generation.
---

# Retrieval-Augmented Generation (RAG)

PRX implemente Retrieval-Augmented Generation (RAG) to enhance LLM responses with relevant context from la reponse de l'agent memory and knowledge stores. Instead of relying solely on le LLM's parametric knowledge, RAG recupere pertinent documents and injects them dans le prompt -- reducing hallucinations and grounding responses in factual, up-to-date information.

## Apercu

The RAG pipeline runs before every LLM call in la boucle de l'agent:

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

PRX prend en charge multiple embedding fournisseurs:

| Provider | Model | Dimensions | Nontes |
|----------|-------|------------|-------|
| OpenAI | text-embedding-3-small | 1536 | Best quality/cost ratio |
| OpenAI | text-embedding-3-large | 3072 | Highest quality |
| Ollama | nomic-embed-text | 768 | Local, no API cost |
| Ollama | mxbai-embed-large | 1024 | Local, higher quality |
| Local | fastembed | 384 | Bundled, no network |

Configure the embedding fournisseur:

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

Avant que les documents puissent etre integres et recherches, ils devrez etre decoupes en morceaux. PRX prend en charge several chunking strategies:

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

Le module RAG extrait une requete de recherche du dernier message de l'utilisateur (optionnellement reformulee via le LLM with `query_reformulation = true`), converts it vers un vector en utilisant le embedding fournisseur, et recherche pour tous les backend memoires simultaneously -- vector similarity (cosine) et full-text search (FTS5/pg_trgm). Results are merged et deduplicated.

### Step 4: Relevance Filtering

Chaque resultat recoit un score de pertinence entre 0.0 et 1.0. Les resultats en dessous de `relevance_threshold` sont ecartes. The scoring envisagezs:

- Vector cosine similarity (primary signal)
- Full-text match score (boost factor)
- Recency (newer memories get a slight boost)
- Source priority (core memories ranked higher than conversation)

### Step 5: Context Injection

Filtered results are formatted with structured XML tags (`<context><memory source="..." relevance="...">`) et injected into le LLM prompt. The total injected context is capped at `max_context_tokens` pour empecher context window overflow.

## Selection Strategies

### Top-K

La valeur par defaut strategy. Selects the K highest-scoring chunks that fit within `max_context_tokens`. Simple and predictable, but may retour redundant results when multiple chunks cover the same topic.

### Maximal Marginal Relevance (MMR)

MMR balances relevance with diversity. It iteratively selects chunks that are both relevant vers le query et different depuis unlready-selected chunks:

```toml
[rag]
selection_strategy = "mmr"

# Lambda controls the relevance-diversity tradeoff.
# 1.0 = pure relevance (same as top_k)
# 0.0 = pure diversity
mmr_lambda = 0.7
```

MMR est recommande lorsque le knowledge base contains overlapping or redundant information.

## Indexing Documents

### Automatic Indexing

Memories stored via the `memory_store` tool sont automatiquement embedded and indexed. Non additional configuration est requis.

### Manual Document Ingestion

For bulk document ingestion, use le CLI:

```bash
# Index a single file or directory
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# Re-index all documents (rebuilds embeddings)
prx rag reindex
```

Formats pris en charge: Markdown (`.md`), plain text (`.txt`), PDF (`.pdf`), HTML (`.html`), and source code (`.rs`, `.py`, `.js`).

## Performance Tuning

| Parameter | Recommendation |
|-----------|----------------|
| `chunk_size` | 256-512 tokens for Q&A, 512-1024 for summarization |
| `chunk_overlap` | 10-20% of chunk_size |
| `max_results` | 5-15 for most cas d'utilisations |
| `relevance_threshold` | 0.3-0.5 (tune based on quality) |

## Securite Nontes

- RAG context is injected into le LLM prompt. Assurez-vous que stored documents ne faites pas contain sensitive data unless l'agent is authorized to access it.
- When `memory.acl_enabled = true`, RAG respecte access control lists. Only memories accessible vers le current principal are retrieved.
- Embedding API calls transmit document content vers le embedding fournisseur. For sensitive data, use a local embedding fournisseur (`ollama` or `local`).

## Voir aussi Pages

- [Memory System](/fr/prx/memory/)
- [Embeddings](/fr/prx/memory/embeddings)
- [Vector Search](/fr/prx/memory/vector-search)
- [SQLite Backend](/fr/prx/memory/sqlite)
- [PostgreSQL Backend](/fr/prx/memory/postgres)
