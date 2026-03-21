---
title: prx service
description: PRX als Systemdienst installieren und verwalten (systemd oder OpenRC).
---

# prx service

PRX als Systemdienst installieren, starten, stoppen und den Status prüfen. Unterstützt sowohl systemd (die meisten Linux-Distributionen) als auch OpenRC (Alpine, Gentoo).

## Verwendung

```bash
prx service <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx service install`

Service-Unit-Datei für das aktuelle Init-System generieren und installieren.

```bash
prx service install [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Konfigurationsdateipfad für den Dienst |
| `--user` | `-u` | aktueller Benutzer | Benutzer, unter dem der Dienst läuft |
| `--group` | `-g` | aktuelle Gruppe | Gruppe, unter der der Dienst läuft |
| `--bin-path` | | automatisch erkannt | Pfad zur `prx`-Binärdatei |
| `--enable` | | `false` | Dienst für Start beim Booten aktivieren |
| `--user-service` | | `false` | Als systemd-Benutzerdienst installieren (kein sudo erforderlich) |

```bash
# Als Systemdienst installieren (erfordert sudo)
sudo prx service install --user prx --group prx --enable

# Als Benutzerdienst installieren (kein sudo)
prx service install --user-service --enable

# Mit benutzerdefiniertem Konfigurationspfad installieren
sudo prx service install --config /etc/prx/config.toml --user prx
```

Der Installationsbefehl:

1. Erkennt das Init-System (systemd oder OpenRC)
2. Generiert die entsprechende Dienstdatei
3. Installiert sie am richtigen Speicherort (`/etc/systemd/system/prx.service` oder `/etc/init.d/prx`)
4. Aktiviert optional den Dienst für den Bootvorgang

### `prx service start`

Den PRX-Dienst starten.

```bash
prx service start
```

```bash
# Systemdienst
sudo prx service start

# Benutzerdienst
prx service start
```

### `prx service stop`

Den PRX-Dienst ordnungsgemäß stoppen.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

Aktuellen Dienststatus anzeigen.

```bash
prx service status [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--json` | `-j` | `false` | Ausgabe als JSON |

**Beispielausgabe:**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## Generierte Unit-Dateien

### systemd

Die generierte systemd-Unit-Datei enthält Härtungsanweisungen für den Produktionsbetrieb:

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
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## Benutzerdienst

Für Einzelbenutzer-Bereitstellungen installieren Sie als systemd-Benutzerdienst. Dies erfordert keine Root-Rechte:

```bash
prx service install --user-service --enable

# Verwaltung mit systemctl --user
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## Verwandte Themen

- [prx daemon](./daemon) -- Daemon-Konfiguration und Signale
- [prx doctor](./doctor) -- Dienstzustand überprüfen
- [Konfigurationsübersicht](/de/prx/config/) -- Konfigurationsdateireferenz
