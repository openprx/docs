---
title: prx channel
description: メッセージングチャネル接続の管理 -- 一覧、追加、削除、起動、診断。
---

# prx channel

PRX が接続するメッセージングチャネルを管理します。チャネルは、メッセージングプラットフォーム（Telegram、Discord、Slack など）と PRX エージェントランタイムの間の橋渡しです。

## 使い方

```bash
prx channel <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx channel list`

設定済みのすべてのチャネルとその現在のステータスを一覧表示します。

```bash
prx channel list [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | JSON で出力 |
| `--verbose` | `-v` | `false` | 詳細な接続情報を表示 |

**出力例：**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

新しいチャネル設定を対話的またはフラグで追加します。

```bash
prx channel add [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--type` | `-t` | | チャネルタイプ（例: `telegram`, `discord`, `slack`） |
| `--name` | `-n` | 自動生成 | チャネルの表示名 |
| `--token` | | | ボットトークンまたは API キー |
| `--enabled` | | `true` | チャネルを直ちに有効化 |
| `--interactive` | `-i` | `true` | 対話型ウィザードを使用 |

```bash
# 対話型モード（ガイド付きプロンプト）
prx channel add

# フラグによる非対話型
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

チャネル設定を削除します。

```bash
prx channel remove <NAME> [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--force` | `-f` | `false` | 確認プロンプトをスキップ |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

デーモンを再起動せずに特定のチャネルを起動（または再起動）します。

```bash
prx channel start <NAME>
```

```bash
# エラーが発生したチャネルを再起動
prx channel start slack-team
```

このコマンドは実行中のデーモンに制御メッセージを送信します。このコマンドが機能するにはデーモンが実行中である必要があります。

### `prx channel doctor`

チャネル接続の診断を実行します。トークンの有効性、ネットワーク接続、Webhook URL、パーミッションをチェックします。

```bash
prx channel doctor [NAME]
```

`NAME` を省略すると、すべてのチャネルがチェックされます。

```bash
# すべてのチャネルをチェック
prx channel doctor

# 特定のチャネルをチェック
prx channel doctor telegram-main
```

**出力例：**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## 使用例

```bash
# 完全なワークフロー: 追加、検証、起動
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# スクリプト用に JSON でチャネルを一覧
prx channel list --json | jq '.[] | select(.status == "error")'
```

## 関連ドキュメント

- [チャネルの概要](/ja/prx/channels/) -- 詳細なチャネルドキュメント
- [prx daemon](./daemon) -- チャネル接続を実行するデーモン
- [prx doctor](./doctor) -- チャネルを含む完全なシステム診断
