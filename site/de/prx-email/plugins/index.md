---
title: WASM-Plugins
description: "PRX-Email WASM-Plugin-System für sandboxed Ausführung in der PRX-Laufzeitumgebung. WIT-Host-Calls, Netzwerk-Sicherheitsschalter und Plugin-Entwicklungsanleitung."
---

# WASM-Plugins

PRX-Email enthält ein WASM-Plugin, das den E-Mail-Client zu WebAssembly für sandboxed Ausführung innerhalb der PRX-Laufzeitumgebung kompiliert. Das Plugin verwendet WIT (WebAssembly Interface Types), um Host-Call-Schnittstellen zu definieren, sodass WASM-gehosteter Code E-Mail-Operationen wie sync, list, get, search, send und reply aufrufen kann.

## Architektur

```
PRX-Laufzeitumgebung (Host)
  |
  +-- WASM-Plugin (prx-email-plugin)
        |
        +-- WIT-Host-Calls
        |     email.sync    --> Host-IMAP-Synchronisation
        |     email.list    --> Host-Posteingang-Liste
        |     email.get     --> Host-Nachrichten-Abruf
        |     email.search  --> Host-Posteingang-Suche
        |     email.send    --> Host-SMTP-Senden
        |     email.reply   --> Host-SMTP-Antworten
        |
        +-- email.execute   --> Dispatcher
              (leitet an Host-Calls oben weiter)
```

### Ausführungsmodell

Wenn ein WASM-Plugin `email.execute` aufruft, leitet das Plugin den Aufruf an die entsprechende Host-Call-Funktion weiter. Die Host-Laufzeit verarbeitet die eigentlichen IMAP/SMTP-Operationen, und Ergebnisse werden durch die WIT-Schnittstelle zurückgegeben.

## Netzwerk-Sicherheitsschalter

Echte IMAP/SMTP-Ausführung aus dem WASM-Kontext ist **standardmäßig deaktiviert**. Dies verhindert, dass sandboxed Plugins unbeabsichtigte Netzwerkverbindungen herstellen.

### Netzwerkoperationen aktivieren

Die Umgebungsvariable vor dem Start der PRX-Laufzeit setzen:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
```

### Verhalten bei Deaktivierung

| Operation | Verhalten |
|-----------|----------|
| `email.sync` | Gibt `EMAIL_NETWORK_GUARD`-Fehler zurück |
| `email.send` | Gibt `EMAIL_NETWORK_GUARD`-Fehler zurück |
| `email.reply` | Gibt `EMAIL_NETWORK_GUARD`-Fehler zurück |
| `email.list` | Funktioniert (liest aus lokalem SQLite) |
| `email.get` | Funktioniert (liest aus lokalem SQLite) |
| `email.search` | Funktioniert (liest aus lokalem SQLite) |

::: tip
Nur-Lese-Operationen (list, get, search) funktionieren immer, da sie die lokale SQLite-Datenbank ohne Netzwerkzugriff abfragen. Nur Operationen, die IMAP/SMTP-Verbindungen erfordern, werden gesperrt.
:::

### Host-Fähigkeit nicht verfügbar

Wenn die Host-Laufzeit die E-Mail-Fähigkeit überhaupt nicht bereitstellt (Nicht-WASM-Ausführungspfad), geben Operationen `EMAIL_HOST_CAPABILITY_UNAVAILABLE` zurück.

## Plugin-Struktur

```
wasm-plugin/
  Cargo.toml          # Plugin-Crate-Konfiguration
  plugin.toml         # Plugin-Manifest
  plugin.wasm         # Vorkompiliertes WASM-Binary
  src/
    lib.rs            # Plugin-Einstiegspunkt und Dispatcher
    bindings.rs       # WIT-generierte Bindungen
  wit/                # WIT-Schnittstellendefinitionen
    deps/
      prx-host/       # Host-bereitgestellte Schnittstellen
