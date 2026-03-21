---
title: 検索拡張生成（RAG）
description: PRX がエンベディングとメモリ検索を使用して、生成前に LLM プロンプトに関連するコンテキストを注入する方法
---

# 検索拡張生成（RAG）

PRX は検索拡張生成（RAG）を実装し、エージェントのメモリや知識ストアからの関連コンテキストで LLM レスポンスを強化します。LLM のパラメトリック知識にのみ依存する代わりに、RAG は関連するドキュメントを検索してプロンプトに注入し、ハルシネーションを削減して事実に基づいた最新の情報にレスポンスを根拠づけます。

## 概要

RAG パイプラインはエージェントループのすべての LLM 呼び出しの前に実行されます:

```
User Message
    │
    ▼
┌──────────────────────────┐
│  1. Query Formulation     │  ユーザーメッセージ + 会話コンテキスト
│                           │  から検索語を抽出
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  2. Embedding Generation  │  設定されたエンベディングプロバイダーで
│                           │  クエリをベクトルに変換
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  3. Memory Search         │  メモリバックエンド全体を検索:
│                           │  ベクトル類似度 + 全文検索
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  4. Relevance Filtering   │  結果をスコアリングし関連性
│                           │  閾値以上のものをフィルタ
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  5. Context Injection     │  結果をフォーマットしてシステム
│                           │  プロンプト / コンテキストウィンドウに注入
└──────────┬───────────────┘
           │
           ▼
┌──────────────────────────┐
│  6. LLM Generation        │  モデルが完全なコンテキストを持って
│                           │  レスポンスを生成
└──────────────────────────┘
```

## 設定

`config.toml` で RAG を有効化:

```toml
[memory]
backend = "embeddings"  # RAG にはエンベディングバックエンドが必要

[memory.embeddings]
# Embedding provider: "openai" | "ollama" | "local"
provider = "openai"
model = "text-embedding-3-small"
dimensions = 1536

# Vector store backend
vector_store = "sqlite"  # "sqlite" | "postgres" | "qdrant"

[rag]
enabled = true

# コンテキストに注入する検索チャンクの最大数
max_results = 10

# チャンクを含める最小関連性スコア（0.0 から 1.0）
relevance_threshold = 0.3

# RAG コンテキストに割り当てる最大トークン数
# コンテキストウィンドウのオーバーフローを防止
max_context_tokens = 4000

# max_context_tokens を超える場合にどのチャンクを含めるかの戦略
# "top_k" -- 最高関連性スコアを優先
# "mmr" -- 最大限界関連性（多様性 + 関連性）
selection_strategy = "top_k"
```

### エンベディングプロバイダー

PRX は複数のエンベディングプロバイダーをサポートします:

| プロバイダー | モデル | 次元数 | 備考 |
|----------|-------|------------|-------|
| OpenAI | text-embedding-3-small | 1536 | 最良の品質/コスト比 |
| OpenAI | text-embedding-3-large | 3072 | 最高品質 |
| Ollama | nomic-embed-text | 768 | ローカル、API コストなし |
| Ollama | mxbai-embed-large | 1024 | ローカル、より高品質 |
| Local | fastembed | 384 | バンドル、ネットワーク不要 |

エンベディングプロバイダーの設定:

```toml
# OpenAI エンベディング
[memory.embeddings]
provider = "openai"
model = "text-embedding-3-small"
api_key = "${OPENAI_API_KEY}"

# Ollama エンベディング（ローカル）
[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
endpoint = "http://localhost:11434"

# 組み込みローカルエンベディング（外部サービス不要）
[memory.embeddings]
provider = "local"
model = "fastembed"
```

## チャンキング戦略

ドキュメントをエンベッドして検索する前に、チャンクに分割する必要があります。PRX はいくつかのチャンキング戦略をサポートします:

| 戦略 | 説明 | 最適な用途 |
|----------|-------------|----------|
| `fixed_size` | 固定トークン数でオーバーラップ付き分割 | 均一なドキュメント |
| `sentence` | 文の境界で分割 | 散文と自然なテキスト |
| `paragraph` | 段落の境界で分割 | 構造化されたドキュメント |
| `semantic` | エンベディングを使用してトピックの境界で分割 | 長くて多様なドキュメント |
| `recursive` | 階層的分割（見出し > 段落 > 文） | Markdown/コード |

