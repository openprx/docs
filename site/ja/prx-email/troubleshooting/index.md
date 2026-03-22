---
title: トラブルシューティング
description: "OAuthエラー、IMAP同期失敗、SMTP送信問題、SQLiteエラー、WASMプラグイン問題を含むPRX-Emailの一般的な問題の解決策。"
---

# トラブルシューティング

このページではPRX-Emailを実行する際によく発生する問題とその原因・解決策を説明します。

## OAuthトークンの期限切れ

**症状：** 操作が期限切れトークンに関するメッセージを持つ`Provider`エラーコードで失敗します。

**考えられる原因：**
- OAuthアクセストークンが期限切れになり、リフレッシュプロバイダが設定されていない
- `*_OAUTH_EXPIRES_AT`環境変数に古いタイムスタンプが含まれている
- リフレッシュプロバイダがエラーを返している

**解決策：**

1. **トークンの期限切れタイムスタンプを確認する：**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# These should be Unix timestamps in the future
```

2. **環境から手動でトークンをリロードする：**

```rust
// Set fresh tokens
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **自動トークン更新のためにリフレッシュプロバイダを実装する：**

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **新しいトークンを取得するためにOutlookブートストラップスクリプトを再実行する：**

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Emailはトークンが期限切れになる60秒前にリフレッシュを試みます。同期間隔よりもトークンの期限切れが速い場合は、リフレッシュプロバイダが接続されていることを確認してください。
:::

## IMAP同期の失敗

**症状：** `sync()`が`Network`エラーを返すか、同期ランナーが失敗を報告します。

**考えられる原因：**
- IMAPサーバーのホスト名またはポートが正しくない
- ネットワーク接続の問題
- 認証の失敗（パスワードが間違っているか期限切れのOAuthトークン）
- IMAPサーバーによるレート制限

**解決策：**

1. **IMAPサーバーへの接続を確認する：**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **トランスポート設定を確認する：**

```rust
// Ensure host and port are correct
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **認証モードを確認する：**

```rust
// Must have exactly one set
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **同期ランナーのバックオフ状態を確認する。** 繰り返し失敗した後、スケジューラは指数バックオフを適用します。遠い未来の`now_ts`を使用して一時的にリセットします：

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **詳細なエラー情報のために構造化ログを確認する：**

```bash
# Look for sync-related structured logs
grep "prx_email.*sync" /path/to/logs
```

## SMTP送信の失敗

**症状：** `send()`が`ok: false`と`Network`または`Provider`エラーを持つ`ApiResponse`を返します。

**考えられる原因：**
- SMTPサーバーのホスト名またはポートが正しくない
- 認証の失敗
- プロバイダによる受信者アドレスの拒否
- レート制限または送信クォータを超過

**解決策：**

1. **アウトボックスのステータスを確認する：**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **SMTP設定を確認する：**

```rust
// Check auth mode
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **検証エラーを確認する。** 送信APIは以下を拒否します：
   - 空の`to`、`subject`、または`body_text`
   - 無効な`email_send`フィーチャーフラグ
   - 無効なメールアドレス

4. **エラー処理を確認するためにシミュレートされた失敗でテストする：**

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... fields ...
    failure_mode: Some(SendFailureMode::Network), // Simulate failure
});
```

## アウトボックスが「sending」状態でスタックする

**症状：** アウトボックスレコードが`status = 'sending'`を持つが、プロセスがファイナライズ前にクラッシュした。

**原因：** アウトボックスレコードをクレームした後、`sent`または`failed`としてファイナライズする前にプロセスがクラッシュしました。

**解決策：** SQLでスタックしたレコードを手動で回復します：

```sql
-- Identify stuck rows (threshold: 15 minutes)
SELECT id, account_id, updated_at
FROM outbox
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;

-- Recover to failed and schedule retry
UPDATE outbox
SET status = 'failed',
    last_error = 'recovered_from_stuck_sending',
    next_attempt_at = strftime('%s','now') + 30,
    updated_at = strftime('%s','now')
WHERE status = 'sending' AND updated_at < strftime('%s','now') - 900;
```

