---
title: Installation
description: "PRX-Email aus dem Quellcode installieren, als Cargo-Abhängigkeit hinzufügen oder das WASM-Plugin für die PRX-Laufzeitintegration kompilieren."
---

# Installation

PRX-Email kann als Rust-Bibliotheksabhängigkeit verwendet, aus dem Quellcode für den eigenständigen Einsatz gebaut oder als WASM-Plugin für die PRX-Laufzeitumgebung kompiliert werden.

::: tip Empfohlen
Für die meisten Benutzer ist das Hinzufügen von PRX-Email als **Cargo-Abhängigkeit** der schnellste Weg, E-Mail-Funktionen in ein Rust-Projekt zu integrieren.
:::

## Voraussetzungen

| Anforderung | Minimum | Hinweise |
|-------------|---------|---------|
| Rust | 1.85.0 (2024 Edition) | Für alle Installationsmethoden erforderlich |
| Git | 2.30+ | Zum Klonen des Repositorys |
| SQLite | bundled | Enthalten über `rusqlite` bundled Feature; kein System-SQLite benötigt |
| `wasm32-wasip1`-Target | aktuell | Nur für WASM-Plugin-Kompilierung benötigt |

## Methode 1: Cargo-Abhängigkeit (Empfohlen)

PRX-Email zur `Cargo.toml` des Projekts hinzufügen:

```toml
[dependencies]
prx_email = { git = "https://github.com/openprx/prx_email.git" }
```

Damit werden die Bibliothek und alle Abhängigkeiten einschließlich `rusqlite` (gebündeltes SQLite), `imap`, `lettre` und `mail-parser` heruntergeladen.

::: warning Build-Abhängigkeiten
Das `rusqlite` bundled Feature kompiliert SQLite aus C-Quellcode. Auf Debian/Ubuntu wird möglicherweise Folgendes benötigt:
```bash
sudo apt install -y build-essential pkg-config
```
Auf macOS sind Xcode Command Line Tools erforderlich:
```bash
xcode-select --install
```
:::

## Methode 2: Aus dem Quellcode bauen

Repository klonen und im Release-Modus bauen:

```bash
git clone https://github.com/openprx/prx_email.git
cd prx_email
cargo build --release
```

Test-Suite ausführen, um zu verifizieren, dass alles funktioniert:

```bash
cargo test
```

Clippy für Lint-Validierung ausführen:

```bash
cargo clippy -- -D warnings
```

## Methode 3: WASM-Plugin

Das WASM-Plugin ermöglicht es PRX-Email, innerhalb der PRX-Laufzeitumgebung als sandboxed WebAssembly-Modul zu laufen. Das Plugin verwendet WIT (WebAssembly Interface Types), um Host-Call-Schnittstellen zu definieren.

### WASM-Plugin bauen

```bash
cd prx_email

# WASM-Target hinzufügen
rustup target add wasm32-wasip1

# Plugin bauen
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

Das kompilierte Plugin befindet sich unter `wasm-plugin/target/wasm32-wasip1/release/prx_email_plugin.wasm`.

Alternativ das Build-Skript verwenden:

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

### Plugin-Konfiguration

Das WASM-Plugin enthält ein `plugin.toml`-Manifest im Verzeichnis `wasm-plugin/`, das die Plugin-Metadaten und -Fähigkeiten definiert.

### Netzwerk-Sicherheitsschalter

Standardmäßig läuft das WASM-Plugin mit **deaktivierten echten Netzwerkoperationen**. Um echte IMAP/SMTP-Verbindungen aus dem WASM-Kontext zu aktivieren:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

Wenn deaktiviert, geben netzwerkabhängige Operationen (`email.sync`, `email.send`, `email.reply`) einen kontrollierten Fehler mit einem Guard-Hinweis zurück. Dies ist eine Sicherheitsmaßnahme, um unbeabsichtigten Netzwerkzugriff aus sandboxed Plugins zu verhindern.

## Abhängigkeiten

PRX-Email verwendet folgende wichtige Abhängigkeiten:

| Crate | Version | Zweck |
|-------|---------|-------|
| `rusqlite` | 0.31 | SQLite-Datenbank mit gebündelter C-Kompilierung |
| `imap` | 2.4 | IMAP-Client für Posteingangs-Synchronisation |
| `lettre` | 0.11 | SMTP-Client für E-Mail-Versand |
| `mail-parser` | 0.10 | MIME-Nachrichtenanalyse |
| `rustls` | 0.23 | TLS für IMAP-Verbindungen |
| `rustls-connector` | 0.20 | TLS-Stream-Wrapper |
| `serde` / `serde_json` | 1.0 | Serialisierung für Modelle und API-Antworten |
| `sha2` | 0.10 | SHA-256 für Fallback-Message-IDs |
| `base64` | 0.22 | Base64-Kodierung für Anhänge |
| `thiserror` | 1.0 | Fehlertyp-Ableitung |

Alle TLS-Verbindungen verwenden `rustls` (reines Rust) -- keine OpenSSL-Abhängigkeit.

## Installation verifizieren

Nach dem Build verifizieren, dass die Bibliothek kompiliert und Tests bestehen:

```bash
cargo check
cargo test
```

Erwartete Ausgabe:

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

## Nächste Schritte

- [Schnellstart](./quickstart) -- Erstes E-Mail-Konto einrichten und eine Nachricht senden
- [Kontoverwaltung](../accounts/) -- IMAP, SMTP und OAuth konfigurieren
- [WASM-Plugins](../plugins/) -- Mehr über die WASM-Plugin-Schnittstelle erfahren
