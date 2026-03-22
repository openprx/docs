---
title: ინსტალაცია
description: PRX-Email-ის ინსტალაცია source-დან, Cargo დამოკიდებულებად დამატება ან WASM plugin-ის კომპილაცია PRX runtime ინტეგრაციისთვის.
---

# ინსტალაცია

PRX-Email შეიძლება გამოყენებულ იქნეს Rust ბიბლიოთეკის დამოკიდებულებად, source-დან დაბილდული დამოუკიდებლად, ან WASM plugin-ად კომპილირებული PRX runtime-ისთვის.

::: tip სასურველია
უმეტეს მომხმარებლებისთვის PRX-Email-ის **Cargo დამოკიდებულებად** დამატება Rust პროექტში ელ.ფოსტის შესაძლებლობების ინტეგრაციის ყველაზე სწრაფი გზაა.
:::

## წინაპირობები

| მოთხოვნა | მინიმუმი | შენიშვნა |
|----------|---------|----------|
| Rust | 1.85.0 (2024 edition) | ყველა ინსტალაციის მეთოდი სჭირდება |
| Git | 2.30+ | საცავის clone-ისთვის |
| SQLite | bundled | `rusqlite` bundled ფუნქციის მეშვეობით; სისტემის SQLite არ სჭირდება |
| `wasm32-wasip1` target | latest | მხოლოდ WASM plugin-ის კომპილაციისთვის სჭირდება |

## მეთოდი 1: Cargo დამოკიდებულება (სასურველია)

დაამატეთ PRX-Email პროექტის `Cargo.toml`-ში:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

ეს ბიბლიოთეკასა და ყველა დეპენდენციას ამოიღებს, მათ შორის `rusqlite`-ს (bundled SQLite), `imap`-ს, `lettre`-ს და `mail-parser`-ს.

::: warning Build-ის დეპენდენციები
`rusqlite` bundled ფუნქცია SQLite-ს C source-დან compile-ს. Debian/Ubuntu-ზე შეიძლება დაგჭირდეთ:
```bash
sudo apt install -y build-essential pkg-config
```
macOS-ზე Xcode Command Line Tools სჭირდება:
```bash
xcode-select --install
```
:::

## მეთოდი 2: Source-დან Build

საცავის clone-ი და release რეჟიმში build:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

ტესტების გაშვება ყველაფრის მუშაობის გადასამოწმებლად:

```bash
cargo test
```

Clippy-ის გაშვება lint ვალიდაციისთვის:

```bash
cargo clippy -- -D warnings
```

## მეთოდი 3: WASM Plugin

WASM plugin-ი PRX-Email-ს PRX runtime-ში sandbox-ირებული WebAssembly მოდულის სახით გაშვების საშუალებას იძლევა. Plugin-ი WIT (WebAssembly Interface Types)-ს იყენებს host-call ინტერფეისების განსაზღვრისთვის.

### WASM Plugin-ის Build

```bash
cd prx_email

# Add the WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

კომპილირებული plugin-ი მდებარეობს `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`-ში.

ალტერნატიულად, გამოიყენეთ build სკრიპტი:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### Plugin-ის კონფიგურაცია

WASM plugin-ი შეიცავს `plugin.toml` manifest-ს `wasm-plugin/` დირექტორიაში, რომელიც plugin-ის metadata-სა და შესაძლებლობებს განსაზღვრავს.

### ქსელის უსაფრთხოების გადამრთველი

ნაგულისხმევად WASM plugin-ი გაშვებულია **ჭეშმარიტი ქსელური ოპერაციების გამორთვით**. WASM კონტექსტიდან ჭეშმარიტი IMAP/SMTP კავშირების ჩასართავად:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

გამორთვისას ქსელ-დამოკიდებული ოპერაციები (`email.sync`, `email.send`, `email.reply`) კონტროლირებულ შეცდომას აბრუნებს guard მინიშნებით. ეს უსაფრთხოების ღონისძიებაა sandbox-ირებული plugin-ებიდან განუზრახველი ქსელის წვდომის თავიდან ასაცილებლად.

## დეპენდენციები

PRX-Email იყენებს ამ ძირითად დეპენდენციებს:

| Crate | ვერსია | მიზანი |
|-------|--------|--------|
| `rusqlite` | 0.31 | SQLite მონაცემთა ბაზა bundled C კომპილაციით |
| `imap` | 2.4 | IMAP კლიენტი inbox სინქ-ისთვის |
| `lettre` | 0.11 | SMTP კლიენტი ელ.ფოსტის გასაგზავნად |
| `mail-parser` | 0.10 | MIME შეტყობინებების parsing |
| `rustls` | 0.23 | TLS IMAP კავშირებისთვის |
| `rustls-connector` | 0.20 | TLS stream wrapper |
| `serde` / `serde_json` | 1.0 | Serialization მოდელებისა და API პასუხებისთვის |
| `sha2` | 0.10 | SHA-256 სარეზერვო message ID-ებისთვის |
| `base64` | 0.22 | Base64 კოდირება დანართებისთვის |
| `thiserror` | 1.0 | Error ტიპის derivation |

ყველა TLS კავშირი იყენებს `rustls`-ს (pure Rust) -- OpenSSL დეპენდენცია არ არის.

## ინსტალაციის გადამოწმება

Build-ის შემდეგ გადაამოწმეთ ბიბლიოთეკა compile-ს და ტესტები გადის:

```bash
cargo check
cargo test
```

მოსალოდნელი გამოტანა:

```
running 7 tests
test plugin::email_plugin::tests::parse_mime_extracts_text_html_and_attachments ... ok
test plugin::email_plugin::tests::references_chain_appends_parent_message_id ... ok
test plugin::email_plugin::tests::reply_sets_in_reply_to_header_on_outbox ... ok
test plugin::email_plugin::tests::parse_mime_fallback_message_id_is_stable_and_unique ... ok
test plugin::email_plugin::tests::list_search_reject_out_of_range_limit ... ok
test plugin::email_plugin::tests::run_sync_runner_respects_max_concurrency_cap ... ok
test plugin::email_plugin::tests::reload_auth_from_env_updates_tokens ... ok

test result: ok. 7 passed; 0 failed; 0 ignored
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](./quickstart) -- პირველი ელ.ფოსტის ანგარიშის კონფიგურაცია და შეტყობინების გაგზავნა
- [ანგარიშის მართვა](../accounts/) -- IMAP, SMTP და OAuth-ის კონფიგურაცია
- [WASM Plugins](../plugins/) -- WASM plugin ინტერფეისის შესახებ
