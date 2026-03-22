---
title: CLIコマンドリファレンス
description: "すべてのPRX-WAF CLIコマンドとサブコマンドの完全リファレンス。サーバー管理、ルール操作、CrowdSec統合、ボット検出。"
---

# CLIコマンドリファレンス

`prx-waf`コマンドラインインターフェースはサーバー管理、ルール操作、CrowdSec統合、ボット検出のためのコマンドを提供します。

## グローバルオプション

| フラグ | デフォルト | 説明 |
|------|---------|-------------|
| `-c, --config <FILE>` | `configs/default.toml` | TOMLコンフィグファイルへのパス |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## サーバーコマンド

| コマンド | 説明 |
|---------|-------------|
| `prx-waf run` | リバースプロキシ + 管理APIを起動（無期限ブロック） |
| `prx-waf migrate` | データベースマイグレーションのみ実行 |
| `prx-waf seed-admin` | デフォルト管理ユーザー（admin/admin）を作成 |

```bash
# Start the server
prx-waf -c configs/default.toml run

# Run migrations before first start
prx-waf -c configs/default.toml migrate

# Create admin user
prx-waf -c configs/default.toml seed-admin
```

::: tip
初回セットアップでは、`run`の前に`migrate`と`seed-admin`を実行してください。以降の起動では`run`のみ必要です -- マイグレーションは自動的にチェックされます。
:::

## ルール管理

検出ルールを管理するコマンド。すべてのルールコマンドは設定されたルールディレクトリで動作します。

| コマンド | 説明 |
|---------|-------------|
| `prx-waf rules list` | ロードされているすべてのルールをリスト |
| `prx-waf rules list --category <CAT>` | カテゴリでルールをフィルタリング |
| `prx-waf rules list --source <SRC>` | ソースでルールをフィルタリング |
| `prx-waf rules info <RULE-ID>` | ルールの詳細情報を表示 |
| `prx-waf rules enable <RULE-ID>` | 無効なルールを有効化 |
| `prx-waf rules disable <RULE-ID>` | ルールを無効化 |
| `prx-waf rules reload` | ディスクからすべてのルールをホットリロード |
| `prx-waf rules validate <PATH>` | ルールファイルの正確性を検証 |
| `prx-waf rules import <PATH\|URL>` | ファイルまたはURLからルールをインポート |
| `prx-waf rules export [--format yaml]` | 現在のルールセットをエクスポート |
| `prx-waf rules update` | リモートソースから最新ルールを取得 |
| `prx-waf rules search <QUERY>` | 名前または説明でルールを検索 |
| `prx-waf rules stats` | ルール統計を表示 |

### サンプル

```bash
# List all SQL injection rules
prx-waf rules list --category sqli

# List OWASP CRS rules
prx-waf rules list --source owasp

# Show details for a specific rule
prx-waf rules info CRS-942100

# Disable a rule causing false positives
prx-waf rules disable CRS-942100

# Hot-reload after editing rules
prx-waf rules reload

# Validate custom rules before deploying
prx-waf rules validate rules/custom/myapp.yaml

# Import rules from a URL
prx-waf rules import https://example.com/rules/custom.yaml

# Export all rules as YAML
prx-waf rules export --format yaml > all-rules.yaml

# View statistics
prx-waf rules stats
```

## ルールソース管理

リモートルールソースを管理するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `prx-waf sources list` | 設定されたルールソースをリスト |
| `prx-waf sources add <NAME> <URL>` | リモートルールソースを追加 |
| `prx-waf sources remove <NAME>` | ルールソースを削除 |
| `prx-waf sources update [NAME]` | 特定のソース（またはすべて）から最新を取得 |
| `prx-waf sources sync` | すべてのリモートソースを同期 |

### サンプル

```bash
# List all sources
prx-waf sources list

# Add a custom source
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Sync all sources
prx-waf sources sync

# Update a specific source
prx-waf sources update owasp-crs
```

## CrowdSec統合

CrowdSec脅威インテリジェンス統合を管理するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `prx-waf crowdsec status` | CrowdSec統合ステータスを表示 |
| `prx-waf crowdsec decisions` | LAPIからのアクティブな決定をリスト |
| `prx-waf crowdsec test` | LAPI接続をテスト |
| `prx-waf crowdsec setup` | インタラクティブなCrowdSecセットアップウィザード |

### サンプル

```bash
# Check integration status
prx-waf crowdsec status

# List active block/captcha decisions
prx-waf crowdsec decisions

# Test connectivity to CrowdSec LAPI
prx-waf crowdsec test

# Run the setup wizard
prx-waf crowdsec setup
```

## ボット検出

ボット検出ルールを管理するコマンド。

| コマンド | 説明 |
|---------|-------------|
| `prx-waf bot list` | 既知のボットシグネチャをリスト |
| `prx-waf bot add <PATTERN> [--action ACTION]` | ボット検出パターンを追加 |
| `prx-waf bot remove <PATTERN>` | ボット検出パターンを削除 |
| `prx-waf bot test <USER-AGENT>` | ユーザーエージェントをボットルールでテスト |

### サンプル

```bash
# List all bot signatures
prx-waf bot list

# Add a new bot pattern
prx-waf bot add "(?i)my-bad-bot" --action block

# Add a bot pattern in log-only mode
prx-waf bot add "(?i)suspicious-crawler" --action log

# Test a user-agent string
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Remove a bot pattern
prx-waf bot remove "(?i)my-bad-bot"
```

## 使用パターン

### 初回セットアップ

```bash
# 1. Run migrations
prx-waf -c configs/default.toml migrate

# 2. Create admin user
prx-waf -c configs/default.toml seed-admin

# 3. Start the server
prx-waf -c configs/default.toml run
```

### ルールメンテナンスワークフロー

```bash
# 1. Check for upstream rule updates
prx-waf rules update

# 2. Validate after update
prx-waf rules validate rules/

# 3. Review changes
prx-waf rules stats

# 4. Hot-reload
prx-waf rules reload
```

### CrowdSec統合セットアップ

```bash
# 1. Run the setup wizard
prx-waf crowdsec setup

# 2. Test connectivity
prx-waf crowdsec test

# 3. Verify decisions are flowing
prx-waf crowdsec decisions
```

## 次のステップ

- [クイックスタート](../getting-started/quickstart) -- PRX-WAFを始める
- [ルールエンジン](../rules/) -- 検出パイプラインを理解する
- [設定リファレンス](../configuration/reference) -- すべての設定キー
