---
title: Модели реранкинга
description: Модели реранкинга, поддерживаемые PRX-Memory, включая провайдеров Jina, Cohere и Pinecone.
---

# Модели реранкинга

PRX-Memory поддерживает несколько провайдеров реранкинга через крейт `prx-memory-rerank`. Каждый провайдер реализует один и тот же трейт адаптера, что обеспечивает бесшовное переключение.

## Jina AI

Jina предлагает модели реранкинга на основе cross-encoder с многоязычной поддержкой.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| Модель | Примечания |
|--------|------------|
| `jina-reranker-v2-base-multilingual` | Многоязычный cross-encoder |
| `jina-reranker-v1-base-en` | Оптимизирован для английского |

::: info
Реранкинг Jina может использовать тот же API-ключ, что и эмбеддинги Jina. Установите `JINA_API_KEY` один раз для покрытия обоих.
:::

## Cohere

Cohere предоставляет высококачественный реранкинг через их Rerank API.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| Модель | Примечания |
|--------|------------|
| `rerank-v3.5` | Последняя модель, наилучшее качество |
| `rerank-english-v3.0` | Оптимизирована для английского |
| `rerank-multilingual-v3.0` | Многоязычная поддержка |

## Pinecone

Pinecone предлагает реранкинг как часть их inference API.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

Для пользовательских Pinecone-совместимых эндпоинтов:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## Выбор реранкера

| Приоритет | Рекомендуемый провайдер | Модель |
|-----------|------------------------|--------|
| Наилучшее качество | Cohere | `rerank-v3.5` |
| Многоязычное | Jina | `jina-reranker-v2-base-multilingual` |
| Интеграция с Pinecone | Pinecone | `bge-reranker-v2-m3` |
| Реранкинг не нужен | -- | `PRX_RERANK_PROVIDER=none` |

## Совместное использование эмбеддингов и реранкинга

Популярная высококачественная конфигурация объединяет эмбеддинги Jina с реранкингом Cohere:

```bash
# Эмбеддинги
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Реранкинг
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

Эта конфигурация использует быстрые многоязычные эмбеддинги Jina для широкого извлечения и высокоточный реранкер Cohere для финального упорядочивания.

## Следующие шаги

- [Модели эмбеддингов](../embedding/models) — варианты моделей первого этапа извлечения
- [Справочник конфигурации](../configuration/) — все переменные окружения
