---
title: prx cron
description: Geplante Cron-Aufgaben verwalten, die auf dem PRX-Daemon laufen.
---

# prx cron

Verwaltet geplante Aufgaben, die auf dem PRX-Cron-Scheduler ausgeführt werden. Cron-Aufgaben können LLM-Prompts, Shell-Befehle oder Werkzeugaufrufe nach einem definierten Zeitplan ausführen.

## Verwendung

```bash
prx cron <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx cron list`

Alle konfigurierten Cron-Aufgaben und deren Status auflisten.

```bash
prx cron list [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--json` | `-j` | `false` | Ausgabe als JSON |
| `--verbose` | `-v` | `false` | Vollständige Aufgabendetails einschließlich Zeitplanausdruck anzeigen |

**Beispielausgabe:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

Neue Cron-Aufgabe hinzufügen.

```bash
prx cron add [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--name` | `-n` | erforderlich | Aufgabenname |
| `--schedule` | `-s` | erforderlich | Cron-Ausdruck (5 oder 6 Felder) |
| `--prompt` | `-p` | | Auszuführender LLM-Prompt |
| `--command` | `-c` | | Auszuführender Shell-Befehl |
| `--channel` | | | Kanal, an den die Ausgabe gesendet wird |
| `--provider` | `-P` | Konfigurationsstandard | LLM-Anbieter für Prompt-Aufgaben |
| `--model` | `-m` | Anbieterstandard | Modell für Prompt-Aufgaben |
| `--enabled` | | `true` | Aufgabe sofort aktivieren |

Entweder `--prompt` oder `--command` muss angegeben werden.

```bash
# Tägliche Zusammenfassung planen
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# Backup-Befehl planen
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# Wöchentlicher Bericht jeden Montag um 10 Uhr
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

Cron-Aufgabe nach ID oder Name entfernen.

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--force` | `-f` | `false` | Bestätigungsaufforderung überspringen |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

Cron-Aufgabe pausieren. Die Aufgabe bleibt konfiguriert, wird aber erst nach Fortsetzen wieder ausgeführt.

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

Pausierte Cron-Aufgabe fortsetzen.

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## Cron-Ausdruck-Format

PRX verwendet standardmäßige 5-Feld-Cron-Ausdrücke:

```
 ┌───────── Minute (0-59)
 │ ┌───────── Stunde (0-23)
 │ │ ┌───────── Tag des Monats (1-31)
 │ │ │ ┌───────── Monat (1-12)
 │ │ │ │ ┌───────── Wochentag (0-7, 0 und 7 = Sonntag)
 │ │ │ │ │
 * * * * *
```

Gängige Beispiele:

| Ausdruck | Beschreibung |
|----------|-------------|
| `0 9 * * *` | Jeden Tag um 9:00 Uhr |
| `*/15 * * * *` | Alle 15 Minuten |
| `0 */6 * * *` | Alle 6 Stunden |
| `0 10 * * 1` | Jeden Montag um 10:00 Uhr |
| `0 0 1 * *` | Am ersten Tag jedes Monats um Mitternacht |

## Verwandte Themen

- [Scheduling-Übersicht](/de/prx/cron/) -- Cron-Architektur und Heartbeat
- [Cron-Aufgaben](/de/prx/cron/tasks) -- Aufgabentypen und Ausführungsdetails
- [prx daemon](./daemon) -- der Daemon, der den Cron-Scheduler ausführt
