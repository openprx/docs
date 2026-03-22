---
title: Modèles d'embedding pris en charge
description: "Modèles d'embedding pris en charge par PRX-Memory, incluant les fournisseurs compatibles OpenAI, Jina et Gemini avec les détails de configuration."
---

# Modèles d'embedding pris en charge

PRX-Memory prend en charge trois familles de fournisseurs d'embedding. Chaque fournisseur se connecte via l'interface d'adaptateur unifiée du crate `prx-memory-embed`.

## Compatible OpenAI

Toute API qui suit le format de point de terminaison d'embedding OpenAI (`/v1/embeddings`) peut être utilisée. Cela inclut OpenAI lui-même, Azure OpenAI et les serveurs d'inférence locaux.

```bash
PRX_EMBED_PROVIDER=openai-compatible
PRX_EMBED_API_KEY=your_openai_key
PRX_EMBED_MODEL=text-embedding-3-small
PRX_EMBED_BASE_URL=https://api.openai.com  # optionnel
```

| Modèle | Dimensions | Notes |
|-------|-----------|-------|
| `text-embedding-3-small` | 1536 | Bon équilibre qualité/coût |
| `text-embedding-3-large` | 3072 | Meilleure qualité, coût plus élevé |
| `text-embedding-ada-002` | 1536 | Modèle hérité |

::: tip Inférence locale
Pour les déploiements sensibles à la confidentialité, pointez `PRX_EMBED_BASE_URL` vers un serveur d'inférence local exécutant un modèle d'embedding open source (par exemple, via Ollama, vLLM ou text-embeddings-inference).
:::

## Jina AI

Jina propose des modèles d'embedding multilingues de haute qualité optimisés pour les tâches de récupération.

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3
```

| Modèle | Dimensions | Notes |
|-------|-----------|-------|
| `jina-embeddings-v3` | 1024 | Dernier modèle multilingue |
| `jina-embeddings-v2-base-en` | 768 | Optimisé pour l'anglais |
| `jina-embeddings-v2-base-code` | 768 | Optimisé pour le code |

::: info Clé de fallback
Si `PRX_EMBED_API_KEY` n'est pas défini, le système vérifie `JINA_API_KEY` en fallback.
:::

## Google Gemini

Les modèles d'embedding Gemini sont disponibles via l'API Google AI.

```bash
PRX_EMBED_PROVIDER=gemini
PRX_EMBED_API_KEY=your_gemini_key
PRX_EMBED_MODEL=text-embedding-004
```

| Modèle | Dimensions | Notes |
|-------|-----------|-------|
| `text-embedding-004` | 768 | Modèle actuel recommandé |
| `embedding-001` | 768 | Modèle hérité |

::: info Clé de fallback
Si `PRX_EMBED_API_KEY` n'est pas défini, le système vérifie `GEMINI_API_KEY` en fallback.
:::

## Choisir un modèle

| Priorité | Modèle recommandé | Fournisseur |
|----------|-------------------|----------|
| Meilleure qualité | `text-embedding-3-large` | Compatible OpenAI |
| Meilleur pour le code | `jina-embeddings-v2-base-code` | Jina |
| Multilingue | `jina-embeddings-v3` | Jina |
| Confidentialité / local | Tout modèle local via `openai-compatible` | Auto-hébergé |
| Rentable | `text-embedding-3-small` | Compatible OpenAI |

## Changer de modèle

Lors du changement de modèle d'embedding, les vecteurs existants deviennent incompatibles avec l'espace vectoriel du nouveau modèle. Utilisez l'outil `memory_reembed` pour ré-embéder toutes les mémoires stockées avec le nouveau modèle :

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_reembed",
    "arguments": {}
  }
}
```

::: warning
Le ré-embedding nécessite des appels API pour chaque mémoire stockée. Pour les grandes bases de données, cela peut prendre un temps significatif et entraîner des coûts API. Planifiez le ré-embedding pendant les périodes de faible utilisation.
:::

## Étapes suivantes

- [Traitement par lots](./batch-processing) -- Embedding en masse efficace
- [Modèles de reranking](../reranking/models) -- Options de modèles de reranking en deuxième étape
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement
