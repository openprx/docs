---
title: 設定リファレンス
description: "トランスポート、ストレージ、埋め込み、リランキング、ガバナンス、オブザーバビリティをカバーするすべてのPRX-Memory環境変数の完全リファレンス。"
---

# 設定リファレンス

PRX-Memoryは環境変数のみで設定されます。このページではカテゴリ別にすべての変数を説明します。

## トランスポート

| 変数 | 値 | デフォルト | 説明 |
|-----|-----|---------|------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`、`http` | `stdio` | サーバートランスポートモード |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | HTTPサーバーバインドアドレス |

## ストレージ

| 変数 | 値 | デフォルト | 説明 |
|-----|-----|---------|------|
| `PRX_MEMORY_BACKEND` | `json`、`sqlite`、`lancedb` | `json` | ストレージバックエンド |
| `PRX_MEMORY_DB` | ファイル/ディレクトリパス | -- | データベースファイルまたはディレクトリパス |

## 埋め込み

| 変数 | 値 | デフォルト | 説明 |
|-----|-----|---------|------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`、`jina`、`gemini` | -- | 埋め込みプロバイダ |
| `PRX_EMBED_API_KEY` | APIキー文字列 | -- | 埋め込みプロバイダAPIキー |
| `PRX_EMBED_MODEL` | モデル名 | プロバイダ固有 | 埋め込みモデル名 |
| `PRX_EMBED_BASE_URL` | URL | プロバイダ固有 | カスタムAPIエンドポイントURL |

### プロバイダフォールバックキー

`PRX_EMBED_API_KEY`が設定されていない場合、システムはこれらのプロバイダ固有キーをチェックします：

| プロバイダ | フォールバックキー |
|-----------|--------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## リランキング

| 変数 | 値 | デフォルト | 説明 |
|-----|-----|---------|------|
| `PRX_RERANK_PROVIDER` | `jina`、`cohere`、`pinecone`、`pinecone-compatible`、`none` | `none` | リランクプロバイダ |
| `PRX_RERANK_API_KEY` | APIキー文字列 | -- | リランクプロバイダAPIキー |
| `PRX_RERANK_MODEL` | モデル名 | プロバイダ固有 | リランクモデル名 |
| `PRX_RERANK_ENDPOINT` | URL | プロバイダ固有 | カスタムリランクエンドポイント |
| `PRX_RERANK_API_VERSION` | バージョン文字列 | -- | APIバージョン（pinecone-compatibleのみ） |

### プロバイダフォールバックキー

`PRX_RERANK_API_KEY`が設定されていない場合、システムはこれらのプロバイダ固有キーをチェックします：

| プロバイダ | フォールバックキー |
|-----------|--------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## 標準化

| 変数 | 値 | デフォルト | 説明 |
|-----|-----|---------|------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`、`governed` | `zero-config` | 標準化プロファイル |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | タグ文字列 | `prx-memory` | デフォルトプロジェクトタグ |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | タグ文字列 | `mcp` | デフォルトツールタグ |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | タグ文字列 | `general` | デフォルトドメインタグ |

## ストリーミングセッション

| 変数 | 値 | デフォルト | 説明 |
|-----|-----|---------|------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | ミリ秒 | `300000` | ストリームセッションの有効期間 |

## オブザーバビリティ

### カーディナリティ制御

| 変数 | デフォルト | 説明 |
|-----|---------|------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | メトリクスの最大区別スコープラベル数 |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | メトリクスの最大区別カテゴリラベル数 |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | 最大区別リランクプロバイダラベル数 |

### アラートしきい値

| 変数 | デフォルト | 説明 |
|-----|---------|------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | ツールエラー率の警告しきい値 |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | ツールエラー率のクリティカルしきい値 |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | リモート警告率の警告しきい値 |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | リモート警告率のクリティカルしきい値 |

## 例：最小設定

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## 例：完全なプロダクション設定

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Storage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Governance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observability
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## 次のステップ

- [インストール](../getting-started/installation) -- PRX-Memoryをビルドしてインストール
- [MCP統合](../mcp/) -- MCPクライアントを設定
- [トラブルシューティング](../troubleshooting/) -- 一般的な設定問題
