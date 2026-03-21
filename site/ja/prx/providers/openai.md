---
title: OpenAI
description: PRX で OpenAI を LLM プロバイダーとして設定する
---

# OpenAI

> OpenAI Chat Completions API を通じて GPT モデルにアクセスします。ネイティブ関数呼び出し、ビジョン、推論モデルをサポートしています。

## 前提条件

- [platform.openai.com](https://platform.openai.com/) から取得した OpenAI API キー

## クイックセットアップ

### 1. API キーの取得

1. [platform.openai.com](https://platform.openai.com/) でサインアップ
2. 左サイドバーの **API Keys** に移動
3. **Create new secret key** をクリックしてコピー（`sk-` で始まります）

### 2. 設定

```toml
[default]
provider = "openai"
model = "gpt-4o"

[providers.openai]
api_key = "${OPENAI_API_KEY}"
```

または環境変数を設定:

```bash
export OPENAI_API_KEY="sk-..."
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

| モデル | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|---------|--------|----------|-------|
| `gpt-4o` | 128K | あり | あり | 最高の汎用モデル |
| `gpt-4o-mini` | 128K | あり | あり | 小型、高速、低コスト |
| `gpt-4-turbo` | 128K | あり | あり | 前世代のフラッグシップ |
| `o3` | 128K | あり | あり | 推論モデル |
| `o4-mini` | 128K | あり | あり | 小型推論モデル |
| `gpt-4` | 8K | なし | あり | オリジナル GPT-4 |

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 必須 | OpenAI API キー（`sk-...`） |
| `api_url` | string | `https://api.openai.com/v1` | カスタム API ベース URL |
| `model` | string | `gpt-4o` | 使用するデフォルトモデル |

## 機能

### ネイティブ関数呼び出し

PRX はツールを OpenAI のネイティブ `function` 形式で送信します。ツール定義には `name`、`description`、`parameters`（JSON Schema）が含まれます。プロバイダーは自動ツール選択のための `tool_choice: "auto"` をサポートしています。

### ビジョン

ビジョン対応モデル（GPT-4o、GPT-4o-mini）は、会話に含まれる画像を分析できます。画像は標準的なメッセージ形式でインラインで送信されます。

### 推論モデルサポート

推論モデル（o1、o3、o4-mini）の場合、PRX は `reasoning_content` フォールバックを自動的に処理します。モデルが `content` の代わりに `reasoning_content` で出力を返した場合、PRX は推論テキストを透過的に抽出します。

### マルチターン会話

システムプロンプト、ユーザーメッセージ、アシスタントレスポンス、ツール呼び出し/結果ペアを含む完全な会話履歴が、OpenAI のネイティブ構造化形式で保持され API に送信されます。

### カスタムベース URL

プロキシ、Azure OpenAI、または任意の OpenAI 互換エンドポイントを使用する場合:

```toml
[providers.openai]
api_key = "${OPENAI_API_KEY}"
api_url = "https://my-proxy.example.com/v1"
```

### コネクションウォームアップ

起動時に PRX は軽量な `GET /models` リクエストを送信して TLS と HTTP/2 コネクションプーリングを確立し、最初の実際のリクエストのレイテンシを削減します。

## トラブルシューティング

### 「OpenAI API key not set」

`OPENAI_API_KEY` 環境変数を設定するか、`config.toml` の `[providers.openai]` に `api_key` を追加してください。

### 429 レート制限

OpenAI は分あたりのトークン数とリクエスト数に制限を設けています。対処法:
- 待ってリトライ（PRX はリライアブルプロバイダーラッパーで自動的に処理）
- OpenAI プランをアップグレードしてレート制限を引き上げ
- `fallback_providers` を使用して、レート制限時に別のプロバイダーにフォールバック

### 推論モデルからの空レスポンス

o1/o3/o4-mini を使用して空のレスポンスが返される場合、これはモデルの出力が完全に `reasoning_content` にある場合の想定される動作です。PRX は `content` が空の場合、自動的に `reasoning_content` にフォールバックします。
