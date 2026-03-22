---
title: スケジュールスキャン
description: "定期的な間隔での自動脅威検出のためにsd scheduleで定期スキャンジョブを設定。"
---

# スケジュールスキャン

`sd schedule`コマンドは定義された間隔で実行される定期スキャンジョブを管理します。スケジュールスキャンはリアルタイム監視を補完し、指定されたディレクトリの定期的なフルスキャンを実行して、監視が非アクティブ中に見逃された脅威や導入された脅威を捕捉します。

## 使い方

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### サブコマンド

| サブコマンド | 説明 |
|------------|-------------|
| `add` | 新しいスケジュールスキャンジョブを作成 |
| `remove` | スケジュールスキャンジョブを削除 |
| `list` | すべてのスケジュールスキャンジョブを一覧表示 |
| `status` | 最終実行と次回実行を含むスケジュールジョブの状態を表示 |
| `run` | スケジュールジョブを直ちに手動でトリガー |

## スケジュールスキャンの追加

```bash
sd schedule add <PATH> [OPTIONS]
```

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--frequency` | `-f` | `daily` | スキャン頻度：`hourly`、`4h`、`12h`、`daily`、`weekly` |
| `--name` | `-n` | 自動生成 | このジョブの人間が読める名前 |
| `--recursive` | `-r` | `true` | ディレクトリを再帰的にスキャン |
| `--auto-quarantine` | `-q` | `false` | 検出された脅威を隔離 |
| `--exclude` | `-e` | | 除外するglobパターン（繰り返し可能） |
| `--notify` | | `true` | 検出時にアラートを送信 |
| `--time` | `-t` | ランダム | 優先開始時刻（HH:MM、24時間形式） |
| `--day` | `-d` | `monday` | 週次スキャンの曜日 |

### 頻度オプション

| 頻度 | 間隔 | ユースケース |
|-----------|----------|----------|
| `hourly` | 60分ごと | リスクの高いディレクトリ（アップロード、一時ファイル） |
| `4h` | 4時間ごと | 共有ディレクトリ、Webルート |
| `12h` | 12時間ごと | ユーザーホームディレクトリ |
| `daily` | 24時間ごと | 汎用フルスキャン |
| `weekly` | 7日ごと | リスクの低いアーカイブ、バックアップ検証 |

### 例

```bash
# Daily scan of home directories
sd schedule add /home --frequency daily --name "home-daily"

# Hourly scan of upload directory with auto-quarantine
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# Weekly full scan excluding large media files
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 4-hour scan of temp directories
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# Daily scan at a specific time
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# Weekly scan on Sunday
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## スケジュールスキャンの一覧表示

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## ジョブステータスの確認

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

特定のジョブの詳細ステータスを取得：

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## スケジュールスキャンの削除

```bash
# Remove by name
sd schedule remove home-daily

# Remove all scheduled scans
sd schedule remove --all
```

## スキャンの手動トリガー

次の間隔を待たずに即座にスケジュールジョブを実行：

```bash
sd schedule run home-daily
```

これにより、すべての設定されたオプション（隔離、除外、通知）でスキャンが実行され、ジョブの最終実行タイムスタンプが更新されます。

## スケジューリングの仕組み

PRX-SDはシステムのcronではなく内部スケジューラーを使用します。スケジューラーはデーモンプロセスの一部として実行されます：

```
sd daemon start
  └── Scheduler thread
        ├── Check job intervals every 60 seconds
        ├── Launch scan jobs when interval elapsed
        ├── Serialize results to ~/.prx-sd/schedule/
        └── Send notifications on completion
```

::: warning
スケジュールスキャンはデーモンがアクティブな場合のみ実行されます。デーモンが停止されると、次回のデーモン起動時に見逃したスキャンが実行されます。継続的なスケジューリングを確保するために`sd daemon start`を使用してください。
:::

## 設定ファイル

スケジュールジョブは`~/.prx-sd/schedule.json`に永続化され、`config.toml`でも定義できます：

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## スキャンレポート

各スケジュールスキャンは`~/.prx-sd/reports/`にレポートを生成します：

```bash
# View the latest report for a job
sd schedule report home-daily

# Export report as JSON
sd schedule report home-daily --json > report.json

# List all reports
sd schedule report --list
```

::: tip
スケジュールスキャンとメールアラートを組み合わせると、自動レポートを受信できます。各スケジュールスキャン後にサマリーを受け取るには、メールイベントで`scan_completed`を設定してください。
:::

## 次のステップ

- [Webhookアラート](./webhook) -- スケジュールスキャンで脅威が見つかったときに通知を受け取る
- [メールアラート](./email) -- スケジュールスキャンからのメールレポート
- [デーモン](/ja/prx-sd/realtime/daemon) -- スケジュールスキャン実行に必要
- [脅威対応](/ja/prx-sd/remediation/) -- 脅威が見つかったときに何が起こるかを設定
