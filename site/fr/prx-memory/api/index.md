---
title: Référence API Rust
description: "Référence de l'API bibliothèque Rust de PRX-Memory pour intégrer le moteur de mémoire dans vos propres applications Rust."
---

# Référence API Rust

PRX-Memory est organisé comme un workspace Rust avec sept crates. Chaque crate fournit une API ciblée qui peut être utilisée indépendamment ou composée avec les autres.

## Aperçu des crates

### prx-memory-core

Primitives de domaine centrales pour le scoring, l'évolution et la représentation des entrées de mémoire.

```toml
[dependencies]
prx-memory-core = "0.1"
```

Types clés :
- Structs d'entrée de mémoire avec texte, portée, étiquettes, importance et métadonnées.
- Primitives de scoring pour le classement par pertinence.
- Types d'évolution pour les tests d'acceptation entraînement/validation.

### prx-memory-embed

Abstraction et adaptateurs du fournisseur d'embedding.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

Fournit un trait async que tous les fournisseurs d'embedding implémentent :

```rust
// API conceptuelle (simplifiée)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

Implémentations intégrées :
- `OpenAiCompatibleProvider` -- Toute API d'embedding compatible OpenAI
- `JinaProvider` -- Embeddings Jina AI
- `GeminiProvider` -- Embeddings Google Gemini

### prx-memory-rerank

Abstraction et adaptateurs du fournisseur de reranking.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

Fournit un trait async pour le reranking :

```rust
// API conceptuelle (simplifiée)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

Implémentations intégrées :
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

Abstraction de fournisseur unifiée qui compose l'embedding et le reranking.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

Ce crate fournit un point d'entrée unique pour configurer les fournisseurs d'embedding et de reranking à partir des variables d'environnement.

### prx-memory-skill

Payloads de compétences de gouvernance intégrés pour la distribution de ressources MCP.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

Fournit des définitions de compétences statiques et des modèles de payload découvrables via le protocole de ressources MCP.

### prx-memory-storage

Moteur de stockage persistant local.

```toml
[dependencies]
prx-memory-storage = "0.1"

# Avec support LanceDB
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

Fournit des implémentations du trait de stockage pour :
- Stockage basé sur fichier JSON
- SQLite avec colonnes vectorielles
- LanceDB (optionnel, derrière un flag de fonctionnalité)

### prx-memory-mcp

Surface du serveur MCP qui combine tous les autres crates en un démon exécutable.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

Ce crate n'est généralement pas utilisé comme dépendance bibliothèque -- il fournit le binaire `prx-memoryd`.

## Gestion des erreurs

Tous les crates utilisent `thiserror` pour les enums d'erreurs typées. Les erreurs se propagent avec l'opérateur `?` et ne sont jamais converties en panics dans le code de production.

```rust
// Exemple de pattern d'erreur
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

## Concurrence

- Les mutex synchrones utilisent `parking_lot::Mutex` (sans empoisonnement).
- Les mutex asynchrones utilisent `tokio::sync::Mutex`.
- `std::sync::Mutex` est interdit dans le code de production.
- Les données immuables partagées utilisent `Arc<str>` ou `Arc<T>`.

## Dépendances

Toutes les requêtes réseau utilisent `reqwest` avec `rustls-tls` (sans dépendance OpenSSL). La sérialisation utilise `serde` et `serde_json`.

## Étapes suivantes

- [Modèles d'embedding](../embedding/models) -- Configuration spécifique au fournisseur
- [Backends de stockage](../storage/) -- Implémentations du trait de stockage
- [Référence de configuration](../configuration/) -- Référence des variables d'environnement
