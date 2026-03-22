---
title: リランキングモデル
description: "PRX-Memoryがサポートするリランキングモデル（Jina、Cohere、Pineconeプロバイダ）。"
---

# リランキングモデル

PRX-Memoryは`prx-memory-rerank`クレートを通じて複数のリランキングプロバイダをサポートします。各プロバイダは同じアダプタトレイトを実装し、シームレスな切り替えを可能にします。

## Jina AI

Jinaは多言語サポートを持つクロスエンコーダリランキングモデルを提供します。

```bash
PRX_RERANK_PROVIDER=jina
PRX_RERANK_API_KEY=your_jina_key
PRX_RERANK_MODEL=jina-reranker-v2-base-multilingual
```

| モデル | 備考 |
|-------|------|
| `jina-reranker-v2-base-multilingual` | 多言語クロスエンコーダ |
| `jina-reranker-v1-base-en` | 英語最適化 |

::: info
Jinaリランキングは埋め込みと同じAPIキーを使用できます。`JINA_API_KEY`を一度設定するだけで両方をカバーできます。
:::

## Cohere

CohereはRerank APIを通じて高品質なリランキングを提供します。

```bash
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5
```

| モデル | 備考 |
|-------|------|
| `rerank-v3.5` | 最新モデル、最高品質 |
| `rerank-english-v3.0` | 英語最適化 |
| `rerank-multilingual-v3.0` | 多言語サポート |

## Pinecone

Pineconeは推論APIの一部としてリランキングを提供します。

```bash
PRX_RERANK_PROVIDER=pinecone
PRX_RERANK_API_KEY=your_pinecone_key
PRX_RERANK_MODEL=bge-reranker-v2-m3
```

カスタムPinecone互換エンドポイントの場合：

```bash
PRX_RERANK_PROVIDER=pinecone-compatible
PRX_RERANK_API_KEY=your_key
PRX_RERANK_ENDPOINT=https://your-endpoint.example.com
PRX_RERANK_API_VERSION=2025-01
```

## リランカーの選び方

| 優先事項 | 推奨プロバイダ | モデル |
|---------|-------------|-------|
| 最高品質 | Cohere | `rerank-v3.5` |
| 多言語 | Jina | `jina-reranker-v2-base-multilingual` |
| Pineconeと統合 | Pinecone | `bge-reranker-v2-m3` |
| リランキング不要 | -- | `PRX_RERANK_PROVIDER=none` |

## 埋め込みとリランキングの組み合わせ

高品質な設定として、Jina埋め込みとCohereリランキングを組み合わせるのが一般的です：

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

このセットアップはJinaの高速な多言語埋め込みによる幅広い検索と、Cohereの高精度リランカーによる最終的な順序付けを活用します。

## 次のステップ

- [埋め込みモデル](../embedding/models) -- 第1段階埋め込みモデルオプション
- [設定リファレンス](../configuration/) -- すべての環境変数
