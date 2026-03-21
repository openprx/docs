---
title: LLM プロバイダー
description: 機能マトリックス、設定、フォールバックチェーン、ルーティングを含む PRX がサポートする 9 以上の LLM プロバイダーの概要
---

# LLM プロバイダー

PRX は**プロバイダー**を通じて大規模言語モデルに接続します。プロバイダーは `Provider` トレイトを実装するプラガブルなバックエンドで、特定の LLM API に対する認証、リクエストフォーマット、ストリーミング、エラー分類を処理します。

PRX には 9 つの組み込みプロバイダー、サードパーティサービス用の OpenAI 互換エンドポイント、フォールバックチェーンとインテリジェントルーティングのインフラが同梱されています。

## 機能マトリックス

| プロバイダー | 主要モデル | ストリーミング | ビジョン | ツール使用 | OAuth | セルフホスト |
|----------|-----------|-----------|--------|----------|-------|-------------|
| [Anthropic](/ja/prx/providers/anthropic) | Claude Opus 4, Claude Sonnet 4 | あり | あり | あり | あり（Claude Code） | なし |
| [OpenAI](/ja/prx/providers/openai) | GPT-4o, o1, o3 | あり | あり | あり | なし | なし |
| [Google Gemini](/ja/prx/providers/google-gemini) | Gemini 2.0 Flash, Gemini 1.5 Pro | あり | あり | あり | あり（Gemini CLI） | なし |
| [OpenAI Codex](/ja/prx/providers/openai-codex) | Codex モデル | あり | なし | あり | あり | なし |
| [GitHub Copilot](/ja/prx/providers/github-copilot) | Copilot Chat モデル | あり | なし | あり | あり（Device Flow） | なし |
| [Ollama](/ja/prx/providers/ollama) | Llama 3, Mistral, Qwen, 任意の GGUF | あり | モデル依存 | あり | なし | あり |
| [AWS Bedrock](/ja/prx/providers/aws-bedrock) | Claude, Titan, Llama | あり | モデル依存 | モデル依存 | AWS IAM | なし |
| [GLM](/ja/prx/providers/glm) | GLM-4, Zhipu, Minimax, Moonshot, Qwen, Z.AI | あり | モデル依存 | モデル依存 | あり（Minimax/Qwen） | なし |
| [OpenRouter](/ja/prx/providers/openrouter) | 複数ベンダーの 200 以上のモデル | あり | モデル依存 | モデル依存 | なし | なし |
| [カスタム互換](/ja/prx/providers/custom-compatible) | 任意の OpenAI 互換 API | あり | エンドポイント依存 | エンドポイント依存 | なし | あり |

## クイック設定

プロバイダーは `~/.config/openprx/config.toml`（または `~/.openprx/config.toml`）で設定します。最低限、デフォルトプロバイダーを設定し API キーを提供します:

```toml
# デフォルトプロバイダーとモデルを選択
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API キー（ANTHROPIC_API_KEY 環境変数でも設定可能）
api_key = "sk-ant-..."
```

Ollama のようなセルフホストプロバイダーの場合、エンドポイントを指定します:

```toml
default_provider = "ollama"
default_model = "llama3:70b"
api_url = "http://localhost:11434"
```

各プロバイダーは以下の順序で API キーを解決します:

1. `config.toml` の `api_key` フィールド
2. プロバイダー固有の環境変数（例: `ANTHROPIC_API_KEY`、`OPENAI_API_KEY`）
3. 汎用の `API_KEY` 環境変数

サポートされる変数の完全なリストは[環境変数](/ja/prx/config/environment)を参照してください。

## ReliableProvider によるフォールバックチェーン

PRX はプロバイダー呼び出しを `ReliableProvider` レイヤーでラップし、以下を提供します:

- **自動リトライ** -- 一時的な障害（5xx、429 レート制限、ネットワークタイムアウト）に対する指数バックオフ付きリトライ
- **フォールバックチェーン** -- プライマリプロバイダーが失敗した場合、リクエストは自動的にチェーン内の次のプロバイダーにルーティング
- **リトライ不要エラーの検出** -- 無効な API キー（401/403）や不明なモデル（404）などのクライアントエラーはリトライを無駄にせず即座に失敗

信頼性を `[reliability]` セクションで設定:

```toml
[reliability]
max_retries = 3
fallback_providers = ["openai", "gemini"]
```

プライマリプロバイダー（例: Anthropic）が一時的なエラーを返した場合、PRX はバックオフ付きで最大 `max_retries` 回リトライします。すべてのリトライが尽きると、最初のフォールバックプロバイダーに移行します。成功するレスポンスが得られるかすべてのプロバイダーが尽きるまでフォールバックチェーンは続行されます。

### エラー分類

ReliableProvider はエラーを 2 つのカテゴリに分類します:

- **リトライ可能**: HTTP 5xx、429（レート制限）、408（タイムアウト）、ネットワークエラー
- **リトライ不可**: HTTP 4xx（429/408 を除く）、無効な API キー、不明なモデル、不正なレスポンス

リトライ不可エラーはリトライをスキップし、即座に次のプロバイダーに移行して、レイテンシの無駄を回避します。

## ルーター統合

高度なマルチモデルセットアップのために、PRX はリクエストごとに最適なプロバイダーとモデルを選択するヒューリスティック LLM ルーターをサポートします:

- **機能スコアリング** -- クエリの複雑さとモデルの強みをマッチング
- **Elo レーティング** -- 時間経過に伴うモデルパフォーマンスを追跡
- **コスト最適化** -- シンプルなクエリにはより安価なモデルを優先
- **レイテンシ重み付け** -- レスポンス時間を考慮
- **KNN セマンティックルーティング** -- 類似度ベースのルーティングのために過去のクエリエンベディングを使用
- **Automix エスカレーション** -- 安価なモデルで開始し、信頼度が低い場合にプレミアムモデルにエスカレーション

```toml
[router]
enabled = true
knn_enabled = true

[router.automix]
enabled = true
confidence_threshold = 0.7
premium_model_id = "anthropic/claude-sonnet-4-6"
```

詳細は[ルーター設定](/ja/prx/router/)を参照してください。

## プロバイダーページ

- [Anthropic（Claude）](/ja/prx/providers/anthropic)
- [OpenAI](/ja/prx/providers/openai)
- [Google Gemini](/ja/prx/providers/google-gemini)
- [OpenAI Codex](/ja/prx/providers/openai-codex)
- [GitHub Copilot](/ja/prx/providers/github-copilot)
- [Ollama](/ja/prx/providers/ollama)
- [AWS Bedrock](/ja/prx/providers/aws-bedrock)
- [GLM（Zhipu / Minimax / Moonshot / Qwen / Z.AI）](/ja/prx/providers/glm)
- [OpenRouter](/ja/prx/providers/openrouter)
- [カスタム互換エンドポイント](/ja/prx/providers/custom-compatible)
