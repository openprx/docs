---
title: Modèles de reranking
description: "Modèles de reranking pris en charge par PRX-Memory, incluant les fournisseurs Jina, Cohere et Pinecone."
---

# Modèles de reranking

PRX-Memory prend en charge plusieurs fournisseurs de reranking via le crate `prx-memory-rerank`. Chaque fournisseur implémente le même trait d'adaptateur, permettant un changement transparent.

## Jina AI

Jina propose des modèles de reranking cross-encoder avec support multilingue.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| Modèle | Notes |
|-------|-------|
| `jina-reranker-v2-base-multilingual` | Cross-encoder multilingue |
| `jina-reranker-v1-base-en` | Optimisé pour l'anglais |

::: info
Le reranking Jina peut utiliser la même clé API que l'embedding Jina. Définissez `JINA_API_KEY` une fois pour couvrir les deux.
:::

## Cohere

Cohere propose un reranking de haute qualité via leur API Rerank.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| Modèle | Notes |
|-------|-------|
| `rerank-v3.5` | Dernier modèle, meilleure qualité |
| `rerank-english-v3.0` | Optimisé pour l'anglais |
| `rerank-multilingual-v3.0` | Support multilingue |

## Pinecone

Pinecone propose le reranking dans le cadre de leur API d'inférence.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

Pour les points de terminaison compatibles Pinecone personnalisés :

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## Choisir un rerankeur

| Priorité | Fournisseur recommandé | Modèle |
|----------|---------------------|-------|
| Meilleure qualité | Cohere | `rerank-v3.5` |
| Multilingue | Jina | `jina-reranker-v2-base-multilingual` |
| Intégré avec Pinecone | Pinecone | `bge-reranker-v2-m3` |
| Pas de reranking nécessaire | -- | `PRX_RERANK_PROVIDER=none` |

## Combiner embedding et reranking

Une configuration haute qualité courante associe les embeddings Jina avec le reranking Cohere :

```bash
# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

Cette configuration exploite les embeddings multilingues rapides de Jina pour une récupération large et le rerankeur haute précision de Cohere pour l'ordonnancement final.

## Étapes suivantes

- [Modèles d'embedding](../embedding/models) -- Options de modèles d'embedding en première étape
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement
