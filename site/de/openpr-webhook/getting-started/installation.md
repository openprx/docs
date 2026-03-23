---
title: Installation
description: "OpenPR-Webhook aus dem Quellcode erstellen und als systemd-Dienst einrichten."
---

# Installation

## Voraussetzungen

- Rust-Toolchain (Edition 2024 oder neuer)
- Eine laufende OpenPR-Instanz, die Webhook-Events senden kann

## Aus dem Quellcode erstellen

Repository klonen und im Release-Modus erstellen:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

Das Binary wird unter `target/release/openpr-webhook` erzeugt.

## Abhängigkeiten

OpenPR-Webhook basiert auf den folgenden Kernbibliotheken:

| Crate | Zweck |
|-------|-------|
| `axum` 0.8 | HTTP-Server-Framework |
| `tokio` 1 | Asynchrone Laufzeitumgebung |
| `reqwest` 0.12 | HTTP-Client für Webhook-Weiterleitung und Callbacks |
| `hmac` + `sha2` | HMAC-SHA256-Signaturverifikation |
| `toml` 0.8 | Konfigurationsparser |
| `tokio-tungstenite` 0.28 | WebSocket-Client für Tunnel-Modus |
| `tracing` | Strukturierte Protokollierung |

## Konfigurationsdatei

Eine `config.toml`-Datei erstellen. Der Dienst lädt diese Datei beim Start. Siehe [Konfigurationsreferenz](../configuration/index.md) für das vollständige Schema.

Minimales Beispiel:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## Ausführen

```bash
# Standard: lädt config.toml aus dem aktuellen Verzeichnis
./target/release/openpr-webhook

# Benutzerdefinierten Konfigurationspfad angeben
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## Protokollierung

Die Protokollierung wird durch die Umgebungsvariable `RUST_LOG` gesteuert. Die Standardstufe ist `openpr_webhook=info`.

```bash
# Debug-Protokollierung
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-Protokollierung (sehr ausführlich)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## Integritätsprüfung

Der Dienst stellt einen `GET /health`-Endpunkt bereit, der `ok` zurückgibt, wenn der Server läuft:

```bash
curl http://localhost:9000/health
# ok
```

## Systemd-Dienst (Optional)

Für Produktionsbereitstellungen auf Linux:

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## Nächste Schritte

- [Schnellstart](quickstart.md) -- ersten Agenten einrichten und End-to-End testen
- [Konfigurationsreferenz](../configuration/index.md) -- vollständige TOML-Schema-Dokumentation
