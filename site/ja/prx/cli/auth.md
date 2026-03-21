---
title: prx auth
description: LLM プロバイダーおよびサービスの OAuth 認証プロファイル管理。
---

# prx auth

OAuth 認証プロファイルを管理します。PRX は、OAuth2 フローをサポートするプロバイダーやサービス（GitHub Copilot、Google Gemini など）に OAuth2 フローを使用します。認証プロファイルはトークンを PRX シークレットストアに安全に保存します。

## 使い方

```bash
prx auth <SUBCOMMAND> [OPTIONS]
```

## サブコマンド

### `prx auth login`

プロバイダーまたはサービスで認証します。

```bash
prx auth login [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--provider` | `-P` | | 認証するプロバイダー（例: `github-copilot`, `google-gemini`） |
| `--profile` | | `default` | 複数アカウント用の名前付きプロファイル |
| `--browser` | | `true` | OAuth フローでブラウザを開く |
| `--device-code` | | `false` | デバイスコードフローを使用（ヘッドレス環境用） |

```bash
# GitHub Copilot にログイン
prx auth login --provider github-copilot

# デバイスコードフロー（ブラウザなし）
prx auth login --provider github-copilot --device-code

# 名前付きプロファイルでログイン
prx auth login --provider google-gemini --profile work
```

ログインフロー：

1. PRX がプロバイダーの OAuth 同意ページ用にブラウザを開きます（またはデバイスコードを表示します）
2. ブラウザで PRX を承認します
3. PRX がアクセストークンとリフレッシュトークンを受け取り安全に保存します
4. トークンは後続の API 呼び出しで自動的に使用されます

### `prx auth refresh`

期限切れのアクセストークンを手動で更新します。

```bash
prx auth refresh [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--provider` | `-P` | すべて | 更新するプロバイダー（省略時はすべてを更新） |
| `--profile` | | `default` | 更新する名前付きプロファイル |

```bash
# すべてのプロバイダーのトークンを更新
prx auth refresh

# 特定のプロバイダーを更新
prx auth refresh --provider github-copilot
```

::: tip
トークンの更新は通常の操作中に自動的に行われます。認証の問題をトラブルシューティングする場合にのみこのコマンドを使用してください。
:::

### `prx auth logout`

プロバイダーの保存済み認証情報を削除します。

```bash
prx auth logout [OPTIONS]
```

| フラグ | 短縮形 | デフォルト | 説明 |
|------|-------|---------|-------------|
| `--provider` | `-P` | | ログアウトするプロバイダー（必須） |
| `--profile` | | `default` | ログアウトする名前付きプロファイル |
| `--all` | | `false` | すべてのプロバイダーとプロファイルからログアウト |

```bash
# GitHub Copilot からログアウト
prx auth logout --provider github-copilot

# すべてからログアウト
prx auth logout --all
```

## 認証プロファイル

プロファイルにより、同じプロバイダーの複数アカウントを使用できます。仕事用と個人用のアカウントを分けたい場合に便利です。

```bash
# 2 つの異なる Google アカウントでログイン
prx auth login --provider google-gemini --profile personal
prx auth login --provider google-gemini --profile work

# チャットで特定のプロファイルを使用
prx chat --provider google-gemini  # "default" プロファイルを使用
```

設定ファイルでプロバイダーごとにアクティブなプロファイルを設定します：

```toml
[providers.google-gemini]
auth_profile = "work"
```

## トークンの保存

トークンは ChaCha20-Poly1305 暗号で暗号化され、`~/.local/share/prx/secrets/` の PRX シークレットストアに保存されます。暗号化キーはマシン ID から導出されます。

## 関連ドキュメント

- [認証の概要](/ja/prx/auth/) -- 認証アーキテクチャ
- [OAuth2 フロー](/ja/prx/auth/oauth2) -- 詳細な OAuth2 フロードキュメント
- [認証プロファイル](/ja/prx/auth/profiles) -- プロファイル管理
- [シークレットストア](/ja/prx/security/secrets) -- トークンの安全な保存方法
