---
title: 認証
description: OAuth2 フローとプロバイダープロファイルを含む PRX 認証システムの概要
---

# 認証

PRX は LLM プロバイダー、API アクセス、ノード間通信のために複数の認証メカニズムをサポートします。認証システムは OAuth2 フロー、API キー管理、プロバイダー固有の認証を処理します。

## 概要

PRX の認証は複数のレベルで動作します:

| レベル | メカニズム | 目的 |
|-------|-----------|---------|
| プロバイダー認証 | OAuth2 / API キー | LLM プロバイダーとの認証 |
| ゲートウェイ認証 | Bearer トークン | API クライアントの認証 |
| ノード認証 | Ed25519 ペアリング | 分散ノードの認証 |

## プロバイダー認証

各 LLM プロバイダーにはそれぞれの認証方式があります:

- **API キー** -- リクエストヘッダーで渡される静的キー（ほとんどのプロバイダー）
- **OAuth2** -- ブラウザベースの認可フロー（Anthropic、Google、GitHub Copilot）
- **AWS IAM** -- Bedrock 用のロールベース認証

## 設定

```toml
[auth]
default_method = "api_key"

[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
```

## 関連ページ

- [OAuth2 フロー](./oauth2)
- [プロバイダープロファイル](./profiles)
- [シークレット管理](/ja/prx/security/secrets)
