---
title: AWS Bedrock
description: PRX で AWS Bedrock を LLM プロバイダーとして設定する
---

# AWS Bedrock

> AWS Bedrock の Converse API を通じて基盤モデル（Claude、Titan、Llama、Mistral など）にアクセスします。SigV4 認証、ネイティブツール呼び出し、プロンプトキャッシングをサポートしています。

## 前提条件

- Bedrock モデルアクセスが有効化された AWS アカウント
- `bedrock:InvokeModel` 権限を持つ AWS 認証情報（アクセスキー ID + シークレットアクセスキー）

## クイックセットアップ

### 1. モデルアクセスの有効化

1. [AWS Bedrock コンソール](https://console.aws.amazon.com/bedrock/) を開く
2. 左サイドバーの **Model access** に移動
3. 使用するモデル（例: Anthropic Claude、Meta Llama）へのアクセスをリクエスト

### 2. AWS 認証情報の設定

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"  # 任意、デフォルトは us-east-1
```

### 3. PRX の設定

```toml
[default]
provider = "bedrock"
model = "anthropic.claude-sonnet-4-20250514-v1:0"
```

### 4. 検証

```bash
prx doctor models
```

## 利用可能なモデル

モデル ID は Bedrock の `<provider>.<model>-<version>` 形式に従います:

| モデル ID | プロバイダー | コンテキスト | ビジョン | ツール使用 | 備考 |
|----------|----------|---------|--------|----------|-------|
| `anthropic.claude-sonnet-4-20250514-v1:0` | Anthropic | 200K | あり | あり | Claude Sonnet 4 |
| `anthropic.claude-sonnet-4-6-v1:0` | Anthropic | 200K | あり | あり | 最新の Claude Sonnet |
| `anthropic.claude-opus-4-6-v1:0` | Anthropic | 200K | あり | あり | Claude Opus |
| `anthropic.claude-3-5-haiku-20241022-v1:0` | Anthropic | 200K | あり | あり | 高速 Claude モデル |
| `meta.llama3-1-70b-instruct-v1:0` | Meta | 128K | なし | あり | Llama 3.1 70B |
| `mistral.mistral-large-2407-v1:0` | Mistral | 128K | なし | あり | Mistral Large |
| `amazon.titan-text-premier-v1:0` | Amazon | 32K | なし | なし | Amazon Titan |

リージョンで利用可能なモデルの完全なリストは [AWS Bedrock ドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html) を参照してください。

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `model` | string | 必須 | Bedrock モデル ID（例: `anthropic.claude-sonnet-4-6`） |

認証は完全に AWS 環境変数で処理されます:

| 環境変数 | 必須 | 説明 |
|---------------------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | はい | AWS アクセスキー ID |
| `AWS_SECRET_ACCESS_KEY` | はい | AWS シークレットアクセスキー |
| `AWS_SESSION_TOKEN` | いいえ | 一時セッショントークン（引き受けたロール用） |
| `AWS_REGION` | いいえ | AWS リージョン（デフォルト: `us-east-1`） |
| `AWS_DEFAULT_REGION` | いいえ | `AWS_REGION` が設定されていない場合のフォールバックリージョン |

## 機能

### 依存関係ゼロの SigV4 署名

PRX は `hmac` と `sha2` クレートのみを使用して AWS SigV4 リクエスト署名を実装しており、AWS SDK への依存がありません。これによりバイナリサイズが小さく保たれ、SDK バージョンの競合を回避します。署名には以下が含まれます:

- HMAC-SHA256 キー導出チェーン
- ソートされたヘッダーによるカノニカルリクエスト構築
- 一時認証情報用の `x-amz-security-token` サポート

### Converse API

PRX は Bedrock の Converse API（レガシーの InvokeModel API ではなく）を使用し、以下を提供します:
- すべてのモデルプロバイダーで統一されたメッセージ形式
- `toolUse` と `toolResult` ブロックによる構造化ツール呼び出し
- システムプロンプトサポート
- 一貫したレスポンス形式

### ネイティブツール呼び出し

ツールは Bedrock のネイティブ `toolConfig` 形式で `name`、`description`、`inputSchema` を含む `toolSpec` 定義として送信されます。ツール結果は `user` メッセージ内の `toolResult` コンテンツブロックとしてラップされます。

### プロンプトキャッシング

PRX は Bedrock のプロンプトキャッシングヒューリスティクスを適用します（Anthropic プロバイダーと同じしきい値を使用）:
- 3 KB 以上のシステムプロンプトは `cachePoint` ブロックを受け取ります
- 4 つ以上の非システムメッセージを含む会話は、最後のメッセージに `cachePoint` が付与されます

### モデル ID の URL エンコーディング

コロンを含む Bedrock モデル ID（例: `v1:0`）には特別な処理が必要です。PRX は:
- HTTP URL では生のコロンを送信（reqwest のデフォルト動作）
- SigV4 署名のカノニカル URI ではコロンを `%3A` としてエンコード
- この二重アプローチにより、HTTP ルーティングと署名検証の両方が成功します

## プロバイダーエイリアス

以下の名前は Bedrock プロバイダーに解決されます:

- `bedrock`
- `aws-bedrock`

## トラブルシューティング

### 「AWS Bedrock credentials not set」

`AWS_ACCESS_KEY_ID` と `AWS_SECRET_ACCESS_KEY` の両方が環境変数として設定されていることを確認してください。PRX は `~/.aws/credentials` や `~/.aws/config` を読み取りません。

### 403 AccessDeniedException

一般的な原因:
- IAM ユーザー/ロールに `bedrock:InvokeModel` 権限がない
- Bedrock コンソールでモデルへのアクセスをリクエストしていない
- 設定されたリージョンでモデルが利用できない

### SignatureDoesNotMatch

通常、クロックスキューを示します。システムクロックが同期されていることを確認してください:
```bash
# Linux
sudo ntpdate pool.ntp.org
# macOS
sudo sntp -sS pool.ntp.org
```

### リージョンでモデルが利用できない

すべてのモデルがすべてのリージョンで利用できるわけではありません。[Bedrock モデル可用性マトリックス](https://docs.aws.amazon.com/bedrock/latest/userguide/models-regions.html) を確認し、`AWS_REGION` を適切に調整してください。

### 一時認証情報（STS）の使用

AWS STS（引き受けたロール、SSO）を使用している場合、3 つすべての変数を設定してください:
```bash
export AWS_ACCESS_KEY_ID="ASIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_SESSION_TOKEN="..."
```

セッショントークンは `x-amz-security-token` ヘッダーとして SigV4 署名に自動的に含まれます。
