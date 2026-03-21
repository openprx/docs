---
title: Laufzeit-Backends
description: Austauschbare Ausführungs-Backends in PRX -- Native-, Docker- und WASM-Laufzeiten für Werkzeug- und Befehlsausführung.
---

# Laufzeit-Backends

PRX unterstützt mehrere Ausführungs-Backends zum Ausführen von Werkzeugen, Befehlen und externen Prozessen. Das Laufzeit-Subsystem abstrahiert die Ausführungsumgebung hinter dem `RuntimeAdapter`-Trait, sodass Sie zwischen lokaler Prozessausführung, Docker-Containern und WebAssembly-Sandboxen wechseln können, ohne Ihre Agentenkonfiguration zu ändern.

## Überblick

Wenn ein Agent ein Werkzeug ausführt, das einen externen Befehl erfordert (Shell-Skripte, MCP-Server, Skill-Integrationen), bestimmt das Laufzeit-Backend, wie dieser Befehl ausgeführt wird:

| Backend | Isolierung | Overhead | Anwendungsfall |
|---------|-----------|----------|----------|
| **Native** | Prozessebene | Minimal | Entwicklung, vertrauenswürdige Umgebungen |
| **Docker** | Containerebene | Moderat | Produktion, nicht vertrauenswürdige Werkzeuge, Reproduzierbarkeit |
| **WASM** | Sandbox-Ebene | Gering | Portable Skills, maximale Isolierung, Plugin-System |

```
Agent Loop
    │
    ├── Tool Call: "shell" with command "ls -la"
    │
    ▼
┌───────────────────────────────────┐
│         RuntimeAdapter            │
│  ┌─────────┬─────────┬─────────┐ │
│  │ Native  │ Docker  │  WASM   │ │
│  │ Runtime │ Runtime │ Runtime │ │
│  └────┬────┴────┬────┴────┬────┘ │
└───────┼─────────┼─────────┼──────┘
        │         │         │
   ┌────▼────┐ ┌──▼───┐ ┌──▼────┐
   │ Process │ │ ctr  │ │ wasmr │
   │ spawn   │ │ exec │ │ exec  │
   └─────────┘ └──────┘ └───────┘
```

## RuntimeAdapter-Trait

Alle Backends implementieren den `RuntimeAdapter`-Trait:

```rust
#[async_trait]
pub trait RuntimeAdapter: Send + Sync {
    async fn execute(&self, command: &str, args: &[String],
        env: &HashMap<String, String>, working_dir: Option<&Path>,
        timeout: Duration) -> Result<ExecutionOutput>;
    async fn is_available(&self) -> bool;
    fn name(&self) -> &str;
}
```

`ExecutionOutput` enthält `stdout`, `stderr`, `exit_code` und `duration`.

## Konfiguration

Wählen und konfigurieren Sie das Laufzeit-Backend in `config.toml`:

```toml
[runtime]
# Backend selection: "native" | "docker" | "wasm" | "auto"
backend = "auto"

# Global execution timeout (can be overridden per-tool).
default_timeout_secs = 60

# Maximum output size captured from stdout/stderr.
max_output_bytes = 1048576  # 1 MB

# Environment variable whitelist. Only these variables are
# passed to child processes (all backends).
env_whitelist = ["PATH", "HOME", "TERM", "LANG", "USER"]
```

### Auto-Erkennung

Wenn `backend = "auto"`, wählt PRX die Laufzeit basierend auf der Verfügbarkeit:

1. Wenn Docker läuft und erreichbar ist, Docker verwenden
2. Wenn eine WASM-Laufzeit verfügbar ist, WASM für kompatible Werkzeuge verwenden
3. Fallback auf Native

Die Auto-Erkennung läuft einmal beim Start und protokolliert das ausgewählte Backend.

## Native-Laufzeit

Die Native-Laufzeit erzeugt Befehle als lokale Kindprozesse mit `tokio::process::Command`. Sie ist das einfachste und schnellste Backend ohne zusätzliche Abhängigkeiten.

### Konfiguration

```toml
[runtime]
backend = "native"

[runtime.native]
# Shell to use for command execution.
shell = "/bin/bash"

# Additional environment variables to set.
[runtime.native.env]
RUSTFLAGS = "-D warnings"
```

### Eigenschaften

| Eigenschaft | Wert |
|------------|-------|
| Isolierung | Nur Prozessebene (erbt Benutzerberechtigungen) |
| Startzeit | < 10ms |
| Dateisystemzugriff | Vollständig (begrenzt durch Benutzerberechtigungen und Sandbox) |
| Netzwerkzugriff | Vollständig (begrenzt durch Sandbox) |
| Abhängigkeiten | Keine |
| Plattform | Alle (Linux, macOS, Windows) |

### Sicherheitshinweise

Die Native-Laufzeit bietet keine Isolierung über Standard-Unix-Prozessgrenzen hinaus. Befehle laufen mit denselben Berechtigungen wie der PRX-Prozess. Kombinieren Sie immer mit dem [Sandbox-Subsystem](/de/prx/security/sandbox), wenn Sie nicht vertrauenswürdige Befehle ausführen:

```toml
[runtime]
backend = "native"

[security.sandbox]
backend = "bubblewrap"
allow_network = false
writable_paths = ["/tmp"]
```

## Docker-Laufzeit

Die Docker-Laufzeit führt Befehle in kurzlebigen Containern aus. Jede Ausführung erstellt einen neuen Container, führt den Befehl aus, erfasst die Ausgabe und zerstört den Container.

### Konfiguration