## 添付ファイルが拒否される

**症状：** 「attachment exceeds size limit」または「attachment content type is not allowed」で送信が失敗します。

**解決策：**

1. **添付ファイルポリシーを確認する：**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **ファイルサイズ**が制限内（デフォルト：25 MiB）であることを確認する。

3. **安全であれば許可リストにMIMEタイプを追加する：**

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **パスベースの添付ファイル**の場合、ファイルパスが設定された添付ファイルストレージルート以下であることを確認する。`../`を含むパスや、ルート外で解決されるシンボリックリンクは拒否されます。

## フィーチャー無効エラー

**症状：** 操作が`FeatureDisabled`エラーコードを返します。

**原因：** リクエストされた操作のフィーチャーフラグがアカウントで有効になっていません。

**解決策：**

```rust
// Check current state
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Enable the feature
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Or set the global default
plugin.set_feature_default("email_send", true, now)?;
```

## SQLiteデータベースエラー

**症状：** 操作が`Storage`エラーコードで失敗します。

**考えられる原因：**
- データベースファイルが別のプロセスによってロックされている
- ディスクが満杯
- データベースファイルが破損している
- マイグレーションが実行されていない

**解決策：**

1. **マイグレーションを実行する：**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **ロックされたデータベースを確認する。** 一度に1つの書き込み接続のみがアクティブになれます。ビジータイムアウトを増やします：

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 seconds
    ..StoreConfig::default()
};
```

3. **ディスク容量を確認する：**

```bash
df -h .
```

4. **データベースが破損している場合は修復または再作成する：**

```bash
# Back up the existing database
cp email.db email.db.bak

# Check integrity
sqlite3 email.db "PRAGMA integrity_check;"

# If corrupt, export and reimport
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## WASMプラグインの問題

### ネットワークガードエラー

**症状：** WASMホスト型のメール操作が`EMAIL_NETWORK_GUARD`エラーを返します。

**原因：** ネットワーク安全スイッチが有効になっていません。

**解決策：**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### ホスト機能が利用できない

**症状：** 操作が`EMAIL_HOST_CAPABILITY_UNAVAILABLE`を返します。

**原因：** ホストランタイムがメール機能を提供していません。これはWASMコンテキスト外で実行する場合に発生します。

**解決策：** PRXランタイムがプラグインにメールホスト呼び出しを提供するように設定されていることを確認します。

## 同期ランナーがジョブをスキップし続ける

**症状：** ジョブが設定されているにもかかわらず、同期ランナーが`attempted: 0`を報告します。

**原因：** 以前の失敗によりすべてのジョブがバックオフ状態になっています。

**解決策：**

1. **構造化ログを調べて失敗バックオフ状態を確認する。**

2. **再実行前にネットワークの到達可能性とIMAP認証を確認する。**

3. **遠い未来のタイムスタンプを使用してバックオフをリセットする：**

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## 高い送信失敗率

**症状：** メトリクスが高い`send_failures`数を示しています。

**解決策：**

1. **`run_id`と`error_code`でフィルタした構造化ログを確認する：**

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **SMTP認証モードを確認する。** パスワードまたはoauth_tokenのいずれか一方のみが設定されていることを確認する。

3. **広範なロールアウトを有効にする前にプロバイダの可用性を確認する。**

4. **メトリクスを確認する：**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## ヘルプを得る

上記の解決策で問題が解決しない場合は：

1. **既存のイシューを確認する：** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **以下の情報を含む新しいイシューを提出する：**
   - PRX-Emailのバージョン（`Cargo.toml`を確認）
   - Rustツールチェーンのバージョン（`rustc --version`）
   - 関連する構造化ログの出力
   - 再現手順

## 次のステップ

- [設定リファレンス](../configuration/) -- すべての設定を確認
- [OAuth認証](../accounts/oauth) -- OAuth固有の問題を解決
- [SQLiteストレージ](../storage/) -- データベースのメンテナンスと回復
