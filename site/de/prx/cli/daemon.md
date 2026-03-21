---
title: prx daemon
description: Startet die vollständige PRX-Laufzeit einschließlich Gateway, Kanäle, Cron-Scheduler und Selbstentwicklungs-Engine.
---

# prx daemon

Startet die vollständige PRX-Laufzeit. Der Daemon-Prozess verwaltet alle langlebigen Subsysteme: das HTTP/WebSocket-Gateway, Messaging-Kanalverbindungen, den Cron-Scheduler und die Selbstentwicklungs-Engine.

## Verwendung

```bash
prx daemon [OPTIONS]
```

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Pfad zur Konfigurationsdatei |
| `--port` | `-p` | `3120` | Gateway-Lauschport |
| `--host` | `-H` | `127.0.0.1` | Gateway-Bindungsadresse |
| `--log-level` | `-l` | `info` | Log-Ausführlichkeit: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | Selbstentwicklungs-Engine deaktivieren |
| `--no-cron` | | `false` | Cron-Scheduler deaktivieren |
| `--no-gateway` | | `false` | HTTP/WS-Gateway deaktivieren |
| `--pid-file` | | | PID in die angegebene Datei schreiben |

## Was der Daemon startet

Beim Start initialisiert `prx daemon` die folgenden Subsysteme in dieser Reihenfolge:

1. **Konfigurationslader** -- liest und validiert die Konfigurationsdatei
2. **Gedächtnis-Backend** -- verbindet sich mit dem konfigurierten Gedächtnisspeicher (Markdown, SQLite oder PostgreSQL)
3. **Gateway-Server** -- startet den HTTP/WebSocket-Server auf dem konfigurierten Host und Port
4. **Kanalmanager** -- verbindet alle aktivierten Messaging-Kanäle (Telegram, Discord, Slack usw.)
5. **Cron-Scheduler** -- lädt und aktiviert geplante Aufgaben
6. **Selbstentwicklungs-Engine** -- startet die L1/L2/L3-Entwicklungspipeline (falls aktiviert)

## Beispiele

```bash
# Mit Standardeinstellungen starten
prx daemon

# An alle Schnittstellen auf Port 8080 binden
prx daemon --host 0.0.0.0 --port 8080

# Mit Debug-Logging starten
prx daemon --log-level debug

# Ohne Evolution starten (nützlich zum Debuggen)
prx daemon --no-evolution

# Benutzerdefinierte Konfigurationsdatei verwenden
prx daemon --config /etc/prx/production.toml
```

## Signale

Der Daemon reagiert auf Unix-Signale zur Laufzeitsteuerung:

| Signal | Verhalten |
|--------|-----------|
| `SIGHUP` | Konfigurationsdatei neu laden ohne Neustart. Kanäle und Cron-Aufgaben werden mit der neuen Konfiguration abgeglichen. |
| `SIGTERM` | Ordnungsgemäßes Herunterfahren. Beendet laufende Anfragen, trennt Kanäle sauber und schreibt ausstehende Gedächtniseinträge. |
| `SIGINT` | Wie `SIGTERM` (Ctrl+C). |

```bash
# Konfiguration ohne Neustart neu laden
kill -HUP $(cat /var/run/prx.pid)

# Ordnungsgemäßes Herunterfahren
kill -TERM $(cat /var/run/prx.pid)
```

## Als systemd-Dienst ausführen

Die empfohlene Methode, den Daemon in der Produktion auszuführen, ist über systemd. Verwenden Sie [`prx service install`](./service), um die Unit-Datei automatisch zu generieren und zu installieren, oder erstellen Sie eine manuell:

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx

# Härtung
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# Dienst installieren und starten
prx service install
prx service start

# Oder manuell
sudo systemctl enable --now prx
```

## Logging

Der Daemon loggt standardmäßig nach stderr. In einer systemd-Umgebung werden Logs vom Journal erfasst:

```bash
# Daemon-Logs verfolgen
journalctl -u prx -f

# Logs der letzten Stunde anzeigen
journalctl -u prx --since "1 hour ago"
```

Aktivieren Sie strukturiertes JSON-Logging durch Hinzufügen von `log_format = "json"` in der Konfigurationsdatei zur Integration mit Log-Aggregatoren.

## Gesundheitscheck

Während der Daemon läuft, verwenden Sie [`prx doctor`](./doctor) oder fragen Sie den Gateway-Gesundheitsendpunkt ab:

```bash
# CLI-Diagnose
prx doctor

# HTTP-Gesundheitsendpunkt
curl http://127.0.0.1:3120/health
```

## Verwandte Themen

- [prx gateway](./gateway) -- eigenständiges Gateway ohne Kanäle oder Cron
- [prx service](./service) -- systemd/OpenRC-Dienstverwaltung
- [prx doctor](./doctor) -- Daemon-Diagnose
- [Konfigurationsübersicht](/de/prx/config/) -- Konfigurationsdateireferenz
- [Selbstentwicklungsübersicht](/de/prx/self-evolution/) -- Details zur Entwicklungs-Engine
