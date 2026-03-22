---
title: 設定リファレンス
description: "トランスポート設定、ストレージオプション、添付ファイルポリシー、環境変数、ランタイムチューニングを含むPRX-Email設定の完全リファレンス。"
---

# 設定リファレンス

このページはすべてのPRX-Email設定オプション、環境変数、ランタイム設定の完全リファレンスです。

## トランスポート設定

`EmailTransportConfig`構造体はIMAPとSMTP接続の両方を設定します：

```rust
use prx_email::plugin::{
    EmailTransportConfig, ImapConfig, SmtpConfig, AuthConfig,
    AttachmentPolicy, AttachmentStoreConfig,
};

let config = EmailTransportConfig {
    imap: ImapConfig { /* ... */ },
    smtp: SmtpConfig { /* ... */ },
    attachment_store: Some(AttachmentStoreConfig { /* ... */ }),
    attachment_policy: AttachmentPolicy::default(),
};
```

### IMAP設定

| フィールド | タイプ | デフォルト | 説明 |
|---------|------|---------|------|
| `imap.host` | `String` | （必須） | IMAPサーバーホスト名 |
| `imap.port` | `u16` | （必須） | IMAPサーバーポート（通常993） |
| `imap.user` | `String` | （必須） | IMAPユーザー名 |
| `imap.auth.password` | `Option<String>` | `None` | LOGINアーカイブのパスワード |
| `imap.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2のOAuthトークン |

### SMTP設定

| フィールド | タイプ | デフォルト | 説明 |
|---------|------|---------|------|
| `smtp.host` | `String` | （必須） | SMTPサーバーホスト名 |
| `smtp.port` | `u16` | （必須） | SMTPサーバーポート（465または587） |
| `smtp.user` | `String` | （必須） | SMTPユーザー名 |
| `smtp.auth.password` | `Option<String>` | `None` | PLAIN/LOGINのパスワード |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2のOAuthトークン |

### 検証ルール

- `imap.host`と`smtp.host`は空であってはならない
- `imap.user`と`smtp.user`は空であってはならない
- 各プロトコルで`password`または`oauth_token`のいずれか一方のみを設定する必要がある
- `attachment_policy.max_size_bytes`は0より大きくなければならない
- `attachment_policy.allowed_content_types`は空であってはならない

## ストレージ設定

### StoreConfig

| フィールド | タイプ | デフォルト | 説明 |
|---------|------|---------|------|
| `enable_wal` | `bool` | `true` | WALジャーナルモードを有効化 |
| `busy_timeout_ms` | `u64` | `5000` | SQLiteのビジータイムアウト（ミリ秒） |
| `wal_autocheckpoint_pages` | `i64` | `1000` | 自動チェックポイント間のページ数 |
| `synchronous` | `SynchronousMode` | `Normal` | 同期モード：`Full`、`Normal`、`Off` |

### 適用されるSQLiteプラグマ

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- when enable_wal = true
PRAGMA synchronous = NORMAL;      -- matches synchronous setting
PRAGMA wal_autocheckpoint = 1000; -- matches wal_autocheckpoint_pages
```

## 添付ファイルポリシー

### AttachmentPolicy

| フィールド | タイプ | デフォルト | 説明 |
|---------|------|---------|------|
| `max_size_bytes` | `usize` | `26,214,400`（25 MiB） | 最大添付ファイルサイズ |
| `allowed_content_types` | `HashSet<String>` | 以下を参照 | 許可されたMIMEタイプ |

### デフォルトで許可されるMIMEタイプ

| MIMEタイプ | 説明 |
|-----------|------|
| `application/pdf` | PDFドキュメント |
| `image/jpeg` | JPEG画像 |
| `image/png` | PNG画像 |
| `text/plain` | プレーンテキストファイル |
| `application/zip` | ZIPアーカイブ |

### AttachmentStoreConfig

