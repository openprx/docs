---
title: GLM（智譜 AI）
description: PRX で GLM および関連する中国 AI プロバイダー（Minimax、Moonshot、Qwen、Z.AI）を設定する
---

# GLM（智譜 AI）

> 統一された設定を通じて Zhipu GLM モデルおよび中国 AI プロバイダーファミリーにアクセスします。Minimax、Moonshot（Kimi）、Qwen（DashScope）、Z.AI のエイリアスを含みます。

## 前提条件

- [open.bigmodel.cn](https://open.bigmodel.cn/) から取得した Zhipu AI API キー（GLM モデル用）、**または**
- 使用する特定のプロバイダー（Minimax、Moonshot、Qwen など）の API キー

## クイックセットアップ

### 1. API キーの取得

1. [open.bigmodel.cn](https://open.bigmodel.cn/) でサインアップ
2. API Keys セクションに移動
3. 新しいキーを作成（形式: `id.secret`）

### 2. 設定

```toml
[default]
provider = "glm"
model = "glm-4-plus"

[providers.glm]
api_key = "${GLM_API_KEY}"
```

または環境変数を設定:

```bash
export GLM_API_KEY="abc123.secretXYZ"
```

### 3. 検証

```bash
prx doctor models
```

## 利用可能なモデル

### GLM モデル

| モデル | コンテキスト | ビジョン | ツール使用 | 備考 |
|-------|---------|--------|----------|-------|
| `glm-4-plus` | 128K | あり | あり | 最も高性能な GLM モデル |
| `glm-4` | 128K | あり | あり | 標準 GLM-4 |
| `glm-4-flash` | 128K | あり | あり | 高速かつコスト効率が高い |
| `glm-4v` | 128K | あり | あり | ビジョン最適化 |

### エイリアスプロバイダー

PRX は OpenAI 互換インターフェースを通じてルーティングされるエイリアスとして、以下のプロバイダーもサポートしています:

| プロバイダー | エイリアス名 | ベース URL | 主要モデル |
|----------|-------------|----------|------------|
| **Minimax** | `minimax`, `minimax-intl`, `minimax-cn` | `api.minimax.io/v1`（国際）、`api.minimaxi.com/v1`（中国） | `MiniMax-Text-01`, `abab6.5s` |
| **Moonshot** | `moonshot`, `kimi`, `moonshot-intl`, `kimi-cn` | `api.moonshot.ai/v1`（国際）、`api.moonshot.cn/v1`（中国） | `moonshot-v1-128k`, `moonshot-v1-32k` |
| **Qwen** | `qwen`, `dashscope`, `qwen-intl`, `qwen-us` | `dashscope.aliyuncs.com`（中国）、`dashscope-intl.aliyuncs.com`（国際） | `qwen-max`, `qwen-plus`, `qwen-turbo` |
| **Z.AI** | `zai`, `z.ai`, `zai-cn` | `api.z.ai/api/coding/paas/v4`（グローバル）、`open.bigmodel.cn/api/coding/paas/v4`（中国） | Z.AI コーディングモデル |

## 設定リファレンス

### GLM（ネイティブプロバイダー）

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 必須 | `id.secret` 形式の GLM API キー |
| `model` | string | 必須 | GLM モデル名 |

### エイリアスプロバイダー（OpenAI 互換）

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `api_key` | string | 必須 | プロバイダー固有の API キー |
| `api_url` | string | 自動検出 | デフォルトベース URL の上書き |
| `model` | string | 必須 | モデル名 |

## 機能

### JWT 認証

GLM はプレーンな API キーではなく JWT ベースの認証を使用します。PRX は自動的に:

1. API キーを `id` と `secret` コンポーネントに分割
2. 以下を含む JWT トークンを生成:
   - ヘッダー: `{"alg":"HS256","typ":"JWT","sign_type":"SIGN"}`
   - ペイロード: `{"api_key":"<id>","exp":<expiry_ms>,"timestamp":<now_ms>}`
   - 署名: シークレットキーによる HMAC-SHA256
3. JWT を 3 分間キャッシュ（トークンは 3.5 分で期限切れ）
4. `Authorization: Bearer <jwt>` として送信

### リージョナルエンドポイント

ほとんどのエイリアスプロバイダーは国際版と中国大陸版の両方のエンドポイントを提供しています:

```toml
# 国際版（ほとんどのデフォルト）
provider = "moonshot-intl"

# 中国大陸
provider = "moonshot-cn"

# 明示的なリージョナルバリアント
provider = "qwen-us"      # 米国リージョン
provider = "qwen-intl"    # 国際
provider = "qwen-cn"      # 中国大陸
```

### Minimax OAuth サポート

Minimax は OAuth トークン認証をサポートしています:

```bash
export MINIMAX_OAUTH_TOKEN="..."
export MINIMAX_OAUTH_REFRESH_TOKEN="..."
```

API キー認証の代わりに OAuth を使用するには `provider = "minimax-oauth"` または `provider = "minimax-oauth-cn"` を設定してください。

### Qwen OAuth およびコーディングモード

Qwen は追加のアクセスモードを提供しています:

- **Qwen OAuth**: OAuth ベースのアクセスには `provider = "qwen-oauth"` または `provider = "qwen-code"`
- **Qwen コーディング**: コーディング特化 API エンドポイントには `provider = "qwen-coding"` または `provider = "dashscope-coding"`

## プロバイダーエイリアスリファレンス

| エイリアス | 解決先 | エンドポイント |
|-------|-------------|----------|
| `glm`, `zhipu`, `glm-global`, `zhipu-global` | GLM（グローバル） | `api.z.ai/api/paas/v4` |
| `glm-cn`, `zhipu-cn`, `bigmodel` | GLM（中国） | `open.bigmodel.cn/api/paas/v4` |
| `minimax`, `minimax-intl`, `minimax-global` | MiniMax（国際） | `api.minimax.io/v1` |
| `minimax-cn`, `minimaxi` | MiniMax（中国） | `api.minimaxi.com/v1` |
| `moonshot`, `kimi`, `moonshot-cn`, `kimi-cn` | Moonshot（中国） | `api.moonshot.cn/v1` |
| `moonshot-intl`, `kimi-intl`, `kimi-global` | Moonshot（国際） | `api.moonshot.ai/v1` |
| `qwen`, `dashscope`, `qwen-cn` | Qwen（中国） | `dashscope.aliyuncs.com` |
| `qwen-intl`, `dashscope-intl` | Qwen（国際） | `dashscope-intl.aliyuncs.com` |
| `qwen-us`, `dashscope-us` | Qwen（米国） | `dashscope-us.aliyuncs.com` |
| `zai`, `z.ai` | Z.AI（グローバル） | `api.z.ai/api/coding/paas/v4` |
| `zai-cn`, `z.ai-cn` | Z.AI（中国） | `open.bigmodel.cn/api/coding/paas/v4` |

## トラブルシューティング

### 「GLM API key not set or invalid format」

GLM API キーは `id.secret` 形式（正確に 1 つのドットを含む）でなければなりません。キーの形式を確認してください:
```
abc123.secretXYZ  # 正しい
abc123secretXYZ   # 間違い - ドットがない
```

### JWT 生成の失敗

システムクロックが正確であることを確認してください。JWT トークンにはタイムスタンプが含まれ、3.5 分後に期限切れとなります。

### MiniMax「role: system」が拒否される

MiniMax は `role: system` メッセージを受け付けません。PRX は MiniMax プロバイダー使用時に、システムメッセージの内容を最初のユーザーメッセージに自動的にマージします。

### Qwen/DashScope のタイムアウト

Qwen の DashScope API は HTTP/1.1（HTTP/2 ではなく）を必要とします。PRX は DashScope エンドポイントに対して HTTP/1.1 を自動的に強制します。タイムアウトが発生する場合は、ネットワークが HTTP/1.1 接続を許可していることを確認してください。

### リージョナルエンドポイントのエラー

接続エラーが発生する場合は、リージョナルエンドポイントの切り替えを試してください:
- 中国のユーザー: `*-cn` バリアントを使用
- 国際ユーザー: `*-intl` またはベースバリアントを使用
- 米国のユーザー: Qwen には `qwen-us` を試す
