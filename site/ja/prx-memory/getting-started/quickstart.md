---
title: クイックスタート
description: "stdioまたはHTTPトランスポートでPRX-Memoryを5分で起動し、最初のメモリを保存してセマンティック検索で呼び出します。"
---

# クイックスタート

このガイドでは、PRX-Memoryのビルド、デーモンの実行、最初の保存・呼び出し操作の実行について説明します。

## 1. デーモンをビルドする

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. サーバーを起動する

### オプションA: stdioトランスポート

MCPクライアントとの直接統合用：

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### オプションB: HTTPトランスポート

ヘルスチェックとメトリクスを持つネットワークアクセス用：

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

サーバーが動作していることを確認します：

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. MCPクライアントを設定する

PRX-MemoryをMCPクライアントの設定に追加します。たとえば、Claude CodeやCodexの場合：

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
`/path/to/prx-memory`をリポジトリをクローンした実際のパスに置き換えてください。
:::

## 4. メモリを保存する

MCPクライアントまたはJSON-RPCで直接`memory_store`ツールを呼び出します：

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. メモリを呼び出す

`memory_recall`を使用して関連するメモリを検索します：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

システムは語彙マッチング、重要度スコアリング、再近接度の組み合わせによって関連性でランク付けされたメモリを返します。

## 6. セマンティック検索を有効にする（オプション）

ベクトルベースのセマンティック検索には、埋め込みプロバイダを設定します：

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

埋め込みが有効になると、呼び出しクエリは語彙マッチングに加えてベクトル類似度を使用し、自然言語クエリの検索品質を大幅に向上させます。

## 7. リランキングを有効にする（オプション）

リランカーを追加して検索精度をさらに向上させます：

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## 利用可能なMCPツール

| ツール | 説明 |
|-------|------|
| `memory_store` | 新しいメモリエントリを保存 |
| `memory_recall` | クエリでメモリを呼び出す |
| `memory_update` | 既存のメモリを更新 |
| `memory_forget` | メモリエントリを削除 |
| `memory_export` | すべてのメモリをエクスポート |
| `memory_import` | エクスポートからメモリをインポート |
| `memory_migrate` | ストレージフォーマットを移行 |
| `memory_reembed` | 新しいモデルでメモリを再埋め込み |
| `memory_compact` | ストレージをコンパクト化・最適化 |
| `memory_evolve` | ホールドアウト検証でメモリを進化させる |
| `memory_skill_manifest` | 利用可能なスキルを検索 |

## 次のステップ

- [埋め込みエンジン](../embedding/) -- 埋め込みプロバイダとバッチ処理を探索
- [リランキング](../reranking/) -- 第2段階リランキングを設定
- [ストレージバックエンド](../storage/) -- JSONとSQLiteストレージから選択
- [設定リファレンス](../configuration/) -- すべての環境変数
