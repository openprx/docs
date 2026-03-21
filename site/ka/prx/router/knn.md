---
title: KNN Router
description: Semantic similarity-based LLM routing using K-nearest neighbors on historical query embeddings.
---

# KNN Router

The KNN (K-Nearest Neighbors) router uses semantic similarity to match incoming queries against a database of historical queries with known optimal model assignments. This enables learned routing that improves over time.

## როგორ მუშაობს

1. **Embed query** -- convert the incoming query to a vector embedding
2. **KNN search** -- find the K most similar past queries in the embedding store
3. **Vote** -- aggregate the model assignments of the K neighbors
4. **Select** -- choose the model with the most votes (weighted by similarity)

## Training Data

The KNN router builds its dataset from:

- Agent session logs with quality ratings
- A/B test results from prompt evolution
- Manual feedback and corrections

## კონფიგურაცია

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

When insufficient training data is available (below `min_dataset_size`), the KNN router falls back to the heuristic strategy.

## Related Pages

- [Router Overview](./)
- [Heuristic Router](./heuristic)
- [Automix Router](./automix)
- [Embeddings Memory](/ka/prx/memory/embeddings)
