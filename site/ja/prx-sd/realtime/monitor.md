---
title: ファイル監視
description: ディスクに現れた脅威を検出するためのsd monitorを使用したリアルタイムファイルシステム監視。
---

# ファイル監視

`sd monitor`コマンドはファイルシステムのアクティビティのためにディレクトリを監視し、新しいまたは変更されたファイルをリアルタイムでスキャンします。これはマルウェアがディスクに到着した瞬間、実行される前に捕捉する主要な方法です。

## 使い方

```bash
sd monitor [OPTIONS] [PATHS...]
```

パスが指定されていない場合、`sd monitor`は現在の作業ディレクトリを監視します。

## オプション

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--recursive` | `-r` | `true` | ディレクトリを再帰的に監視 |
| `--block` | `-b` | `false` | スキャン完了までファイル実行をブロック（Linuxのみ） |
| `--daemon` | `-d` | `false` | バックグラウンドのデーモンプロセスとして実行 |
| `--pid-file` | | | 指定したファイルにPIDを書き込む（`--daemon`を暗示） |
| `--exclude` | `-e` | | 除外するglobパターン（繰り返し可能） |
| `--log-file` | | | stderrの代わりにファイルにログ出力を書き込む |
| `--auto-quarantine` | `-q` | `false` | 検出された脅威を自動的に隔離 |
| `--events` | | すべて | 監視するイベントのカンマ区切りリスト |
| `--json` | | `false` | イベントをJSON行として出力 |

## プラットフォームメカニズム

PRX-SDは各プラットフォームで利用可能な最も有能なファイルシステムAPIを使用します：

| プラットフォーム | API | 機能 |
|----------|-----|-------------|
| **Linux** | fanotify（カーネル5.1以上） | システム全体の監視、実行権限制御、ファイルディスクリプタパススルー |
| **Linux（フォールバック）** | inotify | ディレクトリごとの監視、ブロックサポートなし |
| **macOS** | FSEvents | 低レイテンシの再帰的監視、履歴イベントリプレイ |
| **Windows** | ReadDirectoryChangesW | 完了ポートによるディレクトリごとの非同期監視 |

::: tip
Linuxでは、`sd monitor`はfanotifyを使用するために`CAP_SYS_ADMIN`機能（またはroot）が必要です。利用できない場合は、警告とともにinotifyに自動的にフォールバックします。
:::

## 監視されるイベント

以下のファイルシステムイベントがスキャンをトリガーします：

| イベント | 説明 | プラットフォーム |
|-------|-------------|-----------|
| `Create` | 新しいファイルが作成される | すべて |
| `Modify` | ファイル内容が書き込まれる | すべて |
| `CloseWrite` | 書き込み後にファイルが閉じられる（部分スキャンを回避） | Linux |
| `Delete` | ファイルが削除される | すべて |
| `Rename` | ファイルが名前変更または移動される | すべて |
| `Open` | ファイルが読み取り用に開かれる | Linux（fanotify） |
| `Execute` | ファイルが実行されようとしている | Linux（fanotify） |

`--events`でスキャンをトリガーするイベントをフィルタリング：

```bash
# 新しいファイルと変更のみスキャン
sd monitor --events Create,CloseWrite /home
```

## ブロックモード

Linuxのfanotifyでは、`--block`が`FAN_OPEN_EXEC_PERM`モードを有効にします。このモードではPRX-SDが判定を返すまでカーネルがプロセス実行を一時停止します：

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
ブロックモードは監視されたパス内のすべてのプログラム起動にレイテンシを追加します。`/usr`や`/lib`などのシステム全体のパスではなく、`/tmp`やダウンロードフォルダーなどのリスクの高いディレクトリにのみ使用してください。
:::

ブロックモードで脅威が検出された場合：

1. ファイルのオープン/実行がカーネルによって**拒否**されます
2. イベントが`BLOCKED`判定でログに記録されます
3. `--auto-quarantine`が設定されている場合、ファイルは隔離ボールトに移動されます

## デーモンモード

`--daemon`を使用してモニターをターミナルから切り離す：

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

`SIGTERM`を送信してデーモンを停止：

```bash
kill $(cat /var/run/sd-monitor.pid)
```

またはデーモンマネージャーを通じて実行している場合は`sd daemon stop`を使用します。詳細については[デーモン](./daemon)を参照してください。

## 例

```bash
# homeとtmpディレクトリを監視
sd monitor /home /tmp

# 自動隔離で監視
sd monitor --auto-quarantine /home/downloads

# Linuxでの機密ディレクトリのブロックモード
sudo sd monitor --block --auto-quarantine /tmp

# ビルドアーティファクトとnode_modulesを除外
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# JSON ロギングでデーモンとして実行
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# 特定のイベントのみで監視
sd monitor --events Create,Modify,Rename /var/www
```

## JSON出力

`--json`が有効な場合、各イベントは単一のJSON行を生成します：

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## 次のステップ

- [デーモン](./daemon) -- 管理されたバックグラウンドサービスとして監視を実行
- [ランサムウェア保護](./ransomware) -- 特殊なランサムウェア動作検出
- [隔離管理](/ja/prx-sd/quarantine/) -- 隔離されたファイルの管理
- [脅威対応](/ja/prx-sd/remediation/) -- 自動対応ポリシーの設定
