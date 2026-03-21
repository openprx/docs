---
title: Plugin-Entwicklerhandbuch
description: Schritt-fur-Schritt-Anleitung zur Entwicklung von PRX-Plugins mit dem Plugin Development Kit.
---

# Plugin-Entwicklerhandbuch

Diese Anleitung fuhrt Sie durch die Erstellung eines PRX-Plugins von Grund auf. Am Ende werden Sie ein funktionierendes Werkzeug-Plugin haben, das in PRX geladen werden kann.

## Voraussetzungen

- Rust-Toolchain mit dem `wasm32-wasi`-Target
- PRX-CLI installiert
- Grundlegende Vertrautheit mit WASM-Konzepten

## Projekt einrichten

```bash
# Das WASM-Target installieren
rustup target add wasm32-wasi

# Ein neues Plugin-Projekt erstellen
cargo new --lib my-plugin
cd my-plugin
```

Fugen Sie das PRX-PDK zu Ihrer `Cargo.toml` hinzu:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## Ein Werkzeug-Plugin schreiben

Ein minimales Werkzeug-Plugin implementiert den `Tool`-Trait:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## Kompilieren

```bash
cargo build --target wasm32-wasi --release
```

Das kompilierte Plugin befindet sich unter `target/wasm32-wasi/release/my_plugin.wasm`.

## Lokal testen

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## Veroffentlichen

Plugins konnen als `.wasm`-Dateien geteilt oder in einer Plugin-Registry veroffentlicht werden (in Kurze verfugbar).

## Verwandte Seiten

- [Plugin-System-Ubersicht](./)
- [PDK-Referenz](./pdk)
- [Host-Funktionen](./host-functions)
- [Beispiele](./examples)
