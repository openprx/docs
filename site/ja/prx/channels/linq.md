---
title: LINQ
description: Linq Partner API 経由で PRX を iMessage、RCS、SMS に接続
---

# LINQ

> Linq Partner V3 API を通じて PRX を iMessage、RCS、SMS メッセージングに接続し、マルチプロトコルモバイルメッセージングを実現します。

## 前提条件

- API アクセス付きの [Linq](https://linqapp.com) パートナーアカウント
- Linq API トークン
- Linq で割り当てられたメッセージ送信用の電話番号

## クイックセットアップ

### 1. API 認証情報の取得

1. [linqapp.com](https://linqapp.com) で Linq パートナーアカウントに登録
2. パートナーダッシュボードから **API トークン** を取得
3. アカウントに割り当てられた送信用の **電話番号** を確認

### 2. 設定

```toml
[channels_config.linq]
api_token = "your-linq-api-token"
from_phone = "+15551234567"
allowed_senders = ["+1987654321"]
```

### 3. Webhook の設定

PRX のゲートウェイエンドポイントに Webhook イベントを送信するよう Linq を設定:

```
POST https://your-prx-domain.com/linq
```

### 4. 検証

```bash
prx channel doctor linq
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_token` | `String` | *必須* | Linq Partner API トークン（Bearer 認証として使用） |
| `from_phone` | `String` | *必須* | 送信元電話番号（E.164 形式、例: `"+15551234567"`） |
| `signing_secret` | `String` | `null` | HMAC 署名検証用の Webhook 署名シークレット |
| `allowed_senders` | `[String]` | `[]` | E.164 形式の許可送信者電話番号。`"*"` = すべて許可 |

## 機能

- **マルチプロトコルメッセージング** -- 単一の統合で iMessage、RCS、SMS の送受信
- **Webhook ベースの配信** -- Linq からの HTTP Webhook プッシュでメッセージを受信
- **画像サポート** -- 受信画像添付ファイルを処理し、画像マーカーとしてレンダリング
- **送受信検出** -- 自身のアウトバウンドメッセージを自動フィルタ
- **署名検証** -- `signing_secret` によるオプションの HMAC Webhook 署名検証
- **E.164 電話番号フィルタリング** -- 特定の送信者電話番号にアクセスを制限

## 制限事項

- Webhook 配信にはパブリックにアクセス可能な HTTPS エンドポイントが必要
- Linq Partner API アクセスにはパートナーアカウントが必要（コンシューマーアカウントでは不可）
- メッセージ配信は受信者のメッセージングプロトコルに依存（iMessage、RCS、または SMS フォールバック）
- インライン添付ファイルとして処理されるのは画像 MIME タイプのみ。その他のメディアタイプはスキップ
- API レート制限は Linq パートナーティアに依存

## トラブルシューティング

### Webhook イベントが受信されない
- Webhook URL がパブリックにアクセス可能で `https://your-domain/linq` を指していることを確認
- Linq パートナーダッシュボードで Webhook 配信ログとエラーを確認
- PRX ゲートウェイが正しいポートで実行・リッスンしていることを確認

### メッセージは送信されるが返信に失敗する
- `api_token` が有効で期限切れでないことを確認
- `from_phone` が Linq アカウントで有効なプロビジョニング済み電話番号であることを確認
- Linq API レスポンスでエラーの詳細を確認

### ボットが自身のメッセージに返信する
- これは発生しないはず。PRX は `is_from_me` と `direction` フィールドを使用してアウトバウンドメッセージを自動フィルタ
- 発生する場合は、Webhook ペイロード形式が期待される Linq V3 構造に一致しているか確認
