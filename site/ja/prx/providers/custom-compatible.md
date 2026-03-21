---
title: カスタム互換エンドポイント
description: PRX で任意の OpenAI 互換 API エンドポイントを LLM プロバイダーとして設定する
---

# カスタム互換エンドポイント

> OpenAI Chat Completions 形式に準拠する任意の LLM API に PRX を接続します。LiteLLM、vLLM、Groq、Mistral、xAI、Venice、Vercel AI、Cloudflare AI、HuggingFace Inference、およびその他の OpenAI 互換サービスで動作します。

## 前提条件

- OpenAI Chat Completions 形式（`/v1/chat/completions` または `/chat/completions`）を実装する稼働中の LLM API
- API キー（サービスが要求する場合）

## クイックセットアップ

### 1. エンドポイントの特定

API のベース URL と認証方法を確認します。例:

- Groq: `https://api.groq.com/openai/v1`
- Mistral: `https://api.mistral.ai/v1`
- xAI: `https://api.x.ai/v1`
- ローカル vLLM: `http://localhost:8000/v1`
- LiteLLM プロキシ: `http://localhost:4000`

### 2. 設定

```toml
[default]
provider = "compatible"
model = "your-model-name"

[providers.compatible]
api_key = "${YOUR_API_KEY}"
api_url = "https://api.your-provider.com/v1"
```

### 3. 検証

```bash
prx doctor models
```

## 組み込み互換プロバイダー

PRX には人気のある OpenAI 互換サービスの事前設定エイリアスが含まれています:

| プロバイダー名 | エイリアス | ベース URL | 認証スタイル |
|--------------|---------|----------|------------|
| Venice | `venice` | `https://api.venice.ai` | Bearer |
| Vercel AI | `vercel`, `vercel-ai` | `https://api.vercel.ai` | Bearer |
| Cloudflare AI | `cloudflare`, `cloudflare-ai` | `https://gateway.ai.cloudflare.com/v1` | Bearer |
| Groq | `groq` | `https://api.groq.com/openai/v1` | Bearer |
| Mistral | `mistral` | `https://api.mistral.ai/v1` | Bearer |
| xAI | `xai`, `grok` | `https://api.x.ai/v1` | Bearer |
| Qianfan | `qianfan`, `baidu` | `https://aip.baidubce.com` | Bearer |
| Synthetic | `synthetic` | `https://api.synthetic.com` | Bearer |
| OpenCode Zen | `opencode`, `opencode-zen` | `https://opencode.ai/zen/v1` | Bearer |
| LiteLLM | `litellm`, `lite-llm` | 設定可能 | Bearer |
| vLLM | `vllm`, `v-llm` | 設定可能 | Bearer |
| HuggingFace | `huggingface`, `hf` | 設定可能 | Bearer |

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 任意 | API 認証キー |
| `api_url` | string | 必須 | API エンドポイントのベース URL |
| `model` | string | 必須 | 使用するモデル名/ID |
| `auth_style` | string | `"bearer"` | 認証ヘッダースタイル（下記参照） |

### 認証スタイル

| スタイル | ヘッダー形式 | 用途 |
|-------|---------------|-------|
| `bearer` | `Authorization: Bearer <key>` | ほとんどのプロバイダー（デフォルト） |
| `x-api-key` | `x-api-key: <key>` | 一部の中国系プロバイダー |
| `custom` | カスタムヘッダー名 | 特殊ケース |

## 機能

### 自動エンドポイント検出

PRX はベース URL に `/chat/completions` を自動的に追加します。エンドポイントパスを含める必要はありません:

```toml
# 正しい - PRX が /chat/completions を追加
api_url = "https://api.groq.com/openai/v1"

# これも正しい - 明示的なパスも動作
api_url = "https://api.groq.com/openai/v1/chat/completions"
```

### Responses API フォールバック

OpenAI のより新しい Responses API をサポートするプロバイダーの場合、PRX は `/v1/chat/completions` が 404 を返した時に `/v1/responses` にフォールバックできます。これはデフォルトで有効ですが、サポートしていないプロバイダー（例: GLM/Zhipu）では無効化できます。

### ネイティブツール呼び出し

