---
title: MCP統合
description: PRX-MemoryのMCPプロトコル統合、サポートされるツール、リソース、テンプレート、トランスポートモード。
---

# MCP統合

PRX-MemoryはネイティブのMCP（Model Context Protocol）サーバーとして構築されています。メモリ操作をMCPツールとして、ガバナンススキルをMCPリソースとして、標準化されたメモリインタラクションのためのペイロードテンプレートを公開します。

## トランスポートモード

### stdio

stdioトランスポートは標準入出力を通じて通信します。Claude Code、Codex、OpenClawなどのMCPクライアントとの直接統合に理想的です。

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

HTTPトランスポートは追加の運用エンドポイントを持つネットワークアクセス可能なサーバーを提供します。

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP専用エンドポイント：

| エンドポイント | 説明 |
|------------|------|
| `GET /health` | ヘルスチェック |
| `GET /metrics` | Prometheusメトリクス |
| `GET /metrics/summary` | JSONメトリクスサマリー |
| `POST /mcp/session/renew` | ストリーミングセッションを更新 |

## MCPクライアント設定

MCPクライアントの設定ファイルにPRX-Memoryを追加します：

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
パス解決の問題を避けるために、`command`と`PRX_MEMORY_DB`の両方に絶対パスを使用してください。
:::

## MCPツール

PRX-MemoryはMCPの`tools/call`インターフェースを通じて以下のツールを公開します：

### コアメモリ操作

| ツール | 説明 |
|-------|------|
| `memory_store` | テキスト、スコープ、タグ、メタデータで新しいメモリエントリを保存 |
| `memory_recall` | 語彙、ベクトル、リランク検索を使用してクエリにマッチするメモリを呼び出す |
| `memory_update` | 既存のメモリエントリを更新 |
| `memory_forget` | IDでメモリエントリを削除 |

### バルク操作

| ツール | 説明 |
|-------|------|
| `memory_export` | すべてのメモリを移植可能なJSON形式でエクスポート |
| `memory_import` | エクスポートからメモリをインポート |
| `memory_migrate` | ストレージバックエンド間を移行 |
| `memory_reembed` | 現在の埋め込みモデルですべてのメモリを再埋め込み |
| `memory_compact` | ストレージをコンパクト化・最適化 |

### 進化

| ツール | 説明 |
|-------|------|
| `memory_evolve` | トレイン/ホールドアウト受け入れと制約ゲーティングでメモリを進化させる |

### スキル検索

| ツール | 説明 |
|-------|------|
| `memory_skill_manifest` | ガバナンススキルのスキルマニフェストを返す |

## MCPリソース

PRX-MemoryはガバナンスキルパッケージをMCPリソースとして公開します：

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

特定のリソースを読み込みます：

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## リソーステンプレート

ペイロードテンプレートはクライアントが標準化されたメモリ操作を構築するのを助けます：

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

テンプレートを使用してストアペイロードを生成します：

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## ストリーミングセッション

HTTPトランスポートはストリーミングレスポンス用のServer-Sent Events（SSE）をサポートします。セッションには設定可能なTTLがあります：

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

期限切れ前にセッションを更新します：

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## 標準化プロファイル

PRX-Memoryはメモリエントリのタグ付けと検証方法を制御する2つの標準化プロファイルをサポートします：

| プロファイル | 説明 |
|-----------|------|
| `zero-config` | 最小制約、任意のタグとスコープを受け入れる（デフォルト） |
| `governed` | 厳格なタグの正規化、レシオ境界、品質制約 |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## 次のステップ

- [クイックスタート](../getting-started/quickstart) -- 最初の保存・呼び出し操作
- [設定リファレンス](../configuration/) -- すべての環境変数
- [トラブルシューティング](../troubleshooting/) -- 一般的なMCP問題
