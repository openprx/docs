---
title: Installation
description: PRX unter Linux, macOS oder Windows WSL2 installieren -- per Installationsskript, Cargo, Quellcode-Kompilierung oder Docker.
---

# Installation

PRX wird als einzelne statische Binärdatei namens `prx` ausgeliefert. Wählen Sie die Installationsmethode, die zu Ihrem Workflow passt.

## Voraussetzungen

Stellen Sie vor der Installation sicher, dass Ihr System diese Anforderungen erfüllt:

| Anforderung | Details |
|-------------|---------|
| **Betriebssystem** | Linux (x86_64, aarch64), macOS (Apple Silicon, Intel) oder Windows über WSL2 |
| **Rust** | 1.92.0+ (Edition 2024) -- nur für Cargo-Installation oder Quellcode-Kompilierung erforderlich |
| **Systempakete** | `pkg-config` (Linux, nur für Quellcode-Kompilierung) |
| **Speicherplatz** | ~50 MB für die Binärdatei, ~200 MB mit WASM-Plugin-Laufzeit |
| **Arbeitsspeicher** | Mindestens 64 MB für den Daemon (ohne LLM-Inferenz) |

::: tip
Wenn Sie das Installationsskript oder Docker verwenden, muss Rust nicht auf Ihrem System installiert sein.
:::

## Methode 1: Installationsskript (Empfohlen)

Der schnellste Weg zum Einstieg. Das Skript erkennt Ihr Betriebssystem und Ihre Architektur, lädt die neueste Release-Binärdatei herunter und platziert sie in Ihrem `PATH`.

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

Das Skript installiert `prx` standardmäßig nach `~/.local/bin/`. Stellen Sie sicher, dass dieses Verzeichnis in Ihrem `PATH` enthalten ist:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

Um eine bestimmte Version zu installieren:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --version 0.3.0
```

Um in ein benutzerdefiniertes Verzeichnis zu installieren:

```bash
curl -fsSL https://openprx.dev/install.sh | bash -s -- --prefix /usr/local
```

## Methode 2: Cargo-Installation

Wenn Sie die Rust-Toolchain installiert haben, können Sie PRX direkt von crates.io installieren:

```bash
cargo install openprx
```

Dies kompiliert die Release-Binärdatei mit Standard-Features und platziert sie unter `~/.cargo/bin/prx`.

Um mit allen optionalen Features zu installieren (Matrix E2EE, WhatsApp Web usw.):

```bash
cargo install openprx --all-features
```

::: info Feature-Flags
PRX verwendet Cargo-Feature-Flags für optionale Kanalunterstützung:

| Feature | Beschreibung |
|---------|-------------|
| `channel-matrix` | Matrix-Kanal mit Ende-zu-Ende-Verschlüsselung |
| `whatsapp-web` | WhatsApp Web Multi-Device-Kanal |
| **default** | Alle stabilen Kanäle aktiviert |
:::

## Methode 3: Aus Quellcode kompilieren

Für Entwicklung oder um den neuesten unveröffentlichten Code auszuführen:

```bash
# Repository klonen
git clone https://github.com/openprx/prx.git
cd prx

# Release-Binärdatei kompilieren
cargo build --release

# Die Binärdatei befindet sich unter target/release/prx
./target/release/prx --version
```

Um mit allen Features zu kompilieren:

```bash
cargo build --release --all-features
```

Um die lokal kompilierte Binärdatei in Ihr Cargo-Bin-Verzeichnis zu installieren:

```bash
cargo install --path .
```

### Entwicklungsbuild

Für schnellere Iteration während der Entwicklung verwenden Sie einen Debug-Build:

```bash
cargo build
./target/debug/prx --version
```

::: warning
Debug-Builds sind zur Laufzeit deutlich langsamer. Verwenden Sie für Produktion oder Benchmarking immer `--release`.
:::

## Methode 4: Docker

Führen Sie PRX als Container aus, ohne lokale Installation:

```bash
docker pull ghcr.io/openprx/prx:latest
```

Ausführen mit einem eingebundenen Konfigurationsverzeichnis:

```bash
docker run -d \
  --name prx \
  -v ~/.config/openprx:/home/prx/.config/openprx \
  -p 3120:3120 \
  ghcr.io/openprx/prx:latest \
  daemon
```

Oder mit Docker Compose:

```yaml
# docker-compose.yml
services:
  prx:
    image: ghcr.io/openprx/prx:latest
    restart: unless-stopped
    ports:
      - "3120:3120"
    volumes:
      - ./config:/home/prx/.config/openprx
      - ./data:/home/prx/.local/share/openprx
    command: daemon
```

::: tip
Wenn Sie PRX in Docker ausführen, setzen Sie Ihre LLM-API-Schlüssel über Umgebungsvariablen oder binden Sie eine Konfigurationsdatei ein. Details finden Sie unter [Konfiguration](../config/).
:::

## Installation überprüfen

Überprüfen Sie nach der Installation, dass PRX funktioniert:

```bash
prx --version
```

Erwartete Ausgabe:

```
prx 0.3.0
```

Führen Sie den Gesundheitscheck aus:

```bash
prx doctor
```

Dieser überprüft Ihre Rust-Toolchain (falls installiert), Systemabhängigkeiten, Konfigurationsdateigültigkeit und Netzwerkverbindung zu LLM-Anbietern.

## Plattformhinweise

### Linux

PRX funktioniert auf jeder modernen Linux-Distribution (Kernel 4.18+). Die Binärdatei ist statisch mit `rustls` für TLS gelinkt, sodass keine OpenSSL-Installation erforderlich ist.

Für Sandbox-Funktionen benötigen Sie möglicherweise zusätzliche Pakete:

```bash
# Firejail-Sandbox-Backend
sudo apt install firejail

# Bubblewrap-Sandbox-Backend
sudo apt install bubblewrap

# Docker-Sandbox-Backend (erfordert Docker-Daemon)
sudo apt install docker.io
```

### macOS

PRX läuft nativ sowohl auf Apple Silicon (aarch64) als auch auf Intel (x86_64) Macs. Der iMessage-Kanal ist nur unter macOS verfügbar.

Beim Kompilieren aus dem Quellcode stellen Sie sicher, dass die Xcode Command Line Tools installiert sind:

```bash
xcode-select --install
```

### Windows (WSL2)

PRX wird unter Windows über WSL2 unterstützt. Installieren Sie eine Linux-Distribution (Ubuntu empfohlen) und folgen Sie den Linux-Anweisungen innerhalb Ihrer WSL2-Umgebung.

```powershell
# Aus PowerShell (WSL2 mit Ubuntu installieren)
wsl --install -d Ubuntu
```

Dann innerhalb von WSL2:

```bash
curl -fsSL https://openprx.dev/install.sh | bash
```

::: warning
Native Windows-Unterstützung ist derzeit nicht verfügbar. WSL2 bietet nahezu native Linux-Leistung und ist der empfohlene Ansatz.
:::

## Deinstallation

Um PRX zu entfernen:

```bash
# Bei Installation über Installationsskript
rm ~/.local/bin/prx

# Bei Installation über Cargo
cargo uninstall openprx

# Konfiguration und Daten entfernen (optional)
rm -rf ~/.config/openprx
rm -rf ~/.local/share/openprx
```

## Nächste Schritte

- [Schnellstart](./quickstart) -- PRX in 5 Minuten zum Laufen bringen
- [Einrichtungsassistent](./onboarding) -- LLM-Anbieter konfigurieren
- [Konfiguration](../config/) -- Vollständige Konfigurationsreferenz