ツールは OpenAI の標準的な関数呼び出し形式で送信されます:

```json
{
  "type": "function",
  "function": {
    "name": "tool_name",
    "description": "Tool description",
    "parameters": { "type": "object", "properties": {...} }
  }
}
```

プロバイダーは `tool_choice: "auto"` をサポートし、構造化 `tool_calls` レスポンスを適切にデシリアライズします。

### ビジョンサポート

ビジョン対応モデルの場合、メッセージに `[IMAGE:data:image/png;base64,...]` マーカーとして埋め込まれた画像は、`image_url` コンテンツブロックを含む OpenAI ビジョン形式に自動変換されます。

### ストリーミングサポート

互換プロバイダーはリアルタイムトークン配信のための SSE ストリーミングをサポートしています。ストリームイベントは以下のサポートでインクリメンタルに解析されます:
- `delta.content` テキストチャンク
- `delta.tool_calls`（インクリメンタルなツール呼び出し構築用）
- `[DONE]` マーカー検出
- 適切なタイムアウト処理

### システムメッセージマージ

一部のプロバイダー（例: MiniMax）は `role: system` メッセージを拒否します。PRX は既知の非互換プロバイダーに対して、システムメッセージの内容を最初のユーザーメッセージに自動マージできます。これは既知の非互換プロバイダーではデフォルトで有効です。

### HTTP/1.1 強制モード

一部のプロバイダー（特に DashScope/Qwen）は HTTP/2 ではなく HTTP/1.1 を要求します。PRX はこれらのエンドポイントを自動検出し、接続の信頼性のために HTTP/1.1 を強制します。

### 推論コンテンツフォールバック

`content` の代わりに `reasoning_content` で出力を返す推論モデルの場合、PRX は自動的にフォールバックして推論テキストを抽出します。

## 高度な設定

### ローカル LLM サーバー（vLLM、llama.cpp など）

```toml
[default]
provider = "compatible"
model = "meta-llama/Llama-3.1-8B-Instruct"

[providers.compatible]
api_url = "http://localhost:8000/v1"
# ローカルサーバーでは api_key は不要
```

### LiteLLM プロキシ

```toml
[default]
provider = "litellm"
model = "gpt-4o"

[providers.litellm]
api_key = "${LITELLM_API_KEY}"
api_url = "http://localhost:4000"
```

### 複数のカスタムプロバイダー

モデルルーターを使用して複数の互換プロバイダーを設定:

```toml
[default]
provider = "openrouter"
model = "anthropic/claude-sonnet-4"

[[model_routes]]
pattern = "groq/*"
provider = "compatible"
api_url = "https://api.groq.com/openai/v1"
api_key = "${GROQ_API_KEY}"

[[model_routes]]
pattern = "mistral/*"
provider = "compatible"
api_url = "https://api.mistral.ai/v1"
api_key = "${MISTRAL_API_KEY}"
```

## トラブルシューティング

### 接続拒否

API エンドポイントに到達可能か確認してください:
```bash
curl -v https://api.your-provider.com/v1/models
```

### 401 Unauthorized

- API キーが正しいことを確認
- 認証スタイルがプロバイダーと一致しているか確認（Bearer vs x-api-key）
- 一部のプロバイダーは追加ヘッダーが必要です。利用可能な場合は名前付きプロバイダーエイリアスを使用

### 「role: system」が拒否される

プロバイダーがシステムメッセージをサポートしていない場合、PRX は既知のプロバイダーに対して自動的に処理するはずです。カスタムエンドポイントの場合、これはプロバイダーの制限です。回避策: システム指示を最初のユーザーメッセージに含めてください。

### ストリーミングが機能しない

すべての OpenAI 互換 API がストリーミングをサポートしているわけではありません。ストリーミングに失敗した場合、PRX は自動的に非ストリーミングモードにフォールバックします。

### モデルが見つからない

プロバイダーが期待する正確なモデル名/ID を確認してください。異なるプロバイダーは異なる命名規則を使用しています:
- Groq: `llama-3.3-70b-versatile`
- Mistral: `mistral-large-latest`
- xAI: `grok-2`

正しいモデル識別子についてはプロバイダーのドキュメントを確認してください。
