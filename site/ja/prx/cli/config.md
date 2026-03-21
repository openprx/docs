---
title: prx config
description: コマンドラインから PRX の設定を確認・変更します。
---

# prx config

TOML を手動で編集せずに、PRX 設定ファイルの読み取り、書き込み、検証、変換を行います。

## 使い方

```bash
prx config <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx config get`

ドットパスキーで設定値を読み取ります。

```bash
prx config get <KEY> [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルのパス |
| `--json` | `-j` | `false` | JSON で値を出力 |

```bash
# デフォルトプロバイダーを取得
prx config get providers.default

# ゲートウェイポートを取得
prx config get gateway.port

# セクション全体を JSON で取得
prx config get providers --json
```

### `prx config set`

設定値を設定します。

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | 設定ファイルのパス |

```bash
# デフォルトプロバイダーを変更
prx config set providers.default "anthropic"

# ゲートウェイポートを変更
prx config set gateway.port 8080

# ブール値を設定
prx config set evolution.l1.enabled true

# ネストされた値を設定
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

完全な設定 JSON スキーマを出力します。エディターの自動補完や検証に便利です。

```bash
prx config schema [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--output` | `-o` | stdout | スキーマをファイルに書き込む |
| `--format` | | `json` | 出力形式: `json` または `yaml` |

```bash
# スキーマを stdout に出力
prx config schema

# エディター統合用にスキーマを保存
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

モノリシックな設定ファイルをセクションごとのファイルに分割します。プロバイダー、チャネル、cron などの個別ファイルを持つ設定ディレクトリが作成されます。

```bash
prx config split [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | ソース設定ファイル |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | 出力ディレクトリ |

```bash
prx config split

# 結果:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

分割された設定ディレクトリを単一のファイルにマージします。

```bash
prx config merge [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | ソースディレクトリ |
| `--output` | `-o` | `~/.config/prx/config.toml` | 出力ファイル |
| `--force` | `-f` | `false` | 既存の出力ファイルを上書き |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## 使用例

```bash
# 設定のクイック確認
prx config get .  # 設定全体を出力

# プロバイダーキーの更新
prx config set providers.anthropic.api_key "sk-ant-..."

# VS Code 用のスキーマ生成
prx config schema --output ~/.config/prx/schema.json
# VS Code の settings.json に:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# バージョン管理のためにバックアップと分割
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## 関連ドキュメント

- [設定の概要](/ja/prx/config/) -- 設定ファイルの形式と構造
- [完全なリファレンス](/ja/prx/config/reference) -- すべての設定オプション
- [ホットリロード](/ja/prx/config/hot-reload) -- ランタイムでの設定リロード
- [環境変数](/ja/prx/config/environment) -- 環境変数によるオーバーライド
