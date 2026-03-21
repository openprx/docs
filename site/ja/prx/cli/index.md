---
title: CLI リファレンス
description: prx コマンドラインインターフェースの完全なリファレンス。
---

# CLI リファレンス

`prx` バイナリは、対話型チャット、デーモン管理、チャネル管理、システム診断など、PRX のすべての操作の単一エントリポイントです。

## グローバルフラグ

以下のフラグはすべてのサブコマンドで使用できます。

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルのパス |
| `--log-level` | `-l` | `info` | ログの詳細度: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | カラー出力を無効化 |
| `--quiet` | `-q` | `false` | 重要でない出力を抑制 |
| `--help` | `-h` | | ヘルプ情報を表示 |
| `--version` | `-V` | | バージョンを表示 |

## コマンド

| コマンド | 説明 |
|---------|-------------|
| [`prx agent`](./agent) | シングルターン LLM インタラクション（パイプ対応） |
| [`prx chat`](./chat) | ストリーミングと履歴機能付きのリッチなターミナルチャット |
| [`prx daemon`](./daemon) | 完全な PRX ランタイムの起動（ゲートウェイ + チャネル + cron + 進化） |
| [`prx gateway`](./gateway) | スタンドアロン HTTP/WebSocket ゲートウェイサーバー |
| [`prx onboard`](./onboard) | 対話型セットアップウィザード |
| [`prx channel`](./channel) | チャネル管理（一覧、追加、削除、起動、診断） |
| [`prx cron`](./cron) | cron タスク管理（一覧、追加、削除、一時停止、再開） |
| [`prx evolution`](./evolution) | 自己進化操作（ステータス、履歴、設定、トリガー） |
| [`prx auth`](./auth) | OAuth プロファイル管理（ログイン、更新、ログアウト） |
| [`prx config`](./config) | 設定操作（スキーマ、分割、マージ、取得、設定） |
| [`prx doctor`](./doctor) | システム診断（デーモンヘルス、チャネルステータス、モデル可用性） |
| [`prx service`](./service) | systemd/OpenRC サービス管理（インストール、起動、停止、ステータス） |
| [`prx skills`](./skills) | スキル管理（一覧、インストール、削除） |
| `prx status` | システムステータスダッシュボード |
| `prx models refresh` | プロバイダーモデルカタログの更新 |
| `prx providers` | サポートされているすべての LLM プロバイダーの一覧 |
| `prx completions` | シェル補完の生成（bash, zsh, fish） |

## クイックサンプル

```bash
# 初回セットアップ
prx onboard

# 対話型チャットの開始
prx chat

# シングルターンクエリ（スクリプト対応）
echo "Summarize this file" | prx agent -f report.pdf

# すべてのサービスを含むデーモンの起動
prx daemon

# システムヘルスの確認
prx doctor
```

## シェル補完

シェルの補完を生成してプロファイルに追加します：

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## 環境変数

PRX は以下の環境変数を認識します（設定ファイルの値をオーバーライドします）：

| 変数 | 説明 |
|----------|-------------|
| `PRX_CONFIG` | 設定ファイルのパス（`--config` と同等） |
| `PRX_LOG` | ログレベル（`--log-level` と同等） |
| `PRX_DATA_DIR` | データディレクトリ（デフォルト: `~/.local/share/prx`） |
| `ANTHROPIC_API_KEY` | Anthropic プロバイダーの API キー |
| `OPENAI_API_KEY` | OpenAI プロバイダーの API キー |
| `GOOGLE_API_KEY` | Google Gemini プロバイダーの API キー |

## 関連ドキュメント

- [設定の概要](/ja/prx/config/) -- 設定ファイルの形式とオプション
- [はじめに](/ja/prx/getting-started/installation) -- インストール手順
- [トラブルシューティング](/ja/prx/troubleshooting/) -- よくあるエラーと解決方法
