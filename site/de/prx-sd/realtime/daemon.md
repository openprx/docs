---
title: Daemon-Prozess
description: PRX-SD als Hintergrund-Daemon mit automatischen Signatur-Updates und dauerhafter Dateiüberwachung betreiben.
---

# Daemon-Prozess

Der Befehl `sd daemon` startet PRX-SD als langlebigen Hintergrundprozess, der Echtzeit-Dateiüberwachung mit automatischen Signatur-Updates kombiniert. Dies ist die empfohlene Methode, PRX-SD auf Servern und Workstations auszuführen, die kontinuierlichen Schutz benötigen.

## Verwendung

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### Unterbefehle

| Unterbefehl | Beschreibung |
|-------------|--------------|
| `start` | Daemon starten (Standard wenn kein Unterbefehl angegeben) |
| `stop` | Laufenden Daemon stoppen |
| `restart` | Daemon stoppen und neu starten |
| `status` | Daemon-Status und Statistiken anzeigen |

## Optionen (start)

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|--------------|
| `--watch` | `-w` | `/home,/tmp` | Kommagetrennte zu überwachende Pfade |
| `--update-hours` | `-u` | `6` | Automatisches Signatur-Update-Intervall in Stunden |
| `--no-update` | | `false` | Automatische Signatur-Updates deaktivieren |
| `--block` | `-b` | `false` | Block-Modus aktivieren (Linux fanotify) |
| `--auto-quarantine` | `-q` | `false` | Bedrohungen automatisch in Quarantäne |
| `--pid-file` | | `~/.prx-sd/sd.pid` | PID-Datei-Speicherort |
| `--log-file` | | `~/.prx-sd/daemon.log` | Protokolldatei-Speicherort |
| `--log-level` | `-l` | `info` | Protokoll-Detailgrad: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | Pfad zur Konfigurationsdatei |

## Was der Daemon verwaltet

Beim Start startet `sd daemon` zwei Subsysteme:

1. **Dateimonitor** -- überwacht die konfigurierten Pfade auf Dateisystem-Ereignisse und scannt neue oder geänderte Dateien. Entspricht dem Ausführen von `sd monitor` mit denselben Pfaden.
2. **Update-Scheduler** -- prüft periodisch auf neue Bedrohungssignaturen (Hash-Datenbanken, YARA-Regeln, IOC-Feeds) und lädt sie herunter. Entspricht dem Ausführen von `sd update` im konfigurierten Intervall.

## Standard-überwachte Pfade

Wenn `--watch` nicht angegeben ist, überwacht der Daemon:

| Plattform | Standardpfade |
|-----------|--------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

Diese Standardwerte in der Konfigurationsdatei oder über `--watch` überschreiben:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## Status prüfen

`sd daemon status` (oder die Kurzform `sd status`) verwenden, um den Daemon-Zustand anzuzeigen:

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## systemd-Integration (Linux)

Einen systemd-Dienst für automatischen Start erstellen:

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# Sicherheitshärtung
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
Der Daemon benötigt Root-Rechte für den fanotify-Block-Modus. Für Nicht-Block-Überwachung kann er als nicht-privilegierter Benutzer mit Lesezugriff auf die überwachten Pfade ausgeführt werden.
:::

## launchd-Integration (macOS)

Einen Launch-Daemon-Plist unter `/Library/LaunchDaemons/com.openprx.sd.plist` erstellen:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## Signale

| Signal | Verhalten |
|--------|-----------|
| `SIGHUP` | Konfiguration neu laden und Watches ohne vollständigen Neustart neu starten |
| `SIGTERM` | Geordnetes Herunterfahren -- aktuellen Scan beenden, Protokolle leeren |
| `SIGINT` | Wie `SIGTERM` |
| `SIGUSR1` | Sofortiges Signatur-Update auslösen |

```bash
# Sofortiges Update erzwingen
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## Beispiele

```bash
# Daemon mit Standardeinstellungen starten
sd daemon start

# Mit benutzerdefinierten Überwachungspfaden und 4-Stunden-Update-Zyklus starten
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# Mit Block-Modus und Auto-Quarantäne starten
sudo sd daemon start --block --auto-quarantine

# Daemon-Status prüfen
sd status

# Daemon neu starten
sd daemon restart

# Daemon stoppen
sd daemon stop
```

::: warning
Das Stoppen des Daemons deaktiviert den gesamten Echtzeitschutz. Dateisystem-Ereignisse, die auftreten, während der Daemon gestoppt ist, werden nicht nachträglich gescannt.
:::

## Nächste Schritte

- [Dateiüberwachung](./monitor) -- Detaillierte Überwachungskonfiguration
- [Ransomware-Schutz](./ransomware) -- Verhaltensbasierte Ransomware-Erkennung
- [Signaturen aktualisieren](/de/prx-sd/signatures/update) -- Manuelle Signatur-Updates
- [Webhook-Alarme](/de/prx-sd/alerts/webhook) -- Benachrichtigt werden, wenn Bedrohungen gefunden werden
