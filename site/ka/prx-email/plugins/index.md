---
title: WASM Plugins
description: "PRX-Email WASM plugin სისტემა PRX runtime-ში sandbox-ირებული შესრულებისთვის: WIT host-call-ები, ქსელის უსაფრთხოების გადამრთველი და plugin-ის განვითარების სახელმძღვანელო."
---

# WASM Plugins

PRX-Email WASM plugin-ს მოიცავს, რომელიც ელ.ფოსტის კლიენტს WebAssembly-ად compile-ს PRX runtime-ში sandbox-ირებული შესრულებისთვის. Plugin-ი WIT (WebAssembly Interface Types)-ს იყენებს host-call ინტერფეისების განსაზღვრისთვის, WASM-ში hosted კოდს ელ.ფოსტის ოპერაციების გამოძახების საშუალებას იძლევა, მაგ. sync, list, get, search, send და reply.

## არქიტექტურა

```
PRX Runtime (Host)
  |
  +-- WASM Plugin (prx-email-plugin)
        |
        +-- WIT Host-Calls
        |     email.sync    --> Host IMAP sync
        |     email.list    --> Host inbox list
        |     email.get     --> Host message get
        |     email.search  --> Host inbox search
        |     email.send    --> Host SMTP send
        |     email.reply   --> Host SMTP reply
        |
        +-- email.execute   --> Dispatcher
              (forwards to host-calls above)
```

### შესრულების მოდელი

როდესაც WASM plugin `email.execute`-ს გამოძახებს, plugin-ი გამოძახებას შესაბამის host-call ფუნქციაზე გადაამისამართებს. Host runtime ამუშავებს ფაქტობრივ IMAP/SMTP ოპერაციებს, და შედეგები WIT ინტერფეისის მეშვეობით უბრუნდება.

## ქსელის უსაფრთხოების გადამრთველი

ფაქტობრივი IMAP/SMTP შესრულება WASM კონტექსტიდან ნაგულისხმევად **გამორთულია**. ეს sandbox-ირებულ plugin-ებს განუზრახველი ქსელური კავშირების გაკეთებისგან იცავს.

### ქსელური ოპერაციების ჩართვა

PRX runtime-ის დაწყებამდე დააყენეთ გარემოს ცვლადი:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### ქცევა გამორთვისას

| ოპერაცია | ქცევა |
|---------|-------|
| `email.sync` | `EMAIL_NETWORK_GUARD` შეცდომას აბრუნებს |
| `email.send` | `EMAIL_NETWORK_GUARD` შეცდომას აბრუნებს |
| `email.reply` | `EMAIL_NETWORK_GUARD` შეცდომას აბრუნებს |
| `email.list` | მუშაობს (ლოკალური SQLite-დან კითხულობს) |
| `email.get` | მუშაობს (ლოკალური SQLite-დან კითხულობს) |
| `email.search` | მუშაობს (ლოკალური SQLite-დან კითხულობს) |

::: tip
მხოლოდ-წაკითხვის ოპერაციები (list, get, search) ყოველთვის მუშაობს, რადგან ლოკალური SQLite მონაცემთა ბაზიდან ქსელური წვდომის გარეშე მოიკითხავს. მხოლოდ IMAP/SMTP კავშირებს მოთხოვნი ოპერაციებია დაბლოკილი.
:::

### Host Capability მიუწვდომელია

როდესაც host runtime ელ.ფოსტის შესაძლებლობას საერთოდ არ უზრუნველყოფს (WASM-გარეშე შესრულების გზა), ოპერაციები `EMAIL_HOST_CAPABILITY_UNAVAILABLE`-ს აბრუნებს.

## Plugin-ის სტრუქტურა

```
wasm-plugin/
  Cargo.toml          # Plugin crate configuration
  plugin.toml         # Plugin manifest
  plugin.wasm         # Pre-compiled WASM binary
  src/
    lib.rs            # Plugin entry point and dispatcher
    bindings.rs       # WIT-generated bindings
  wit/                # WIT interface definitions
    deps/
      prx-host/       # Host-provided interfaces
```

