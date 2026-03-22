---
title: პრობლემების მოგვარება
description: "PRX-Email-ის გავრცელებული პრობლემების გადაწყვეტები: OAuth შეცდომები, IMAP სინქ-ის წარუმატებლობები, SMTP გაგზავნის პრობლემები, SQLite შეცდომები და WASM plugin-ის პრობლემები."
---

# პრობლემების მოგვარება

ეს გვერდი PRX-Email-ის გაშვებისას ყველაზე გავრცელებულ პრობლემებს, მათ მიზეზებს და გადაწყვეტებს მოიცავს.

## OAuth Token-ის ვადა ამოიწურა

**სიმპტომები:** ოპერაციები `Provider` შეცდომის კოდით და ვადასრულ token-ებზე შეტყობინებით ვერ ხერხდება.

**შესაძლო მიზეზები:**
- OAuth access token-ის ვადა ამოიწურა და refresh provider კონფიგურირებული არ არის
- `*_OAUTH_EXPIRES_AT` გარემოს ცვლადი ძველ timestamp-ს შეიცავს
- Refresh provider შეცდომებს აბრუნებს

**გადაწყვეტები:**

1. **Token-ის ვადის გასვლის timestamp-ების გადამოწმება:**

```bash
echo $PRX_EMAIL_IMAP_OAUTH_EXPIRES_AT
echo $PRX_EMAIL_SMTP_OAUTH_EXPIRES_AT
# These should be Unix timestamps in the future
```

2. **Token-ების ხელით გარემოდან reload:**

```rust
// Set fresh tokens
std::env::set_var("PRX_EMAIL_IMAP_OAUTH_TOKEN", "new-token");
std::env::set_var("PRX_EMAIL_SMTP_OAUTH_TOKEN", "new-token");

// Reload
plugin.reload_auth_from_env("PRX_EMAIL");
```

3. **Refresh provider-ის განხორციელება** ავტომატური ტოკენის განახლებისთვის:

```rust
let plugin = EmailPlugin::new_with_config(repo, config)
    .with_refresh_provider(Box::new(my_refresh_provider));
```

4. **Outlook bootstrap სკრიპტის ხელახლა გაშვება** ახალი token-ების მისაღებად:

```bash
CLIENT_ID='...' TENANT='...' REDIRECT_URI='...' \
./scripts/outlook_oauth_bootstrap.sh
```

::: tip
PRX-Email token-ების განახლებას ვადის გასვლამდე 60 წამით ადრე ცდილობს. თუ token-ები სინქ ინტერვალზე სწრაფად ვადასრულდება, დარწმუნდით, რომ refresh provider დაკავშირებულია.
:::

## IMAP სინქ ვერ ხდება

**სიმპტომები:** `sync()` `Network` შეცდომას აბრუნებს, ან sync runner-ი წარუმატებლობებს ატყობინებს.

**შესაძლო მიზეზები:**
- არასწორი IMAP სერვერის hostname ან port
- ქსელის კავშირის პრობლემები
- ავთენტიფიკაციის წარუმატებლობა (არასწორი პაროლი ან ვადასრული OAuth token)
- IMAP სერვერის rate limiting

**გადაწყვეტები:**

1. **IMAP სერვერთან კავშირის გადამოწმება:**

```bash
openssl s_client -connect imap.example.com:993 -quiet
```

2. **ტრანსპორტის კონფიგურაციის შემოწმება:**

```rust
// Ensure host and port are correct
println!("IMAP host: {}", config.imap.host);
println!("IMAP port: {}", config.imap.port);
```

3. **ავთენტიფიკაციის რეჟიმის გადამოწმება:**

```rust
// Must have exactly one set
assert!(config.imap.auth.password.is_some() ^ config.imap.auth.oauth_token.is_some());
```

