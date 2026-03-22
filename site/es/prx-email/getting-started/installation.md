---
title: Instalación
description: "Instala PRX-Email desde el código fuente, añádelo como dependencia de Cargo, o compila el plugin WASM para integración con el runtime de PRX."
---

# Instalación

PRX-Email puede usarse como dependencia de biblioteca Rust, compilarse desde el código fuente para uso independiente, o compilarse como plugin WASM para el runtime de PRX.

::: tip Recomendado
Para la mayoría de usuarios, añadir PRX-Email como **dependencia de Cargo** es la forma más rápida de integrar capacidades de email en tu proyecto Rust.
:::

## Prerrequisitos

| Requisito | Mínimo | Notas |
|-----------|--------|-------|
| Rust | 1.85.0 (edición 2024) | Requerido para todos los métodos de instalación |
| Git | 2.30+ | Para clonar el repositorio |
| SQLite | bundled | Incluido via característica bundled de `rusqlite`; no se necesita SQLite del sistema |
| Objetivo `wasm32-wasip1` | latest | Solo necesario para compilación del plugin WASM |

## Método 1: Dependencia de Cargo (Recomendado)

Añade PRX-Email al `Cargo.toml` de tu proyecto:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

Esto descarga la biblioteca y todas las dependencias incluyendo `rusqlite` (SQLite bundled), `imap`, `lettre` y `mail-parser`.

::: warning Dependencias de Compilación
La característica bundled de `rusqlite` compila SQLite desde código fuente C. En Debian/Ubuntu puede necesitar:
```bash
sudo apt install -y build-essential pkg-config
```
En macOS, se requieren las Xcode Command Line Tools:
```bash
xcode-select --install
```
:::

## Método 2: Compilar desde el Código Fuente

Clona el repositorio y compila en modo release:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

Ejecuta la suite de pruebas para verificar que todo funciona:

```bash
cargo test
```

Ejecuta clippy para validación de linting:

```bash
cargo clippy -- -D warnings
```

## Método 3: Plugin WASM

El plugin WASM permite que PRX-Email se ejecute dentro del runtime de PRX como un módulo WebAssembly en sandbox. El plugin usa WIT (WebAssembly Interface Types) para definir interfaces de host-call.

### Compilar el Plugin WASM

```bash
cd prx_email

# Add the WASM target
rustup target add wasm32-wasip1

# Build the plugin
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

El plugin compilado se encuentra en `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`.

Alternativamente, usa el script de compilación:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### Configuración del Plugin

El plugin WASM incluye un manifiesto `plugin.toml` en el directorio `wasm-plugin/` que define los metadatos y capacidades del plugin.

### Interruptor de Seguridad de Red

Por defecto, el plugin WASM se ejecuta con **operaciones de red reales deshabilitadas**. Para habilitar conexiones IMAP/SMTP reales desde el contexto WASM:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

Cuando está deshabilitado, las operaciones dependientes de red (`email.sync`, `email.send`, `email.reply`) devuelven un error controlado con una indicación de guarda. Esta es una medida de seguridad para prevenir acceso de red no intencionado desde plugins en sandbox.

## Dependencias

PRX-Email usa las siguientes dependencias clave:

| Crate | Versión | Propósito |
|-------|---------|-----------|
| `rusqlite` | 0.31 | Base de datos SQLite con compilación bundled de C |
| `imap` | 2.4 | Cliente IMAP para sincronización de bandeja de entrada |
| `lettre` | 0.11 | Cliente SMTP para envío de email |
| `mail-parser` | 0.10 | Análisis de mensajes MIME |
| `rustls` | 0.23 | TLS para conexiones IMAP |
| `rustls-connector` | 0.20 | Envolvente de stream TLS |
| `serde` / `serde_json` | 1.0 | Serialización para modelos y respuestas de API |
| `sha2` | 0.10 | SHA-256 para Message-IDs de respaldo |
| `base64` | 0.22 | Codificación Base64 para adjuntos |
| `thiserror` | 1.0 | Derivación de tipos de error |

Todas las conexiones TLS usan `rustls` (Rust puro) -- sin dependencia de OpenSSL.

## Verificar la Instalación

Después de compilar, verifica que la biblioteca compila y las pruebas pasan:

```bash
cargo check
cargo test
```

Salida esperada:

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

## Siguientes Pasos

- [Inicio Rápido](./quickstart) -- Configura tu primera cuenta de email y envía un mensaje
- [Gestión de Cuentas](../accounts/) -- Configura IMAP, SMTP y OAuth
- [Plugins WASM](../plugins/) -- Aprende sobre la interfaz de plugin WASM
