---
title: OAuth認証
description: "PRX-EmailのGmailとOutlook向けOAuth 2.0 XOAUTH2認証の設定。トークンライフサイクル管理、リフレッシュプロバイダ、ホットリロード。"
---

# OAuth認証

PRX-EmailはIMAPとSMTPの両方でXOAUTH2メカニズムを通じてOAuth 2.0認証をサポートします。これはOutlook/Office 365に必須で、Gmailに推奨されます。プラグインはトークン期限切れ追跡、プラガブルなリフレッシュプロバイダ、環境ベースのホットリロードを提供します。

## XOAUTH2の動作方法

XOAUTH2は従来のパスワード認証をOAuthアクセストークンに置き換えます。クライアントはIMAP AUTHENTICATEまたはSMTP AUTH中に特別なフォーマットの文字列を送信します：

```
user=<email>\x01auth=Bearer <access_token>\x01\x01
```

`auth.oauth_token`が設定されている場合、PRX-Emailはこれを自動的に処理します。

## Gmail OAuthセットアップ

### 1. Google Cloudの認証情報を作成する

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセスする
2. プロジェクトを作成するか既存のものを選択する
3. Gmail APIを有効にする
4. OAuth 2.0認証情報を作成する（デスクトップアプリケーションタイプ）
5. **クライアントID**と**クライアントシークレット**をメモする

### 2. アクセストークンを取得する

GoogleのOAuthプレイグラウンドまたは独自のOAuthフローを使用して、以下のスコープでアクセストークンを取得します：

- `https://mail.google.com/`（完全なIMAP/SMTPアクセス）

### 3. PRX-Emailを設定する

```rust
use prx_email::plugin::{AuthConfig, ImapConfig, SmtpConfig};

let auth = AuthConfig {
    password: None,
    oauth_token: Some("ya29.your-access-token-here".to_string()),
};

let imap = ImapConfig {
    host: "imap.gmail.com".to_string(),
    port: 993,
    user: "you@gmail.com".to_string(),
    auth: auth.clone(),
};

let smtp = SmtpConfig {
    host: "smtp.gmail.com".to_string(),
    port: 465,
    user: "you@gmail.com".to_string(),
    auth,
};
```

## Outlook OAuthセットアップ

PRX-EmailにはOutlook/Office 365 OAuthのブートストラップスクリプトが含まれており、認証コードフロー全体を処理します。

### 1. Azureアプリを登録する

1. [Azureポータルのアプリ登録](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)にアクセスする
2. 新しいアプリケーションを登録する
3. リダイレクトURIを設定する（例：`http://localhost:53682/callback`）
4. **アプリケーション（クライアント）ID**と**ディレクトリ（テナント）ID**をメモする
5. APIアクセス許可で以下を追加する：
   - `offline_access`
   - `https://outlook.office.com/IMAP.AccessAsUser.All`
   - `https://outlook.office.com/SMTP.Send`

### 2. ブートストラップスクリプトを実行する

```bash
cd /path/to/prx_email
chmod +x scripts/outlook_oauth_bootstrap.sh

CLIENT_ID='your-azure-client-id' \
TENANT='your-tenant-id-or-common' \
REDIRECT_URI='http://localhost:53682/callback' \
./scripts/outlook_oauth_bootstrap.sh
```

スクリプトは以下を実行します：
1. 認証URLを印刷します -- ブラウザで開く
2. コールバックURLまたは認証コードの貼り付けを待機する
3. コードをアクセストークンとリフレッシュトークンに交換する
4. `chmod 600`で`./outlook_oauth.local.env`にトークンを保存する

### スクリプトオプション

| フラグ | 説明 |
|-------|------|
| `--output <file>` | カスタム出力パス（デフォルト：`./outlook_oauth.local.env`） |
| `--dry-run` | 認証URLを印刷して終了 |
| `-h`、`--help` | 使用情報を表示 |

### 環境変数

| 変数 | 必須 | 説明 |
|-----|------|------|
| `CLIENT_ID` | はい | Azureアプリケーションクライアント ID |
| `TENANT` | はい | テナントID、または`common`/`organizations`/`consumers` |
| `REDIRECT_URI` | はい | Azureアプリに登録されたリダイレクトURI |
| `SCOPE` | いいえ | カスタムスコープ（デフォルト：IMAP + SMTP + offline_access） |

