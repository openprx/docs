---
title: Vector Search & Text Processing
description: Embedding-based vector search, text chunking strategies, topic extraction, and content filtering in PRX memory.
---

# Vector Search & Text Processing

PRX includes a text processing pipeline that powers semantic memory retrieval. This pipeline handles text chunking, vector embedding, topic extraction, and content filtering -- transforming raw conversation text into searchable, organized memory entries.

## Architecture

The text processing pipeline consists of four stages, each configurable independently:

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

## Vector Search

Vector search enables semantic similarity retrieval -- finding memories that are conceptually related to a query even when the exact words differ.

### How It Works

1. **Indexing** -- each memory chunk is embedded into a dense vector (e.g., 768 dimensions)
2. **Storage** -- vectors are stored in a vector index (sqlite-vec, pgvector, or in-memory)
3. **Query** -- the search query is embedded using the same model
4. **Retrieval** -- the index returns the top-K vectors by cosine similarity
5. **Reranking** -- optionally, results are reranked using a cross-encoder for higher precision

### Configuration

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

### Index Types

| Index Type | Storage | Persistence | Best For |
|-----------|---------|-------------|----------|
| `sqlite-vec` | Local file | Yes | Single-user, local deployments |
| `pgvector` | PostgreSQL | Yes | Multi-user, production deployments |
| `memory` | In-process | No (session only) | Testing and ephemeral sessions |

### Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable vector search |
| `index_type` | `String` | `"sqlite-vec"` | Vector index backend |
| `similarity_metric` | `String` | `"cosine"` | Distance metric for similarity comparison |
| `top_k` | `usize` | `10` | Number of results to return per query |
| `similarity_threshold` | `f64` | `0.5` | Minimum similarity score (0.0--1.0) to include in results |
| `rerank` | `bool` | `false` | Enable cross-encoder reranking for improved precision |
| `rerank_model` | `String` | `""` | Cross-encoder model name (only used when `rerank = true`) |
| `ef_search` | `usize` | `64` | HNSW search parameter (higher = more accurate, slower) |

## Text Chunking

Before embedding, long text must be split into smaller chunks. PRX provides two chunking strategies: token-aware and semantic.

### Token-Aware Chunking

Token-aware chunking splits text at token boundaries to ensure each chunk fits within the embedding model's context window. It respects word and sentence boundaries to avoid cutting mid-word.

```toml
[memory.chunker]
strategy = "token"
max_tokens = 512
overlap_tokens = 64
tokenizer = "cl100k_base"     # OpenAI-compatible tokenizer
```

The algorithm:

1. Tokenize the input text using the configured tokenizer
2. Split into chunks of at most `max_tokens` tokens
3. Each chunk overlaps with the previous by `overlap_tokens` to preserve context at boundaries
4. Chunk boundaries are adjusted to align with sentence or paragraph breaks when possible

### Semantic Chunking

Semantic chunking uses embedding similarity to find natural topic boundaries in the text. Instead of splitting at fixed token counts, it detects where the topic shifts.

```toml
[memory.chunker]
strategy = "semantic"
max_tokens = 1024
min_tokens = 64
breakpoint_threshold = 0.3
```

The algorithm:

1. Split the text into sentences
2. Compute embeddings for each sentence
3. Calculate cosine similarity between consecutive sentences
4. When similarity drops below `breakpoint_threshold`, insert a chunk boundary
5. Merge small chunks (below `min_tokens`) with adjacent chunks

### Chunking Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `strategy` | `String` | `"token"` | Chunking strategy: `"token"` or `"semantic"` |
| `max_tokens` | `usize` | `512` | Maximum tokens per chunk |
| `overlap_tokens` | `usize` | `64` | Overlap between consecutive chunks (token strategy only) |
| `tokenizer` | `String` | `"cl100k_base"` | Tokenizer name for token counting |
| `min_tokens` | `usize` | `64` | Minimum tokens per chunk (semantic strategy only) |
| `breakpoint_threshold` | `f64` | `0.3` | Similarity drop threshold for topic boundaries (semantic strategy only) |

