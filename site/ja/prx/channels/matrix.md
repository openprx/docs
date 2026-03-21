---
title: Matrix
description: エンドツーエンド暗号化サポート付きで PRX を Matrix に接続
---

# Matrix

> Client-Server API を使用して PRX を Matrix ネットワークに接続し、オプションのエンドツーエンド暗号化（E2EE）とルームベースのメッセージングをサポートします。

## 前提条件

- Matrix ホームサーバー（例: [matrix.org](https://matrix.org)、またはセルフホストの Synapse/Dendrite）
- アクセストークンを持つホームサーバー上のボットアカウント
- ボットがリッスンするルーム ID
- `channel-matrix` フィーチャーフラグでビルドされた PRX

## クイックセットアップ

### 1. ボットアカウントの作成

ホームサーバーにボット用のアカウントを作成します。Element またはコマンドラインが使用可能:

```bash
# ホームサーバー API に対して curl を使用
curl -X POST "https://matrix.org/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "prx-bot", "password": "secure-password", "auth": {"type": "m.login.dummy"}}'
```

### 2. アクセストークンの取得

```bash
curl -X POST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "prx-bot", "password": "secure-password"}'
```

### 3. ボットをルームに招待

Matrix クライアントから、ボットアカウントを運用するルームに招待します。ルーム ID（形式: `!abc123:matrix.org`）を記録します。

### 4. 設定

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
room_id = "!abc123def456:matrix.org"
allowed_users = ["@alice:matrix.org", "@bob:matrix.org"]
```

### 5. 検証

```bash
prx channel doctor matrix
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `homeserver` | `String` | *必須* | Matrix ホームサーバー URL（例: `"https://matrix.org"`） |
| `access_token` | `String` | *必須* | ボットアカウントの Matrix アクセストークン |
| `user_id` | `String` | `null` | Matrix ユーザー ID（例: `"@bot:matrix.org"`）。セッション復元に使用 |
| `device_id` | `String` | `null` | Matrix デバイス ID。E2EE セッションの継続性に使用 |
| `room_id` | `String` | *必須* | リッスンするルーム ID（例: `"!abc123:matrix.org"`） |
| `allowed_users` | `[String]` | `[]` | 許可する Matrix ユーザー ID。空 = すべて拒否。`"*"` = すべて許可 |

## 機能

- **エンドツーエンド暗号化** -- Vodozemac を使用した matrix-sdk で暗号化ルームをサポート
- **ルームベースのメッセージング** -- 特定の Matrix ルームでリッスンして応答
- **メッセージリアクション** -- 受信確認と完了を示すリアクションをメッセージに付与
- **既読レシート** -- 処理済みメッセージに既読レシートを送信
- **セッション永続化** -- E2EE の継続性のため暗号セッションをローカルに保存し、再起動後も保持
- **ホームサーバー非依存** -- 任意の Matrix ホームサーバー（Synapse、Dendrite、Conduit など）で動作

## 制限事項

- 現在は単一のルーム（`room_id` で設定）でのみリッスン
- コンパイル時に `channel-matrix` フィーチャーフラグが必要
- E2EE キーバックアップとクロスサイニング検証はまだサポートされていない
- メッセージ量の多い大規模ルームではリソース使用量が増加する可能性あり
- ボットがリッスンするにはルームに招待されている必要あり

## トラブルシューティング

### 暗号化ルームでボットが応答しない
- 適切な E2EE セッション管理のため `user_id` と `device_id` が設定されていることを確認
- ローカルの暗号ストアを削除して再起動し、暗号化セッションを再確立
- ボットアカウントがルームメンバーによって検証/信頼されていることを確認

### 「Room not found」エラー
- ルーム ID の形式が正しいことを確認（`!` プレフィックス、`:homeserver` サフィックス）
- ボットがルームに招待されて参加済みであることを確認
- ルームエイリアス（例: `#room:matrix.org`）はサポートされていない。ルーム ID を使用

### アクセストークンが拒否される
- アクセストークンは期限切れの可能性あり。ログイン API で新しいトークンを生成
- トークンが正しいホームサーバーに属していることを確認
