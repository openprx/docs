---
title: Google Gemini
description: PRX で Google Gemini を LLM プロバイダーとして設定する
---

# Google Gemini

> Google Generative Language API を通じて Gemini モデルにアクセスします。API キー、Gemini CLI OAuth トークン、最大 200 万トークンのロングコンテキストウィンドウをサポートしています。

## 前提条件

- [aistudio.google.com](https://aistudio.google.com/app/apikey) から取得した Google AI Studio API キー、**または**
- Gemini CLI がインストール済みで認証済み（`gemini` コマンド）、**または**
- `GEMINI_API_KEY` または `GOOGLE_API_KEY` 環境変数

## クイックセットアップ

### 1. API キーの取得

**オプション A: API キー（ほとんどのユーザーに推奨）**

1. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) にアクセス
2. **Create API key** をクリック
3. キーをコピー

**オプション B: Gemini CLI（既存ユーザーはゼロコンフィグ）**

すでに Gemini CLI を使用している場合、PRX は `~/.gemini/oauth_creds.json` から OAuth トークンを自動検出します。追加設定は不要です。

### 2. 設定

```toml
[default]
provider = "gemini"
model = "gemini-2.5-flash"

[providers.gemini]
api_key = "${GEMINI_API_KEY}"
```

または環境変数を設定:

```bash
export GEMINI_API_KEY="AIza..."
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

| モデル | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|---------|--------|----------|-------|
| `gemini-2.5-pro` | 1M | あり | あり | 最も高性能な Gemini モデル |
| `gemini-2.5-flash` | 1M | あり | あり | 高速かつコスト効率が高い |
| `gemini-2.0-flash` | 1M | あり | あり | 前世代の Flash |
| `gemini-1.5-pro` | 2M | あり | あり | 最長のコンテキストウィンドウ |
| `gemini-1.5-flash` | 1M | あり | あり | 前世代 |

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 任意 | Google AI API キー（`AIza...`） |
| `model` | string | `gemini-2.5-flash` | 使用するデフォルトモデル |

## 機能

### 複数の認証方法

PRX は以下の優先順位で Gemini 認証情報を解決します:

| 優先度 | ソース | 仕組み |
|----------|--------|--------------|
| 1 | 設定内の明示的 API キー | `?key=` クエリパラメーターとしてパブリック API に送信 |
| 2 | `GEMINI_API_KEY` 環境変数 | 上記と同じ |
| 3 | `GOOGLE_API_KEY` 環境変数 | 上記と同じ |
| 4 | Gemini CLI OAuth トークン | 内部 Code Assist API に `Authorization: Bearer` として送信 |

### Gemini CLI OAuth 統合

Gemini CLI（`gemini` コマンド）で認証済みの場合、PRX は自動的に:

1. `~/.gemini/oauth_creds.json` を読み取り
2. トークンの有効期限を確認（期限切れトークンは警告と共にスキップ）
3. 適切なエンベロープ形式を使用して、Google 内部の Code Assist API（`cloudcode-pa.googleapis.com`）にリクエストをルーティング

これにより、既存の Gemini CLI ユーザーは追加設定なしで PRX を使用できます。

### ロングコンテキストウィンドウ

Gemini モデルは非常に長いコンテキストウィンドウ（Gemini 1.5 Pro で最大 200 万トークン）をサポートしています。PRX はデフォルトで `maxOutputTokens` を 8192 に設定します。完全な会話履歴は適切なロールマッピング（`user`/`model`）で `contents` として送信されます。

### システムインストラクション

システムプロンプトは Gemini のネイティブ `systemInstruction` フィールドを使用して送信されます（通常のメッセージとしてではなく）。これにより、モデルによって正しく処理されることが保証されます。

### 自動モデル名フォーマット

PRX は必要に応じてモデル名に `models/` を自動的に付加します。`gemini-2.5-flash` と `models/gemini-2.5-flash` の両方が正しく動作します。

## プロバイダーエイリアス

以下の名前はすべて Gemini プロバイダーに解決されます:

- `gemini`
- `google`
- `google-gemini`

## トラブルシューティング

### 「Gemini API key not found」

PRX が認証情報を見つけられませんでした。対処法:

1. `GEMINI_API_KEY` 環境変数を設定
2. `gemini` CLI を実行して認証（トークンは自動的に再利用されます）
3. [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) から API キーを取得
4. `prx onboard` を実行してインタラクティブに設定

### 「400 Bad Request: API key not valid」（Gemini CLI 使用時）

Gemini CLI からの OAuth トークンがパブリック API エンドポイントに送信された場合に発生します。PRX は OAuth トークンを内部の `cloudcode-pa.googleapis.com` エンドポイントに自動的にルーティングして処理します。このエラーが表示された場合、最新バージョンの PRX を使用していることを確認してください。

### 「Gemini CLI OAuth token expired」

`gemini` CLI を再実行してトークンを更新してください。PRX は Gemini CLI トークンを自動更新しません（Anthropic OAuth トークンとは異なります）。

### 403 Forbidden

API キーで Generative Language API が有効になっていない可能性があります。[Google Cloud Console](https://console.cloud.google.com/) に移動し、プロジェクトの **Generative Language API** を有効にしてください。
