---
title: Routeur KNN
description: Semantic similarity-based LLM routing using K-nearest neighbors on historical query embeddings.
---

# KNN Router

The KNN (K-Nearest Neighbors) router uses semantic similarity to match incoming interroge against a database of historical interroge with known optimal model assignments. Cela permet learned routing that improves over time.

## Fonctionnement

1. **Embed query** -- convert the incoming query vers un vector embedding
2. **KNN search** -- find the K most similar past interroge in the embedding store
3. **Vote** -- aggregate the model assignments of the K neighbors
4. **Select** -- choose the model avec le most votes (weighted by similarity)

## Training Data

The KNN router builds its dataset from:

- Agent session logs with quality ratings
- A/B test results from prompt evolution
- Manual feedback and corrections

## Configuration

```toml
[router]
strategy = "knn"

[router.knn]
k = 5
embedding_provider = "ollama"
embedding_model = "nomic-embed-text"
min_similarity = 0.6
min_dataset_size = 100
fallback_strategy = "heuristic"
```

## Cold Start

When insufficient training data est disponible (below `min_dataset_size`), the KNN router falls back vers le heuristic strategy.

## Voir aussi Pages

- [Router Overview](./)
- [Heuristic Router](./heuristic)
- [Automix Router](./automix)
- [Embeddings Memory](/fr/prx/memory/embeddings)
