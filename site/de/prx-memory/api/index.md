---
title: Rust-API-Referenz
description: "PRX-Memory Rust-Bibliotheks-API-Referenz zum Einbetten der Speicher-Engine in eigene Rust-Anwendungen."
---

# Rust-API-Referenz

PRX-Memory ist als Rust-Workspace mit sieben Crates organisiert. Jedes Crate bietet eine fokussierte API, die unabhängig oder zusammengesetzt verwendet werden kann.

## Crate-Übersicht

### prx-memory-core

Kern-Domänenprimitive für Bewertung, Evolution und Speichereintragsdarstellung.

```toml
[dependencies]
prx-memory-core = "0.1"
```

Schlüsseltypen:
- Speichereintrag-Structs mit Text, Scope, Tags, Wichtigkeit und Metadaten.
- Bewertungsprimitive für Relevanzeinstufung.
- Evolutionstypen für Train/Holdout-Akzeptanztests.

### prx-memory-embed

Embedding-Provider-Abstraktion und Adapter.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

Bietet ein async Trait, das alle Embedding-Provider implementieren:

```rust
// Konzeptionelle API (vereinfacht)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

Eingebaute Implementierungen:
- `OpenAiCompatibleProvider` -- Jede OpenAI-kompatible Embedding-API
- `JinaProvider` -- Jina-AI-Embeddings
- `GeminiProvider` -- Google-Gemini-Embeddings

### prx-memory-rerank

Rerank-Provider-Abstraktion und Adapter.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

Bietet ein async Trait für Reranking:

```rust
// Konzeptionelle API (vereinfacht)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

Eingebaute Implementierungen:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

Einheitliche Provider-Abstraktion, die Embedding und Reranking zusammensetzt.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

Dieses Crate bietet einen einzelnen Einstiegspunkt für die Konfiguration beider Embedding- und Reranking-Provider aus Umgebungsvariablen.

### prx-memory-skill

Eingebaute Governance-Skill-Nutzlasten für MCP-Ressourcenverteilung.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

Bietet statische Skill-Definitionen und Nutzlastvorlagen, die über das MCP-Ressourcenprotokoll auffindbar sind.

### prx-memory-storage

Lokale persistente Speicher-Engine.

```toml
[dependencies]
prx-memory-storage = "0.1"

# Mit LanceDB-Unterstützung
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

Bietet Speicher-Trait-Implementierungen für:
- JSON-dateibasiertem Speicher
- SQLite mit Vektorspalten
- LanceDB (optional, hinter Feature-Flag)

### prx-memory-mcp

MCP-Server-Oberfläche, die alle anderen Crates zu einem ausführbaren Daemon kombiniert.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

Dieses Crate wird typischerweise nicht als Bibliotheksabhängigkeit verwendet -- es stellt das `prx-memoryd`-Binary bereit.

## Fehlerbehandlung

Alle Crates verwenden `thiserror` für typisierte Fehler-Enums. Fehler propagieren mit dem `?`-Operator und werden nie in Panics in Produktionscode umgewandelt.

```rust
// Beispiel-Fehlermuster
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

## Nebenläufigkeit

- Synchrone Mutexes verwenden `parking_lot::Mutex` (kein Vergiften).
- Asynchrone Mutexes verwenden `tokio::sync::Mutex`.
- `std::sync::Mutex` ist in Produktionscode verboten.
- Gemeinsame unveränderliche Daten verwenden `Arc<str>` oder `Arc<T>`.

## Abhängigkeiten

Alle Netzwerkanfragen verwenden `reqwest` mit `rustls-tls` (keine OpenSSL-Abhängigkeit). Serialisierung verwendet `serde` und `serde_json`.

## Nächste Schritte

- [Embedding-Modelle](../embedding/models) -- Provider-spezifische Konfiguration
- [Speicher-Backends](../storage/) -- Speicher-Trait-Implementierungen
- [Konfigurationsreferenz](../configuration/) -- Umgebungsvariablen-Referenz
