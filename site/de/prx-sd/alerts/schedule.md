---
title: Geplante Scans
description: "Wiederkehrende Scan-Jobs mit sd schedule für automatische Bedrohungserkennung in regelmäßigen Abständen einrichten."
---

# Geplante Scans

Der Befehl `sd schedule` verwaltet wiederkehrende Scan-Jobs, die in definierten Intervallen ausgeführt werden. Geplante Scans ergänzen die Echtzeitüberwachung durch periodische vollständige Scans bestimmter Verzeichnisse und erfassen Bedrohungen, die möglicherweise übersehen wurden oder eingeführt wurden, während die Überwachung inaktiv war.

## Verwendung

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### Unterbefehle

| Unterbefehl | Beschreibung |
|-------------|-------------|
| `add` | Neuen geplanten Scan-Job erstellen |
| `remove` | Geplanten Scan-Job entfernen |
| `list` | Alle geplanten Scan-Jobs auflisten |
| `status` | Status geplanter Jobs einschließlich letztem und nächstem Lauf anzeigen |
| `run` | Geplanten Job sofort manuell auslösen |

## Geplanten Scan hinzufügen

```bash
sd schedule add <PATH> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--frequency` | `-f` | `daily` | Scan-Häufigkeit: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | automatisch generiert | Lesbarer Name für diesen Job |
| `--recursive` | `-r` | `true` | Verzeichnisse rekursiv scannen |
| `--auto-quarantine` | `-q` | `false` | Erkannte Bedrohungen in Quarantäne |
| `--exclude` | `-e` | | Auszuschließende Glob-Muster (wiederholbar) |
| `--notify` | | `true` | Alarme bei Erkennung senden |
| `--time` | `-t` | zufällig | Bevorzugte Startzeit (HH:MM, 24-Stunden-Format) |
| `--day` | `-d` | `monday` | Wochentag für wöchentliche Scans |

### Häufigkeitsoptionen

| Häufigkeit | Intervall | Anwendungsfall |
|------------|-----------|----------------|
| `hourly` | Alle 60 Minuten | Hochrisiko-Verzeichnisse (Uploads, Temp) |
| `4h` | Alle 4 Stunden | Gemeinsam genutzte Verzeichnisse, Web-Wurzeln |
| `12h` | Alle 12 Stunden | Benutzer-Home-Verzeichnisse |
| `daily` | Alle 24 Stunden | Allgemeine vollständige Scans |
| `weekly` | Alle 7 Tage | Risikoarme Archive, Backup-Verifizierung |

### Beispiele

```bash
# Täglicher Scan der Home-Verzeichnisse
sd schedule add /home --frequency daily --name "home-daily"

# Stündlicher Scan des Upload-Verzeichnisses mit Auto-Quarantäne
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# Wöchentlicher vollständiger Scan ohne große Mediendateien
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 4-Stunden-Scan der Temp-Verzeichnisse
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# Täglicher Scan zu einer bestimmten Zeit
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# Wöchentlicher Scan sonntags
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## Geplante Scans auflisten

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## Job-Status prüfen

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

Detaillierten Status für einen bestimmten Job abrufen:

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## Geplante Scans entfernen

```bash
# Nach Name entfernen
sd schedule remove home-daily

# Alle geplanten Scans entfernen
sd schedule remove --all
```

## Scan manuell auslösen

Geplanten Job sofort ausführen, ohne auf das nächste Intervall zu warten:

```bash
sd schedule run home-daily
```

Dieser führt den Scan mit allen konfigurierten Optionen (Quarantäne, Ausschlüsse, Benachrichtigungen) durch und aktualisiert den Zeitstempel des letzten Laufs.

## Funktionsweise der Planung

PRX-SD verwendet einen internen Scheduler, nicht System-Cron. Der Scheduler läuft als Teil des Daemon-Prozesses:

```
sd daemon start
  └── Scheduler-Thread
        ├── Job-Intervalle jede 60 Sekunden prüfen
        ├── Scan-Jobs starten, wenn Intervall abgelaufen
        ├── Ergebnisse in ~/.prx-sd/schedule/ serialisieren
        └── Benachrichtigungen bei Abschluss senden
```

::: warning
Geplante Scans laufen nur, wenn der Daemon aktiv ist. Wenn der Daemon gestoppt wird, werden verpasste Scans beim nächsten Daemon-Start ausgeführt. `sd daemon start` verwenden, um kontinuierliche Planung sicherzustellen.
:::

## Konfigurationsdatei

Geplante Jobs werden in `~/.prx-sd/schedule.json` gespeichert und können auch in `config.toml` definiert werden:

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## Scan-Berichte

Jeder geplante Scan erzeugt einen Bericht, der unter `~/.prx-sd/reports/` gespeichert wird:

```bash
# Neuesten Bericht für einen Job anzeigen
sd schedule report home-daily

# Bericht als JSON exportieren
sd schedule report home-daily --json > report.json

# Alle Berichte auflisten
sd schedule report --list
```

::: tip
Geplante Scans mit E-Mail-Alarmen kombinieren, um automatische Berichte zu erhalten. `scan_completed` in den E-Mail-Ereignissen konfigurieren, um nach jedem geplanten Scan eine Zusammenfassung zu erhalten.
:::

## Nächste Schritte

- [Webhook-Alarme](./webhook) -- Benachrichtigt werden, wenn geplante Scans Bedrohungen finden
- [E-Mail-Alarme](./email) -- E-Mail-Berichte von geplanten Scans
- [Daemon](/de/prx-sd/realtime/daemon) -- erforderlich für die Ausführung geplanter Scans
- [Bedrohungsreaktion](/de/prx-sd/remediation/) -- konfigurieren, was passiert, wenn Bedrohungen gefunden werden