```toml
[runtime]
backend = "docker"

[runtime.docker]
image = "debian:bookworm-slim"
socket = "/var/run/docker.sock"
memory_limit = "256m"
cpu_limit = "1.0"
pids_limit = 100
network = "none"          # "none" | "bridge" | "host"
mount_workspace = true
workspace_mount_path = "/workspace"
auto_pull = true
auto_remove = true
```

Die Startzeit beträgt 500ms-2s abhängig vom Image. Der Dateisystemzugriff ist auf den Container plus explizit gemountete Volumes beschränkt.

### Sicherheit

Die Docker-Laufzeit bietet standardmäßig starke Isolierung: Netzwerkisolierung (`network = "none"`), Ressourcenlimits (Speicher/CPU/PID), schreibgeschütztes Rootdateisystem, kein privilegierter Modus und automatische Container-Entfernung nach der Ausführung. Pro-Werkzeug-Image-Überschreibungen werden über `[runtime.docker.tool_images]` unterstützt.

## WASM-Laufzeit

Die WASM (WebAssembly)-Laufzeit führt Werkzeuge aus, die zu `.wasm`-Modulen kompiliert wurden. WASM bietet portable, sandboxed Ausführung mit feinkörniger Fähigkeitskontrolle über WASI (WebAssembly System Interface).

### Konfiguration

```toml
[runtime]
backend = "wasm"

[runtime.wasm]
# WASM runtime engine: "wasmtime" | "wasmer"
engine = "wasmtime"

# Directory containing .wasm modules.
module_path = "~/.local/share/openprx/wasm/"

# WASI capabilities granted to WASM modules.
[runtime.wasm.capabilities]
filesystem_read = ["/workspace"]
filesystem_write = ["/tmp"]
network = false
env_vars = ["HOME", "USER"]

# Maximum execution time for a single WASM call.
timeout_secs = 30

# Maximum memory allocation for WASM modules.
max_memory_mb = 128
```

### Eigenschaften

| Eigenschaft | Wert |
|------------|-------|
| Isolierung | WASM-Sandbox (fähigkeitsbasiert) |
| Startzeit | 10-50ms |
| Dateisystemzugriff | Nur WASI-vorgeöffnete Verzeichnisse |
| Netzwerkzugriff | Konfigurierbar über WASI |
| Abhängigkeiten | `wasmtime` oder `wasmer` Laufzeit (bedingte Kompilierung) |
| Plattform | Alle (WASM ist plattformunabhängig) |

### Bedingte Kompilierung

Die WASM-Laufzeit wird bedingt hinter einem Feature-Flag kompiliert:

```bash
# Build PRX with WASM support
cargo build --release --features wasm-runtime
```

Ohne das Feature-Flag ist das WASM-Backend nicht verfügbar und `backend = "auto"` wird es überspringen.

### Plugin-System

Die WASM-Laufzeit treibt PRXs Plugin-System an. Skills, die als `.wasm`-Module verteilt werden, können dynamisch geladen werden, ohne nativem Code zu vertrauen. Registrieren Sie WASM-Werkzeuge in `config.toml` unter `[tools.custom.<name>]` mit `type = "wasm"` und einem `module`-Pfad.

## Factory-Funktion

PRX verwendet eine Factory-Funktion (`create_runtime`), um das Backend beim Start auszuwählen. Sie ordnet den konfigurierten `backend`-String der entsprechenden `RuntimeAdapter`-Implementierung zu und validiert, dass das Backend verfügbar ist (z.B. Docker-Daemon läuft, WASM-Engine kompiliert).

## Vergleichsmatrix

| Merkmal | Native | Docker | WASM |
|---------|--------|--------|------|
| Einrichtungskomplexität | Keine | Docker-Daemon | Feature-Flag + Module |
| Startlatenz | < 10ms | 500ms - 2s | 10-50ms |
| Isolierungsstärke | Gering | Hoch | Hoch |
| Ressourcenkontrolle | OS-Limits | cgroups | WASM-Speicherlimits |
| Netzwerkisolierung | Über Sandbox | Eingebaut | WASI-Fähigkeit |
| Dateisystemisolierung | Über Sandbox | Eingebaut | WASI-Vorgeöffnete |
| Portabilität | Plattform-nativ | OCI-Images | Plattformunabhängig |
| Werkzeugkompatibilität | Alle | Alle (mit Image) | Nur WASM-kompiliert |

## Sicherheitshinweise

- Das Laufzeit-Backend ist eine Verteidigungsschicht, kein Ersatz für die [Sandbox](/de/prx/security/sandbox). Beide Systeme arbeiten zusammen -- die Laufzeit stellt die Ausführungsumgebung bereit, die Sandbox fügt OS-Level-Beschränkungen hinzu.
- Die Docker-Laufzeit erfordert Zugriff auf den Docker-Socket, der selbst eine privilegierte Ressource ist. Führen Sie PRX unter einem dedizierten Dienstkonto aus.
- WASM-Module haben keine implizite Autorität. Jede Fähigkeit (Dateisystem, Netzwerk, Umgebung) muss explizit gewährt werden.
- Die `env_whitelist`-Einstellung gilt für alle Backends. API-Schlüssel und Geheimnisse werden niemals an Werkzeugausführungsumgebungen übergeben.

## Verwandte Seiten

- [Agenten-Laufzeitarchitektur](/de/prx/agent/runtime)
- [Sandbox](/de/prx/security/sandbox)
- [Skillforge](/de/prx/tools/skillforge)
- [Session Worker](/de/prx/agent/session-worker)
- [Werkzeugübersicht](/de/prx/tools/)
