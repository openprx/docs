---
title: Nextcloud Talk
description: OCS API 経由で PRX を Nextcloud Talk に接続
---

# Nextcloud Talk

> OCS API と Webhook ベースのメッセージ配信を使用して PRX を Nextcloud Talk に接続し、セルフホスト型チームメッセージングを実現します。

## 前提条件

- Talk アプリが有効な Nextcloud インスタンス（バージョン 25 以降推奨）
- OCS API 認証用のボットアプリトークン
- 受信メッセージ配信用の Webhook 設定

## クイックセットアップ

### 1. ボットアプリトークンの作成

Nextcloud でアプリパスワードを生成:
1. **設定 > セキュリティ > デバイスとセッション** に移動
2. 説明的な名前（例: 「PRX Bot」）で新しいアプリパスワードを作成
3. 生成されたトークンをコピー

または、Nextcloud Talk Bot API（Nextcloud 27 以降）の場合:
1. `occ` を使用してボットを登録: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

### 2. 設定

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
allowed_users = ["admin", "alice"]
```

### 3. Webhook の設定

PRX のゲートウェイエンドポイントに Webhook イベントを送信するよう Nextcloud Talk ボットを設定:

```
POST https://your-prx-domain.com/nextcloud-talk
```

### 4. 検証

```bash
prx channel doctor nextcloud_talk
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `base_url` | `String` | *必須* | Nextcloud ベース URL（例: `"https://cloud.example.com"`） |
| `app_token` | `String` | *必須* | OCS API Bearer 認証用のボットアプリトークン |
| `webhook_secret` | `String` | `null` | HMAC-SHA256 Webhook 署名検証用の共有シークレット。`ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` 環境変数でも設定可能 |
| `allowed_users` | `[String]` | `[]` | 許可する Nextcloud アクター ID。空 = すべて拒否。`"*"` = すべて許可 |

## 機能

- **Webhook ベースの配信** -- Nextcloud Talk からの HTTP Webhook プッシュでメッセージを受信
- **OCS API 返信** -- Nextcloud Talk OCS REST API を通じてレスポンスを送信
- **HMAC-SHA256 検証** -- `webhook_secret` によるオプションの Webhook 署名検証
- **複数のペイロード形式** -- レガシー/カスタム形式と Activity Streams 2.0 形式（Nextcloud Talk ボット Webhook）の両方をサポート
- **セルフホスト** -- 任意の Nextcloud インスタンスで動作し、すべてのデータを自社インフラに保持

## 制限事項

- Webhook 配信にはパブリックにアクセス可能な HTTPS エンドポイントが必要（またはリバースプロキシ）
- Nextcloud Talk ボット API は Nextcloud 27 以降で利用可能。古いバージョンではカスタム Webhook 設定が必要
- ボットがメッセージを受信するには Talk ルームに登録されている必要あり
- ファイルおよびメディア添付ファイルの処理は現在サポートされていない
- ミリ秒タイムスタンプを使用する Webhook ペイロードは自動的に秒に正規化

## トラブルシューティング

### Webhook イベントが受信されない
- Webhook URL がパブリックにアクセス可能で `https://your-domain/nextcloud-talk` を指していることを確認
- ボットが Talk ルームに登録されていることを確認
- Nextcloud サーバーログで Webhook 配信エラーを確認

### 署名検証が失敗する
- `webhook_secret` がボット登録時に使用したシークレットと一致していることを確認
- シークレットは設定ファイルまたは `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` 環境変数で設定可能

### 返信が投稿されない
- `base_url` が正しく、PRX サーバーからアクセス可能であることを確認
- `app_token` がルームでメッセージを投稿する権限を持っていることを確認
- OCS API レスポンスで認証または権限エラーを確認
