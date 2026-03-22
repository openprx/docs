---
title: Справочник Rust API
description: Справочник Rust API библиотеки PRX-Memory для встраивания движка памяти в ваши собственные Rust-приложения.
---

# Справочник Rust API

PRX-Memory организован как Rust-воркспейс с семью крейтами. Каждый крейт предоставляет сфокусированный API, который можно использовать независимо или комбинировать.

## Обзор крейтов

### prx-memory-core

Основные доменные примитивы для оценки, эволюции и представления записей памяти.

```toml
[dependencies]
prx-memory-core = "0.1"
```

Ключевые типы:
- Структуры записей памяти с текстом, областью видимости, тегами, важностью и метаданными.
- Примитивы оценки для ранжирования релевантности.
- Типы эволюции для train/holdout-приёмочного тестирования.

### prx-memory-embed

Абстракция провайдера эмбеддингов и адаптеры.

```toml
[dependencies]
prx-memory-embed = "0.1"
```

Предоставляет async-трейт, который реализуют все провайдеры эмбеддингов:

```rust
// Концептуальный API (упрощённо)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

Встроенные реализации:
- `OpenAiCompatibleProvider` — любой OpenAI-совместимый API эмбеддингов
- `JinaProvider` — эмбеддинги Jina AI
- `GeminiProvider` — эмбеддинги Google Gemini

### prx-memory-rerank

Абстракция провайдера реранкинга и адаптеры.

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

Предоставляет async-трейт для реранкинга:

```rust
// Концептуальный API (упрощённо)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

Встроенные реализации:
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

Унифицированная абстракция провайдера, объединяющая эмбеддинги и реранкинг.

```toml
[dependencies]
prx-memory-ai = "0.1"
```

Этот крейт предоставляет единую точку входа для настройки как провайдеров эмбеддингов, так и реранкинга из переменных окружения.

### prx-memory-skill

Встроенные payload навыков управления для распространения через MCP-ресурсы.

```toml
[dependencies]
prx-memory-skill = "0.1"
```

Предоставляет статические определения навыков и шаблоны payload, обнаруживаемые через ресурсный протокол MCP.

### prx-memory-storage

Локальный постоянный движок хранения.

```toml
[dependencies]
prx-memory-storage = "0.1"

# С поддержкой LanceDB
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

Предоставляет реализации трейта хранения для:
- JSON файлового хранения
- SQLite с векторными столбцами
- LanceDB (опционально, за флагом функции)

### prx-memory-mcp

Поверхность MCP-сервера, объединяющая все остальные крейты в запускаемый демон.

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

Этот крейт обычно не используется как зависимость библиотеки — он предоставляет бинарный файл `prx-memoryd`.

## Обработка ошибок

Все крейты используют `thiserror` для типизированных перечислений ошибок. Ошибки распространяются с помощью оператора `?` и никогда не преобразуются в паники в продакшен-коде.

```rust
// Пример паттерна ошибок
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

## Конкурентность

- Синхронные мьютексы используют `parking_lot::Mutex` (без отравления).
- Асинхронные мьютексы используют `tokio::sync::Mutex`.
- `std::sync::Mutex` запрещён в продакшен-коде.
- Разделяемые неизменяемые данные используют `Arc<str>` или `Arc<T>`.

## Зависимости

Все сетевые запросы используют `reqwest` с `rustls-tls` (без зависимости от OpenSSL). Сериализация использует `serde` и `serde_json`.

## Следующие шаги

- [Модели эмбеддингов](../embedding/models) — конфигурация для конкретного провайдера
- [Бэкенды хранения](../storage/) — реализации трейта хранения
- [Справочник конфигурации](../configuration/) — справочник по переменным окружения
