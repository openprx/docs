---
title: Slack
description: Bot API と Socket Mode を使用して PRX を Slack に接続
---

# Slack

> OAuth トークンを使用したボット、リアルタイムイベント用の Socket Mode、スレッド会話サポートにより PRX を Slack に接続します。

## 前提条件

- アプリをインストールする権限を持つ Slack ワークスペース
- [api.slack.com/apps](https://api.slack.com/apps) で作成した Slack アプリ
- ボットトークン（`xoxb-...`）、およびオプションで Socket Mode 用のアプリレベルトークン（`xapp-...`）

## クイックセットアップ

### 1. Slack アプリの作成

1. [api.slack.com/apps](https://api.slack.com/apps) にアクセスし、「Create New App」をクリック
2. 「From scratch」を選択し、ワークスペースを選択
3. 「OAuth & Permissions」で以下のボットスコープを追加：
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `files:read`, `files:write`, `reactions:write`, `users:read`
4. ワークスペースにアプリをインストールし、**Bot User OAuth Token**（`xoxb-...`）をコピー

### 2. Socket Mode の有効化（推奨）

1. 「Socket Mode」で有効化し、`connections:write` スコープでアプリレベルトークン（`xapp-...`）を生成
2. 「Event Subscriptions」で以下をサブスクライブ: `message.channels`, `message.groups`, `message.im`, `message.mpim`

### 3. 設定

```toml
[channels_config.slack]
bot_token = "xoxb-your-bot-token-here"
app_token = "xapp-your-app-token-here"
allowed_users = ["U01ABCDEF"]
```

### 4. 検証

```bash
prx channel doctor slack
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `bot_token` | `String` | *必須* | Slack ボット OAuth トークン（`xoxb-...`） |
| `app_token` | `String` | `null` | Socket Mode 用のアプリレベルトークン（`xapp-...`）。未設定の場合はポーリングにフォールバック |
| `channel_id` | `String` | `null` | 単一チャネルに制限。省略または `"*"` ですべてのチャネルをリッスン |
| `allowed_users` | `[String]` | `[]` | Slack ユーザー ID。空 = すべて拒否。`"*"` = すべて許可 |
| `interrupt_on_new_message` | `bool` | `false` | true の場合、同じ送信者からの新しいメッセージで処理中のリクエストをキャンセル |
| `thread_replies` | `bool` | `true` | true の場合、元のスレッド内で返信。false の場合、チャネルルートに返信 |
| `mention_only` | `bool` | `false` | true の場合、@メンションにのみ応答。DM は常に処理 |

## 機能

- **Socket Mode** -- パブリック URL なしでリアルタイムイベント配信（`app_token` が必要）
- **スレッド返信** -- 元のスレッド内で自動的に返信
- **ファイル添付** -- テキストファイルをダウンロードしてインライン化、5 MB までの画像を処理
- **ユーザー表示名** -- Slack ユーザー ID をキャッシュ付き（6 時間 TTL）で表示名に解決
- **マルチチャネルサポート** -- 複数チャネルをリッスンまたは単一に制限
- **入力中インジケーター** -- レスポンス生成中に入力中ステータスを表示
- **中断サポート** -- ユーザーがフォローアップを送信した場合に処理中のリクエストをキャンセル

## 制限事項

- Slack メッセージは 40,000 文字に制限（まれに問題になる）
- ファイルダウンロードはテキスト 256 KB、画像 5 MB に制限
- メッセージあたり最大 8 ファイル添付を処理
- Socket Mode にはアプリレベルトークンの `connections:write` スコープが必要
- Socket Mode なし（`app_token`）の場合、高レイテンシのポーリングにフォールバック

## トラブルシューティング

### ボットがメッセージを受信しない
- Socket Mode が有効で `app_token` が正しいことを確認
- 「Event Subscriptions」に必要な `message.*` イベントが含まれていることを確認
- ボットがチャネルに招待されていることを確認（`/invite @botname`）

### 返信がスレッドではなくチャネルに送信される
- `thread_replies` が `false` に設定されていないことを確認
- スレッド返信には元のメッセージに `thread_ts` が必要

### ファイル添付が処理されない
- ボットに `files:read` スコープがあることを確認
- `text/*` と一般的な画像 MIME タイプのみサポート
- サイズ制限を超えるファイルは無視される