```

### Cargo-Konfiguration

```toml
[package]
name = "prx-email-plugin"
version = "0.1.0"
edition = "2024"

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

## Plugin bauen

### Voraussetzungen

- Rust-Toolchain
- `wasm32-wasip1`-Target

### Build-Schritte

```bash
# WASM-Target hinzufügen
rustup target add wasm32-wasip1

# Plugin bauen
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### Build-Skript verwenden

```bash
chmod +x scripts/build_wasm_plugin.sh
./scripts/build_wasm_plugin.sh
```

## WIT-Schnittstelle

Das Plugin kommuniziert mit dem Host über WIT-definierte Schnittstellen. Das `prx:host`-Paket stellt folgende Host-Call-Funktionen bereit:

### Verfügbare Host-Calls

| Funktion | Beschreibung | Netzwerk erforderlich |
|----------|-------------|:--------------------:|
| `email.sync` | IMAP-Posteingang für ein Konto/Ordner synchronisieren | Ja |
| `email.list` | Nachrichten aus lokaler Datenbank auflisten | Nein |
| `email.get` | Eine bestimmte Nachricht nach ID abrufen | Nein |
| `email.search` | Nachrichten nach Abfrage durchsuchen | Nein |
| `email.send` | Neue E-Mail über SMTP senden | Ja |
| `email.reply` | Auf eine vorhandene E-Mail antworten | Ja |

### Anfrage/Antwort-Format

Host-Calls verwenden JSON-Serialisierung für Anfrage- und Antwort-Nutzdaten:

```rust
// Beispiel: Nachrichten auflisten
let request = serde_json::json!({
    "account_id": 1,
    "limit": 10
});

let response = host_call("email.list", &request)?;
```

## Entwicklungs-Workflow

### 1. Plugin-Code anpassen

`wasm-plugin/src/lib.rs` bearbeiten, um benutzerdefinierte Logik hinzuzufügen:

```rust
// Vorverarbeitung vor E-Mail-Operationen hinzufügen
fn before_send(request: &SendRequest) -> Result<(), PluginError> {
    // Benutzerdefinierte Validierung, Protokollierung oder Transformation
    Ok(())
}
```

### 2. Neu bauen

```bash
cd wasm-plugin
cargo build --release --target wasm32-wasip1
```

### 3. Lokal testen

Mit deaktiviertem Netzwerk-Sicherheitsschalter testen:

```bash
export PRX_EMAIL_ENABLE_REAL_NETWORK=1
# PRX-Laufzeit mit dem aktualisierten Plugin ausführen
```

### 4. Bereitstellen

Die kompilierte `.wasm`-Datei in das Plugin-Verzeichnis der PRX-Laufzeit kopieren.

## Sicherheitsmodell

| Einschränkung | Durchsetzung |
|--------------|-------------|
| Netzwerkzugriff | Standardmäßig deaktiviert; erfordert `PRX_EMAIL_ENABLE_REAL_NETWORK=1` |
| Dateisystemzugriff | Kein direkter Dateisystemzugriff aus WASM |
| Arbeitsspeicher | Begrenzt durch WASM-Linear-Memory-Limits |
| Ausführungszeit | Begrenzt durch Fuel-Metering |
| Token-Sicherheit | OAuth-Token werden vom Host verwaltet, nicht dem WASM ausgesetzt |

::: warning
Das WASM-Plugin hat keinen direkten Zugriff auf OAuth-Token oder Anmeldedaten. Die gesamte Authentifizierung wird von der Host-Laufzeit verarbeitet. Das Plugin empfängt nur Operationsergebnisse, niemals rohe Anmeldedaten.
:::

## Nächste Schritte

- [Installation](../getting-started/installation) -- Build-Anweisungen für das WASM-Plugin
- [Konfigurationsreferenz](../configuration/) -- Netzwerk-Sicherheitsschalter und Laufzeiteinstellungen
- [Fehlerbehebung](../troubleshooting/) -- Plugin-bezogene Probleme