### Choosing a Strategy

| Criterion | Token-Aware | Semantic |
|-----------|-------------|----------|
| Speed | Fast (no embedding calls during chunking) | Slower (requires per-sentence embedding) |
| Quality | Good for uniform content | Better for multi-topic documents |
| Predictability | Consistent chunk sizes | Variable chunk sizes |
| Use case | Chat logs, short messages | Long documents, meeting notes |

## Topic Extraction

PRX automatically extracts topics from memory entries to organize them into categories. Topics improve retrieval by enabling filtered search within specific domains.

### How It Works

1. After chunking, each chunk is analyzed for topic keywords and semantic content
2. The topic extractor assigns one or more topic labels from a configurable taxonomy
3. Topics are stored alongside the memory entry as metadata
4. During recall, queries can optionally filter by topic to narrow results

### Configuration

```toml
[memory.topics]
enabled = true
max_topics_per_entry = 3
taxonomy = "auto"               # "auto", "fixed", or "hybrid"
custom_topics = []              # only used when taxonomy = "fixed" or "hybrid"
min_confidence = 0.6
```

### Taxonomy Modes

| Mode | Description |
|------|-------------|
| `auto` | Topics are generated dynamically from the content. New topics are created as needed. |
| `fixed` | Only topics from `custom_topics` are assigned. Content that does not match any topic is left uncategorized. |
| `hybrid` | Prefers `custom_topics` but creates new topics when content does not match any existing label. |

### Topic Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable topic extraction |
| `max_topics_per_entry` | `usize` | `3` | Maximum topic labels per memory entry |
| `taxonomy` | `String` | `"auto"` | Taxonomy mode: `"auto"`, `"fixed"`, or `"hybrid"` |
| `custom_topics` | `[String]` | `[]` | Custom topic labels for fixed/hybrid taxonomies |
| `min_confidence` | `f64` | `0.6` | Minimum confidence score (0.0--1.0) to assign a topic |

## Content Filtering

Not every message is worth saving to long-term memory. The content filter applies autosave heuristics to decide which content should be persisted and which should be discarded.

### Autosave Heuristics

The filter evaluates each candidate memory entry against several criteria:

| Heuristic | Description | Weight |
|-----------|-------------|--------|
| **Information density** | Ratio of unique tokens to total tokens. Low-density text (e.g., "ok", "thanks") is filtered out | High |
| **Novelty** | Similarity to existing memories. Content too similar to what is already stored is skipped | High |
| **Relevance** | Semantic similarity to the user's known interests and active topics | Medium |
| **Actionability** | Presence of action items, decisions, or commitments (e.g., "I will...", "let's do...") | Medium |
| **Recency bias** | Recent context is weighted higher for short-term relevance | Low |

A composite score is computed as a weighted sum. Entries scoring below the `autosave_threshold` are not persisted.

### Configuration

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

### Filter Configuration Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | `bool` | `true` | Enable or disable content filtering |
| `autosave_threshold` | `f64` | `0.4` | Minimum composite score (0.0--1.0) to persist a memory |
| `novelty_threshold` | `f64` | `0.85` | Maximum similarity to existing memories before deduplication |
| `min_length` | `usize` | `20` | Minimum character length for a memory entry |
| `max_length` | `usize` | `10000` | Maximum character length (longer entries are truncated) |
| `exclude_patterns` | `[String]` | `[]` | Regex patterns for content that should never be saved |

## Full Pipeline Example

A complete configuration combining all four stages:

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

## Related Pages

- [Memory System Overview](./)
- [Embeddings Backend](./embeddings) -- embedding provider configuration
- [SQLite Backend](./sqlite) -- local storage for sqlite-vec index
- [PostgreSQL Backend](./postgres) -- storage for pgvector index
- [Memory Hygiene](./hygiene) -- compaction and cleanup strategies