```toml
[rag.chunking]
strategy = "recursive"

# ターゲットチャンクサイズ（トークン数）
chunk_size = 512

# 隣接チャンク間のオーバーラップ（境界でのコンテキスト喪失を防止）
chunk_overlap = 64

# recursive 戦略用: 優先順位順のセパレーター
separators = ["\n## ", "\n### ", "\n\n", "\n", ". "]
```

## 検索パイプライン

### ステップ 1-3: クエリ、エンベッド、検索

RAG モジュールはユーザーの最新メッセージから検索クエリを抽出し（オプションで `query_reformulation = true` により LLM で再定式化）、エンベディングプロバイダーでベクトルに変換し、すべてのメモリバックエンドを同時に検索します -- ベクトル類似度（コサイン）と全文検索（FTS5/pg_trgm）。結果はマージされ重複排除されます。

### ステップ 4: 関連性フィルタリング

各結果は 0.0 から 1.0 の関連性スコアを受け取ります。`relevance_threshold` 未満の結果は破棄されます。スコアリングでは以下を考慮します:

- ベクトルコサイン類似度（主要シグナル）
- 全文検索マッチスコア（ブーストファクター）
- 新しさ（新しいメモリは若干のブーストを受ける）
- ソースの優先度（コアメモリは会話より高くランク付け）

### ステップ 5: コンテキスト注入

フィルタされた結果は構造化 XML タグ（`<context><memory source="..." relevance="...">`）でフォーマットされ、LLM プロンプトに注入されます。注入されるコンテキストの合計は `max_context_tokens` で制限され、コンテキストウィンドウのオーバーフローを防ぎます。

## 選択戦略

### Top-K

デフォルトの戦略。`max_context_tokens` 内に収まる最高スコアの K 個のチャンクを選択します。シンプルで予測可能ですが、複数のチャンクが同じトピックをカバーする場合に冗長な結果を返す可能性があります。

### 最大限界関連性（MMR）

MMR は関連性と多様性のバランスを取ります。クエリに関連しつつ、既に選択されたチャンクとは異なるチャンクを反復的に選択します:

```toml
[rag]
selection_strategy = "mmr"

# Lambda は関連性-多様性のトレードオフを制御
# 1.0 = 純粋な関連性（top_k と同じ）
# 0.0 = 純粋な多様性
mmr_lambda = 0.7
```

知識ベースに重複や冗長な情報が含まれる場合、MMR が推奨されます。

## ドキュメントのインデックス

### 自動インデックス

`memory_store` ツールを通じて保存されたメモリは自動的にエンベッドされインデックスされます。追加の設定は不要です。

### 手動ドキュメント取り込み

大量のドキュメント取り込みには CLI を使用します:

```bash
# 単一ファイルまたはディレクトリをインデックス
prx rag index /path/to/document.md
prx rag index /path/to/docs/ --recursive

# すべてのドキュメントを再インデックス（エンベディングを再構築）
prx rag reindex
```

サポートされるフォーマット: Markdown（`.md`）、プレーンテキスト（`.txt`）、PDF（`.pdf`）、HTML（`.html`）、ソースコード（`.rs`、`.py`、`.js`）。

## パフォーマンスチューニング

| パラメータ | 推奨値 |
|-----------|----------------|
| `chunk_size` | Q&A では 256-512 トークン、要約では 512-1024 |
| `chunk_overlap` | chunk_size の 10-20% |
| `max_results` | ほとんどのユースケースで 5-15 |
| `relevance_threshold` | 0.3-0.5（品質に基づいて調整） |

## セキュリティノート

- RAG コンテキストは LLM プロンプトに注入されます。エージェントがアクセスを許可されていない限り、保存されたドキュメントに機密データが含まれないようにしてください。
- `memory.acl_enabled = true` の場合、RAG はアクセス制御リストを尊重します。現在のプリンシパルがアクセス可能なメモリのみが取得されます。
- エンベディング API 呼び出しはドキュメントの内容をエンベディングプロバイダーに送信します。機密データにはローカルエンベディングプロバイダー（`ollama` または `local`）を使用してください。

## 関連ページ

- [メモリシステム](/ja/prx/memory/)
- [エンベディング](/ja/prx/memory/embeddings)
- [ベクトル検索](/ja/prx/memory/vector-search)
- [SQLite バックエンド](/ja/prx/memory/sqlite)
- [PostgreSQL バックエンド](/ja/prx/memory/postgres)
