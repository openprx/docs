---
title: prx daemon
description: ゲートウェイ、チャネル、cron スケジューラ、自己進化エンジンを含む完全な PRX ランタイムを起動します。
---

# prx daemon

完全な PRX ランタイムを起動します。デーモンプロセスは、HTTP/WebSocket ゲートウェイ、メッセージングチャネル接続、cron スケジューラ、自己進化エンジンなど、すべての長時間実行サブシステムを管理します。

## 使い方

```bash
prx daemon [OPTIONS]
```

## オプション

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルのパス |
| `--port` | `-p` | `3120` | ゲートウェイのリッスンポート |
| `--host` | `-H` | `127.0.0.1` | ゲートウェイのバインドアドレス |
| `--log-level` | `-l` | `info` | ログの詳細度: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | 自己進化エンジンを無効化 |
| `--no-cron` | | `false` | cron スケジューラを無効化 |
| `--no-gateway` | | `false` | HTTP/WS ゲートウェイを無効化 |
| `--pid-file` | | | 指定したファイルに PID を書き込む |

## デーモンが起動するもの

起動時、`prx daemon` は以下のサブシステムを順番に初期化します：

1. **設定ローダー** -- 設定ファイルを読み込み検証します
2. **メモリバックエンド** -- 設定済みのメモリストア（markdown、SQLite、PostgreSQL）に接続します
3. **ゲートウェイサーバー** -- 設定されたホストとポートで HTTP/WebSocket サーバーを起動します
4. **チャネルマネージャー** -- すべての有効なメッセージングチャネル（Telegram、Discord、Slack など）に接続します
5. **cron スケジューラ** -- スケジュールされたタスクを読み込みアクティブにします
6. **自己進化エンジン** -- L1/L2/L3 進化パイプラインを開始します（有効な場合）

## 使用例

```bash
# デフォルト設定で起動
prx daemon

# すべてのインターフェースのポート 8080 にバインド
prx daemon --host 0.0.0.0 --port 8080

# デバッグログで起動
prx daemon --log-level debug

# 進化なしで起動（デバッグに便利）
prx daemon --no-evolution

# カスタム設定ファイルを使用
prx daemon --config /etc/prx/production.toml
```

## シグナル

デーモンは Unix シグナルに応答してランタイムを制御します：

| シグナル | 動作 |
|--------|----------|
| `SIGHUP` | 再起動せずに設定ファイルをリロード。チャネルと cron タスクは新しい設定に合わせて調整されます。 |
| `SIGTERM` | グレースフルシャットダウン。処理中のリクエストを完了し、チャネルをクリーンに切断し、保留中のメモリ書き込みをフラッシュします。 |
| `SIGINT` | `SIGTERM` と同じ（Ctrl+C）。 |

```bash
# 再起動せずに設定をリロード
kill -HUP $(cat /var/run/prx.pid)

# グレースフルシャットダウン
kill -TERM $(cat /var/run/prx.pid)
```

## systemd サービスとして実行

本番環境でデーモンを実行する推奨方法は systemd 経由です。[`prx service install`](./service) を使用してユニットファイルを自動的に生成・インストールするか、手動で作成します：

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

# セキュリティ強化
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# サービスのインストールと起動
prx service install
prx service start

# または手動で
sudo systemctl enable --now prx
```

## ロギング

デーモンはデフォルトで stderr にログを出力します。systemd 環境では、ログはジャーナルにキャプチャされます：

```bash
# デーモンログをフォロー
journalctl -u prx -f

# 過去 1 時間のログを表示
journalctl -u prx --since "1 hour ago"
```

ログアグリゲーターとの統合のために、設定ファイルに `log_format = "json"` を追加して構造化 JSON ログを設定できます。

## ヘルスチェック

デーモン実行中は、[`prx doctor`](./doctor) を使用するか、ゲートウェイのヘルスエンドポイントにクエリします：

```bash
# CLI 診断
prx doctor

# HTTP ヘルスエンドポイント
curl http://127.0.0.1:3120/health
```

## 関連ドキュメント

- [prx gateway](./gateway) -- チャネルや cron なしのスタンドアロンゲートウェイ
- [prx service](./service) -- systemd/OpenRC サービス管理
- [prx doctor](./doctor) -- デーモン診断
- [設定の概要](/ja/prx/config/) -- 設定ファイルリファレンス
- [自己進化の概要](/ja/prx/self-evolution/) -- 進化エンジンの詳細
