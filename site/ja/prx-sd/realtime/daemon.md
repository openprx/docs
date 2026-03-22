---
title: デーモンプロセス
description: 自動シグネチャ更新と持続的なファイル監視でPRX-SDをバックグラウンドデーモンとして実行します。
---

# デーモンプロセス

`sd daemon`コマンドはPRX-SDをリアルタイムファイル監視と自動シグネチャ更新を組み合わせた長時間実行のバックグラウンドプロセスとして起動します。これは継続的な保護を必要とするサーバーとワークステーションでPRX-SDを実行する推奨方法です。

## 使い方

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### サブコマンド

| サブコマンド | 説明 |
|------------|-------------|
| `start` | デーモンを起動（サブコマンドなしのデフォルト） |
| `stop` | 実行中のデーモンを停止 |
| `restart` | デーモンを停止して再起動 |
| `status` | デーモンのステータスと統計を表示 |

## オプション（start）

| フラグ | ショート | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--watch` | `-w` | `/home,/tmp` | 監視するパスのカンマ区切りリスト |
| `--update-hours` | `-u` | `6` | 自動シグネチャ更新間隔（時間） |
| `--no-update` | | `false` | 自動シグネチャ更新を無効化 |
| `--block` | `-b` | `false` | ブロックモードを有効化（Linux fanotify） |
| `--auto-quarantine` | `-q` | `false` | 脅威を自動的に隔離 |
| `--pid-file` | | `~/.prx-sd/sd.pid` | PIDファイルの場所 |
| `--log-file` | | `~/.prx-sd/daemon.log` | ログファイルの場所 |
| `--log-level` | `-l` | `info` | ログの詳細度：`trace`、`debug`、`info`、`warn`、`error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | 設定ファイルへのパス |

## デーモンが管理するもの

起動時、`sd daemon`は2つのサブシステムを立ち上げます：

1. **ファイルモニター** -- 設定されたパスのファイルシステムイベントを監視し、新しいまたは変更されたファイルをスキャンします。同じパスで`sd monitor`を実行するのと同等です。
2. **更新スケジューラー** -- 定期的に新しい脅威シグネチャ（ハッシュデータベース、YARAルール、IOCフィード）を確認してダウンロードします。設定された間隔で`sd update`を実行するのと同等です。

## デフォルト監視パス

`--watch`が指定されていない場合、デーモンは以下を監視します：

| プラットフォーム | デフォルトパス |
|----------|--------------|
| Linux | `/home`、`/tmp` |
| macOS | `/Users`、`/tmp`、`/private/tmp` |
| Windows | `C:\Users`、`C:\Windows\Temp` |

設定ファイルまたは`--watch`でこれらのデフォルトを上書き：

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## ステータスの確認

`sd daemon status`（または短縮形の`sd status`）を使用してデーモンの状態を表示：

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## systemd統合（Linux）

自動起動のためのsystemdサービスを作成：

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# セキュリティ強化
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
デーモンはfanotifyブロックモードを使用するためにrootが必要です。非ブロック監視の場合、監視対象パスへの読み取りアクセスを持つ非特権ユーザーとして実行できます。
:::

## launchd統合（macOS）

`/Library/LaunchDaemons/com.openprx.sd.plist`にlaunchデーモンplistを作成：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## シグナル

| シグナル | 動作 |
|--------|----------|
| `SIGHUP` | 完全な再起動なしに設定をリロードして監視を再起動 |
| `SIGTERM` | グレースフルシャットダウン -- 現在のスキャンを終了してログをフラッシュ |
| `SIGINT` | `SIGTERM`と同じ |
| `SIGUSR1` | 即時シグネチャ更新をトリガー |

```bash
# 即時更新を強制
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## 例

```bash
# デフォルトでデーモンを起動
sd daemon start

# カスタム監視パスと4時間更新サイクルで起動
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# ブロックモードと自動隔離で起動
sudo sd daemon start --block --auto-quarantine

# デーモンステータスを確認
sd status

# デーモンを再起動
sd daemon restart

# デーモンを停止
sd daemon stop
```

::: warning
デーモンを停止するとすべてのリアルタイム保護が無効になります。デーモンが停止している間に発生したファイルシステムイベントは遡及的にスキャンされません。
:::

## 次のステップ

- [ファイル監視](./monitor) -- 詳細な監視設定
- [ランサムウェア保護](./ransomware) -- 動作的ランサムウェア検出
- [シグネチャの更新](/ja/prx-sd/signatures/update) -- 手動シグネチャ更新
- [Webhookアラート](/ja/prx-sd/alerts/webhook) -- 脅威が見つかったときに通知を受け取る
