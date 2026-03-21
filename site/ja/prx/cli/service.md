---
title: prx service
description: PRX をシステムサービス（systemd または OpenRC）としてインストール・管理します。
---

# prx service

PRX をシステムサービスとしてインストール、起動、停止、ステータス確認を行います。systemd（ほとんどの Linux ディストリビューション）と OpenRC（Alpine、Gentoo）の両方をサポートしています。

## 使い方

```bash
prx service <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx service install`

現在の init システム用のサービスユニットファイルを生成してインストールします。

```bash
prx service install [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | サービス用の設定ファイルパス |
| `--user` | `-u` | 現在のユーザー | サービスを実行するユーザー |
| `--group` | `-g` | 現在のグループ | サービスを実行するグループ |
| `--bin-path` | | 自動検出 | `prx` バイナリのパス |
| `--enable` | | `false` | 起動時にサービスを有効化 |
| `--user-service` | | `false` | ユーザーレベルの systemd サービスとしてインストール（sudo 不要） |

```bash
# システムサービスとしてインストール（sudo が必要）
sudo prx service install --user prx --group prx --enable

# ユーザーサービスとしてインストール（sudo 不要）
prx service install --user-service --enable

# カスタム設定パスでインストール
sudo prx service install --config /etc/prx/config.toml --user prx
```

install コマンドの動作：

1. init システムを検出（systemd または OpenRC）
2. 適切なサービスファイルを生成
3. 正しい場所にインストール（`/etc/systemd/system/prx.service` または `/etc/init.d/prx`）
4. オプションで起動時のサービスを有効化

### `prx service start`

PRX サービスを起動します。

```bash
prx service start
```

```bash
# システムサービス
sudo prx service start

# ユーザーサービス
prx service start
```

### `prx service stop`

PRX サービスをグレースフルに停止します。

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

現在のサービスステータスを表示します。

```bash
prx service status [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--json` | `-j` | `false` | JSON で出力 |

**出力例：**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## 生成されるユニットファイル

### systemd

生成される systemd ユニットファイルには本番環境向けのセキュリティ強化ディレクティブが含まれます：

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## ユーザーレベルのサービス

シングルユーザーデプロイメントの場合、systemd ユーザーサービスとしてインストールします。root 権限は不要です：

```bash
prx service install --user-service --enable

# systemctl --user で管理
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## 関連ドキュメント

- [prx daemon](./daemon) -- デーモンの設定とシグナル
- [prx doctor](./doctor) -- サービスヘルスの検証
- [設定の概要](/ja/prx/config/) -- 設定ファイルリファレンス
