---
title: トラブルシューティング
description: "設定、埋め込み、リランキング、ストレージ、MCP統合に関するPRX-Memoryの一般的な問題と解決策。"
---

# トラブルシューティング

このページではPRX-Memoryを実行する際によく発生する問題とその原因・解決策を説明します。

## 設定の問題

### "PRX_EMBED_API_KEY is not configured"

**原因：** リモートセマンティック検索がリクエストされましたが、埋め込みAPIキーが設定されていません。

**解決策：** 埋め込みプロバイダとAPIキーを設定します：

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

またはプロバイダ固有のフォールバックキーを使用します：

```bash
JINA_API_KEY=your_api_key
```

::: tip
セマンティック検索が不要な場合、PRX-Memoryは埋め込み設定なしで語彙マッチングのみで動作します。
:::

### "Unsupported rerank provider"

**原因：** `PRX_RERANK_PROVIDER`変数に認識されない値が含まれています。

**解決策：** サポートされる値の1つを使用します：

```bash
PRX_RERANK_PROVIDER=jina        # or cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**原因：** `PRX_EMBED_PROVIDER`変数に認識されない値が含まれています。

**解決策：** サポートされる値の1つを使用します：

```bash
PRX_EMBED_PROVIDER=openai-compatible  # or jina, gemini
```

## セッションの問題

### "session_expired"

**原因：** HTTPストリーミングセッションが更新されずにTTLを超えました。

**解決策：** セッションが期限切れになる前に更新するか、TTLを増やします：

```bash
# Renew the session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Or increase the TTL (default: 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## ストレージの問題

### データベースファイルが見つからない

**原因：** `PRX_MEMORY_DB`で指定されたパスが存在しないか、書き込み不可です。

**解決策：** ディレクトリが存在し、パスが正しいことを確認します：

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
作業ディレクトリの変更による問題を避けるために絶対パスを使用してください。
:::

### 大きなJSONデータベースの読み込みが遅い

**原因：** JSONバックエンドは起動時にファイル全体をメモリに読み込みます。10,000件以上のエントリを持つデータベースでは遅くなることがあります。

**解決策：** SQLiteバックエンドに移行します：

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

`memory_migrate`ツールを使用して既存のデータを転送します。

## オブザーバビリティの問題

### メトリクスカーディナリティオーバーフローアラート

**原因：** 検索スコープ、カテゴリ、またはリランクプロバイダのディメンションで区別ラベル値が多すぎます。

**解決策：** カーディナリティの制限を増やすか、入力を正規化します：

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

制限を超えると、新しいラベル値は黙って削除され`prx_memory_metrics_label_overflow_total`にカウントされます。

### アラートしきい値が過敏すぎる

**原因：** デフォルトのアラートしきい値が初期デプロイ中に誤検知を引き起こす場合があります。

**解決策：** 予想されるエラー率に基づいてしきい値を調整します：

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## ビルドの問題

### LanceDBフィーチャーが利用できない

**原因：** コンパイル時に`lancedb-backend`フィーチャーが有効にされていませんでした。

**解決策：** フィーチャーフラグでリビルドします：

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Linuxでのコンパイルエラー

**原因：** ネイティブコードのビルドに必要なシステム依存関係が不足しています。

**解決策：** ビルド依存関係をインストールします：

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## ヘルスチェック

HTTPヘルスエンドポイントを使用してサーバーが正常に動作していることを確認します：

```bash
curl -sS http://127.0.0.1:8787/health
```

運用状況のメトリクスを確認します：

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## 検証コマンド

インストールを確認するために完全な検証スイートを実行します：

```bash
# Multi-client validation
./scripts/run_multi_client_validation.sh

# Soak test (60 seconds, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## ヘルプを得る

- **リポジトリ:** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **イシュー:** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **ドキュメント:** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
