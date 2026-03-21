---
title: OAuth2 フロー
description: PRX がサポートする LLM プロバイダー認可のための OAuth2 認証フロー
---

# OAuth2 フロー

PRX はブラウザベースの認証をサポートするプロバイダー向けに OAuth2 認可フローを実装しています。これにより、ユーザーは API キーを手動で管理することなく認証できます。

## サポートされるフロー

### 認可コードフロー

Anthropic（Claude Code）、Google Gemini CLI、Minimax で使用:

1. PRX がプロバイダーの認可 URL へブラウザを開く
2. ユーザーが権限を付与
3. プロバイダーが PRX のローカルコールバックサーバーにリダイレクト
4. PRX が認可コードをアクセストークンとリフレッシュトークンに交換
5. トークンがセキュアに保存されて将来使用

### デバイスコードフロー

GitHub Copilot で使用:

1. PRX がプロバイダーにデバイスコードをリクエスト
2. ユーザーが URL にアクセスしてデバイスコードを入力
3. PRX が認可完了をポーリング
4. 認可されるとトークンを受信して保存

## トークン管理

PRX は以下を自動的に処理します:

- 繰り返しの認可を避けるためのトークンキャッシュ
- アクセストークン期限切れ時のリフレッシュトークンローテーション
- トークンのセキュア保存（保存時暗号化）

## 設定

```toml
[auth.oauth2]
redirect_port = 8400
token_cache_path = "~/.local/share/openprx/tokens"
auto_refresh = true
```

## CLI コマンド

```bash
prx auth login anthropic    # Anthropic の OAuth2 フローを開始
prx auth login copilot      # Copilot のデバイスコードフローを開始
prx auth status              # すべてのプロバイダーの認証ステータスを表示
prx auth logout anthropic   # Anthropic のトークンを取り消し
```

## 関連ページ

- [認証概要](./)
- [プロバイダープロファイル](./profiles)
