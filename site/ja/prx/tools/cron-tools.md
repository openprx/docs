---
title: cron ツール
description: cron 式と Xin 自律タスクエンジンによるスケジュールタスクの作成、管理、実行のための 9 つのツール。
---

# cron ツール

PRX は、従来の cron ジョブ管理と高度な Xin スケジューリングエンジンにわたる、時間ベースのタスク自動化のための 9 つのツールを提供します。これらのツールにより、エージェントはスケジュールタスクの作成、ジョブ履歴の検査、手動トリガー、定期スケジュールでのバックグラウンド操作のオーケストレーションが可能です。

cron ツールは 2 つのシステムに分かれています: cron 式を使用する標準スケジュールジョブのための **cron サブシステム**と、依存チェーン、条件付き実行、自己進化パイプラインとの統合を備えた高度なタスクスケジューリングのための **Xin エンジン**です。

すべての cron およびスケジューリングツールは `all_tools()` レジストリに登録されており、デーモンが実行中であれば常に利用可能です。

## 設定

### cron システム

```toml
[cron]
enabled = true
timezone = "UTC"           # cron 式のタイムゾーン

# 組み込みスケジュールタスクを定義
[[cron.tasks]]
name = "daily-report"
schedule = "0 9 * * *"     # 毎日 UTC 09:00
action = "agent"
prompt = "Generate a daily summary report and send it to the user."

[[cron.tasks]]
name = "memory-cleanup"
schedule = "0 3 * * *"     # 毎日 UTC 03:00
action = "agent"
prompt = "Run memory hygiene: archive old daily entries and compact core memories."

[[cron.tasks]]
name = "repo-check"
schedule = "*/30 * * * *"  # 30 分ごと
action = "shell"
command = "cd /home/user/project && git fetch --all"
```

### Xin エンジン

```toml
[xin]
enabled = true
interval_minutes = 5            # ティック間隔（分）（最小 1）
max_concurrent = 4              # ティックあたりの最大同時タスク実行数
max_tasks = 128                 # ストア内の最大総タスク数
stale_timeout_minutes = 60      # 実行中タスクが古いとマークされるまでの分数
builtin_tasks = true            # 組み込みシステムタスクの自動登録
evolution_integration = false   # Xin に進化/フィットネスのスケジュールを管理させる
```

## ツールリファレンス

### cron_add

cron 式、コマンドまたはプロンプト、オプションの説明で新しい cron ジョブを追加。

