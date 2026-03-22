---
title: Dateiüberwachung
description: Echtzeit-Dateisystemüberwachung mit sd monitor zur Erkennung von Bedrohungen, sobald sie auf der Festplatte erscheinen.
---

# Dateiüberwachung

Der Befehl `sd monitor` überwacht Verzeichnisse auf Dateisystemaktivitäten und scannt neue oder geänderte Dateien in Echtzeit. Dies ist die primäre Methode, Malware in dem Moment zu erfassen, in dem sie auf der Festplatte landet, bevor sie die Chance hat, ausgeführt zu werden.

## Verwendung

```bash
sd monitor [OPTIONS] [PATHS...]
```

Wenn keine Pfade angegeben sind, überwacht `sd monitor` das aktuelle Arbeitsverzeichnis.

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|--------------|
| `--recursive` | `-r` | `true` | Verzeichnisse rekursiv überwachen |
| `--block` | `-b` | `false` | Dateiausführung blockieren, bis Scan abgeschlossen ist (nur Linux) |
| `--daemon` | `-d` | `false` | Im Hintergrund als Daemon-Prozess ausführen |
| `--pid-file` | | | PID in angegebene Datei schreiben (impliziert `--daemon`) |
| `--exclude` | `-e` | | Glob-Muster zum Ausschließen (wiederholbar) |
| `--log-file` | | | Protokollausgabe in Datei statt in stderr schreiben |
| `--auto-quarantine` | `-q` | `false` | Erkannte Bedrohungen automatisch in Quarantäne |
| `--events` | | alle | Kommagetrennte Liste der zu überwachenden Ereignisse |
| `--json` | | `false` | Ereignisse als JSON-Zeilen ausgeben |

## Plattform-Mechanismen

PRX-SD verwendet die leistungsfähigste Dateisystem-API, die auf jeder Plattform verfügbar ist:

| Plattform | API | Fähigkeiten |
|-----------|-----|-------------|
| **Linux** | fanotify (Kernel 5.1+) | Systemweite Überwachung, Ausführungs-Berechtigungssteuerung, Dateideskriptor-Durchleitung |
| **Linux (Fallback)** | inotify | Pro-Verzeichnis-Watches, keine Block-Unterstützung |
| **macOS** | FSEvents | Niedriglatenz-Rekursiv-Überwachung, historische Ereignis-Wiedergabe |
| **Windows** | ReadDirectoryChangesW | Pro-Verzeichnis-Async-Überwachung mit Completion Ports |

::: tip
Unter Linux benötigt `sd monitor` die Fähigkeit `CAP_SYS_ADMIN` (oder Root), um fanotify zu verwenden. Wenn nicht verfügbar, fällt es automatisch auf inotify mit einer Warnung zurück.
:::

## Überwachte Ereignisse

Die folgenden Dateisystem-Ereignisse lösen einen Scan aus:

| Ereignis | Beschreibung | Plattformen |
|----------|--------------|-------------|
| `Create` | Eine neue Datei wird erstellt | Alle |
| `Modify` | Dateiinhalt wird geschrieben | Alle |
| `CloseWrite` | Datei nach dem Schreiben geschlossen (vermeidet Teil-Scans) | Linux |
| `Delete` | Eine Datei wird entfernt | Alle |
| `Rename` | Eine Datei wird umbenannt oder verschoben | Alle |
| `Open` | Eine Datei wird zum Lesen geöffnet | Linux (fanotify) |
| `Execute` | Eine Datei soll ausgeführt werden | Linux (fanotify) |

Mit `--events` filtern, welche Ereignisse Scans auslösen:

```bash
# Nur bei neuen Dateien und Änderungen scannen
sd monitor --events Create,CloseWrite /home
```

## Block-Modus

Unter Linux mit fanotify aktiviert `--block` den Modus `FAN_OPEN_EXEC_PERM`. In diesem Modus hält der Kernel die Prozessausführung an, bis PRX-SD ein Urteil zurückgibt:

```bash
sudo sd monitor --block /usr/local/bin /tmp
```

::: warning
Block-Modus fügt Latenz zu jedem Programmstart in den überwachten Pfaden hinzu. Verwenden Sie ihn nur für Hochrisiko-Verzeichnisse wie `/tmp` oder Download-Ordner, nicht für systemweite Pfade wie `/usr` oder `/lib`.
:::

Wenn eine Bedrohung im Block-Modus erkannt wird:

1. Der Datei-Öffnen/Ausführen wird vom Kernel **verweigert**
2. Das Ereignis wird mit dem Urteil `BLOCKED` protokolliert
3. Wenn `--auto-quarantine` gesetzt ist, wird die Datei in den Quarantänetresor verschoben

## Daemon-Modus

`--daemon` verwenden, um den Monitor vom Terminal zu trennen:

```bash
sd monitor --daemon --pid-file /var/run/sd-monitor.pid /home /tmp /var/www
```

Daemon durch Senden von `SIGTERM` stoppen:

```bash
kill $(cat /var/run/sd-monitor.pid)
```

Oder `sd daemon stop` verwenden, wenn über den Daemon-Manager ausgeführt. Weitere Informationen finden Sie unter [Daemon](./daemon).

## Beispiele

```bash
# Home- und tmp-Verzeichnisse überwachen
sd monitor /home /tmp

# Mit automatischer Quarantäne überwachen
sd monitor --auto-quarantine /home/downloads

# Block-Modus unter Linux für ein sensibles Verzeichnis
sudo sd monitor --block --auto-quarantine /tmp

# Build-Artefakte und node_modules ausschließen
sd monitor -e "*.o" -e "node_modules/**" /home/dev/projects

# Als Daemon mit JSON-Protokollierung ausführen
sd monitor --daemon --json --log-file /var/log/sd-monitor.json /home

# Mit bestimmten Ereignissen überwachen
sd monitor --events Create,Modify,Rename /var/www
```

## JSON-Ausgabe

Wenn `--json` aktiviert ist, erzeugt jedes Ereignis eine einzelne JSON-Zeile:

```json
{
  "timestamp": "2026-03-21T10:15:32.456Z",
  "event": "CloseWrite",
  "path": "/tmp/payload.exe",
  "verdict": "malicious",
  "threat": "Win.Trojan.Agent-123456",
  "action": "quarantined",
  "scan_ms": 12
}
```

## Nächste Schritte

- [Daemon](./daemon) -- Überwachung als verwalteten Hintergrunddienst ausführen
- [Ransomware-Schutz](./ransomware) -- Spezialisierte Ransomware-Verhaltens-Erkennung
- [Quarantäneverwaltung](/de/prx-sd/quarantine/) -- Quarantänierte Dateien verwalten
- [Bedrohungsreaktion](/de/prx-sd/remediation/) -- Automatische Reaktionsrichtlinien konfigurieren
