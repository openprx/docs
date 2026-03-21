---
title: Mattermost
description: REST API 経由で PRX を Mattermost に接続
---

# Mattermost

> REST API v4 を使用して PRX を Mattermost に接続し、このオープンソースのセルフホスト型 Slack 代替でメッセージングを行います。

## 前提条件

- Mattermost サーバー（セルフホストまたはクラウド）
- パーソナルアクセストークンを持つ Mattermost のボットアカウント
- ボットが運用するチャネルにボットが招待済み

## クイックセットアップ

### 1. ボットアカウントの作成

1. **システムコンソール > インテグレーション > ボットアカウント** でボットアカウントを有効化
2. **インテグレーション > ボットアカウント > ボットアカウントの追加** に移動
3. ユーザー名、表示名、ロールを設定
4. 生成された**アクセストークン**をコピー

または、通常のユーザーアカウントを作成し、**プロフィール > セキュリティ > パーソナルアクセストークン** でパーソナルアクセストークンを生成します。

### 2. 設定

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456ghi789"
allowed_users = ["user123456"]
```

### 3. 検証

```bash
prx channel doctor mattermost
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `url` | `String` | *必須* | Mattermost サーバー URL（例: `"https://mattermost.example.com"`） |
| `bot_token` | `String` | *必須* | ボットアクセストークンまたはパーソナルアクセストークン |
| `channel_id` | `String` | `null` | オプション。ボットを単一チャネルに制限するチャネル ID |
| `allowed_users` | `[String]` | `[]` | 許可する Mattermost ユーザー ID。空 = すべて拒否。`"*"` = すべて許可 |
| `thread_replies` | `bool` | `true` | true の場合、元の投稿のスレッドに返信。false の場合、チャネルルートに投稿 |
| `mention_only` | `bool` | `false` | true の場合、ボットをメンションしたメッセージにのみ応答 |

## 機能

- **REST API v4** -- メッセージの送受信に標準 Mattermost API を使用
- **スレッド返信** -- 元のスレッド内に自動的に返信
- **入力中インジケーター** -- レスポンス生成中に入力中ステータスを表示
- **セルフホストフレンドリー** -- 任意の Mattermost デプロイメントで動作、外部依存なし
- **チャネル制限** -- `channel_id` でオプションでボットを単一チャネルに制限
- **メンションフィルタリング** -- 繁忙なチャネルでメンション時のみ応答

## 制限事項

- メッセージ配信に WebSocket ではなくポーリングを使用するため、わずかな遅延が発生
- ボットがメッセージの読み書きを行うにはチャネルのメンバーである必要あり
- ボットアカウントの有効化にはシステム管理者が Mattermost システムコンソールで設定する必要あり
- ファイル添付の処理は現在サポートされていない
- URL の末尾スラッシュは自動的に除去

## トラブルシューティング

### ボットが応答しない
- `url` に末尾スラッシュがないことを確認（自動除去されるが、念のため確認）
- ボットトークンが有効であることを確認: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- ボットがチャネルに追加されていることを確認

### 返信が間違った場所に投稿される
- `thread_replies = true` の場合、元の投稿の `root_id` のスレッドに返信
- 元のメッセージがスレッド内にない場合、新しいスレッドが作成される
- チャネルルートに常に投稿するには `thread_replies = false` を設定

### ボットがチャネルのすべてのメッセージに応答する
- メンション時のみ応答するには `mention_only = true` を設定
- または、`channel_id` で専用チャネルに制限
