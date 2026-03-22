---
title: Rust APIリファレンス
description: 独自のRustアプリケーションにメモリエンジンを組み込むためのPRX-Memory RustライブラリAPIリファレンス。
---

# Rust APIリファレンス

PRX-MemoryはRustワークスペースとして7つのクレートで構成されています。各クレートは独立して使用するか、組み合わせて使用できる焦点を絞ったAPIを提供します。

## クレート概要

### prx-memory-core

スコアリング、進化、メモリエントリ表現のためのコアドメインプリミティブ。

```toml
[dependencies]
prx-memory-core = "0.1"
```

主要な型：
- テキスト、スコープ、タグ、重要度、メタデータを持つメモリエントリ構造体。
- 関連性ランキングのためのスコアリングプリミティブ。
- トレイン/ホールドアウト受け入れテストのための進化型。

### prx-memory-embed

埋め込みプロバイダの抽象化とアダプタ。

```toml
[dependencies]
prx-memory-embed = "0.1"
```

すべての埋め込みプロバイダが実装する非同期トレイトを提供します：

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait EmbedProvider: Send + Sync {
    async fn embed(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>, EmbedError>;
}
```

組み込み実装：
- `OpenAiCompatibleProvider` -- OpenAI互換の埋め込みAPI
- `JinaProvider` -- Jina AI埋め込み
- `GeminiProvider` -- Google Gemini埋め込み

### prx-memory-rerank

リランクプロバイダの抽象化とアダプタ。

```toml
[dependencies]
prx-memory-rerank = "0.1"
```

リランキングの非同期トレイトを提供します：

```rust
// Conceptual API (simplified)
#[async_trait]
pub trait RerankProvider: Send + Sync {
    async fn rerank(
        &self,
        query: &str,
        documents: &[&str],
    ) -> Result<Vec<RerankResult>, RerankError>;
}
```

組み込み実装：
- `JinaReranker`
- `CohereReranker`
- `PineconeReranker`

### prx-memory-ai

埋め込みとリランキングを組み合わせた統一プロバイダ抽象化。

```toml
[dependencies]
prx-memory-ai = "0.1"
```

このクレートは環境変数から埋め込みとリランキングプロバイダの両方を設定するための単一エントリポイントを提供します。

### prx-memory-skill

MCPリソース配布のための組み込みガバナンススキルペイロード。

```toml
[dependencies]
prx-memory-skill = "0.1"
```

MCPリソースプロトコルを通じて検索可能な静的スキル定義とペイロードテンプレートを提供します。

### prx-memory-storage

ローカル永続ストレージエンジン。

```toml
[dependencies]
prx-memory-storage = "0.1"

# With LanceDB support
[dependencies]
prx-memory-storage = { version = "0.1", features = ["lancedb-backend"] }
```

以下のストレージトレイト実装を提供します：
- JSONファイルベースストレージ
- ベクトル列を持つSQLite
- LanceDB（オプション、フィーチャーフラグの背後）

### prx-memory-mcp

他のすべてのクレートを実行可能なデーモンに組み合わせたMCPサーバーサーフェス。

```toml
[dependencies]
prx-memory-mcp = "0.1"
```

このクレートは通常ライブラリ依存関係として使用されません。`prx-memoryd`バイナリを提供します。

## エラー処理

すべてのクレートは型付きエラー列挙体に`thiserror`を使用します。エラーは`?`演算子を使用して伝播し、本番コードではパニックに変換されません。

```rust
// Example error pattern
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

## 並行性

- 同期ミューテックスは`parking_lot::Mutex`を使用します（毒化なし）。
- 非同期ミューテックスは`tokio::sync::Mutex`を使用します。
- `std::sync::Mutex`は本番コードで禁止されています。
- 共有不変データは`Arc<str>`または`Arc<T>`を使用します。

## 依存関係

すべてのネットワークリクエストは`rustls-tls`付きの`reqwest`を使用します（OpenSSL依存なし）。シリアル化は`serde`と`serde_json`を使用します。

## 次のステップ

- [埋め込みモデル](../embedding/models) -- プロバイダ固有の設定
- [ストレージバックエンド](../storage/) -- ストレージトレイト実装
- [設定リファレンス](../configuration/) -- 環境変数リファレンス
