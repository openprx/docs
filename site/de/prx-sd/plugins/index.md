---
title: WASM-Plugin-Entwicklung
description: "PRX-SD mit benutzerdefinierter Erkennungslogik über WebAssembly-Plugins erweitern. Plugins in Rust, Go, C oder jeder Sprache schreiben, die nach WASM kompiliert."
---

# WASM-Plugin-Entwicklung

PRX-SD enthält ein Plugin-System, das auf [Wasmtime](https://wasmtime.dev/) basiert und es ermöglicht, die Erkennungsengine mit benutzerdefinierten Scannern zu erweitern, die in jeder Sprache geschrieben wurden, die nach WebAssembly kompiliert (Rust, Go, C, AssemblyScript usw.). Plugins laufen in einer sandboxed WASM-Umgebung mit konfigurierbaren Ressourcenlimits.

## Architektur

```
~/.prx-sd/plugins/
  my-scanner/
    plugin.json          # Plugin-Manifest
    my_scanner.wasm      # Kompiliertes WASM-Modul
  another-plugin/
    plugin.json
    another_plugin.wasm
```

Wenn die Scan-Engine startet, durchläuft die `PluginRegistry` das Plugins-Verzeichnis, lädt jedes Unterverzeichnis mit einer `plugin.json`, kompiliert das WASM-Modul und ruft den `on_load`-Export des Plugins auf. Während eines Scans wird jedes Plugin, dessen `file_types` und `platforms` zur aktuellen Datei passen, der Reihe nach aufgerufen.

### Ausführungsfluss

1. **Entdeckung** -- `PluginRegistry` findet `plugin.json`-Dateien in `~/.prx-sd/plugins/`
2. **Kompilierung** -- Wasmtime kompiliert das `.wasm`-Modul mit Kraftstoff-Messung und Speicherlimits
3. **Initialisierung** -- `on_load()` wird aufgerufen; `plugin_name()` und `plugin_version()` werden gelesen
4. **Scanning** -- Für jede Datei wird `scan(ptr, len) -> score` mit den Dateidaten aufgerufen
5. **Berichterstattung** -- Plugins rufen `report_finding()` auf, um Bedrohungen zu registrieren, oder geben einen Nicht-Null-Score zurück

## Plugin-Manifest (`plugin.json`)

Jedes Plugin-Verzeichnis muss eine `plugin.json` enthalten, die das Plugin und seine Sandbox-Einschränkungen beschreibt:

```json
{
  "name": "Example Scanner",
  "version": "0.1.0",
  "author": "prx-sd",
  "description": "Example plugin that detects MALICIOUS_MARKER string",
  "wasm_file": "example_plugin.wasm",
  "platforms": ["all"],
  "file_types": ["all"],
  "min_engine_version": "0.1.0",
  "permissions": {
    "network": false,
    "filesystem": false,
    "max_memory_mb": 64,
    "max_exec_ms": 5000
  }
}
```

### Manifest-Felder

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|--------------|-------------|
| `name` | `string` | Ja | Lesbarer Plugin-Name |
| `version` | `string` | Ja | Semantische Version des Plugins |
| `author` | `string` | Ja | Plugin-Autor oder -Organisation |
| `description` | `string` | Ja | Kurze Beschreibung, was das Plugin erkennt |
| `wasm_file` | `string` | Ja | Dateiname des kompilierten WASM-Moduls (relativ zum Plugin-Verzeichnis) |
| `platforms` | `string[]` | Ja | Zielplattformen: `"linux"`, `"macos"`, `"windows"` oder `"all"` |
| `file_types` | `string[]` | Ja | Zu inspizierende Dateitypen: `"pe"`, `"elf"`, `"macho"`, `"pdf"` oder `"all"` |
| `min_engine_version` | `string` | Ja | Erforderliche Mindest-PRX-SD-Engine-Version |
| `permissions.network` | `boolean` | Nein | Ob das Plugin auf das Netzwerk zugreifen darf (Standard: `false`) |
| `permissions.filesystem` | `boolean` | Nein | Ob das Plugin via WASI auf das Host-Dateisystem zugreifen darf (Standard: `false`) |
| `permissions.max_memory_mb` | `integer` | Nein | Maximaler linearer Speicher in MiB (Standard: `64`) |
| `permissions.max_exec_ms` | `integer` | Nein | Maximale Wanduhr-Ausführungszeit in ms (Standard: `5000`) |

## Erforderliche WASM-Exporte

Das WASM-Modul muss die folgenden Funktionen exportieren:

### `scan(ptr: i32, len: i32) -> i32`

Der Haupt-Scan-Einstiegspunkt. Empfängt einen Zeiger und eine Länge zu den Dateidaten im Guest-Speicher. Gibt einen Bedrohungs-Score von 0 bis 100 zurück:

- `0` = sauber
- `1-29` = informativ
- `30-59` = verdächtig
- `60-100` = bösartig

### `memory`

Das Modul muss seinen linearen Speicher als `memory` exportieren, damit der Host Dateidaten schreiben und Ergebnisse lesen kann.

## Optionale WASM-Exporte

| Export | Signatur | Beschreibung |
|--------|----------|-------------|
| `on_load() -> i32` | `() -> i32` | Einmal nach der Kompilierung aufgerufen. `0` für Erfolg zurückgeben. |
| `plugin_name(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Plugin-Namen in den Puffer schreiben. Tatsächliche Länge zurückgeben. |
| `plugin_version(buf: i32, len: i32) -> i32` | `(i32, i32) -> i32` | Plugin-Version in den Puffer schreiben. Tatsächliche Länge zurückgeben. |
| `alloc(size: i32) -> i32` | `(i32) -> i32` | `size` Bytes Guest-Speicher allokieren. Zeiger zurückgeben. |

## Vom Host bereitgestellte Funktionen für Plugins

Der Host stellt diese Funktionen im `"env"`-Namespace bereit:

### `report_finding(name_ptr, name_len, score, detail_ptr, detail_len)`

Eine Bedrohungserkenntnng melden. Kann während eines einzelnen Scans mehrfach aufgerufen werden.

- `name_ptr` / `name_len` -- Zeiger und Länge des Bedrohungsname-Strings (z.B. `"Trojan.Marker"`)
- `score` -- Bedrohungs-Score (0-100, begrenzt)
- `detail_ptr` / `detail_len` -- Zeiger und Länge eines Detail-Strings

### `log_message(level, msg_ptr, msg_len)`

Eine Protokollnachricht in das Tracing-System der Engine schreiben.

- `level` -- `0`=trace, `1`=debug, `2`=info, `3`=warn, `4`=error
- `msg_ptr` / `msg_len` -- Zeiger und Länge des Nachrichtenstrings

### `get_file_path(buf_ptr, buf_len) -> actual_len`

Den Pfad der gescannten Datei in einen Guest-Puffer lesen.

### `get_file_type(buf_ptr, buf_len) -> actual_len`

Den erkannten Dateityp (z.B. `"pe"`, `"elf"`, `"pdf"`) in einen Guest-Puffer lesen.

## PluginFinding-Struktur

Wenn ein Plugin eine Erkenntnis meldet (entweder über `report_finding()` oder durch Zurückgeben eines Nicht-Null-Scores), erstellt die Engine ein `PluginFinding`:

```rust
pub struct PluginFinding {
    pub plugin_name: String,   // Name des Plugins
    pub threat_name: String,   // z.B. "Trojan.Marker"
    pub score: u32,            // 0-100
    pub detail: String,        // Freitext-Detail-String
}
```

Wenn das Plugin einen Nicht-Null-Score zurückgibt, aber `report_finding()` nicht aufruft, synthetisiert die Engine automatisch eine Erkenntnis:

```
threat_name: "Plugin.<plugin_name>"
detail: "Plugin '<name>' returned threat score <score>"
```

## Entwicklungs-Workflow

### 1. Plugin-Verzeichnis erstellen

```bash
mkdir -p ~/.prx-sd/plugins/my-scanner
```

### 2. Manifest schreiben

```bash
cat > ~/.prx-sd/plugins/my-scanner/plugin.json << 'EOF'
{
  "name": "My Custom Scanner",
  "version": "0.1.0",
  "author": "your-name",
  "description": "Detects custom threat patterns",
  "wasm_file": "my_scanner.wasm",
  "platforms": ["all"],
  "file_types": ["all"],
  "min_engine_version": "0.1.0",
  "permissions": {
    "network": false,
    "filesystem": false,
    "max_memory_mb": 64,
    "max_exec_ms": 5000
  }
}
EOF
```

### 3. Plugin schreiben (Rust-Beispiel)

Neues Rust-Bibliotheksprojekt erstellen:

```bash
cargo new --lib my-scanner
cd my-scanner
```

Zu `Cargo.toml` hinzufügen:

```toml
[lib]
crate-type = ["cdylib"]

[profile.release]
opt-level = "s"
lto = true
```

`src/lib.rs` schreiben:

```rust
// Host function imports
extern "C" {
    fn report_finding(
        name_ptr: *const u8, name_len: u32,
        score: u32,
        detail_ptr: *const u8, detail_len: u32,
    );
    fn log_message(level: u32, msg_ptr: *const u8, msg_len: u32);
}

#[no_mangle]
pub extern "C" fn on_load() -> i32 {
    let msg = b"My Custom Scanner loaded";
    unsafe { log_message(2, msg.as_ptr(), msg.len() as u32) };
    0 // success
}

#[no_mangle]
pub extern "C" fn scan(ptr: *const u8, len: u32) -> i32 {
    let data = unsafe { core::slice::from_raw_parts(ptr, len as usize) };

    // Example: look for a known malicious marker
    let marker = b"MALICIOUS_MARKER";
    if data.windows(marker.len()).any(|w| w == marker) {
        let name = b"Custom.MaliciousMarker";
        let detail = b"Found MALICIOUS_MARKER string in file data";
        unsafe {
            report_finding(
                name.as_ptr(), name.len() as u32,
                85,
                detail.as_ptr(), detail.len() as u32,
            );
        }
        return 85;
    }

    0 // clean
}
```

### 4. Nach WASM kompilieren

```bash
rustup target add wasm32-wasip1
cargo build --release --target wasm32-wasip1
cp target/wasm32-wasip1/release/my_scanner.wasm ~/.prx-sd/plugins/my-scanner/
```

### 5. Plugin testen

```bash
# Testdatei mit dem Marker erstellen
echo "MALICIOUS_MARKER" > /tmp/test-marker.txt

# Mit Debug-Protokollierung scannen, um Plugin-Aktivität zu sehen
sd --log-level debug scan /tmp/test-marker.txt
```

::: tip
`--log-level debug` verwenden, um detaillierte Plugin-Lade- und Ausführungsmeldungen zu sehen, einschließlich Kraftstoffverbrauch und Speichernutzung.
:::

## Sandbox-Sicherheit

Plugins laufen in einer Wasmtime-Sandbox mit folgenden Einschränkungen:

| Einschränkung | Durchsetzung |
|--------------|-------------|
| **Speicherlimit** | `max_memory_mb` im Manifest; Wasmtime erzwingt lineares Speicherlimit |
| **CPU-Limit** | `max_exec_ms` in Kraftstoff-Einheiten umgerechnet; Ausführung wird gestoppt, wenn Kraftstoff aufgebraucht |
| **Netzwerk** | Standardmäßig deaktiviert; erfordert `permissions.network: true` |
| **Dateisystem** | Standardmäßig deaktiviert; erfordert `permissions.filesystem: true` (WASI preopens) |
| **Plattform-Prüfung** | Plugins mit nicht übereinstimmenden `platforms` werden beim Laden übersprungen |
| **Dateityp-Filter** | Plugins mit nicht übereinstimmenden `file_types` werden pro Datei übersprungen |

::: warning
Auch mit `network: true` oder `filesystem: true` schränkt die WASI-Sandbox den Zugriff auf bestimmte Verzeichnisse und Endpunkte ein. Diese Berechtigungen sind eine Absichtserklärung, keine umfassenden Zugriffsgewährungen.
:::

## Hot Reload

Ein neues Plugin-Verzeichnis in `~/.prx-sd/plugins/` ablegen und die Registry nimmt es beim nächsten Scan auf. Für den Daemon einen Reload durch Aufrufen von `sd update` oder Neustart des Daemons auslösen.

## Nächste Schritte

- Das [Beispiel-Plugin](https://github.com/openprx/prx-sd/tree/main/crates/plugins/examples/example-plugin) im Repository prüfen
- Die [Erkennungsengine](../detection/)-Pipeline kennenlernen, um zu verstehen, wie Plugin-Erkenntnisse aggregiert werden
- Die [CLI-Referenz](../cli/) für alle verfügbaren Befehle lesen
