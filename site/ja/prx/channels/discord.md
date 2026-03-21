---
title: Discord
description: ボットアプリケーションを使用して PRX を Discord に接続
---

# Discord

> ボットアプリケーションと Gateway WebSocket を使用して PRX を Discord に接続し、サーバーと DM でのリアルタイムメッセージングを実現します。

## 前提条件

- Discord アカウント
- [Developer Portal](https://discord.com/developers/applications) でボットユーザーを作成した Discord アプリケーション
- 適切なパーミッションでサーバーに招待されたボット

## クイックセットアップ

### 1. ボットアプリケーションの作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. 「New Application」をクリックして名前を付ける
3. 「Bot」セクションに移動して「Add Bot」をクリック
4. ボットトークンをコピー
5. 「Privileged Gateway Intents」で **Message Content Intent** を有効化

### 2. ボットの招待

「OAuth2 > URL Generator」で招待 URL を生成：
- スコープ: `bot`
- パーミッション: `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`

### 3. 設定

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. 検証

```bash
prx channel doctor discord
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `bot_token` | `String` | *必須* | Developer Portal からの Discord ボットトークン |
| `guild_id` | `String` | `null` | ボットを単一のギルド（サーバー）に制限するオプションの ID |
| `allowed_users` | `[String]` | `[]` | Discord ユーザー ID。空 = すべて拒否。`"*"` = すべて許可 |
| `listen_to_bots` | `bool` | `false` | true の場合、他のボットからのメッセージを処理（自身のメッセージは常に無視） |
| `mention_only` | `bool` | `false` | true の場合、ボットを @メンションしたメッセージにのみ応答 |

## 機能

- **Gateway WebSocket** -- Discord の Gateway API によるリアルタイムメッセージ配信
- **サーバーと DM サポート** -- ギルドチャネルとダイレクトメッセージで応答
- **テキスト添付処理** -- `text/*` 添付ファイルを自動取得しインライン化
- **ギルド制限** -- `guild_id` で単一サーバーにボットをオプションで制限
- **ボット間通信** -- マルチボットワークフロー用に `listen_to_bots` を有効化
- **入力中インジケーター** -- レスポンス生成中に入力中ステータスを表示

## 制限事項

- Discord メッセージは 2,000 文字に制限（PRX は長いレスポンスを自動分割）
- `text/*` MIME タイプの添付ファイルのみ取得・インライン化、他のファイルタイプはスキップ
- ボットがメッセージテキストを読むには「Message Content Intent」を有効にする必要あり
- Discord の Gateway への安定した WebSocket 接続が必要

## トラブルシューティング

### ボットがオンラインだが応答しない
- Developer Portal の Bot 設定で「Message Content Intent」が有効になっていることを確認
- 送信者の Discord ユーザー ID が `allowed_users` に含まれていることを確認
- チャネルでボットが `Send Messages` と `Read Message History` パーミッションを持っていることを確認

### ボットが一部のチャネルでのみ動作する
- `guild_id` が設定されている場合、ボットはその特定のサーバーでのみ応答
- 各チャネルで正しいパーミッションでボットが招待されていることを確認

### 他のボットからのメッセージが無視される
- 他のボットアカウントからのメッセージを処理するには `listen_to_bots = true` に設定
- ボットはフィードバックループ防止のため自身のメッセージは常に無視
