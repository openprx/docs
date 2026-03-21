---
title: prx onboard
description: PRX の初回設定用対話型セットアップウィザード。
---

# prx onboard

セットアップウィザードを実行して PRX を初回設定します。ウィザードはプロバイダーの選択、API キーの設定、チャネルの設定、基本的な環境設定を案内します。

## 使い方

```bash
prx onboard [OPTIONS]
```

## オプション

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--quick` | `-q` | `false` | クイックモード -- 最小限のプロンプト、適切なデフォルト値 |
| `--provider` | `-P` | | プロバイダーを事前選択（プロバイダー選択ステップをスキップ） |
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルの出力パス |
| `--force` | `-f` | `false` | 既存の設定ファイルを上書き |
| `--non-interactive` | | `false` | 非対話型モード（`--provider` と環境変数のキーが必要） |

## ウィザードのステップ

対話型ウィザードは以下のステップを案内します：

1. **プロバイダーの選択** -- 主要な LLM プロバイダーを選択（Anthropic、OpenAI、Ollama など）
2. **API キーの設定** -- API キーの入力と検証
3. **モデルの選択** -- 選択したプロバイダーからデフォルトモデルを選択
4. **チャネルのセットアップ**（任意） -- 1 つ以上のメッセージングチャネルを設定
5. **メモリバックエンド** -- 会話メモリの保存先を選択（markdown、SQLite、PostgreSQL）
6. **セキュリティ** -- ペアリングコードとサンドボックスの設定
7. **設定の確認** -- 生成された設定をプレビューして確認

## 使用例

```bash
# 完全な対話型ウィザード
prx onboard

# Anthropic でクイックセットアップ
prx onboard --quick --provider anthropic

# 非対話型（環境変数から API キー）
export ANTHROPIC_API_KEY="sk-ant-..."
prx onboard --non-interactive --provider anthropic

# カスタムパスに設定を書き込み
prx onboard --config /etc/prx/config.toml

# ウィザードを再実行（既存の設定を上書き）
prx onboard --force
```

## クイックモード

クイックモード（`--quick`）はオプションのステップをスキップし、適切なデフォルト値を使用します：

- メモリバックエンド: SQLite
- セキュリティ: サンドボックス有効、ペアリング不要
- チャネル: なし（後で `prx channel add` で追加）
- 進化: 無効（後で設定で有効化）

動作する設定を最も手早く取得する方法です：

```bash
prx onboard --quick --provider ollama
```

## セットアップ後

オンボーディング完了後、以下を実行できます：

```bash
# 設定の検証
prx doctor

# チャットの開始
prx chat

# チャネルの追加
prx channel add

# 完全なデーモンの起動
prx daemon
```

## 関連ドキュメント

- [はじめに](/ja/prx/getting-started/quickstart) -- クイックスタートガイド
- [設定の概要](/ja/prx/config/) -- 設定ファイルの形式とオプション
- [prx config](./config) -- 初回セットアップ後の設定変更
- [prx channel](./channel) -- オンボーディング後のチャネル追加
