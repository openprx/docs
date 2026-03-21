---
title: Installation
description: Install PRX-Email from source, add as a Cargo dependency, or build the WASM plugin for PRX runtime integration.
---

# Installation

PRX-Email can be used as a Rust library dependency, built from source for standalone use, or compiled as a WASM plugin for the PRX runtime.

::: tip Recommended
For most users, adding PRX-Email as a **Cargo dependency** is the fastest way to integrate email capabilities into your Rust project.
:::

## Prerequisites

| Requirement | Minimum | Notes |
|-------------|---------|-------|
| Rust | 1.85.0 (2024 edition) | Required for all installation methods |
| Git | 2.30+ | For cloning the repository |
| SQLite | bundled | Included via `rusqlite` bundled feature; no system SQLite needed |
| `wasm32-wasip1` target | latest | Only needed for WASM plugin compilation |

## Method 1: Cargo Dependency (Recommended)

Add PRX-Email to your project's `Cargo.toml`:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

This pulls the library and all dependencies including `rusqlite` (bundled SQLite), `imap`, `lettre`, and `mail-parser`.

::: warning Build Dependencies
The `rusqlite` bundled feature compiles SQLite from C source. On Debian/Ubuntu you may need:
```bash
sudo apt install -y build-essential pkg-config
```
On macOS, Xcode Command Line Tools are required:
```bash
xcode-select --install
```
:::

## Method 2: Build from Source

Clone the repository and build in release mode:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

Run the test suite to verify everything works:

```bash
cargo test
```

Run clippy for lint validation:

```bash
cargo clippy -- -D warnings
```

## Method 3: WASM Plugin

The WASM plugin allows PRX-Email to run inside the PRX runtime as a sandboxed WebAssembly module. The plugin uses WIT (WebAssembly Interface Types) to define host-call interfaces.

### Build the WASM Plugin

```bash
cd prx_email

# Add the WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

The compiled plugin is located at `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`.

Alternatively, use the build script:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### Plugin Configuration

The WASM plugin includes a `plugin.toml` manifest in the `wasm-plugin/` directory that defines the plugin metadata and capabilities.

### Network Safety Switch

By default, the WASM plugin runs with **real network operations disabled**. To enable actual IMAP/SMTP connections from the WASM context:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

When disabled, network-dependent operations (`email.sync`, `email.send`, `email.reply`) return a controlled error with a guard hint. This is a safety measure to prevent unintended network access from sandboxed plugins.

## Dependencies

PRX-Email uses the following key dependencies:

| Crate | Version | Purpose |
|-------|---------|---------|
| `rusqlite` | 0.31 | SQLite database with bundled C compilation |
| `imap` | 2.4 | IMAP client for inbox sync |
| `lettre` | 0.11 | SMTP client for sending email |
| `mail-parser` | 0.10 | MIME message parsing |
| `rustls` | 0.23 | TLS for IMAP connections |
| `rustls-connector` | 0.20 | TLS stream wrapper |
| `serde` / `serde_json` | 1.0 | Serialization for models and API responses |
| `sha2` | 0.10 | SHA-256 for fallback message IDs |
| `base64` | 0.22 | Base64 encoding for attachments |
| `thiserror` | 1.0 | Error type derivation |

All TLS connections use `rustls` (pure Rust) -- no OpenSSL dependency.

## Verify Installation

After building, verify that the library compiles and tests pass:

```bash
cargo check
cargo test
```

Expected output:

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

## Next Steps

- [Quick Start](./quickstart) -- Set up your first email account and send a message
- [Account Management](../accounts/) -- Configure IMAP, SMTP, and OAuth
- [WASM Plugins](../plugins/) -- Learn about the WASM plugin interface
