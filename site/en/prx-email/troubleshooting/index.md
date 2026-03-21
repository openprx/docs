---
title: Troubleshooting
description: Solutions for common PRX-Email issues including OAuth errors, IMAP sync failures, SMTP send problems, SQLite errors, and WASM plugin issues.
---

# Troubleshooting

This page covers the most common issues encountered when running PRX-Email, along with their causes and solutions.

## OAuth Token Expired

**Symptoms:** Operations fail with `Provider` error code and a message about expired tokens.

**Possible Causes:**
- OAuth access token has expired and no refresh provider is configured
- The `*_OAUTH_EXPIRES_AT` environment variable contains a stale timestamp
- The refresh provider is returning errors

**Solutions:**

1. **Verify token expiry timestamps:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# These should be Unix timestamps in the future
```

2. **Manually reload tokens from environment:**

```rust
// Set fresh tokens
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **Implement a refresh provider** for automatic token renewal:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **Re-run the Outlook bootstrap script** to get fresh tokens:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email attempts to refresh tokens 60 seconds before they expire. If your tokens expire faster than your sync interval, ensure the refresh provider is connected.
:::

## IMAP Sync Fails

**Symptoms:** `sync()` returns a `Network` error, or the sync runner reports failures.

**Possible Causes:**
- Incorrect IMAP server hostname or port
- Network connectivity issues
- Authentication failure (wrong password or expired OAuth token)
- IMAP server rate limiting

**Solutions:**

1. **Verify connectivity to the IMAP server:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **Check the transport configuration:**

```rust
// Ensure host and port are correct
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **Verify authentication mode:**

```rust
// Must have exactly one set
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **Check sync runner backoff state.** After repeated failures, the scheduler applies exponential backoff. Temporarily reset by using a far-future `now_ts`:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **Check structured logs** for detailed error information:

```bash
# Look for sync-related structured logs
grep "prx_email.*sync" /path/to/logs
```

## SMTP Send Fails

**Symptoms:** `send()` returns an `ApiResponse` with `ok: false` and a `Network` or `Provider` error.

**Possible Causes:**
- Incorrect SMTP server hostname or port
- Authentication failure
- Recipient address rejected by the provider
- Rate limiting or sending quota exceeded

**Solutions:**

1. **Check the outbox status:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **Verify SMTP configuration:**

```rust
// Check auth mode
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **Check for validation errors.** The send API rejects:
   - Empty `to`, `subject`, or `body_text`
   - Disabled `email_send` feature flag
   - Invalid email addresses

4. **Test with simulated failure** to verify your error handling:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... fields ...
    failure_mode: Some(SendFailureMode::Network), // Simulate failure
});
```

## Outbox Stuck in "sending" State

**Symptoms:** Outbox records have `status = 'sending'` but the process crashed before finalization.

**Cause:** The process crashed after claiming the outbox record but before finalizing it as `sent` or `failed`.

**Solution:** Manually recover stuck records via SQL:

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

## Attachment Rejected

**Symptoms:** Send fails with "attachment exceeds size limit" or "attachment content type is not allowed".

**Solutions:**

1. **Check the attachment policy:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **Verify the file size** is within the limit (default: 25 MiB).

3. **Add the MIME type** to the allowed list if it is safe:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **For path-based attachments**, ensure the file path is under the configured attachment storage root. Paths containing `../` or symlinks that resolve outside the root are rejected.

## Feature Disabled Error

**Symptoms:** Operations return `FeatureDisabled` error code.

**Cause:** The feature flag for the requested operation is not enabled for the account.

**Solution:**

```rust
// Check current state
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Enable the feature
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Or set the global default
plugin.set_feature_default("email_send", true, now)?;
```

## SQLite Database Errors

**Symptoms:** Operations fail with `Storage` error code.

**Possible Causes:**
- Database file is locked by another process
- Disk is full
- Database file is corrupted
- Migrations have not been run

**Solutions:**

1. **Run migrations:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **Check for locked database.** Only one write connection can be active at a time. Increase the busy timeout:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 seconds
    ..StoreConfig::default()
};
```

3. **Check disk space:**

```bash
df -h .
```

4. **Repair or recreate** if the database is corrupted:

```bash
# Back up the existing database
cp email.db email.db.bak

# Check integrity
sqlite3 email.db "PRAGMA integrity_check;"

# If corrupt, export and reimport
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## WASM Plugin Issues

### Network Guard Error

**Symptoms:** WASM-hosted email operations return `EMAIL_NETWORK_GUARD` error.

**Cause:** The network safety switch is not enabled.

**Solution:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Host Capability Unavailable

**Symptoms:** Operations return `EMAIL_HOST_CAPABILITY_UNAVAILABLE`.

**Cause:** The host runtime does not provide the email capability. This occurs when running outside the WASM context.

**Solution:** Ensure the PRX runtime is configured to provide email host-calls to the plugin.

## Sync Runner Keeps Skipping Jobs

**Symptoms:** The sync runner reports `attempted: 0` even though jobs are configured.

**Cause:** All jobs are in backoff due to previous failures.

**Solutions:**

1. **Check the failure backoff state** by examining structured logs.

2. **Verify network reachability** and IMAP authentication before re-running.

3. **Reset backoff** by using a far-future timestamp:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## High Send Failure Rate

**Symptoms:** Metrics show a high `send_failures` count.

**Solutions:**

1. **Inspect structured logs** filtered by `run_id` and `error_code`:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **Check SMTP auth mode.** Ensure exactly one of password or oauth_token is set.

3. **Validate provider availability** before enabling broad rollout.

4. **Check metrics:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## Getting Help

If none of the above solutions resolve your issue:

1. **Check existing issues:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **File a new issue** with:
   - PRX-Email version (check `Cargo.toml`)
   - Rust toolchain version (`rustc --version`)
   - Relevant structured log output
   - Steps to reproduce

## Next Steps

- [Configuration Reference](../configuration/) -- Review all settings
- [OAuth Authentication](../accounts/oauth) -- Resolve OAuth-specific issues
- [SQLite Storage](../storage/) -- Database maintenance and recovery
