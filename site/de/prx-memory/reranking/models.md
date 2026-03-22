---
title: Reranking-Modelle
description: "Von PRX-Memory unterstützte Reranking-Modelle, einschließlich Jina, Cohere und Pinecone-Provider."
---

# Reranking-Modelle

PRX-Memory unterstützt mehrere Reranking-Provider durch das `prx-memory-rerank`-Crate. Jeder Provider implementiert dasselbe Adapter-Trait, was nahtloses Wechseln ermöglicht.

## Jina AI

Jina bietet Cross-Encoder-Reranking-Modelle mit mehrsprachiger Unterstützung.

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| Modell | Hinweise |
|--------|---------|
| `jina-reranker-v2-base-multilingual` | Mehrsprachiger Cross-Encoder |
| `jina-reranker-v1-base-en` | Englisch-optimiert |

::: info
Jina-Reranking kann denselben API-Schlüssel wie Jina-Embedding verwenden. `JINA_API_KEY` einmal setzen, um beides abzudecken.
:::

## Cohere

Cohere bietet hochwertiges Reranking durch ihre Rerank-API.

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| Modell | Hinweise |
|--------|---------|
| `rerank-v3.5` | Neuestes Modell, beste Qualität |
| `rerank-english-v3.0` | Englisch-optimiert |
| `rerank-multilingual-v3.0` | Mehrsprachige Unterstützung |

## Pinecone

Pinecone bietet Reranking als Teil ihrer Inferenz-API an.

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

Für benutzerdefinierte Pinecone-kompatible Endpunkte:

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## Reranker auswählen

| Priorität | Empfohlener Provider | Modell |
|-----------|---------------------|--------|
| Beste Qualität | Cohere | `rerank-v3.5` |
| Mehrsprachig | Jina | `jina-reranker-v2-base-multilingual` |
| Integriert mit Pinecone | Pinecone | `bge-reranker-v2-m3` |
| Kein Reranking benötigt | -- | `PRX_RERANK_PROVIDER=none` |

## Embedding und Reranking kombinieren

Eine häufige hochwertige Konfiguration kombiniert Jina-Embeddings mit Cohere-Reranking:

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

Dieses Setup nutzt Jinas schnelle mehrsprachige Embeddings für breites Retrieval und Coheres hochpräzisen Reranker für die finale Ordnung.

## Nächste Schritte

- [Embedding-Modelle](../embedding/models) -- Erste-Stufe-Embedding-Modell-Optionen
- [Konfigurationsreferenz](../configuration/) -- Alle Umgebungsvariablen
