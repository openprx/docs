---
title: ინსტალაცია
description: PRX-Memory-ის ინსტალაცია source-დან Cargo-ს გამოყენებით ან daemon binary-ს build-ი stdio და HTTP ტრანსპორტებისთვის.
---

# ინსტალაცია

PRX-Memory Rust workspace-ად გამოდის. ძირითადი artifact-ია `prx-memoryd` daemon binary `prx-memory-mcp` crate-დან.

::: tip სასურველია
Source-დან build-ი გაძლევთ უახლეს ფუნქციებს და საშუალებას გაძლევთ ჩართოთ სურვილისამებრ backend-ები, მაგ. LanceDB.
:::

## წინაპირობები

| მოთხოვნა | მინიმუმი | შენიშვნა |
|----------|---------|----------|
| Rust | stable toolchain | დააინსტალირეთ [rustup](https://rustup.rs/)-ის მეშვეობით |
| ოპერაციული სისტემა | Linux, macOS, Windows (WSL2) | Rust-ის მხარდაჭერილი ნებისმიერი პლატფორმა |
| Git | 2.30+ | საცავის clone-ისთვის |
| დისკის სივრცე | 100 MB | Binary + დეპენდენციები |
| RAM | 256 MB | დიდი მეხსიერების ბაზებისთვის მეტია სასურველი |

## მეთოდი 1: Source-დან Build (სასურველია)

საცავის clone-ი და release რეჟიმში build:

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

Binary მდებარეობს `target/release/prx-memoryd`-ში. გადაიტანეთ PATH-ში:

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### Build-ის პარამეტრები

| ფუნქციის ნიშანი | ნაგულისხმევი | აღწერა |
|----------------|--------------|--------|
| `lancedb-backend` | გამორთული | LanceDB ვექტორული შენახვის backend |

LanceDB მხარდაჭერით build-ი:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning Build-ის დეპენდენციები
Debian/Ubuntu-ზე შეიძლება დაგჭირდეთ:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
macOS-ზე Xcode Command Line Tools სჭირდება:
```bash
xcode-select --install
```
:::

## მეთოდი 2: Cargo Install

Rust-ის ინსტალაციის შემთხვევაში პირდაპირ დაინსტალირება შეგიძლიათ:

```bash
cargo install prx-memory-mcp
```

ეს source-დან compile-ს აკეთებს და `prx-memoryd` binary-ს `~/.cargo/bin/`-ში ათავსებს.

## მეთოდი 3: ბიბლიოთეკად გამოყენება

PRX-Memory crate-ების საკუთარ Rust პროექტში დამოკიდებულებებად გამოყენებისთვის, დაამატეთ `Cargo.toml`-ში:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## ინსტალაციის გადამოწმება

Build-ის შემდეგ გადაამოწმეთ binary-ი გაიშვება:

```bash
prx-memoryd --help
```

ბაზისური stdio სესიის ტესტი:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

HTTP სესიის ტესტი:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

ჯანმრთელობის endpoint-ის შემოწმება:

```bash
curl -sS http://127.0.0.1:8787/health
```

## განვითარების კონფიგურაცია

განვითარებისა და ტესტირებისთვის გამოიყენეთ სტანდარტული Rust სამუშაო ნაკადი:

```bash
# Format
cargo fmt --all

# Lint
cargo clippy --all-targets --all-features -- -D warnings

# Test
cargo test --all-targets --all-features

# Check (fast feedback)
cargo check --all-targets --all-features
```

## დეინსტალაცია

```bash
# Remove the binary
sudo rm /usr/local/bin/prx-memoryd
# Or if installed via Cargo
cargo uninstall prx-memory-mcp

# Remove data files
rm -rf ./data/memory-db.json
```

## შემდეგი ნაბიჯები

- [სწრაფი დაწყება](./quickstart) -- PRX-Memory 5 წუთში
- [კონფიგურაცია](../configuration/) -- ყველა გარემოს ცვლადი და პროფილი
- [MCP ინტეგრაცია](../mcp/) -- MCP კლიენტთან კავშირი