4. **Sync runner backoff სტატუსის შემოწმება.** განმეორებითი წარუმატებლობების შემდეგ, scheduler-ი ექსპონენციური backoff-ს გამოიყენებს. დროებით გადაყენება შორეული `now_ts`-ის გამოყენებით:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &config);
```

5. **სტრუქტურირებული ლოგების შემოწმება** დეტალური შეცდომის ინფორმაციისთვის:

```bash
# Look for sync-related structured logs
grep "prx_email.*sync" /path/to/logs
```

## SMTP გაგზავნა ვერ ხდება

**სიმპტომები:** `send()` `ApiResponse`-ს `ok: false`-ით და `Network` ან `Provider` შეცდომით აბრუნებს.

**შესაძლო მიზეზები:**
- არასწორი SMTP სერვერის hostname ან port
- ავთენტიფიკაციის წარუმატებლობა
- მიმღების მისამართი პროვაიდერმა უარყო
- Rate limiting ან გაგზავნის კვოტა ამოიწურა

**გადაწყვეტები:**

1. **Outbox სტატუსის შემოწმება:**

```rust
let outbox = plugin.get_outbox(outbox_id)?;
if let Some(msg) = outbox {
    println!("Status: {}", msg.status);
    println!("Retries: {}", msg.retries);
    println!("Last error: {:?}", msg.last_error);
    println!("Next attempt: {}", msg.next_attempt_at);
}
```

2. **SMTP კონფიგურაციის გადამოწმება:**

```rust
// Check auth mode
println!("Auth: password={}, oauth={}",
    config.smtp.auth.password.is_some(),
    config.smtp.auth.oauth_token.is_some());
```

3. **ვალიდაციის შეცდომების შემოწმება.** Send API-ი უარყოფს:
   - ცარიელი `to`, `subject`, ან `body_text`
   - გამორთული `email_send` ფუნქციის ნიშანი
   - არასწორი ელ.ფოსტის მისამართები

4. **სიმულირებული წარუმატებლობით ტესტირება** შეცდომის დამუშავების გადასამოწმებლად:

```rust
use prx_email::plugin::SendFailureMode;

let response = plugin.send(SendEmailRequest {
    // ... fields ...
    failure_mode: Some(SendFailureMode::Network), // Simulate failure
});
```

## Outbox "sending" სტატუსში გაჭედილია

**სიმპტომები:** Outbox ჩანაწერები `status = 'sending'`-ს ჩვენებს, მაგრამ პროცესი finalization-მდე crash-ი მოხდა.

**მიზეზი:** პროცესი outbox ჩანაწერის claim-ის შემდეგ, მაგრამ `sent` ან `failed`-ად finalization-მდე crash-ი მოხდა.

**გადაწყვეტა:** SQL-ის მეშვეობით გაჭედილი ჩანაწერების ხელით აღდგენა:

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

## დანართი უარყოფილია

**სიმპტომები:** გაგზავნა "attachment exceeds size limit" ან "attachment content type is not allowed" შეცდომით ვერ ხდება.

**გადაწყვეტები:**

1. **დანართის policy-ის შემოწმება:**

```rust
let policy = &config.attachment_policy;
println!("Max size: {} bytes", policy.max_size_bytes);
println!("Allowed types: {:?}", policy.allowed_content_types);
```

2. **ფაილის ზომის გადამოწმება** ლიმიტის ფარგლებშია (ნაგულისხმევი: 25 MiB).

3. **MIME ტიპის ნებადართულ სიაში დამატება**, თუ უსაფრთხოა:

```rust
policy.allowed_content_types.insert("application/vnd.ms-excel".to_string());
```

4. **Path-ზე დაფუძნებული დანართებისთვის**, დარწმუნდით, რომ ფაილის path კონფიგურირებული attachment storage root-ის ქვეშ არის. `../`-შემცველი ან root-ის გარეთ გადამისამართებული სიმლინკები უარყოფილია.

## ფუნქცია გამორთულია შეცდომა

**სიმპტომები:** ოპერაციები `FeatureDisabled` შეცდომის კოდს აბრუნებს.

**მიზეზი:** მოთხოვნილი ოპერაციის ფუნქციის ნიშანი ანგარიشش-ისთვის ჩართული არ არის.

**გადაწყვეტა:**

```rust
// Check current state
let enabled = plugin.is_feature_enabled(account_id, "email_send")?;
println!("email_send enabled: {}", enabled);

// Enable the feature
plugin.set_account_feature(account_id, "email_send", true, now)?;

// Or set the global default
plugin.set_feature_default("email_send", true, now)?;
```

## SQLite მონაცემთა ბაზის შეცდომები

**სიმპტომები:** ოპერაციები `Storage` შეცდომის კოდით ვერ ხდება.

**შესაძლო მიზეზები:**
- მონაცემთა ბაზის ფაილი სხვა პროცესის მიერ ჩაკეტილია
- დისკი სავსეა
- მონაცემთა ბაზის ფაილი დაზიანებულია
- Migration-ები გაშვებული არ არის

**გადაწყვეტები:**

1. **Migration-ების გაშვება:**

```rust
let store = EmailStore::open("./email.db")?;
store.migrate()?;
```

2. **ჩაკეტილი მონაცემთა ბაზის შემოწმება.** ერთდროულად მხოლოდ ერთი ჩაწერის კავშირი შეიძლება იყოს. გაზარდეთ busy timeout:

```rust
let config = StoreConfig {
    busy_timeout_ms: 30_000, // 30 seconds
    ..StoreConfig::default()
};
```

3. **სადისკო სივრცის შემოწმება:**

```bash
df -h .
```

4. **შეკეთება ან ხელახალი შექმნა**, თუ მონაცემთა ბაზა დაზიანებულია:

```bash
# Back up the existing database
cp email.db email.db.bak

