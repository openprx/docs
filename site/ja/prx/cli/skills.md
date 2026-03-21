---
title: prx skills
description: PRX エージェントの機能を拡張するインストール可能なスキルの管理。
---

# prx skills

スキルを管理します -- PRX エージェントの機能を拡張するモジュラーな能力パッケージです。スキルはプロンプト、ツール設定、WASM プラグインをインストール可能なユニットにバンドルします。

## 使い方

```bash
prx skills <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx skills list`

インストール済みのスキルとレジストリから利用可能なスキルを一覧表示します。

```bash
prx skills list [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--installed` | | `false` | インストール済みのスキルのみ表示 |
| `--available` | | `false` | 利用可能な（未インストールの）スキルのみ表示 |
| `--json` | `-j` | `false` | JSON で出力 |

**出力例：**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

レジストリまたはローカルパスからスキルをインストールします。

```bash
prx skills install <NAME|PATH> [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--version` | `-v` | 最新 | インストールする特定のバージョン |
| `--force` | `-f` | `false` | 既にインストール済みでも再インストール |

```bash
# レジストリからインストール
prx skills install code-review

# 特定のバージョンをインストール
prx skills install web-research --version 1.0.2

# ローカルパスからインストール
prx skills install ./my-custom-skill/

# 強制再インストール
prx skills install code-review --force
```

### `prx skills remove`

スキルをアンインストールします。

```bash
prx skills remove <NAME> [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--force` | `-f` | `false` | 確認プロンプトをスキップ |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## スキルの構造

スキルパッケージには以下が含まれます：

```
my-skill/
  skill.toml          # スキルのメタデータと設定
  system_prompt.md    # 追加のシステムプロンプト指示
  tools.toml          # ツール定義とパーミッション
  plugin.wasm         # オプションの WASM プラグインバイナリ
```

`skill.toml` マニフェスト：

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## スキルディレクトリ

インストール済みのスキルは以下に保存されます：

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## 関連ドキュメント

- [プラグインの概要](/ja/prx/plugins/) -- WASM プラグインシステム
- [ツールの概要](/ja/prx/tools/) -- 組み込みツール
- [開発者ガイド](/ja/prx/plugins/developer-guide) -- カスタムプラグインの構築
