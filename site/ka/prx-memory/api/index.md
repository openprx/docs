---
title: Rust API ცნობარი
description: PRX-Memory Rust ბიბლიოთეკის API ცნობარი მეხსიერების ძრავის საკუთარ Rust აპლიკაციებში ჩასასმელად.
---

# Rust API ცნობარი

PRX-Memory ორგანიზებულია Rust workspace-ად შვიდი crate-ით. ყოველი crate გამოყენებადი API-ს მოიცავს, რომელიც დამოუკიდებლად ან ერთობლივად შეიძლება გამოყენებულ იქნეს.

## Crate-ების მიმოხილვა

### prx-memory-core

ძირითადი დომენის primitive-ები შეფასებისთვის, evolution-ისა და მეხსიერების ჩანაწერის წარმოდგენისთვის.

```toml
[dependencies]
prx-memory-core = "0.1"
```

ძირითადი ტიპები:
- მეხსიერების ჩანაწერის სტრუქტურები ტექსტით, scope-ით, tag-ებით, მნიშვნელობითა და metadata-ით.
- შეფასების primitive-ები შესაბამისობის რანჟირებისთვის.
- Evolution ტიპები train/holdout მიღების ტესტირებისთვის.

### prx-memory-embed

Embedding პროვაიდერის abstraction და adapter-ები.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

უზრუნველყოფს async trait-ს, რომელსაც ყველა embedding პროვაიდერი ახორციელებს:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

ჩაშენებული განხორციელებები:
- `OpenAiCompatibleProvider` -- ნებისმიერი OpenAI-თავსებადი embedding API
- `JinaProvider` -- Jina AI embedding-ები
- `GeminiProvider` -- Google Gemini embedding-ები

### prx-memory-rerank

Rerank პროვაიდერის abstraction და adapter-ები.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

უზრუნველყოფს async trait-ს reranking-ისთვის:

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

ჩაშენებული განხორციელებები:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

ერთიანი პროვაიდერის abstraction, რომელიც embedding-ს და reranking-ს კომბინირებს.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

ეს crate გარემოს ცვლადებიდან embedding-ისა და reranking პროვაიდერების კონფიგურაციის ერთ შესასვლელ წერტილს უზრუნველყოფს.

### prx-memory-skill

ჩაშენებული მმართველობის skill payload-ები MCP resource განაწილებისთვის.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

უზრუნველყოფს სტატიკური skill განმარტებებს და payload template-ებს, MCP resource პროტოკოლის მეშვეობით აღმოჩენადს.

### prx-memory-storage

ლოკალური მდგრადი შენახვის ძრავა.

```toml
[dependencies]
prx-memory-storage = "0.1"

# With LanceDB support
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

უზრუნველყოფს storage trait-ის განხორციელებებს:
- JSON ფაილ-ზე დაფუძნებული შენახვა
- SQLite ვექტორული სვეტებით
- LanceDB (სურვილისამებრ, ფუნქციის ნიშნის მიღმა)

### prx-memory-mcp

MCP სერვერის ზედაპირი, რომელიც ყველა სხვა crate-ს გამოსაშვებ daemon-ში აერთიანებს.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

ეს crate ჩვეულებრივ ბიბლიოთეკური დამოკიდებულებად არ გამოიყენება -- ის `prx-memoryd` binary-ს უზრუნველყოფს.

## შეცდომების დამუშავება

ყველა crate იყენებს `thiserror`-ს ტიპ-ირებული შეცდომების enum-ებისთვის. შეცდომები `?` ოპერატორის გამოყენებით გადაეცემა და წარმოების კოდში panic-ებად არ კონვერტირდება.

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

## კონკურენტობა

- სინქრონული mutex-ები იყენებენ `parking_lot::Mutex`-ს (poisoning-ი არ არის).
- ასინქრონული mutex-ები იყენებენ `tokio::sync::Mutex`-ს.
- `std::sync::Mutex` წარმოების კოდში აკრძალულია.
- გაზიარებული უცვლელი მონაცემები იყენებს `Arc<str>`-ს ან `Arc<T>`-ს.

## დეპენდენციები

ყველა ქსელური მოთხოვნა იყენებს `reqwest`-ს `rustls-tls`-ით (OpenSSL დეპენდენცია არ არის). სერიალიზება `serde`-სა და `serde_json`-ს იყენებს.

## შემდეგი ნაბიჯები

- [Embedding მოდელები](../embedding/models) -- პროვაიდერ-სპეციფიკური კონფიგურაცია
- [შენახვის backend-ები](../storage/) -- Storage trait-ის განხორციელებები
- [კონფიგურაციის ცნობარი](../configuration/) -- გარემოს ცვლადის ცნობარი