# Check integrity
sqlite3 email.db "PRAGMA integrity_check;"

# If corrupt, export and reimport
sqlite3 email.db ".dump" | sqlite3 email_new.db
```

## WASM Plugin-ის პრობლემები

### ქსელის Guard შეცდომა

**სიმპტომები:** WASM-ში hosted ელ.ფოსტის ოპერაციები `EMAIL_NETWORK_GUARD` შეცდომას აბრუნებს.

**მიზეზი:** ქსელის უსაფრთხოების გადამრთველი ჩართული არ არის.

**გადაწყვეტა:**

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Host Capability მიუწვდომელია

**სიმპტომები:** ოპერაციები `EMAIL_HOST_CAPABILITY_UNAVAILABLE`-ს აბრუნებს.

**მიზეზი:** Host runtime ელ.ფოსტის შესაძლებლობას საერთოდ არ უზრუნველყოფს. ეს WASM კონტექსტის გარეთ გაშვებისას ხდება.

**გადაწყვეტა:** დარწმუნდით, რომ PRX runtime კონფიგურირებულია plugin-ისთვის ელ.ფოსტის host-call-ების გასაწევად.

## Sync Runner-ი ამოცანებს გამოტოვებს

**სიმპტომები:** Sync runner-ი `attempted: 0`-ს ატყობინებს ამოცანების კონფიგურაციის მიუხედავად.

**მიზეზი:** ყველა ამოცანა წინა წარუმატებლობების გამო backoff-ში არის.

**გადაწყვეტები:**

1. **წარუმატებლობის backoff სტატუსის შემოწმება** სტრუქტურირებული ლოგების გამოკვლევით.

2. **ქსელის მიწვდომისა** და IMAP ავთენტიფიკაციის ხელახლა გაშვებამდე გადამოწმება.

3. **Backoff-ის გადაყენება** შორეული timestamp-ის გამოყენებით:

```rust
let report = plugin.run_sync_runner(&jobs, now + 86400, &default_config);
```

## მაღალი გაგზავნის წარუმატებლობის კოეფიციენტი

**სიმპტომები:** მეტრიკები მაღალ `send_failures` რაოდენობას ჩვენებს.

**გადაწყვეტები:**

1. **სტრუქტურირებული ლოგების გამოკვლევა** `run_id` და `error_code`-ით ფილტრირებული:

```bash
grep "prx_email.*send_failed" /path/to/logs
```

2. **SMTP auth რეჟიმის შემოწმება.** დარწმუნდით, რომ ზუსტად ერთი password ან oauth_token დაყენებულია.

3. **პროვაიდერის ხელმისაწვდომობის ვალიდაცია** ფართო rollout-ის ჩართვამდე.

4. **მეტრიკების შემოწმება:**

```rust
let metrics = plugin.metrics_snapshot();
println!("Send failures: {}", metrics.send_failures);
println!("Retry count: {}", metrics.retry_count);
```

## დახმარების მიღება

თუ ზემოაღნიშნული გადაწყვეტები პრობლემას არ აგვარებს:

1. **არსებული issues-ების შემოწმება:** [github.com/openprx/prx_email/issues](https://github.com/openprx/prx_email/issues)
2. **ახალი issue-ის შექმნა** შემდეგით:
   - PRX-Email ვერსია (`Cargo.toml`-ის შემოწმება)
   - Rust toolchain ვერსია (`rustc --version`)
   - შესაბამისი სტრუქტურირებული ლოგის გამოტანა
   - გამეორების ნაბიჯები

## შემდეგი ნაბიჯები

- [კონფიგურაციის ცნობარი](../configuration/) -- ყველა პარამეტრის გადახედვა
- [OAuth ავთენტიფიკაცია](../accounts/oauth) -- OAuth-სპეციფიკური პრობლემების მოგვარება
- [SQLite შენახვა](../storage/) -- მონაცემთა ბაზის ტექნიკური მომსახურება და აღდგენა
