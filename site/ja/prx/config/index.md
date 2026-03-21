---
title: 設定
description: PRX の設定システムの概要 -- TOML ベースの設定、ホットリロード、分割ファイル、CLI ツール、スキーマエクスポート。
---

# 設定

PRX はホットリロード対応の TOML ベースの設定システムを使用しています。すべての設定は単一のファイル（オプションで分割フラグメント付き）に格納され、ほとんどの変更はデーモンを再起動することなく即座に反映されます。

## 設定ファイルの場所

主要な設定ファイルは以下の場所にあります：

```
~/.openprx/config.toml
```

PRX は以下の順序で設定ディレクトリを解決します：

1. `OPENPRX_CONFIG_DIR` 環境変数（設定されている場合）
2. `OPENPRX_WORKSPACE` 環境変数（設定されている場合）
3. アクティブワークスペースマーカー（`~/.openprx/active_workspace.toml`）
4. `~/.openprx/`（デフォルト）

ワークスペースディレクトリ（メモリ、セッション、データが保存される場所）はデフォルトで `~/.openprx/workspace/` です。

## TOML フォーマット

PRX の設定は [TOML](https://toml.io/) を使用します -- 最小限で人間が読みやすい形式です。以下は最小限の動作する設定です：

```toml
# プロバイダーとモデルの選択
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API キー（または ANTHROPIC_API_KEY 環境変数を使用）
api_key = "sk-ant-..."

# メモリバックエンド
[memory]
backend = "sqlite"
auto_save = true

# ゲートウェイサーバー
[gateway]
port = 16830
host = "127.0.0.1"
```

## 設定セクション

設定は以下のトップレベルセクションで構成されています：

| セクション | 目的 |
|---------|---------|
| *（トップレベル）* | デフォルトプロバイダー、モデル、温度、API キー |
| `[gateway]` | HTTP ゲートウェイ: ホスト、ポート、ペアリング、レート制限 |
| `[channels_config]` | メッセージングチャネル: Telegram、Discord、Slack など |
| `[channels_config.telegram]` | Telegram ボット設定 |
| `[channels_config.discord]` | Discord ボット設定 |
| `[memory]` | メモリバックエンドとエンベディング設定 |
| `[router]` | ヒューリスティック LLM ルーターと Automix |
| `[security]` | サンドボックス、リソース制限、監査ログ |
| `[autonomy]` | 自律性レベルとツールスコープルール |
| `[observability]` | メトリクスとトレーシングバックエンド |
| `[mcp]` | Model Context Protocol サーバー統合 |
| `[browser]` | ブラウザ自動化ツール設定 |
| `[web_search]` | Web 検索とフェッチツール設定 |
| `[xin]` | Xin 自律タスクエンジン |
| `[reliability]` | リトライとフォールバックプロバイダーチェーン |
| `[cost]` | 支出制限とモデル料金 |
| `[cron]` | スケジュールジョブ定義 |
| `[self_system]` | 自己進化エンジン制御 |
| `[proxy]` | HTTP/HTTPS/SOCKS5 プロキシ設定 |
| `[secrets]` | 暗号化クレデンシャルストア |
| `[auth]` | 外部クレデンシャルインポート（Codex CLI など） |
| `[storage]` | 永続ストレージプロバイダー |
| `[tunnel]` | パブリックトンネル公開 |
| `[nodes]` | リモートノードプロキシ設定 |

フィールドごとの詳細なドキュメントについては、[設定リファレンス](/ja/prx/config/reference)を参照してください。

## 分割設定ファイル

複雑なデプロイメントの場合、PRX は `config.toml` の隣にある `config.d/` ディレクトリ内のフラグメントファイルへの設定分割をサポートしています：

```
~/.openprx/
  config.toml          # メイン設定（トップレベル + オーバーライド）
  config.d/
    channels.toml      # [channels_config] セクション
    memory.toml        # [memory] と [storage] セクション
    security.toml      # [security] と [autonomy] セクション
    agents.toml        # [agents] と [sessions_spawn] セクション
    identity.toml      # [identity] と [identity_bindings] セクション
    network.toml       # [gateway]、[tunnel]、[proxy] セクション
    scheduler.toml     # [scheduler]、[cron]、[heartbeat] セクション
```

フラグメントファイルは `config.toml` の上にマージされます（フラグメントが優先）。ファイルはアルファベット順に読み込まれます。

## 編集方法

### 対話型ウィザード

オンボーディングウィザードがプロバイダー選択、チャネルセットアップ、メモリ設定を案内します：

```bash
prx onboard
```

### CLI 設定コマンド

コマンドラインから設定を確認・変更します：

```bash
# 現在の設定を表示
prx config show

# 特定の値を編集
prx config set default_provider anthropic
prx config set default_model "anthropic/claude-sonnet-4-6"

# 手動リロードをトリガー
prx config reload
```

### 直接編集

任意のテキストエディターで `~/.openprx/config.toml` を開きます。変更はファイルウォッチャーによって自動的に検出され、1 秒以内に適用されます（[ホットリロード](/ja/prx/config/hot-reload)を参照）。

### スキーマエクスポート

エディターの自動補完と検証用に、完全な設定スキーマを JSON Schema としてエクスポートします：

```bash
prx config schema
```

これにより、VS Code、IntelliJ、または TOML スキーマ検証をサポートする任意のエディターで使用できる JSON Schema ドキュメントが出力されます。

## ホットリロード

ほとんどの設定変更は PRX を再起動せずに即座に適用されます。ファイルウォッチャーは 1 秒のデバウンスウィンドウを使用し、パースが成功するとライブ設定をアトミックにスワップします。新しいファイルに構文エラーがある場合、前の設定が保持され、警告がログに記録されます。

再起動が必要な項目の詳細については、[ホットリロード](/ja/prx/config/hot-reload)を参照してください。

## 次のステップ

- [設定リファレンス](/ja/prx/config/reference) -- フィールドごとの詳細なドキュメント
- [ホットリロード](/ja/prx/config/hot-reload) -- ライブで変更される項目と再起動が必要な項目
- [環境変数](/ja/prx/config/environment) -- 環境変数、API キー、`.env` サポート
- [LLM プロバイダー](/ja/prx/providers/) -- プロバイダー固有の設定