```json
{
  "name": "cron_add",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 2 * * *",
    "action": "shell",
    "command": "tar czf /tmp/workspace-$(date +%Y%m%d).tar.gz /home/user/workspace",
    "description": "Daily workspace backup at 2 AM"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `name` | `string` | はい | -- | cron ジョブの一意な名前 |
| `schedule` | `string` | はい | -- | cron 式（5 フィールド: 分 時 日 月 曜日） |
| `action` | `string` | はい | -- | アクションタイプ: `"shell"`（コマンド実行）または `"agent"`（エージェントプロンプト実行） |
| `command` | `string` | 条件付き | -- | シェルコマンド（`action = "shell"` の場合に必須） |
| `prompt` | `string` | 条件付き | -- | エージェントプロンプト（`action = "agent"` の場合に必須） |
| `description` | `string` | いいえ | -- | 人間可読な説明 |

### cron_list

すべての登録済み cron ジョブをスケジュール、ステータス、次回実行時間とともにリスト。

```json
{
  "name": "cron_list",
  "arguments": {}
}
```

パラメーター不要。すべての cron ジョブのテーブルを返します。

### cron_remove

名前または ID で cron ジョブを削除。

```json
{
  "name": "cron_remove",
  "arguments": {
    "name": "backup-workspace"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `name` | `string` | はい | -- | 削除する cron ジョブの名前または ID |

### cron_update

既存の cron ジョブのスケジュール、コマンド、設定を更新。

```json
{
  "name": "cron_update",
  "arguments": {
    "name": "backup-workspace",
    "schedule": "0 4 * * *",
    "description": "Daily workspace backup at 4 AM (shifted)"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `name` | `string` | はい | -- | 更新する cron ジョブの名前 |
| `schedule` | `string` | いいえ | -- | 新しい cron 式 |
| `command` | `string` | いいえ | -- | 新しいシェルコマンド |
| `prompt` | `string` | いいえ | -- | 新しいエージェントプロンプト |
| `description` | `string` | いいえ | -- | 新しい説明 |

### cron_run

通常のスケジュール外で cron ジョブを即座に手動トリガー。

```json
{
  "name": "cron_run",
  "arguments": {
    "name": "daily-report"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `name` | `string` | はい | -- | トリガーする cron ジョブの名前 |

### cron_runs

cron ジョブ実行の実行履歴とログを表示。タイムスタンプ、ステータス、出力を含む過去の実行を表示。

```json
{
  "name": "cron_runs",
  "arguments": {
    "name": "daily-report",
    "limit": 10
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `name` | `string` | いいえ | -- | ジョブ名でフィルタ。省略時はすべての最近の実行を表示。 |
| `limit` | `integer` | いいえ | `20` | 返す履歴エントリの最大数 |

### schedule

自然言語の時間表現でワンショットまたは繰り返しタスクをスケジュール。生の cron 式より高レベルなインターフェース。

```json
{
  "name": "schedule",
  "arguments": {
    "when": "in 30 minutes",
    "action": "agent",
    "prompt": "Check if the deployment completed and report the status."
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `when` | `string` | はい | -- | 自然言語の時間表現（例: `"in 30 minutes"`、`"tomorrow at 9am"`、`"every Monday at 10:00"`） |
| `action` | `string` | はい | -- | アクションタイプ: `"shell"` または `"agent"` |
| `command` | `string` | 条件付き | -- | シェルコマンド（`"shell"` アクション用） |
| `prompt` | `string` | 条件付き | -- | エージェントプロンプト（`"agent"` アクション用） |

### cron（レガシー）

後方互換性のためのレガシー cron エントリポイント。action 引数に基づいて適切な cron ツールにルーティング。

```json
{
  "name": "cron",
  "arguments": {
    "action": "list"
  }
}
```

### xin

依存チェーンと条件付き実行を備えた高度なタスク自動化のための Xin スケジューリングエンジン。

```json
{
  "name": "xin",
  "arguments": {
    "action": "status"
  }
}
```

| パラメーター | 型 | 必須 | デフォルト | 説明 |
|-----------|------|----------|---------|-------------|
| `action` | `string` | はい | -- | アクション: `"status"`、`"tasks"`、`"run"`、`"pause"`、`"resume"` |

## cron 式のフォーマット

PRX は標準の 5 フィールド cron 式を使用:

```
┌───────────── 分 (0-59)
│ ┌───────────── 時 (0-23)
│ │ ┌───────────── 日 (1-31)
│ │ │ ┌───────────── 月 (1-12)
│ │ │ │ ┌───────────── 曜日 (0-7, 0 と 7 = 日曜)
│ │ │ │ │
* * * * *
```

**例:**

| 式 | 説明 |
|-----------|-------------|
| `0 9 * * *` | 毎日 9:00 AM |
| `*/15 * * * *` | 15 分ごと |
| `0 9 * * 1-5` | 平日の 9:00 AM |
| `0 0 1 * *` | 毎月 1 日の深夜 |
| `30 8,12,18 * * *` | 毎日 8:30、12:30、18:30 |

## Xin エンジン

Xin エンジンは単純な cron タイミングを超えた高度なタスクスケジューラーです:

- **依存チェーン**: タスクは他のタスクの正常完了に依存可能
- **条件付き実行**: 指定された条件が満たされた場合のみタスクを実行
- **組み込みタスク**: `builtin_tasks = true` の場合、システムメンテナンスタスク（ハートビート、メモリハイジーン、ログローテーション）が自動登録
- **進化統合**: `evolution_integration = true` の場合、Xin が自己進化とフィットネスチェックのスケジュールを管理
- **古いタスクの検出**: `stale_timeout_minutes` を超えて実行中のタスクは古いとマークされクリーンアップ可能
- **並行実行**: 複数タスクを並列実行可能、`max_concurrent` で制限

## 使用方法

### CLI cron 管理

```bash
# すべての cron ジョブをリスト
prx cron list

# 新しい cron ジョブを追加
prx cron add --name "check-updates" --schedule "0 */6 * * *" --action agent --prompt "Check for package updates"

# ジョブを手動トリガー
prx cron run daily-report

# 実行履歴を表示
prx cron runs --name daily-report --limit 5

# ジョブを削除
prx cron remove check-updates
```

### Xin ステータス

```bash
# Xin エンジンのステータスを確認
prx xin status

# すべての Xin タスクをリスト
prx xin tasks
```

## セキュリティ

### シェルコマンドのサンドボックス

`action = "shell"` の cron ジョブは `shell` ツールと同じサンドボックスで実行されます。設定されたサンドボックスバックエンド（Landlock、Firejail、Bubblewrap、Docker）がスケジュールされたコマンドに適用されます。

### エージェントプロンプトの安全性

`action = "agent"` の cron ジョブは設定されたプロンプトで新しいエージェントセッションを起動します。エージェントセッションはデーモンのセキュリティポリシー、ツール制限、リソース制限を継承します。

### ポリシーエンジン

cron ツールはセキュリティポリシーエンジンの管理下にあります:

```toml
[security.tool_policy.groups]
automation = "allow"

[security.tool_policy.tools]
cron_add = "supervised"    # 新しいジョブの追加に承認を要求
cron_remove = "supervised" # ジョブの削除に承認を要求
cron_run = "allow"         # 手動トリガーを許可
```

### 監査ログ

すべての cron 操作が監査ログに記録されます: ジョブの作成、変更、削除、手動トリガー、実行結果。

### リソース制限

スケジュールタスクはデーモンのリソース制限を共有します。Xin エンジンの `max_concurrent` 設定により、同時タスクが多すぎることによるリソース枯渇を防ぎます。

## 関連

- [cron システム](/ja/prx/cron/) -- アーキテクチャと組み込みタスク
- [cron ハートビート](/ja/prx/cron/heartbeat) -- ヘルスモニタリング
- [cron タスク](/ja/prx/cron/tasks) -- 組み込みメンテナンスタスク
- [自己進化](/ja/prx/self-evolution/) -- Xin 進化統合
- [シェル実行](/ja/prx/tools/shell) -- シェルベース cron ジョブのサンドボックス
- [設定リファレンス](/ja/prx/config/reference) -- `[cron]` と `[xin]` 設定
- [ツール概要](/ja/prx/tools/) -- 全ツールとレジストリシステム
