---
title: HTTP リクエスト
description: ドメインホワイトリスト、設定可能なレスポンスサイズ制限、タイムアウト強制による API への HTTP リクエスト送信。
---

# HTTP リクエスト

`http_request` ツールは、PRX エージェントが外部 API に直接 HTTP リクエストを送信できるようにします。JSON データの取得、REST エンドポイントの呼び出し、Webhook の送信など、構造化された API インタラクション向けに設計されており、一般的な Web ブラウジング向けではありません。ツールは拒否デフォルトのドメインポリシーを強制し、`allowed_domains` に明示的にリストされたドメインのみが到達可能です。

HTTP リクエストはフィーチャーゲートされており、設定で `http_request.enabled = true` が必要です。Web ページをレンダリングするブラウザツールとは異なり、HTTP リクエストツールはプロトコルレベルで動作するため、より高速で API 統合に適しています。

ツールは標準のすべての HTTP メソッド（GET、POST、PUT、PATCH、DELETE、HEAD、OPTIONS）、カスタムヘッダー、リクエストボディ、設定可能なタイムアウトをサポートします。レスポンスボディはメモリ枯渇を防ぐために設定可能な最大サイズまでキャプチャされます。

## 設定

```toml
[http_request]
enabled = true
allowed_domains = [
  "api.github.com",
  "api.openai.com",
  "api.anthropic.com",
  "httpbin.org"
]
max_response_size = 1000000   # 最大レスポンスボディサイズ（バイト）（1 MB）
timeout_secs = 30             # リクエストタイムアウト（秒）
```

### ドメインホワイトリスト

`allowed_domains` リストは HTTP リクエストツールの主要なセキュリティ制御です。このリストのドメインへのリクエストのみが許可されます。ドメインマッチングルール:

| パターン | 例 | マッチ |
|---------|---------|---------|
| 完全一致ドメイン | `"api.github.com"` | `api.github.com` のみ |
| ワイルドカードサブドメイン | `"*.github.com"` | `api.github.com`、`raw.github.com` など |
| トップレベルドメイン | `"github.com"` | `github.com` のみ（デフォルトではサブドメインを含まない） |

::: warning
空の `allowed_domains` リストはツールが有効でも HTTP リクエストが一切許可されないことを意味します。これはセキュアなデフォルトです。
:::

## 使用方法

### GET リクエスト

REST API からデータを取得:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "GET",
    "url": "https://api.github.com/repos/openprx/prx/releases/latest",
    "headers": {
      "Accept": "application/vnd.github+json",
      "Authorization": "Bearer ghp_xxxxxxxxxxxx"
    }
  }
}
```

### POST リクエスト

API エンドポイントにデータを送信:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "POST",
    "url": "https://api.example.com/webhooks",
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"event\": \"task_completed\", \"data\": {\"task_id\": 42}}"
  }
}
```

### PUT リクエスト

リソースを更新:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "PUT",
    "url": "https://api.example.com/config/settings",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token-here"
    },
    "body": "{\"theme\": \"dark\", \"language\": \"en\"}"
  }
}
```

### DELETE リクエスト

リソースを削除:

```json
{
  "name": "http_request",
  "arguments": {
    "method": "DELETE",
    "url": "https://api.example.com/items/42",
    "headers": {
      "Authorization": "Bearer token-here"
    }
  }
}
```

## パラメーター

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `method` | `string` | いいえ | `"GET"` | HTTP メソッド: `"GET"`、`"POST"`、`"PUT"`、`"PATCH"`、`"DELETE"`、`"HEAD"`、`"OPTIONS"` |
| `url` | `string` | はい | -- | リクエストする完全な URL。HTTPS または HTTP でなければならない。ドメインは `allowed_domains` に含まれている必要がある。 |
| `headers` | `object` | いいえ | `{}` | リクエストに含める HTTP ヘッダーのキーバリューマップ |
| `body` | `string` | いいえ | -- | リクエストボディ（POST、PUT、PATCH メソッド用） |
| `timeout_secs` | `integer` | いいえ | 設定値（`30`） | リクエストごとのタイムアウトオーバーライド（秒） |

**戻り値:**

| フィールド | 型 | 説明 |
|-------|------|-------------|
| `success` | `bool` | リクエストが完了した場合 `true`（非 2xx ステータスコードでも） |
| `output` | `string` | レスポンスボディ（テキスト）、`max_response_size` に切り詰め。構造化出力にステータスコードとヘッダーを含む。 |
| `error` | `string?` | リクエストが失敗した場合のエラーメッセージ（ドメインブロック、タイムアウト、接続エラー） |

### レスポンス形式

ツールは以下を含む構造化出力を返します:

```
Status: 200 OK
Content-Type: application/json

