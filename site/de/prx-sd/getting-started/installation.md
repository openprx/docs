---
title: Installation
description: PRX-SD auf Linux, macOS oder Windows WSL2 installieren -- per Installationsskript, Cargo, Build aus dem Quellcode oder Docker.
---

# Installation

PRX-SD unterstützt vier Installationsmethoden. Wählen Sie diejenige, die am besten zu Ihrem Workflow passt.

::: tip Empfohlen
Das **Installationsskript** ist der schnellste Einstieg. Es erkennt Ihre Plattform, lädt die passende Binärdatei herunter und legt sie in Ihrem PATH ab.
:::

## Voraussetzungen

| Anforderung | Minimum | Hinweise |
|-------------|---------|----------|
| Betriebssystem | Linux (x86_64, aarch64), macOS (12+), Windows (WSL2) | Natives Windows wird nicht unterstützt |
| Festplattenplatz | 200 MB | ~50 MB Binärdatei + ~150 MB Signaturdatenbank |
| RAM | 512 MB | 2 GB+ empfohlen für große Verzeichnis-Scans |
| Rust (nur Quellcode-Build) | 1.85.0 | Nicht benötigt für Skript- oder Docker-Installation |
| Git (nur Quellcode-Build) | 2.30+ | Zum Klonen des Repositorys |
| Docker (nur Docker) | 20.10+ | Oder Podman 3.0+ |

## Methode 1: Installationsskript (Empfohlen)

Das Installationsskript lädt die neueste Release-Binärdatei für Ihre Plattform herunter und legt sie in `/usr/local/bin` ab.

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash
```

Um eine bestimmte Version zu installieren:

```bash
curl -fsSL https://openprx.dev/install-sd.sh | bash -s -- --version 0.5.0
```

Das Skript unterstützt folgende Umgebungsvariablen:

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `INSTALL_DIR` | `/usr/local/bin` | Benutzerdefiniertes Installationsverzeichnis |
| `VERSION` | `latest` | Bestimmte Release-Version |
| `ARCH` | automatisch erkannt | Architektur überschreiben (`x86_64`, `aarch64`) |

## Methode 2: Cargo-Installation

Wenn Sie Rust installiert haben, können Sie direkt von crates.io installieren:

```bash
cargo install prx-sd
```

Dies kompiliert aus dem Quellcode und legt die Binärdatei `sd` in `~/.cargo/bin/` ab.

::: warning Build-Abhängigkeiten
Cargo-Installation kompiliert native Abhängigkeiten. Unter Debian/Ubuntu benötigen Sie möglicherweise:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
Unter macOS sind die Xcode Command Line Tools erforderlich:
```bash
xcode-select --install
```
:::

## Methode 3: Build aus dem Quellcode

Klonen Sie das Repository und erstellen Sie es im Release-Modus:

```bash
git clone https://github.com/openprx/prx-sd.git
cd prx-sd
cargo build --release
```

Die Binärdatei befindet sich unter `target/release/sd`. Kopieren Sie sie in Ihren PATH:

```bash
sudo cp target/release/sd /usr/local/bin/sd
```

### Build-Optionen

| Feature-Flag | Standard | Beschreibung |
|-------------|----------|--------------|
| `yara` | aktiviert | YARA-X-Regel-Engine |
| `ml` | deaktiviert | ONNX-ML-Inferenz-Engine |
| `gui` | deaktiviert | Tauri + Vue 3 Desktop-GUI |
| `virustotal` | deaktiviert | VirusTotal-API-Integration |

Mit ML-Inferenz-Unterstützung erstellen:

```bash
cargo build --release --features ml
```

Desktop-GUI erstellen:

```bash
cargo build --release --features gui
```

## Methode 4: Docker

Das offizielle Docker-Image herunterladen:

```bash
docker pull ghcr.io/openprx/prx-sd:latest
```

Scan durch Einbinden eines Zielverzeichnisses ausführen:

```bash
docker run --rm -v /path/to/scan:/scan ghcr.io/openprx/prx-sd:latest scan /scan --recursive
```

Für Echtzeitüberwachung als Daemon ausführen:

```bash
docker run -d \
  --name prx-sd \
  --restart unless-stopped \
  -v /home:/watch/home:ro \
  -v /tmp:/watch/tmp:ro \
  ghcr.io/openprx/prx-sd:latest \
  monitor /watch/home /watch/tmp
```

::: tip Docker Compose
Eine `docker-compose.yml` ist im Repository-Root für Produktionsumgebungen mit automatischen Signatur-Updates verfügbar.
:::

## Plattformhinweise

### Linux

PRX-SD funktioniert auf jeder modernen Linux-Distribution. Für Echtzeitüberwachung wird das `inotify`-Subsystem verwendet. Für große Verzeichnisbäume müssen Sie möglicherweise das Watch-Limit erhöhen:

```bash
echo "fs.inotify.max_user_watches=524288" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

Rootkit-Erkennung und Arbeitsspeicher-Scan erfordern Root-Rechte.

### macOS

PRX-SD verwendet FSEvents für Echtzeitüberwachung unter macOS. Sowohl Apple Silicon (aarch64) als auch Intel (x86_64) werden unterstützt. Das Installationsskript erkennt Ihre Architektur automatisch.

::: warning macOS Gatekeeper
Wenn macOS die Binärdatei blockiert, entfernen Sie das Quarantäne-Attribut:
```bash
xattr -d com.apple.quarantine /usr/local/bin/sd
```
:::

### Windows (WSL2)

PRX-SD läuft innerhalb von WSL2 mit der Linux-Binärdatei. Installieren Sie zunächst WSL2 mit einer Linux-Distribution und folgen Sie dann den Linux-Installationsschritten. Natives Windows-Support ist für eine zukünftige Version geplant.

## Installation überprüfen

Nach der Installation überprüfen, ob `sd` funktioniert:

```bash
sd --version
```

Erwartete Ausgabe:

```
prx-sd 0.5.0
```

Vollständigen Systemstatus einschließlich Signaturdatenbank prüfen:

```bash
sd info
```

Dies zeigt die installierte Version, Signaturanzahl, YARA-Regelanzahl und Datenbankpfade an.

## Deinstallation

### Skript / Cargo-Installation

```bash
# Binärdatei entfernen
sudo rm /usr/local/bin/sd
# Oder wenn über Cargo installiert
cargo uninstall prx-sd

# Signaturdatenbank und Konfiguration entfernen
rm -rf ~/.config/prx-sd
rm -rf ~/.local/share/prx-sd
```

### Docker

```bash
docker stop prx-sd && docker rm prx-sd
docker rmi ghcr.io/openprx/prx-sd:latest
```

## Nächste Schritte

- [Schnellstart](./quickstart) -- In 5 Minuten mit dem Scannen beginnen
- [Datei- und Verzeichnisscan](../scanning/file-scan) -- Vollständige Referenz für den Befehl `sd scan`
- [Übersicht Erkennungsengine](../detection/) -- Die mehrschichtige Pipeline verstehen
