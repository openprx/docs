---
title: Installation
description: "PRX-WAF mit Docker Compose, Cargo oder durch Erstellen aus dem Quellcode installieren. Enthält Voraussetzungen, Plattformhinweise und Installations-Verifizierung."
---

# Installation

PRX-WAF unterstützt drei Installationsmethoden. Wählen Sie die, die am besten zu Ihrem Workflow passt.

::: tip Empfohlen
**Docker Compose** ist der schnellste Weg für den Einstieg. Es startet PRX-WAF, PostgreSQL und die Admin-UI mit einem einzigen Befehl.
:::

## Voraussetzungen

| Anforderung | Minimum | Hinweise |
|-------------|---------|---------|
| Betriebssystem | Linux (x86_64, aarch64), macOS (12+) | Windows via WSL2 |
| PostgreSQL | 16+ | Im Docker Compose enthalten |
| Rust (nur Quellcode-Build) | 1.82.0 | Nicht benötigt für Docker-Installation |
| Node.js (nur Admin-UI-Build) | 18+ | Nicht benötigt für Docker-Installation |
| Docker | 20.10+ | Oder Podman 3.0+ |
| Festplattenspeicher | 500 MB | ~100 MB Binärdatei + ~400 MB PostgreSQL-Daten |
| RAM | 512 MB | 2 GB+ empfohlen für Produktion |

## Methode 1: Docker Compose (Empfohlen)

Repository klonen und alle Dienste mit Docker Compose starten:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Umgebungsvariablen in docker-compose.yml überprüfen und bearbeiten
# (Datenbankpasswort, Admin-Anmeldedaten, Lausch-Ports)
docker compose up -d
```

Dies startet drei Container:

| Container | Port | Beschreibung |
|-----------|------|-------------|
| `prx-waf` | `80`, `443` | Reverse-Proxy (HTTP + HTTPS) |
| `prx-waf` | `9527` | Admin-API + Vue 3 UI |
| `postgres` | `5432` | PostgreSQL 16-Datenbank |

Bereitstellung verifizieren:

```bash
# Container-Status prüfen
docker compose ps

# Health-Endpunkt prüfen
curl http://localhost:9527/health
```

Die Admin-UI unter `http://localhost:9527` öffnen und sich mit den Standard-Anmeldedaten anmelden: `admin` / `admin`.

::: warning Standard-Passwort ändern
Das Standard-Admin-Passwort sofort nach der ersten Anmeldung ändern. Gehen Sie zu **Einstellungen > Konto** in der Admin-UI oder verwenden Sie die API.
:::

### Docker Compose mit Podman

Wenn Sie Podman anstelle von Docker verwenden:

```bash
podman-compose up -d --build
```

::: info Podman DNS
Bei der Verwendung von Podman ist die DNS-Resolver-Adresse für die Inter-Container-Kommunikation `10.89.0.1` anstatt Dockers `127.0.0.11`. Die enthaltene `docker-compose.yml` handhabt dies automatisch.
:::

## Methode 2: Cargo-Installation

Wenn Sie Rust installiert haben, können Sie PRX-WAF aus dem Repository installieren:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf
cargo build --release
```

Die Binärdatei befindet sich unter `target/release/prx-waf`. In Ihren PATH kopieren:

```bash
sudo cp target/release/prx-waf /usr/local/bin/prx-waf
```

::: warning Build-Abhängigkeiten
Cargo-Build kompiliert native Abhängigkeiten. Unter Debian/Ubuntu benötigen Sie möglicherweise:
```bash
sudo apt install -y build-essential pkg-config libssl-dev
```
Unter macOS sind Xcode Command Line Tools erforderlich:
```bash
xcode-select --install
```
:::

### Datenbank-Einrichtung

PRX-WAF benötigt eine PostgreSQL 16+-Datenbank:

```bash
# Datenbank und Benutzer erstellen
createdb prx_waf
createuser prx_waf

# Migrationen ausführen
./target/release/prx-waf -c configs/default.toml migrate

# Standard-Admin-Benutzer erstellen (admin/admin)
./target/release/prx-waf -c configs/default.toml seed-admin
```

### Server starten

```bash
./target/release/prx-waf -c configs/default.toml run
```

Dies startet den Reverse-Proxy auf den Ports 80/443 und die Admin-API auf Port 9527.

## Methode 3: Aus dem Quellcode erstellen (Entwicklung)

Für Entwicklung mit Live-Reload der Admin-UI:

```bash
git clone https://github.com/openprx/prx-waf
cd prx-waf

# Rust-Backend erstellen
cargo build

# Admin-UI erstellen
cd web/admin-ui
npm install
npm run build
cd ../..

# Entwicklungsserver starten
cargo run -- -c configs/default.toml run
```

### Admin-UI für Produktion erstellen

```bash
cd web/admin-ui
npm install
npm run build
```

Die erstellten Dateien werden bei der Kompilierung in die Rust-Binärdatei eingebettet und vom API-Server bereitgestellt.

## systemd-Dienst

Für Produktionsbereitstellungen auf Bare-Metal einen systemd-Dienst erstellen:

```ini
# /etc/systemd/system/prx-waf.service
[Unit]
Description=PRX-WAF Web Application Firewall
After=network.target postgresql.service

[Service]
Type=simple
User=prx-waf
ExecStart=/usr/local/bin/prx-waf -c /etc/prx-waf/config.toml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-waf
sudo systemctl status prx-waf
```

## Installation verifizieren

Nach der Installation verifizieren, dass PRX-WAF läuft:

```bash
# Health-Endpunkt prüfen
curl http://localhost:9527/health

# Admin-UI prüfen
curl -s http://localhost:9527 | head -5
```

In der Admin-UI unter `http://localhost:9527` anmelden, um zu überprüfen, ob das Dashboard korrekt lädt.

## Nächste Schritte

- [Schnellstart](./quickstart) -- Ihre erste Anwendung in 5 Minuten schützen
- [Konfiguration](../configuration/) -- PRX-WAF-Einstellungen anpassen
- [Regel-Engine](../rules/) -- Erkennungspipeline verstehen
