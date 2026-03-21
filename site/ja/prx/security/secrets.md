---
title: シークレット管理
description: PRX での API キーと認証情報のセキュアな保存とアクセス制御
---

# シークレット管理

PRX は API キー、トークン、認証情報などの機密データのセキュアな保存を提供します。シークレットは保存時に暗号化され、制御された API を通じてアクセスされます。

## 概要

シークレットシステム:

- AES-256-GCM を使用して保存時にシークレットを暗号化
- マスターパスワードまたはシステムキーリングから暗号化キーを導出
- ツール実行のための環境変数インジェクションを提供
- シークレットのローテーションと有効期限をサポート

## ストレージ

シークレットは `~/.local/share/openprx/secrets.enc` の暗号化ファイルに保存されます。暗号化キーは以下から導出されます:

1. システムキーリング（利用可能な場合に推奨）
2. マスターパスワード（インタラクティブプロンプト）
3. 環境変数 `PRX_MASTER_KEY`（自動化用）

## 設定

```toml
[security.secrets]
store_path = "~/.local/share/openprx/secrets.enc"
key_derivation = "argon2id"
auto_rotate_days = 90
```

## CLI コマンド

```bash
prx secret set OPENAI_API_KEY      # シークレットを設定（値の入力を促す）
prx secret get OPENAI_API_KEY      # シークレットを取得
prx secret list                    # シークレット名を一覧表示（値は非表示）
prx secret delete OPENAI_API_KEY   # シークレットを削除
prx secret rotate                  # マスターキーをローテーション
```

## 関連ページ

- [セキュリティ概要](./)
- [認証](/ja/prx/auth/)
