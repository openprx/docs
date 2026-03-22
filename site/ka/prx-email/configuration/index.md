---
title: კონფიგურაციის ცნობარი
description: "PRX-Email კონფიგურაციის სრული ცნობარი: ტრანსპორტის პარამეტრები, შენახვის პარამეტრები, დანართის policy-ები, გარემოს ცვლადები და runtime tuning."
---

# კონფიგურაციის ცნობარი

ეს გვერდი PRX-Email-ის ყველა კონფიგურაციის პარამეტრის, გარემოს ცვლადის და runtime პარამეტრის სრული ცნობარია.

## ტრანსპორტის კონფიგურაცია

`EmailTransportConfig` struct-ი IMAP-ისა და SMTP-ის კავშირებს კონფიგურირებს:

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

### IMAP პარამეტრები

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `imap.host` | `String` | (სავალდებულო) | IMAP სერვერის hostname |
| `imap.port` | `u16` | (სავალდებულო) | IMAP სერვერის პორტი (ჩვეულებრივ 993) |
| `imap.user` | `String` | (სავალდებულო) | IMAP მომხმარებელი |
| `imap.auth.password` | `Option<String>` | `None` | LOGIN ავთენტიფიკაციისთვის პაროლი |
| `imap.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2-ისთვის OAuth token |

### SMTP პარამეტრები

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `smtp.host` | `String` | (სავალდებულო) | SMTP სერვერის hostname |
| `smtp.port` | `u16` | (სავალდებულო) | SMTP სერვერის პორტი (465 ან 587) |
| `smtp.user` | `String` | (სავალდებულო) | SMTP მომხმარებელი |
| `smtp.auth.password` | `Option<String>` | `None` | PLAIN/LOGIN-ისთვის პაროლი |
| `smtp.auth.oauth_token` | `Option<String>` | `None` | XOAUTH2-ისთვის OAuth token |

### ვალიდაციის წესები

- `imap.host` და `smtp.host` ცარიელი არ უნდა იყოს
- `imap.user` და `smtp.user` ცარიელი არ უნდა იყოს
- ყოველი პროტოკოლისთვის ზუსტად ერთი `password` ან `oauth_token` უნდა იყოს დაყენებული
- `attachment_policy.max_size_bytes` 0-ზე მეტი უნდა იყოს
- `attachment_policy.allowed_content_types` ცარიელი არ უნდა იყოს

## შენახვის კონფიგურაცია

### StoreConfig

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enable_wal` | `bool` | `true` | WAL journal რეჟიმის ჩართვა |
| `busy_timeout_ms` | `u64` | `5000` | SQLite busy timeout მილიწამებში |
| `wal_autocheckpoint_pages` | `i64` | `1000` | ავტომატური checkpoint-ებს შორის გვერდები |
| `synchronous` | `SynchronousMode` | `Normal` | სინქ რეჟიმი: `Full`, `Normal` ან `Off` |

### SQLite Pragmas-ების გამოყენება

```sql
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;        -- when enable_wal = true
PRAGMA synchronous = NORMAL;      -- matches synchronous setting
PRAGMA wal_autocheckpoint = 1000; -- matches wal_autocheckpoint_pages
```

## დანართის Policy

### AttachmentPolicy

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `max_size_bytes` | `usize` | `26,214,400` (25 MiB) | დანართის მაქსიმალური ზომა |
| `allowed_content_types` | `HashSet<String>` | იხ. ქვემოთ | ნებადართული MIME ტიპები |

### ნაგულისხმევი ნებადართული MIME ტიპები

| MIME ტიპი | აღწერა |
|-----------|--------|
| `application/pdf` | PDF დოკუმენტები |
| `image/jpeg` | JPEG სურათები |
| `image/png` | PNG სურათები |
| `text/plain` | მარტივი ტექსტური ფაილები |
| `application/zip` | ZIP არქივები |

### AttachmentStoreConfig

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `enabled` | `bool` | (სავალდებულო) | დანართის persistence-ის ჩართვა |
| `dir` | `String` | (სავალდებულო) | შენახული დანართების root დირექტორია |

::: warning Path უსაფრთხოება
დანართის path-ები directory traversal შეტევების მიმართ ვალიდაციას გადიან. კონფიგურირებული `dir` root-ის გარეთ გადამისამართებული ნებისმიერი path, სიმლინკ-ზე დაფუძნებული escape-ების ჩათვლით, უარყოფილია.
:::

## Sync Runner კონფიგურაცია

### SyncRunnerConfig

| ველი | ტიპი | ნაგულისხმევი | აღწერა |
|------|------|-------------|--------|
| `max_concurrency` | `usize` | `4` | runner tick-ზე მაქსიმალური ამოცანები |
| `base_backoff_seconds` | `i64` | `10` | საწყისი backoff წარუმატებლობისას |
| `max_backoff_seconds` | `i64` | `300` | მაქსიმალური backoff (5 წუთი) |

