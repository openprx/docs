---
title: WhatsApp (Cloud API)
description: Meta Business Cloud API を使用して PRX を WhatsApp に接続
---

# WhatsApp (Cloud API)

> Meta Business Cloud API を使用した Webhook ベースのメッセージングで PRX を WhatsApp Business プラットフォームに接続します。

## 前提条件

- [Meta Business アカウント](https://business.facebook.com/)
- [Meta Developer Portal](https://developers.facebook.com/) でセットアップした WhatsApp Business API アプリケーション
- WhatsApp Business API からの電話番号 ID とアクセストークン
- Webhook 用の公開アクセス可能な HTTPS エンドポイント

## クイックセットアップ

### 1. WhatsApp Business API のセットアップ

1. [Meta Developer Portal](https://developers.facebook.com/) でアプリを作成
2. アプリに「WhatsApp」製品を追加
3. 「WhatsApp > API Setup」で **Phone Number ID** をメモし、**Permanent Access Token** を生成

### 2. PRX の設定

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. Webhook のセットアップ

1. Meta Developer Portal で「WhatsApp > Configuration」に移動
2. Webhook URL を `https://your-domain.com/whatsapp` に設定
3. PRX で設定した同じ `verify_token` を入力
4. `messages` Webhook フィールドをサブスクライブ

### 4. 検証

```bash
prx channel doctor whatsapp
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `access_token` | `String` | *必須* | Meta Business API からの永続アクセストークン |
| `phone_number_id` | `String` | *必須* | Meta Business API からの電話番号 ID。このフィールドの存在で Cloud API モードが選択される |
| `verify_token` | `String` | *必須* | Webhook 検証ハンドシェイク用の共有シークレット |
| `app_secret` | `String` | `null` | Webhook 署名検証（HMAC-SHA256）用のアプリシークレット。`ZEROCLAW_WHATSAPP_APP_SECRET` 環境変数でも設定可能 |
| `allowed_numbers` | `[String]` | `[]` | E.164 形式の許可電話番号（例: `"+1234567890"`）。`"*"` = すべて許可 |

## 機能

- **Webhook ベースメッセージング** -- Meta Webhook プッシュ通知でメッセージを受信
- **E.164 電話番号フィルタリング** -- 特定の電話番号へのアクセスを制限
- **HTTPS 強制** -- 非 HTTPS URL での データ送信を拒否
- **Webhook 署名検証** -- `app_secret` によるオプションの HMAC-SHA256 検証
- **テキストとメディアメッセージ** -- テキスト、画像、その他のメディアタイプを処理

## 制限事項

- Webhook 配信のために公開アクセス可能な HTTPS エンドポイントが必要
- Meta の Cloud API にはビジネスティアに基づくレート制限あり
- 24 時間メッセージングウィンドウ: ユーザーの最後のメッセージから 24 時間以内にのみ返信可能（メッセージテンプレートを使用する場合を除く）
- 許可リストの電話番号は E.164 形式である必要あり

## トラブルシューティング

### Webhook 検証が失敗する
- PRX 設定の `verify_token` が Meta Developer Portal で入力したものと完全に一致することを確認
- Webhook エンドポイントは `hub.challenge` パラメータ付きの GET リクエストに応答する必要あり

### メッセージが受信されない
- Webhook サブスクリプションに `messages` フィールドが含まれていることを確認
- Webhook URL が HTTPS 経由で公開アクセス可能であることを確認
- Meta Developer Portal で Webhook 配信ログを確認

### 「Refusing to transmit over non-HTTPS」エラー
- すべての WhatsApp Cloud API 通信には HTTPS が必要
- PRX ゲートウェイが TLS 終端プロキシ（Caddy、SSL 付き Nginx など）の背後にあることを確認

::: tip WhatsApp Web モード
Meta Business API のセットアップが不要なネイティブ WhatsApp Web クライアントについては、[WhatsApp Web](./whatsapp-web) を参照してください。
:::
