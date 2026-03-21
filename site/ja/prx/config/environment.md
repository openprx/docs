---
title: 環境変数
description: PRX 設定用の環境変数 -- API キー、パス、ランタイムオーバーライド。
---

# 環境変数

PRX は API キー、設定パス、ランタイムオーバーライドのために環境変数を読み取ります。環境変数は、API キーのようなセキュリティに敏感なフィールドについて `config.toml` の値より優先されます。

## 設定パス

| 変数 | デフォルト | 説明 |
|----------|---------|-------------|
| `OPENPRX_CONFIG_DIR` | `~/.openprx` | 設定ディレクトリをオーバーライド。PRX はこのディレクトリ内の `config.toml` と `config.d/` を参照 |
| `OPENPRX_WORKSPACE` | `~/.openprx/workspace` | ワークスペースディレクトリ（メモリ、セッション、データ）をオーバーライド |

`OPENPRX_CONFIG_DIR` が設定されている場合、`OPENPRX_WORKSPACE` とアクティブワークスペースマーカーより優先されます。

設定ディレクトリの解決順序：

1. `OPENPRX_CONFIG_DIR`（最高優先度）
2. `OPENPRX_WORKSPACE`
3. アクティブワークスペースマーカー（`~/.openprx/active_workspace.toml`）
4. `~/.openprx/`（デフォルト）

## プロバイダー API キー

各プロバイダーには専用の環境変数があります。PRX は `config.toml` の `api_key` フィールドにフォールバックする前にこれらをチェックします。

### 主要プロバイダー

| 変数 | プロバイダー |
|----------|----------|
| `ANTHROPIC_API_KEY` | Anthropic (Claude) |
| `OPENAI_API_KEY` | OpenAI |
| `GEMINI_API_KEY` | Google Gemini |
| `GOOGLE_API_KEY` | Google Gemini（代替） |
| `OPENROUTER_API_KEY` | OpenRouter |
| `OLLAMA_API_KEY` | Ollama（通常は不要） |
| `GLM_API_KEY` | 智譜 GLM |
| `ZAI_API_KEY` | Z.AI |
| `MINIMAX_API_KEY` | Minimax |
| `MOONSHOT_API_KEY` | Moonshot |
| `DASHSCOPE_API_KEY` | Alibaba Qwen (DashScope) |

### OAuth トークン

一部のプロバイダーは API キーに加えて（または代わりに）OAuth 認証をサポートしています：

| 変数 | プロバイダー | 説明 |
|----------|----------|-------------|
| `ANTHROPIC_OAUTH_TOKEN` | Anthropic | Claude Code OAuth トークン |
| `CLAUDE_CODE_ACCESS_TOKEN` | Anthropic | Claude Code アクセストークン（代替） |
| `CLAUDE_CODE_REFRESH_TOKEN` | Anthropic | 自動更新用の Claude Code リフレッシュトークン |
| `MINIMAX_OAUTH_TOKEN` | Minimax | Minimax OAuth アクセストークン |
| `MINIMAX_OAUTH_REFRESH_TOKEN` | Minimax | Minimax OAuth リフレッシュトークン |
| `MINIMAX_OAUTH_CLIENT_ID` | Minimax | OAuth クライアント ID オーバーライド |
| `MINIMAX_OAUTH_REGION` | Minimax | OAuth リージョン（`global` または `cn`） |
| `QWEN_OAUTH_TOKEN` | Qwen | Qwen OAuth アクセストークン |
| `QWEN_OAUTH_REFRESH_TOKEN` | Qwen | Qwen OAuth リフレッシュトークン |
| `QWEN_OAUTH_CLIENT_ID` | Qwen | Qwen OAuth クライアント ID オーバーライド |
| `QWEN_OAUTH_RESOURCE_URL` | Qwen | Qwen OAuth リソース URL オーバーライド |

### 互換/サードパーティプロバイダー

