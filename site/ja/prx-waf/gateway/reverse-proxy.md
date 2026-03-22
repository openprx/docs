---
title: リバースプロキシ設定
description: "PRX-WAFをリバースプロキシとして設定。ホストルーティング、上流バックエンド、負荷分散、リクエスト/レスポンスヘッダー、ヘルスチェック。"
---

# リバースプロキシ設定

PRX-WAFはリバースプロキシとして機能し、WAF検出パイプラインを通過した後にクライアントリクエストを上流バックエンドサーバーに転送します。このページでは、ホストルーティング、負荷分散、プロキシ設定について説明します。

## ホスト設定

保護する各ドメインには、受信リクエストを上流バックエンドにマッピングするホストエントリが必要です。ホストは3つの方法で設定できます：

### TOMLコンフィグファイル経由

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### 管理UI経由

1. サイドバーの**ホスト**に移動
2. **ホストを追加**をクリック
3. ホストの詳細を入力
4. **保存**をクリック

### REST API経由

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## ホストフィールド

| フィールド | タイプ | 必須 | 説明 |
|-------|------|----------|-------------|
| `host` | `string` | はい | マッチするドメイン名（例：`example.com`） |
| `port` | `integer` | はい | リッスンするポート（通常`80`または`443`） |
| `remote_host` | `string` | はい | 上流バックエンドIPまたはホスト名 |
| `remote_port` | `integer` | はい | 上流バックエンドポート |
| `ssl` | `boolean` | いいえ | 上流がHTTPSを使用するか（デフォルト：`false`） |
| `guard_status` | `boolean` | いいえ | このホストのWAF保護を有効化（デフォルト：`true`） |

## 負荷分散

PRX-WAFは重み付きラウンドロビン負荷分散を使用して上流バックエンド全体にトラフィックを分散します。ホストに複数のバックエンドが設定されている場合、トラフィックは重みに比例して分配されます。

::: info
ホストごとの複数の上流バックエンドは管理UIまたはAPIで設定できます。TOMLコンフィグファイルは単一バックエンドのホストエントリをサポートします。
:::

## リクエストヘッダー

PRX-WAFは転送リクエストに標準プロキシヘッダーを自動的に追加します：

| ヘッダー | 値 |
|--------|-------|
| `X-Real-IP` | クライアントのオリジナルIPアドレス |
| `X-Forwarded-For` | クライアントIP（既存のチェーンに追加） |
| `X-Forwarded-Proto` | `http`または`https` |
| `X-Forwarded-Host` | オリジナルのHostヘッダー値 |

## リクエストボディサイズ制限

最大リクエストボディサイズはセキュリティ設定で制御されます：

```toml
[security]
max_request_body_bytes = 10485760  # 10 MB
```

この制限を超えるリクエストはWAFパイプラインに到達する前に413 Payload Too Largeレスポンスで拒否されます。

## ホストの管理

### すべてのホストを一覧表示

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### ホストを更新

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### ホストを削除

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## IPベースのルール

PRX-WAFは検出パイプラインのフェーズ1〜4で評価されるIPベースのアローおよびブロックルールをサポートします：

```bash
# Add an IP allowlist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Add an IP blocklist rule
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## 次のステップ

- [SSL/TLS](./ssl-tls) -- Let's EncryptでHTTPSを有効化する
- [ゲートウェイ概要](./index) -- レスポンスキャッシングとリバーストンネル
- [設定リファレンス](../configuration/reference) -- すべてのプロキシ設定キー
