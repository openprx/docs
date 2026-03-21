---
title: 認証プロファイル
description: PRX で複数のプロバイダーアカウントを管理するための名前付き認証プロファイル
---

# プロバイダープロファイル

プロバイダープロファイルを使用すると、同じプロバイダーに対して複数の認証コンテキストを設定できます。個人用と仕事用で別々のアカウントがある場合や、開発用と本番用の API キーを切り替える場合に便利です。

## 概要

プロファイルは以下を含む名前付き設定です:

- プロバイダー識別子
- 認証情報（API キーまたは OAuth2 トークン）
- モデルプリファレンス
- レート制限オーバーライド

## 設定

```toml
[[auth.profiles]]
name = "personal"
provider = "anthropic"
api_key = "sk-ant-personal-..."
default_model = "claude-haiku"

[[auth.profiles]]
name = "work"
provider = "anthropic"
api_key = "sk-ant-work-..."
default_model = "claude-sonnet-4-6"
```

## プロファイルの切り替え

```bash
# 特定のプロファイルを使用
prx chat --profile work

# デフォルトプロファイルを設定
prx auth set-default work

# プロファイル一覧
prx auth profiles
```

## 環境変数

プロファイルは認証情報に環境変数を参照できます:

```toml
[[auth.profiles]]
name = "ci"
provider = "anthropic"
api_key = "${ANTHROPIC_API_KEY}"
```

## 関連ページ

- [認証概要](./)
- [OAuth2 フロー](./oauth2)
- [シークレット管理](/ja/prx/security/secrets)
