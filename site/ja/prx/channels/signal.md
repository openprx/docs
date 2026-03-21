---
title: Signal
description: signal-cli を使用して PRX を Signal に接続
---

# Signal

> signal-cli デーモンの JSON-RPC と SSE API を使用して PRX を Signal に接続し、DM とグループでの暗号化メッセージングを実現します。

## 前提条件

- Signal に登録された電話番号
- [signal-cli](https://github.com/AsamK/signal-cli) がインストールおよび登録済み
- HTTP API を有効にしたデーモンモードで実行中の signal-cli

## クイックセットアップ

### 1. signal-cli のインストールと登録

```bash
# signal-cli をインストール（最新版は https://github.com/AsamK/signal-cli を参照）
# 電話番号を登録
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <verification-code>
```

### 2. signal-cli デーモンの起動

```bash
signal-cli -u +1234567890 daemon --http localhost:8686
```

### 3. 設定

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:8686"
account = "+1234567890"
allowed_from = ["+1987654321", "*"]
```

### 4. 検証

```bash
prx channel doctor signal
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `http_url` | `String` | *必須* | signal-cli HTTP デーモンのベース URL（例: `"http://127.0.0.1:8686"`） |
| `account` | `String` | *必須* | signal-cli アカウントの E.164 電話番号（例: `"+1234567890"`） |
| `group_id` | `String` | `null` | グループでメッセージをフィルタ。`null` = すべて受け入れ（DM とグループ）。`"dm"` = DM のみ。特定のグループ ID = そのグループのみ |
| `allowed_from` | `[String]` | `[]` | E.164 形式の許可送信者電話番号。`"*"` = すべて許可 |
| `ignore_attachments` | `bool` | `false` | 添付ファイルのみ（テキスト本文なし）のメッセージをスキップ |
| `ignore_stories` | `bool` | `false` | 受信ストーリーメッセージをスキップ |

## 機能

- **エンドツーエンド暗号化** -- すべてのメッセージは Signal Protocol で暗号化
- **DM とグループサポート** -- ダイレクトメッセージとグループ会話の両方を処理
- **SSE イベントストリーム** -- リアルタイム配信のため `/api/v1/events` で Server-Sent Events をリッスン
- **JSON-RPC 送信** -- `/api/v1/rpc` で JSON-RPC を使用して返信を送信
- **柔軟なグループフィルタリング** -- すべてのメッセージ、DM のみ、特定のグループを受け入れ可能
- **添付ファイル処理** -- 添付ファイルのみのメッセージをオプションで処理またはスキップ

## 制限事項

- signal-cli を別のデーモンプロセスとして実行する必要あり
- signal-cli は有効な電話番号で登録・認証済みである必要あり
- 1 つの signal-cli インスタンスは 1 つの電話番号をサポート
- グループメッセージの送信には signal-cli アカウントがグループのメンバーである必要あり
- signal-cli は独自のリソース要件を持つ Java アプリケーション

## トラブルシューティング

### signal-cli に接続できない
- signal-cli デーモンが実行中であることを確認: `curl http://127.0.0.1:8686/api/v1/about`
- `http_url` がデーモンのバインドアドレスとポートに一致することを確認
- ファイアウォールルールが接続をブロックしていないことを確認

### グループからのメッセージが無視される
- `group_id` フィルタを確認 -- `"dm"` に設定するとグループメッセージが除外される
- 特定のグループ ID に設定した場合、そのグループからのメッセージのみ受け入れ
- `group_id` を `null`（または省略）にすると、すべてのメッセージを受け入れ

### 添付ファイルのみのメッセージがスキップされる
- `ignore_attachments = true` の場合は期待される動作
- 添付ファイルのみのメッセージを処理するには `ignore_attachments = false` に設定
