---
title: Referencia de API Rust
description: "Referencia de la API de la biblioteca Rust de PRX-Memory para embeber el motor de memoria en tus propias aplicaciones Rust."
---

# Referencia de API Rust

PRX-Memory está organizado como un workspace de Rust con siete crates. Cada crate proporciona una API enfocada que puede usarse de forma independiente o compuesta junto con otras.

## Descripción General de Crates

### prx-memory-core

Primitivos de dominio central para puntuación, evolución y representación de entradas de memoria.

```toml
[dependencies]
prx-memory-core = "0.1"
```

Tipos clave:
- Structs de entrada de memoria con texto, alcance, etiquetas, importancia y metadatos.
- Primitivos de puntuación para clasificación de relevancia.
- Tipos de evolución para pruebas de aceptación train/holdout.

### prx-memory-embed

Abstracción de proveedores de embedding y adaptadores.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

Proporciona un trait async que todos los proveedores de embedding implementan:

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

Implementaciones integradas:
- `OpenAiCompatibleProvider` -- Cualquier API de embedding compatible con OpenAI
- `JinaProvider` -- Embeddings de Jina AI
- `GeminiProvider` -- Embeddings de Google Gemini

### prx-memory-rerank

Abstracción de proveedores de reranking y adaptadores.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

Proporciona un trait async para reranking:

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

Implementaciones integradas:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

Abstracción de proveedor unificada que compone embedding y reranking.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

Este crate proporciona un único punto de entrada para configurar tanto los proveedores de embedding como de reranking desde variables de entorno.

### prx-memory-skill

Payloads de habilidades de gobernanza integrados para distribución de recursos MCP.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

Proporciona definiciones de habilidades estáticas y plantillas de payload que son descubribles a través del protocolo de recursos MCP.

### prx-memory-storage

Motor de almacenamiento persistente local.

```toml
[dependencies]
prx-memory-storage = "0.1"

# With LanceDB support
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

Proporciona implementaciones de traits de almacenamiento para:
- Almacenamiento basado en archivos JSON
- SQLite con columnas vectoriales
- LanceDB (opcional, detrás de indicador de característica)

### prx-memory-mcp

Superficie del servidor MCP que combina todos los demás crates en un daemon ejecutable.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

Este crate típicamente no se usa como dependencia de biblioteca -- proporciona el binario `prx-memoryd`.

## Manejo de Errores

Todos los crates usan `thiserror` para enums de error tipados. Los errores se propagan usando el operador `?` y nunca se convierten en panics en código de producción.

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

## Concurrencia

- Los mutexes síncronos usan `parking_lot::Mutex` (sin envenenamiento).
- Los mutexes asíncronos usan `tokio::sync::Mutex`.
- `std::sync::Mutex` está prohibido en código de producción.
- Los datos inmutables compartidos usan `Arc<str>` o `Arc<T>`.

## Dependencias

Todas las solicitudes de red usan `reqwest` con `rustls-tls` (sin dependencia de OpenSSL). La serialización usa `serde` y `serde_json`.

## Siguientes Pasos

- [Modelos de Embedding](../embedding/models) -- Configuración específica de proveedor
- [Backends de Almacenamiento](../storage/) -- Implementaciones de traits de almacenamiento
- [Referencia de Configuración](../configuration/) -- Referencia de variables de entorno
