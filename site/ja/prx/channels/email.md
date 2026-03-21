---
title: Email
description: IMAP と SMTP を使用して PRX をメールに接続
---

# Email

> IMAP で受信、SMTP で送信を行い、リアルタイム配信のための IDLE プッシュをサポートして、PRX を任意のメールプロバイダーに接続します。

## 前提条件

- IMAP と SMTP アクセスが有効なメールアカウント
- IMAP/SMTP サーバーのホスト名とポート
- メール認証情報（ユーザー名とパスワード、またはアプリ固有のパスワード）

## クイックセットアップ

### 1. IMAP アクセスの有効化

主要なメールプロバイダーの場合:
- **Gmail**: Gmail 設定 > メール転送と POP/IMAP で IMAP を有効化し、[アプリパスワード](https://myaccount.google.com/apppasswords)を生成
- **Outlook**: IMAP はデフォルトで有効。2FA が有効な場合はアプリパスワードを使用
- **セルフホスト**: メールサーバーで IMAP が有効であることを確認

### 2. 設定

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 465
username = "your-bot@gmail.com"
password = "your-app-password"
from_address = "your-bot@gmail.com"
allowed_senders = ["trusted-user@example.com"]
```

### 3. 検証

```bash
prx channel doctor email
```

## 設定リファレンス

| フィールド | 型 | デフォルト | 説明 |
|-------|------|---------|-------------|
| `imap_host` | `String` | *必須* | IMAP サーバーのホスト名（例: `"imap.gmail.com"`） |
| `imap_port` | `u16` | `993` | IMAP サーバーポート（TLS の場合 993） |
| `imap_folder` | `String` | `"INBOX"` | 新着メッセージをポーリングする IMAP フォルダ |
| `smtp_host` | `String` | *必須* | SMTP サーバーのホスト名（例: `"smtp.gmail.com"`） |
| `smtp_port` | `u16` | `465` | SMTP サーバーポート（暗黙 TLS の場合 465、STARTTLS の場合 587） |
| `smtp_tls` | `bool` | `true` | SMTP 接続に TLS を使用 |
| `username` | `String` | *必須* | IMAP/SMTP 認証用のメールユーザー名 |
| `password` | `String` | *必須* | メールパスワードまたはアプリ固有のパスワード |
| `from_address` | `String` | *必須* | 送信メールの From アドレス |
| `idle_timeout_secs` | `u64` | `1740` | 再接続前の IDLE タイムアウト（秒）（デフォルト: RFC 2177 に準拠した 29 分） |
| `allowed_senders` | `[String]` | `[]` | 許可する送信者アドレスまたはドメイン。空 = すべて拒否。`"*"` = すべて許可 |
| `default_subject` | `String` | `"PRX Message"` | 送信メールのデフォルト件名 |

## 機能

- **IMAP IDLE** -- 新着メールのリアルタイムプッシュ通知（RFC 2177）、ポーリング遅延なし
- **TLS 暗号化** -- IMAP および SMTP サーバーへの接続は TLS で暗号化
- **MIME 解析** -- マルチパートメールを処理し、テキストコンテンツと添付ファイルを抽出
- **ドメインレベルフィルタリング** -- 送信者許可リストでドメイン全体を許可可能（例: `"@company.com"`）
- **自動再接続** -- 29 分のタイムアウト後に IDLE 接続を再確立
- **返信スレッディング** -- 適切な `In-Reply-To` ヘッダーで元のメールスレッドに返信

## 制限事項

- 設定された IMAP フォルダ内のメールのみ処理（デフォルト: INBOX）
- HTML メールはプレーンテキストとして処理（HTML タグは除去）
- 大きな添付ファイルはメモリ制約により完全に処理できない場合あり
- 一部のメールプロバイダーは 2FA 有効時にアプリ固有のパスワードが必要
- IDLE サポートは IMAP サーバーに依存。ほとんどの最新サーバーはサポート

## トラブルシューティング

### IMAP サーバーに接続できない
- `imap_host` と `imap_port` がプロバイダーに対して正しいことを確認
- メールアカウント設定で IMAP アクセスが有効であることを確認
- Gmail を使用する場合、アプリパスワードを生成（2FA では通常のパスワードはブロックされる）
- ファイアウォールで TLS がブロックされていないことを確認

### メールが検出されない
- `imap_folder` が正しいことを確認（デフォルト: `"INBOX"`）
- 送信者のアドレスまたはドメインが `allowed_senders` に含まれていることを確認
- 一部のプロバイダーではメールが IMAP に表示されるまでに遅延がある場合あり

### 返信が送信されない
- `smtp_host`、`smtp_port`、`smtp_tls` の設定がプロバイダーに一致していることを確認
- SMTP 認証情報を確認（IMAP と同じ `username`/`password`、または別の SMTP 認証情報）
- サーバーログで SMTP 拒否理由を確認（例: SPF/DKIM の失敗）