{
  "name": "prx",
  "version": "0.8.0",
  ...
}
```

非テキストレスポンス（バイナリデータ）の場合、ツールはボディを含めずにレスポンスサイズとコンテンツタイプを報告します。

## 一般的なパターン

### API 統合

HTTP リクエストツールは外部サービスとの統合に一般的に使用されます:

```
エージェントの思考: ユーザーが PR の CI ステータスを確認したい。
  1. [http_request] GET https://api.github.com/repos/owner/repo/pulls/42/checks
  2. [JSON レスポンスをパース]
  3. [ステータスをユーザーに報告]
```

### Webhook 配信

外部システムに通知を送信:

```
エージェントの思考: タスク完了、Webhook に通知する必要がある。
  1. [http_request] POST https://hooks.slack.com/services/T.../B.../xxx
     body: {"text": "Task #42 completed successfully"}
```

### データ取得

分析用の構造化データを取得:

```
エージェントの思考: パッケージのメタデータを調べる必要がある。
  1. [http_request] GET https://crates.io/api/v1/crates/tokio
  2. [バージョン、ダウンロード数、依存関係を抽出]
```

## セキュリティ

### 拒否デフォルト

HTTP リクエストツールは拒否デフォルトのセキュリティモデルを使用します。ドメインが `allowed_domains` に明示的にリストされていない場合、ネットワーク接続が行われる前にリクエストがブロックされます。これにより以下を防止します:

- **サーバーサイドリクエストフォージェリ（SSRF）**: 明示的に許可されない限り、エージェントは内部ネットワークアドレス（`localhost`、`10.x.x.x`、`192.168.x.x`）にリクエストできない
- **データ流出**: エージェントは任意の外部サーバーにデータを送信できない
- **DNS リバインディング**: ドメインは DNS 解決時だけでなくリクエスト時にチェックされる

### 資格情報の処理

HTTP リクエストツールは自動的に資格情報を注入しません。エージェントが API で認証する必要がある場合、ツール呼び出しの引数に認証ヘッダーを明示的に含める必要があります。これは以下を意味します:

- API キーはツール呼び出し（および監査ログ）で可視
- エージェントは与えられた、またはメモリから取得した資格情報のみ使用可能
- ドメインホワイトリストにより未承認ドメインへの資格情報漏洩を防止

機密性の高い API 呼び出しには `http_request` を supervised としてマークすることを検討:

```toml
[security.tool_policy.tools]
http_request = "supervised"
```

### レスポンスサイズ制限

`max_response_size` 設定（デフォルト: 1 MB）は、予想外に大きなレスポンスによるメモリ枯渇を防ぎます。この制限を超えるレスポンスは切り詰められ、出力にメモが付加されます。

### タイムアウト保護

`timeout_secs` 設定（デフォルト: 30 秒）は、遅い、または応答のないサーバーでエージェントがハングすることを防ぎます。タイムアウトは接続レベルで強制されます。

### プロキシサポート

`[proxy]` が設定されている場合、HTTP リクエストは設定されたプロキシを経由:

```toml
[proxy]
enabled = true
https_proxy = "socks5://127.0.0.1:1080"
no_proxy = ["localhost", "127.0.0.1"]
```

### 監査ログ

有効な場合、すべての HTTP リクエストが監査ログに記録されます:

- リクエストメソッドと URL
- リクエストヘッダー（機密値はリダクト）
- レスポンスステータスコード
- レスポンスサイズ
- 成功/失敗ステータス

## 関連

- [Web 検索](/ja/prx/tools/web-search) -- Web の検索とページコンテンツの取得
- [ブラウザツール](/ja/prx/tools/browser) -- Web ページのフルブラウザオートメーション
- [MCP 統合](/ja/prx/tools/mcp) -- MCP プロトコル経由で外部ツールに接続
- [設定リファレンス](/ja/prx/config/reference) -- `[http_request]` 設定フィールド
- [プロキシ設定](/ja/prx/config/reference#proxy) -- アウトバウンドプロキシ設定
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