| フィールド | タイプ | デフォルト | 説明 |
|---------|------|---------|------|
| `enabled` | `bool` | （必須） | 添付ファイルの永続化を有効化 |
| `dir` | `String` | （必須） | 保存された添付ファイルのルートディレクトリ |

::: warning パス安全性
添付ファイルのパスはディレクトリトラバーサル攻撃に対して検証されます。設定された`dir`ルート外で解決されるパス（シンボリックリンクベースのエスケープを含む）はすべて拒否されます。
:::

## 同期ランナー設定

### SyncRunnerConfig

| フィールド | タイプ | デフォルト | 説明 |
|---------|------|---------|------|
| `max_concurrency` | `usize` | `4` | ランナーティックごとの最大ジョブ数 |
| `base_backoff_seconds` | `i64` | `10` | 失敗時の初期バックオフ |
| `max_backoff_seconds` | `i64` | `300` | 最大バックオフ（5分） |

## 環境変数

### OAuthトークン管理

| 変数 | 説明 |
|-----|------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAPのOAuthアクセストークン |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTPのOAuthアクセストークン |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAPトークンの期限切れ（Unix秒） |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTPトークンの期限切れ（Unix秒） |

デフォルトのプレフィックスは`PRX_EMAIL`です。ランタイムでこれらを読み込むには`reload_auth_from_env("PRX_EMAIL")`を使用します。

### WASMプラグイン

| 変数 | デフォルト | 説明 |
|-----|---------|------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | 未設定（無効） | WASMコンテキストから実際のIMAP/SMTPを有効にするには`1`に設定 |

## API制限

| 制限 | 値 | 説明 |
|-----|---|------|
| 一覧/検索の最小制限 | 1 | 最小`limit`パラメータ |
| 一覧/検索の最大制限 | 500 | 最大`limit`パラメータ |
| デバッグメッセージの切り捨て | 160文字 | プロバイダのデバッグメッセージは切り捨てられる |
| メッセージスニペット長 | 120文字 | 自動生成されるメッセージスニペット |

## エラーコード

| コード | 説明 |
|------|------|
| `Validation` | 入力検証失敗（空フィールド、範囲外の制限、不明なフィーチャー） |
| `FeatureDisabled` | フィーチャーフラグによりブロックされた操作 |
| `Network` | IMAP/SMTP接続またはプロトコルエラー |
| `Provider` | メールプロバイダが操作を拒否 |
| `Storage` | SQLiteデータベースエラー |

## アウトボックス定数

| 定数 | 値 | 説明 |
|-----|---|------|
| バックオフのベース | 5秒 | 初期リトライバックオフ |
| バックオフの計算式 | `5 * 2^retries` | 指数増加 |
| 最大リトライ | 無制限 | バックオフの増加でキャップ |
| べき等性キー | `outbox-{id}-{retries}` | 決定論的なMessage-ID |

## フィーチャーフラグ

| フラグ | 説明 | リスクレベル |
|-------|------|----------|
| `inbox_read` | メッセージの一覧表示と取得 | 低 |
| `inbox_search` | クエリでメッセージを検索 | 低 |
| `email_send` | 新しいメールを送信 | 中 |
| `email_reply` | 既存のメールに返信 | 中 |
| `outbox_retry` | 失敗したアウトボックスメッセージをリトライ | 低 |

## ロギング

PRX-Emailは以下の形式で構造化ログをstderrに出力します：

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### セキュリティ

- OAuthトークン、パスワード、APIキーは**ログに記録されない**
- メールアドレスはデバッグログで削除される（例：`a***@example.com`）
- プロバイダのデバッグメッセージはサニタイズされる：認証ヘッダーが削除され、出力は160文字に切り捨てられる

## 次のステップ

- [インストール](../getting-started/installation) -- PRX-Emailをセットアップ
- [アカウント管理](../accounts/) -- アカウントとフィーチャーを設定
- [トラブルシューティング](../troubleshooting/) -- 設定問題を解決
