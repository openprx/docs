---
title: Telegram
description: Bot API を使用して PRX を Telegram に接続
---

# Telegram

> 公式 Bot API を使用して PRX を Telegram に接続します。DM、グループ、ストリーミングレスポンス、メディア添付に対応。

## 前提条件

- Telegram アカウント
- [@BotFather](https://t.me/BotFather) から取得したボットトークン
- 許可するユーザーの Telegram ユーザー ID またはユーザー名

## クイックセットアップ

### 1. ボットの作成

1. Telegram を開き、[@BotFather](https://t.me/BotFather) にメッセージを送信
2. `/newbot` を送信し、プロンプトに従ってボットに名前を付ける
3. ボットトークンをコピー（形式: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`）

### 2. 設定

PRX 設定ファイルに以下を追加：

```toml
[channels_config.telegram]
bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
allowed_users = ["123456789", "your_username"]
```

`allowed_users` を空のままにすると、PRX は**ペアリングモード**に入り、ワンタイムバインドコードを生成します。Telegram アカウントから `/bind <code>` を送信してペアリングします。

### 3. 検証

```bash
prx channel doctor telegram
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `bot_token` | `String` | *必須* | @BotFather からの Telegram Bot API トークン |
| `allowed_users` | `[String]` | `[]` | Telegram ユーザー ID またはユーザー名。空 = ペアリングモード。`"*"` = すべて許可 |
| `stream_mode` | `String` | `"none"` | ストリーミングモード: `"none"`, `"edit"`, `"typing"`。edit モードはレスポンスメッセージを段階的に更新 |
| `draft_update_interval_ms` | `u64` | `500` | レート制限回避のためのドラフトメッセージ編集の最小間隔（ms） |
| `interrupt_on_new_message` | `bool` | `false` | true の場合、同じ送信者からの新しいメッセージで処理中のリクエストをキャンセル |
| `mention_only` | `bool` | `false` | true の場合、グループでは @メンションにのみ応答。DM は常に処理 |
| `ack_reactions` | `bool` | *継承* | グローバル `ack_reactions` 設定のオーバーライド。未設定の場合は `[channels_config].ack_reactions` にフォールバック |

## 機能

- **ダイレクトメッセージとグループチャット** -- DM とグループ会話に応答
- **ストリーミングレスポンス** -- 段階的なメッセージ編集で生成中のレスポンスを表示
- **ペアリングモード** -- 許可ユーザーが未設定の場合のセキュアなワンタイムコードバインディング
- **メディア添付** -- ドキュメント、写真、キャプションを処理
- **長文メッセージ分割** -- Telegram の 4096 文字制限を超えるレスポンスを単語境界で自動分割
- **確認リアクション** -- 受信確認のために受信メッセージにリアクション
- **音声文字起こし** -- STT 設定時にボイスメッセージを文字起こし

## 制限事項

- Telegram はテキストメッセージを 4,096 文字に制限（PRX は長いメッセージを自動分割）
- Bot API ポーリングは Webhook モードと比較してわずかなレイテンシあり
- ボットは会話を開始できない；ユーザーが先にボットにメッセージを送信する必要がある
- Bot API 経由のファイルアップロードは 50 MB に制限

## トラブルシューティング

### ボットがメッセージに応答しない
- `prx channel doctor telegram` でボットトークンが正しいか確認
- 送信者のユーザー ID またはユーザー名が `allowed_users` に含まれているか確認
- `allowed_users` が空の場合、まず `/bind <code>` でペアリング

### ストリーミング時のレート制限エラー
- `draft_update_interval_ms` を増加（例: `1000` 以上に）
- Telegram はチャットごとにメッセージ編集のレート制限を適用

### ボットが DM では応答するがグループでは応答しない
- `mention_only` が `false` に設定されていることを確認するか、ボットを @メンション
- BotFather で「Group Privacy」モードを無効にして、ボットがすべてのグループメッセージを参照できるように設定