| 変数 | プロバイダー |
|----------|----------|
| `GROQ_API_KEY` | Groq |
| `MISTRAL_API_KEY` | Mistral |
| `DEEPSEEK_API_KEY` | DeepSeek |
| `XAI_API_KEY` | xAI (Grok) |
| `TOGETHER_API_KEY` | Together AI |
| `FIREWORKS_API_KEY` | Fireworks AI |
| `PERPLEXITY_API_KEY` | Perplexity |
| `COHERE_API_KEY` | Cohere |
| `NVIDIA_API_KEY` | NVIDIA NIM |
| `VENICE_API_KEY` | Venice |
| `LLAMACPP_API_KEY` | llama.cpp server |
| `KIMI_CODE_API_KEY` | Kimi Code (Moonshot) |
| `QIANFAN_API_KEY` | Baidu Qianfan |
| `CLOUDFLARE_API_KEY` | Cloudflare AI |
| `VERCEL_API_KEY` | Vercel AI |

### フォールバック

| 変数 | 説明 |
|----------|-------------|
| `API_KEY` | プロバイダー固有の変数が設定されていない場合に使用される汎用フォールバック |

## ツールとチャネルの変数

| 変数 | 説明 |
|----------|-------------|
| `BRAVE_API_KEY` | Brave Search API キー（`[web_search]` で `provider = "brave"` の場合） |
| `GITHUB_TOKEN` | GitHub パーソナルアクセストークン（スキルと統合で使用） |
| `GOOGLE_APPLICATION_CREDENTIALS` | Google Cloud ADC ファイルパス（サービスアカウント経由の Gemini） |

## ランタイム変数

| 変数 | 説明 |
|----------|-------------|
| `OPENPRX_VERSION` | 報告されるバージョン文字列をオーバーライド |
| `OPENPRX_AUTOSTART_CHANNELS` | `"1"` に設定すると起動時にチャネルリスナーを自動開始 |
| `OPENPRX_EVOLUTION_CONFIG` | 進化設定パスをオーバーライド |
| `OPENPRX_EVOLUTION_DEBUG_RAW` | 生の進化デバッグログを有効化 |

## 設定内の変数展開

PRX は `config.toml` 内で `${VAR_NAME}` 構文をネイティブに展開**しません**。ただし、以下のアプローチで環境変数の置換を実現できます：

### 1. 環境変数を直接使用

API キーについて、PRX は対応する環境変数を自動的にチェックします。設定ファイルで参照する必要はありません：

```toml
# api_key 不要 -- PRX は ANTHROPIC_API_KEY を自動的にチェック
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
```

### 2. シェルラッパーを使用

`envsubst` などを使用してテンプレートから `config.toml` を生成：

```bash
envsubst < config.toml.template > ~/.openprx/config.toml
```

### 3. シークレット付き分割設定を使用

デプロイ時に環境変数から生成される別ファイルにシークレットを保持：

```bash
# シークレットフラグメントを生成
cat > ~/.openprx/config.d/secrets.toml << EOF
api_key = "$ANTHROPIC_API_KEY"

[channels_config.telegram]
bot_token = "$TELEGRAM_BOT_TOKEN"
EOF
```

## `.env` ファイルサポート

PRX は `.env` ファイルを自動的に読み込みません。`.env` ファイルサポートが必要な場合は、以下のアプローチのいずれかを使用してください：

### systemd の場合

サービスユニットに `EnvironmentFile` を追加：

```ini
[Service]
EnvironmentFile=/opt/openprx/.env
ExecStart=/usr/local/bin/openprx
```

### シェルラッパーの場合

PRX 起動前に `.env` ファイルをソース：

```bash
#!/bin/bash
set -a
source /opt/openprx/.env
set +a
exec openprx
```

### direnv の場合

[direnv](https://direnv.net/) を使用する場合、作業ディレクトリに `.envrc` ファイルを配置：

```bash
# .envrc
export ANTHROPIC_API_KEY="sk-ant-..."
export TELEGRAM_BOT_TOKEN="123456:ABC-DEF..."
```

## セキュリティの推奨事項

- **API キーをバージョン管理にコミットしない**。環境変数または暗号化されたシークレットを使用してください。
- PRX の `[secrets]` サブシステムは `config.toml` 内の機密フィールドを ChaCha20-Poly1305 で暗号化します。`[secrets] encrypt = true` で有効化します（デフォルトで有効）。
- PRX に同梱される `.dockerignore` はコンテナビルドから `.env` と `.env.*` ファイルを除外します。
- 監査ログは API キーとトークンを自動的に秘匿化します。
- `OPENPRX_CONFIG_DIR` を共有ディレクトリに向ける場合、適切なファイルパーミッション（`chmod 600 config.toml`）を確認してください。