### Cargo კონფიგურაცია

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
wit-bindgen = { version = "0.51", features = ["macros"] }

[package.metadata.component]
package = "prx:plugin"

[package.metadata.component.target.dependencies]
"prx:host" = { path = "wit/deps/prx-host" }
```

## Plugin-ის Build

### წინაპირობები

- Rust toolchain
- `wasm32-wasip1` target

### Build ნაბიჯები

```bash
# Add WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### Build სკრიპტის გამოყენება

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WIT ინტერფეისი

Plugin-ი host-თან WIT-განსაზღვრული ინტერფეისების მეშვეობით კომუნიკაციას ახდენს. `prx:host` package შემდეგ host-call ფუნქციებს უზრუნველყოფს:

### ხელმისაწვდომი Host-Call-ები

| ფუნქცია | აღწერა | ქსელი საჭიროა |
|---------|--------|:-------------:|
| `email.sync` | IMAP inbox-ის სინქ ანგარიşş/საქაღალდისთვის | დიახ |
| `email.list` | შეტყობინებების ჩამოთვლა ლოკალური მონაცემთა ბაზიდან | არა |
| `email.get` | კონკრეტული შეტყობინების მიღება ID-ით | არა |
| `email.search` | შეტყობინებების ძიება მოთხოვნით | არა |
| `email.send` | ახალი ელ.ფოსტის გაგზავნა SMTP-ის მეშვეობით | დიახ |
| `email.reply` | არსებული ელ.ფოსტის პასუხი | დიახ |

### მოთხოვნა/პასუხის ფორმატი

Host-call-ები მოთხოვნისა და პასუხის payload-ებისთვის JSON სერიალიზაციას იყენებს:

```rust
// Example: list messages
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## განვითარების სამუშაო ნაკადი

### 1. Plugin კოდის შეცვლა

შეცვალეთ `wasm-plugin/src/lib.rs` custom ლოგიკის დასამატებლად:

```rust
// Add pre-processing before email operations
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Custom validation, logging, or transformation
    Ok(())
}
```

### 2. ხელახლა Build

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. ლოკალური ტესტირება

ქსელის უსაფრთხოების გადამრთველის გამორთვით ტესტირება:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# Run your PRX runtime with the updated plugin
```

### 4. განასახება

კომპილირებული `.wasm` ფაილი დააკოპირეთ PRX runtime-ის plugin დირექტორიაში.

## უსაფრთხოების მოდელი

| შეზღუდვა | შესრულება |
|---------|-----------|
| ქსელური წვდომა | ნაგულისხმევად გამორთული; `PRX_EMAIL_ENABLE_REAL_NETWORK=1` სჭირდება |
| ფაილური სისტემის წვდომა | WASM-დან პირდაპირი ფაილური სისტემის წვდომა არ არის |
| მეხსიერება | WASM linear memory ლიმიტებით შეზღუდული |
| შესრულების დრო | Fuel metering-ით შეზღუდული |
| Token-ის უსაფრთხოება | OAuth token-ებს host მართავს, WASM-ზე არ ექსპოზდება |

::: warning
WASM plugin-ს OAuth token-ებსა ან სერთიფიკატებზე პირდაპირი წვდომა არ აქვს. ყველა ავთენტიფიკაცია host runtime-ის მიერ მუშავდება. Plugin მხოლოდ ოპერაციის შედეგებს იღებს, არა raw სერთიფიკატებს.
:::

## შემდეგი ნაბიჯები

- [ინსტალაცია](../getting-started/installation) -- WASM plugin-ის build ინსტრუქციები
- [კონფიგურაციის ცნობარი](../configuration/) -- ქსელის უსაფრთხოების გადამრთველი და runtime პარამეტრები
- [პრობლემების მოგვარება](../troubleshooting/) -- Plugin-თან დაკავშირებული პრობლემები