::: warning セキュリティ
生成されたトークンファイルはコミットしないでください。`.gitignore`に`*.local.env`を追加してください。
:::

### 3. トークンを読み込む

ブートストラップスクリプトがトークンを生成した後、envファイルをsourceしてPRX-Emailを設定します：

```bash
source ./outlook_oauth.local.env
```

```rust
let auth = AuthConfig {
    password: None,
    oauth_token: Some(std::env::var("OUTLOOK_ACCESS_TOKEN")?),
};
```

## トークンライフサイクル管理

### 期限切れ追跡

PRX-EmailはプロトコルごとにOAuthトークンの期限切れタイムスタンプを追跡します（IMAP/SMTP）：

```rust
// Set expiry via environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800000000");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800000000");
```

各操作の前に、プラグインはトークンが60秒以内に期限切れになるかどうかを確認します。期限切れになる場合はリフレッシュが試みられます。

### プラガブルなリフレッシュプロバイダ

自動トークンリフレッシュを処理するために`OAuthRefreshProvider`トレイトを実装します：

```rust
use prx_email::plugin::{
    OAuthRefreshProvider, RefreshedOAuthToken, ApiError, ErrorCode,
};

struct MyRefreshProvider {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

impl OAuthRefreshProvider for MyRefreshProvider {
    fn refresh_token(
        &self,
        protocol: &str,
        user: &str,
        current_token: &str,
    ) -> Result<RefreshedOAuthToken, ApiError> {
        // Call your OAuth provider's token endpoint
        // Return the new access token and optional expiry
        Ok(RefreshedOAuthToken {
            token: "new-access-token".to_string(),
            expires_at: Some(now + 3600),
        })
    }
}
```

プラグイン作成時にプロバイダをアタッチします：

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(MyRefreshProvider {
        client_id: "...".to_string(),
        client_secret: "...".to_string(),
        refresh_token: "...".to_string(),
    }));
```

### 環境からのホットリロード

再起動なしにランタイムでOAuthトークンをリロードします：

```rust
// Set new tokens in environment
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-imap-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-smtp-token");
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT", "1800003600");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT", "1800003600");

// Trigger reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

`reload_auth_from_env`メソッドは指定されたプレフィックスの環境変数を読み取り、IMAPとSMTPのOAuthトークンと期限切れタイムスタンプを更新します。OAuthトークンが読み込まれると、2つの認証のうち1つという不変条件を維持するために対応するパスワードがクリアされます。

### 完全な設定リロード

完全なトランスポート再設定のために：

```rust
plugin.reload_config(new_transport_config)?;
```

これは新しい設定を検証し、トランスポート設定全体をアトミックに置き換えます。

## OAuth環境変数

| 変数 | 説明 |
|-----|------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAPのOAuthアクセストークン |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTPのOAuthアクセストークン |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAPトークンの期限切れ（Unix秒） |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTPトークンの期限切れ（Unix秒） |

プレフィックスは`reload_auth_from_env()`に渡されます。デフォルトのPRX-Email設定では`PRX_EMAIL`をプレフィックスとして使用します。

## セキュリティのベストプラクティス

1. **トークンをログに記録しない。** PRX-Emailはデバッグメッセージをサニタイズし、認証関連のコンテンツを削除します。
2. **リフレッシュトークンを使用する。** アクセストークンは期限切れになります。プロダクション使用では常にリフレッシュプロバイダを実装してください。
3. **トークンを安全に保管する。** ファイルのアクセス許可（`chmod 600`）を使用し、トークンファイルをバージョン管理にコミットしないでください。
4. **トークンを定期的にローテーションする。** 自動リフレッシュがある場合でも、トークンがローテーションされていることを定期的に確認してください。

## 次のステップ

- [アカウント管理](./index) -- アカウントとフィーチャーフラグを管理
- [設定リファレンス](../configuration/) -- すべての環境変数と設定
- [トラブルシューティング](../troubleshooting/) -- OAuthに関するエラーの解決