## გარემოს ცვლადები

### OAuth Token-ის მართვა

| ცვლადი | აღწერა |
|--------|--------|
| `{PREFIX}_IMAP_OAUTH_TOKEN` | IMAP OAuth access token |
| `{PREFIX}_SMTP_OAUTH_TOKEN` | SMTP OAuth access token |
| `{PREFIX}_IMAP_OAUTH_EXPIRES_AT` | IMAP token-ის ვადის გასვლა (Unix წამები) |
| `{PREFIX}_SMTP_OAUTH_EXPIRES_AT` | SMTP token-ის ვადის გასვლა (Unix წამები) |

ნაგულისხმევი პრეფიქსია `PRX_EMAIL`. ამ runtime-ში ჩასატვირთად გამოიყენეთ `reload_auth_from_env("PRX_EMAIL")`.

### WASM Plugin

| ცვლადი | ნაგულისხმევი | აღწერა |
|--------|-------------|--------|
| `PRX_EMAIL_ENABLE_REAL_NETWORK` | დაუდგენელი (გამორთული) | `1`-ზე დაყენება WASM კონტექსტიდან ფაქტობრივ IMAP/SMTP-ს ჩასართავად |

## API ლიმიტები

| ლიმიტი | მნიშვნელობა | აღწერა |
|--------|-------------|--------|
| List/search limit მინიმუმი | 1 | `limit` პარამეტრის მინიმუმი |
| List/search limit მაქსიმუმი | 500 | `limit` პარამეტრის მაქსიმუმი |
| Debug შეტყობინების შეჭრა | 160 სიმბოლო | პროვაიდერის debug შეტყობინებები შეჭრილია |
| შეტყობინების snippet სიგრძე | 120 სიმბოლო | ავტო-გენერირებული შეტყობინების snippets |

## შეცდომის კოდები

| კოდი | აღწერა |
|------|--------|
| `Validation` | შეყვანის ვალიდაციის წარუმატებლობა (ცარიელი ველები, დიაპაზონის მიღმა ლიმიტები, უცნობი ფუნქციები) |
| `FeatureDisabled` | ოპერაცია ფუნქციის ნიშნით დაბლოკილია |
| `Network` | IMAP/SMTP კავშირის ან პროტოკოლის შეცდომა |
| `Provider` | ელ.ფოსტის პროვაიდერმა ოპერაცია უარყო |
| `Storage` | SQLite მონაცემთა ბაზის შეცდომა |

## Outbox კონსტანტები

| კონსტანტა | მნიშვნელობა | აღწერა |
|----------|-------------|--------|
| Backoff base | 5 წამი | საწყისი retry backoff |
| Backoff ფორმულა | `5 * 2^retries` | ექსპონენციური ზრდა |
| მაქსიმალური retry-ები | შეუზღუდავი | backoff ზრდით შეზღუდული |
| Idempotency გასაღები | `outbox-{id}-{retries}` | დეტერმინირებული Message-ID |

## ფუნქციის ნიშნები

| ნიშანი | აღწერა | Risk დონე |
|--------|--------|----------|
| `inbox_read` | შეტყობინებების ჩამოთვლა და მიღება | დაბალი |
| `inbox_search` | შეტყობინებების ძიება მოთხოვნით | დაბალი |
| `email_send` | ახალი ელ.ფოსტის გაგზავნა | საშუალო |
| `email_reply` | არსებული ელ.ფოსტების პასუხი | საშუალო |
| `outbox_retry` | ვერ გაგზავნილი outbox შეტყობინებების retry | დაბალი |

## ლოგირება

PRX-Email სტრუქტურირებულ ლოგებს stderr-ზე ასე გამოაქვს:

```
[prx_email][structured] {"event":"...","account":...,"folder":...,"message_id":...,"run_id":...,"error_code":...}
[prx_email][debug] context | details
```

### უსაფრთხოება

- OAuth token-ები, პაროლები და API გასაღებები **არასოდეს ილოგება**
- ელ.ფოსტის მისამართები debug ლოგებში ანონიმიზდება (მაგ., `a***@example.com`)
- პროვაიდერის debug შეტყობინებები სანიტაციას გადიან: ავტორიზაციის header-ები იმალება და გამოტანა 160 სიმბოლომდე შეჭრილია

## შემდეგი ნაბიჯები

- [ინსტალაცია](../getting-started/installation) -- PRX-Email-ის კონფიგურაცია
- [ანგარიშის მართვა](../accounts/) -- ანგარიشش-ებისა და ფუნქციების კონფიგურაცია
- [პრობლემების მოგვარება](../troubleshooting/) -- კონფიგურაციის პრობლემების მოგვარება
