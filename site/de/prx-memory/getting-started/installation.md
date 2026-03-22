---
title: Installation
description: "PRX-Memory aus dem Quellcode mit Cargo installieren oder den Daemon-Binary für stdio- und HTTP-Transporte erstellen."
---

# Installation

PRX-Memory wird als Rust-Workspace verteilt. Das primäre Artefakt ist das `prx-memoryd`-Daemon-Binary aus dem `prx-memory-mcp`-Crate.

::: tip Empfohlen
Das Erstellen aus dem Quellcode bietet die neuesten Funktionen und ermöglicht das Aktivieren optionaler Backends wie LanceDB.
:::

## Voraussetzungen

| Anforderung | Minimum | Hinweise |
|-------------|---------|---------|
| Rust | Stable Toolchain | Installieren via [rustup](https://rustup.rs/) |
| Betriebssystem | Linux, macOS, Windows (WSL2) | Jede von Rust unterstützte Plattform |
| Git | 2.30+ | Zum Klonen des Repositories |
| Festplattenspeicher | 100 MB | Binary + Abhängigkeiten |
| RAM | 256 MB | Mehr empfohlen für große Speicherdatenbanken |

## Methode 1: Aus dem Quellcode erstellen (Empfohlen)

Repository klonen und im Release-Modus erstellen:

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build --release -p prx-memory-mcp --bin prx-memoryd
```

Das Binary befindet sich unter `target/release/prx-memoryd`. In den PATH kopieren:

```bash
sudo cp target/release/prx-memoryd /usr/local/bin/prx-memoryd
```

### Build-Optionen

| Feature-Flag | Standard | Beschreibung |
|-------------|---------|-------------|
| `lancedb-backend` | deaktiviert | LanceDB-Vektorspeicher-Backend |

Mit LanceDB-Unterstützung erstellen:

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

::: warning Build-Abhängigkeiten
Auf Debian/Ubuntu möglicherweise erforderlich:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
Auf macOS sind die Xcode Command Line Tools erforderlich:
```bash
xcode-select --install
```
:::

## Methode 2: Cargo Install

Wenn Rust installiert ist, direkt installieren:

```bash
cargo install prx-memory-mcp
```

Dies kompiliert aus dem Quellcode und platziert das `prx-memoryd`-Binary in `~/.cargo/bin/`.

## Methode 3: Als Bibliothek verwenden

Um PRX-Memory-Crates als Abhängigkeiten im eigenen Rust-Projekt zu verwenden, in `Cargo.toml` hinzufügen:

```toml
[dependencies]
prx-memory-core = "0.1"
prx-memory-embed = "0.1"
prx-memory-rerank = "0.1"
prx-memory-storage = "0.1"
```

## Installation verifizieren

Nach dem Erstellen überprüfen, ob das Binary läuft:

```bash
prx-memoryd --help
```

Eine einfache stdio-Sitzung testen:

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Eine HTTP-Sitzung testen:

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Den Integritäts-Endpunkt überprüfen:

```bash
curl -sS http://127.0.0.1:8787/health
```

## Entwicklungs-Setup

Für Entwicklung und Tests den Standard-Rust-Workflow verwenden:

```bash
# Formatieren
cargo fmt --all

# Lint
cargo clippy --all-targets --all-features -- -D warnings

# Testen
cargo test --all-targets --all-features

# Prüfen (schnelles Feedback)
cargo check --all-targets --all-features
```

## Deinstallieren

```bash
# Binary entfernen
sudo rm /usr/local/bin/prx-memoryd
# Oder wenn über Cargo installiert
cargo uninstall prx-memory-mcp

# Datendateien entfernen
rm -rf ./data/memory-db.json
```

## Nächste Schritte

- [Schnellstart](./quickstart) -- PRX-Memory in 5 Minuten zum Laufen bringen
- [Konfiguration](../configuration/) -- Alle Umgebungsvariablen und Profile
- [MCP-Integration](../mcp/) -- Mit dem MCP-Client verbinden
