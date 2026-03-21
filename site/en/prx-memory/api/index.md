---
title: Rust API Reference
description: PRX-Memory Rust library API reference for embedding the memory engine in your own Rust applications.
---

# Rust API Reference

PRX-Memory is organized as a Rust workspace with seven crates. Each crate provides a focused API that can be used independently or composed together.

## Crate Overview

### prx-memory-core

Core domain primitives for scoring, evolution, and memory entry representation.

```toml
[dependencies]
prx-memory-core = "0.1"
```

Key types:
- Memory entry structs with text, scope, tags, importance, and metadata.
- Scoring primitives for relevance ranking.
- Evolution types for train/holdout acceptance testing.

### prx-memory-embed

Embedding provider abstraction and adapters.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

Provides an async trait that all embedding providers implement:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

Built-in implementations:
- `OpenAiCompatibleProvider` -- Any OpenAI-compatible embedding API
- `JinaProvider` -- Jina AI embeddings
- `GeminiProvider` -- Google Gemini embeddings

### prx-memory-rerank

Rerank provider abstraction and adapters.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

Provides an async trait for reranking:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

Built-in implementations:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

Unified provider abstraction that composes embedding and reranking.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

This crate provides a single entry point for configuring both embedding and reranking providers from environment variables.

### prx-memory-skill

Built-in governance skill payloads for MCP resource distribution.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

Provides static skill definitions and payload templates that are discoverable through the MCP resource protocol.

### prx-memory-storage

Local persistent storage engine.

```toml
[dependencies]
prx-memory-storage = "0.1"

# With LanceDB support
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

Provides storage trait implementations for:
- JSON file-based storage
- SQLite with vector columns
- LanceDB (optional, behind feature flag)

### prx-memory-mcp

MCP server surface that combines all other crates into a runnable daemon.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

This crate is typically not used as a library dependency -- it provides the `prx-memoryd` binary.

## Error Handling

All crates use `thiserror` for typed error enums. Errors propagate using the `?` operator and are never converted to panics in production code.

```rust
// Example error pattern
use thiserror::Error;

#[derive(Error, Debug)]
pub enum EmbedError {
    #[error("API request failed: {0}")]
    Request(#[from] reqwest::Error),
    #[error("API key not configured")]
    MissingApiKey,
    #[error("Unexpected response: {0}")]
    Response(String),
}
```

## Concurrency

- Synchronous mutexes use `parking_lot::Mutex` (no poisoning).
- Asynchronous mutexes use `tokio::sync::Mutex`.
- `std::sync::Mutex` is banned in production code.
- Shared immutable data uses `Arc<str>` or `Arc<T>`.

## Dependencies

All network requests use `reqwest` with `rustls-tls` (no OpenSSL dependency). Serialization uses `serde` and `serde_json`.

## Next Steps

- [Embedding Models](../embedding/models) -- Provider-specific configuration
- [Storage Backends](../storage/) -- Storage trait implementations
- [Configuration Reference](../configuration/) -- Environment variable reference
