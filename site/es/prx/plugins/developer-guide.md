---
title: Guia del desarrollador de plugins
description: Guia paso a paso para desarrollar plugins de PRX usando el Kit de Desarrollo de Plugins.
---

# Guia del desarrollador de plugins

Esta guia te lleva a traves de la creacion de un plugin de PRX desde cero. Al final, tendras un plugin de herramienta funcional que puede cargarse en PRX.

## Requisitos previos

- Toolchain de Rust con el target `wasm32-wasi`
- CLI de PRX instalado
- Familiaridad basica con conceptos WASM

## Configuracion del proyecto

```bash
# Install the WASM target
rustup target add wasm32-wasi

# Create a new plugin project
cargo new --lib my-plugin
cd my-plugin
```

Agrega el PDK de PRX a tu `Cargo.toml`:

```toml
[dependencies]
prx-pdk = "0.1"

[lib]
crate-type = ["cdylib"]
```

## Escribir un plugin de herramienta

Un plugin de herramienta minimo implementa el trait `Tool`:

```rust
use prx_pdk::prelude::*;

#[prx_tool]
fn hello(name: String) -> Result<String, PluginError> {
    Ok(format!("Hello, {}!", name))
}
```

## Compilar

```bash
cargo build --target wasm32-wasi --release
```

El plugin compilado estara en `target/wasm32-wasi/release/my_plugin.wasm`.

## Probar localmente

```bash
prx plugin install ./target/wasm32-wasi/release/my_plugin.wasm
prx plugin test my-plugin
```

## Publicar

Los plugins pueden compartirse como archivos `.wasm` o publicarse en un registro de plugins (proximamente).

## Paginas relacionadas

- [Vision general del sistema de plugins](./)
- [Referencia del PDK](./pdk)
- [Funciones del host](./host-functions)
- [Ejemplos](./examples)
