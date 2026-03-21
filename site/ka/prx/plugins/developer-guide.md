---
title: დანამატის დეველოპერის სახელმძღვანელო
description: Step-by-step guide to developing PRX plugins using the Plugin Development Kit.
---

# Plugin Developer Guide

This guide walks you through creating a PRX plugin from scratch. By the end, you will have a working tool plugin that can be loaded into PRX.

## წინაპირობები

- Rust toolchain with the `wasm32-wasi` target
- PRX CLI installed
- Basic familiarity with WASM concepts

## Project Setup

```bash
# Install the WASM target
rustup target add wasm32-wasi

# Create a new plugin project
cargo new --lib my-plugin
cd my-plugin
```

Add the PRX PDK to your `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## Writing a Tool Plugin

A minimal tool plugin implements the `Tool` trait:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## Building

```bash
cargo build --target wasm32-wasi --release
```

The compiled plugin will be at `target/wasm32-wasi/release/my_plugin.wasm`.

## Testing Locally

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## Publishing

Plugins can be shared as `.wasm` files or published to a plugin registry (coming soon).

## Related Pages

- [Plugin System Overview](./)
- [PDK Reference](./pdk)
- [Host Functions](./host-functions)
- [Examples](./examples)
