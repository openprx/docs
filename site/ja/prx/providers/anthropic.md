---
title: Anthropic
description: PRX で Anthropic Claude を LLM プロバイダーとして設定する
---

# Anthropic

> Anthropic Messages API を通じて Claude モデル（Opus、Sonnet、Haiku）にアクセスします。ネイティブツール使用、ビジョン、プロンプトキャッシング、OAuth トークン自動更新をサポートしています。

## 前提条件

- [console.anthropic.com](https://console.anthropic.com/) から取得した Anthropic API キー、**または**
- Claude Code OAuth トークン（`~/.claude/.credentials.json` から自動検出）

## クイックセットアップ

### 1. API キーの取得

1. [console.anthropic.com](https://console.anthropic.com/) でサインアップ
2. ダッシュボードの **API Keys** に移動
3. **Create Key** をクリックしてキーをコピー（`sk-ant-` で始まります）

### 2. 設定

```toml
[default]
provider = "anthropic"
model = "claude-sonnet-4-20250514"

[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
```

または環境変数を設定:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

| モデル | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|---------|--------|----------|-------|
| `claude-opus-4-20250514` | 200K | あり | あり | 最も高性能、複雑な推論に最適 |
| `claude-sonnet-4-20250514` | 200K | あり | あり | 速度と性能の最適なバランス |
| `claude-haiku-3-5-20241022` | 200K | あり | あり | 最速、最もコスト効率が高い |
| `claude-sonnet-4-6` | 200K | あり | あり | 最新の Sonnet リリース |
| `claude-opus-4-6` | 200K | あり | あり | 最新の Opus リリース |

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 必須 | Anthropic API キー（`sk-ant-...`）または OAuth トークン |
| `api_url` | string | `https://api.anthropic.com` | カスタム API ベース URL（プロキシ用） |
| `model` | string | `claude-sonnet-4-20250514` | 使用するデフォルトモデル |

## 機能

### ネイティブツール呼び出し

PRX はツール定義を Anthropic のネイティブ形式で `input_schema` 付きで送信し、OpenAI から Anthropic への形式変換による損失を回避します。ツール結果は `tool_result` コンテンツブロックとして適切にラップされます。

### ビジョン（画像分析）

メッセージに `[IMAGE:data:image/png;base64,...]` マーカーとして埋め込まれた画像は、適切な `media_type` と `source_type` フィールドを持つ Anthropic ネイティブの `image` コンテンツブロックに自動変換されます。最大 20 MB の画像がサポートされます（このサイズを超えるペイロードに対しては警告がログに記録されます）。

### プロンプトキャッシング

PRX は Anthropic のエフェメラルプロンプトキャッシングを自動的に適用し、コストとレイテンシを削減します:

- 約 1024 トークン（3 KB）以上の**システムプロンプト**は `cache_control` ブロックを受け取ります
- 4 つ以上の非システムメッセージを含む**会話**では、最後のメッセージがキャッシュされます
- **ツール定義**では、最後のツールに `cache_control: ephemeral` が付与されます

設定は不要で、キャッシングは透過的に適用されます。

### OAuth トークン自動更新

Claude Code 認証情報を使用する場合、PRX は自動的に:

1. `~/.claude/.credentials.json` からキャッシュされた OAuth トークンを検出
2. 有効期限の 90 秒前にトークンをプロアクティブに更新
3. 401 レスポンス時に新しいトークンでリトライ
4. 更新された認証情報をディスクに永続化

これにより、`prx` は追加設定なしで既存の Claude Code ログインを利用できます。

### Claude Code 統合

PRX は以下を Anthropic 認証ソースとして認識します:

| ソース | 検出方法 |
|--------|-----------|
| 直接 API キー | `sk-ant-api-...` プレフィックス、`x-api-key` ヘッダーで送信 |
| OAuth セットアップトークン | `sk-ant-oat01-...` プレフィックス、`anthropic-beta` ヘッダー付き `Authorization: Bearer` で送信 |
| Claude Code キャッシュ認証情報 | `~/.claude/.credentials.json` の `access_token` + `refresh_token` |
| 環境変数 | `ANTHROPIC_API_KEY` |

### カスタムベース URL

プロキシまたは代替エンドポイントを経由する場合:

```toml
[providers.anthropic]
api_key = "${ANTHROPIC_API_KEY}"
api_url = "https://my-proxy.example.com"
```

## プロバイダーエイリアス

以下の名前はすべて Anthropic プロバイダーに解決されます:

- `anthropic`
- `claude-code`
- `claude-cli`

## トラブルシューティング

### 「Anthropic credentials not set」

PRX が認証情報を見つけられませんでした。以下のいずれかが設定されていることを確認してください:

1. `ANTHROPIC_API_KEY` 環境変数
2. `config.toml` の `[providers.anthropic]` セクションの `api_key`
3. Claude Code の有効な `~/.claude/.credentials.json`

### 401 Unauthorized

- **API キー**: `sk-ant-api-` で始まり、有効期限が切れていないことを確認
- **OAuth トークン**: `prx auth login --provider anthropic` を実行して再認証するか、Claude Code を再起動してトークンを更新
- **プロキシの問題**: カスタム `api_url` を使用している場合、プロキシが `x-api-key` または `Authorization` ヘッダーを正しく転送していることを確認

### 画像ペイロードが大きすぎる

Anthropic では base64 エンコード形式で 20 MB 以下の画像を推奨しています。送信前に大きな画像をリサイズまたは圧縮してください。

### プロンプトキャッシングが機能しない

キャッシングは自動ですが、以下の条件が必要です:
- システムレベルキャッシングをトリガーするには、システムプロンプトが 3 KB 以上
- 会話キャッシングをトリガーするには、非システムメッセージが 4 つ以上
- API バージョン `2023-06-01`（PRX が自動的に設定）
