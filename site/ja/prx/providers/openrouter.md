---
title: OpenRouter
description: PRX で OpenRouter を LLM プロバイダーとして設定する
---

# OpenRouter

> 単一の API キーと統一されたインターフェースを通じて、複数のプロバイダー（OpenAI、Anthropic、Google、Meta、Mistral など）から 200 以上のモデルにアクセスします。

## 前提条件

- [openrouter.ai](https://openrouter.ai/) から取得した OpenRouter API キー

## クイックセットアップ

### 1. API キーの取得

1. [openrouter.ai](https://openrouter.ai/) でサインアップ
2. ダッシュボードの **Keys** に移動
3. **Create Key** をクリックしてコピー（`sk-or-` で始まります）

### 2. 設定

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[providers.openrouter]
api_key = "${OPENROUTER_API_KEY}"
```

または環境変数を設定:

```bash
export OPENROUTER_API_KEY="sk-or-..."
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

OpenRouter は数百のモデルへのアクセスを提供します。人気のある選択肢:

| モデル | プロバイダー | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|----------|---------|--------|----------|-------|
| `anthropic/claude-sonnet-4` | Anthropic | 200K | あり | あり | Claude Sonnet 4 |
| `anthropic/claude-opus-4` | Anthropic | 200K | あり | あり | Claude Opus 4 |
| `openai/gpt-4o` | OpenAI | 128K | あり | あり | GPT-4o |
| `openai/o3` | OpenAI | 128K | あり | あり | 推論モデル |
| `google/gemini-2.5-pro` | Google | 1M | あり | あり | Gemini Pro |
| `google/gemini-2.5-flash` | Google | 1M | あり | あり | Gemini Flash |
| `meta-llama/llama-3.1-405b-instruct` | Meta | 128K | なし | あり | 最大のオープンモデル |
| `deepseek/deepseek-chat` | DeepSeek | 128K | なし | あり | DeepSeek V3 |
| `mistralai/mistral-large` | Mistral | 128K | なし | あり | Mistral Large |
| `x-ai/grok-2` | xAI | 128K | なし | あり | Grok 2 |

完全なモデルリストは [openrouter.ai/models](https://openrouter.ai/models) でブラウズできます。

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 必須 | OpenRouter API キー（`sk-or-...`） |
| `model` | string | 必須 | `provider/model` 形式のモデル ID |

## 機能

### 統一されたマルチプロバイダーアクセス

単一の OpenRouter API キーで、OpenAI、Anthropic、Google、Meta、Mistral、Cohere などのモデルにアクセスできます。複数の API キーを管理する必要がなくなります。

### OpenAI 互換 API

OpenRouter は `https://openrouter.ai/api/v1/chat/completions` で OpenAI 互換の Chat Completions API を公開しています。PRX は以下を含めてリクエストを送信します:

- 認証用の `Authorization: Bearer <key>`
- アプリ識別用の `HTTP-Referer: https://github.com/theonlyhennygod/openprx`
- アプリ名帰属用の `X-Title: OpenPRX`

### ネイティブツール呼び出し

ツールは OpenAI のネイティブ関数呼び出し形式で送信されます。プロバイダーは `tool_choice: "auto"` をサポートし、マルチターンツールインタラクションの `tool_call_id` マッピングを含む構造化ツール呼び出しレスポンスを適切に処理します。

### マルチターン会話履歴

完全な会話履歴が適切な構造化フォーマットで保持されます:
- ツール呼び出しを含むアシスタントメッセージは `tool_calls` 配列でシリアライズされます
- ツール結果メッセージには `tool_call_id` 参照が含まれます
- システム、ユーザー、アシスタントメッセージはそのまま渡されます

### コネクションウォームアップ

起動時に PRX は `https://openrouter.ai/api/v1/auth/key` に軽量リクエストを送信して API キーを検証し、TLS/HTTP2 コネクションプーリングを確立します。

### モデルルーティング

OpenRouter は API レベルでのモデルルーティングとフォールバックをサポートしています。また、PRX の組み込み `fallback_providers` を使用してクライアントサイドのフォールバックも可能です:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[reliability]
fallback_providers = ["openai"]
```

## デフォルトプロバイダー

OpenRouter は PRX のデフォルトプロバイダーです。設定で `provider` が指定されていない場合、PRX はデフォルトで OpenRouter を使用します。

## トラブルシューティング

### 「OpenRouter API key not set」

`OPENROUTER_API_KEY` 環境変数を設定するか、`config.toml` の `[providers.openrouter]` に `api_key` を追加してください。`prx onboard` を実行してインタラクティブにセットアップすることもできます。

### 402 Payment Required

OpenRouter アカウントのクレジットが不足しています。[openrouter.ai/credits](https://openrouter.ai/credits) でクレジットを追加してください。

### モデル固有のエラー

OpenRouter 上の異なるモデルは、異なる機能とレート制限を持っています。特定のモデルがエラーを返す場合:
- モデルがツール呼び出しをサポートしているか確認（すべてのモデルがサポートしているわけではありません）
- モデルが OpenRouter で非推奨になっていないか確認
- 別のモデルバリアントを試す

### 遅いレスポンス

OpenRouter は基盤となるプロバイダーにルーティングします。レスポンス時間は以下に依存します:
- モデルプロバイダーの現在の負荷
- プロバイダーからの地理的距離
- モデルサイズとコンテキスト長

OpenRouter が遅い場合は、`fallback_providers` を使用して直接プロバイダー接続にフェイルオーバーすることを検討してください。

### レート制限

OpenRouter には基盤プロバイダーの制限に加えて、独自のレート制限があります。レート制限された場合:
- [openrouter.ai/usage](https://openrouter.ai/usage) で使用量を確認
- プランをアップグレードしてより高い制限を取得
- PRX のリライアブルプロバイダーラッパーを使用してバックオフ付き自動リトライ
