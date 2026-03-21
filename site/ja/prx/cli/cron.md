---
title: prx cron
description: PRX デーモン上で実行されるスケジュール済み cron タスクの管理。
---

# prx cron

PRX cron スケジューラで実行されるスケジュール済みタスクを管理します。cron タスクは、定義されたスケジュールに基づいて LLM プロンプト、シェルコマンド、ツール呼び出しを実行できます。

## 使い方

```bash
prx cron <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx cron list`

設定済みのすべての cron タスクとそのステータスを一覧表示します。

```bash
prx cron list [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | JSON で出力 |
| `--verbose` | `-v` | `false` | スケジュール式を含む完全なタスク詳細を表示 |

**出力例：**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

新しい cron タスクを追加します。

```bash
prx cron add [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--name` | `-n` | 必須 | タスク名 |
| `--schedule` | `-s` | 必須 | cron 式（5 または 6 フィールド） |
| `--prompt` | `-p` | | 実行する LLM プロンプト |
| `--command` | `-c` | | 実行するシェルコマンド |
| `--channel` | | | 出力を送信するチャネル |
| `--provider` | `-P` | 設定のデフォルト | プロンプトタスク用の LLM プロバイダー |
| `--model` | `-m` | プロバイダーのデフォルト | プロンプトタスク用のモデル |
| `--enabled` | | `true` | タスクを直ちに有効化 |

`--prompt` または `--command` のいずれかを指定する必要があります。

```bash
# 日次サマリーをスケジュール
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# バックアップコマンドをスケジュール
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# 毎週月曜日午前 10 時にウィークリーレポート
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

cron タスクを ID または名前で削除します。

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--force` | `-f` | `false` | 確認プロンプトをスキップ |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

cron タスクを一時停止します。タスクは設定のまま残りますが、再開するまで実行されません。

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

一時停止した cron タスクを再開します。

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## cron 式のフォーマット

PRX は標準的な 5 フィールド cron 式を使用します：

```
 ┌───────── 分 (0-59)
 │ ┌───────── 時 (0-23)
 │ │ ┌───────── 日 (1-31)
 │ │ │ ┌───────── 月 (1-12)
 │ │ │ │ ┌───────── 曜日 (0-7, 0 と 7 = 日曜日)
 │ │ │ │ │
 * * * * *
```

一般的な例：

| 式 | 説明 |
|------------|-------------|
| `0 9 * * *` | 毎日午前 9:00 |
| `*/15 * * * *` | 15 分ごと |
| `0 */6 * * *` | 6 時間ごと |
| `0 10 * * 1` | 毎週月曜日午前 10:00 |
| `0 0 1 * *` | 毎月 1 日の午前 0 時 |

## 関連ドキュメント

- [スケジューリングの概要](/ja/prx/cron/) -- cron アーキテクチャとハートビート
- [cron タスク](/ja/prx/cron/tasks) -- タスクの種類と実行の詳細
- [prx daemon](./daemon) -- cron スケジューラを実行するデーモン
