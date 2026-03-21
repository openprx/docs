---
title: prx channel
description: Messaging-Kanalverbindungen verwalten -- auflisten, hinzufügen, entfernen, starten und diagnostizieren.
---

# prx channel

Verwalten Sie die Messaging-Kanäle, mit denen sich PRX verbindet. Kanäle sind die Brücken zwischen Messaging-Plattformen (Telegram, Discord, Slack usw.) und der PRX-Agent-Laufzeit.

## Verwendung

```bash
prx channel <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx channel list`

Alle konfigurierten Kanäle und deren aktuellen Status auflisten.

```bash
prx channel list [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--json` | `-j` | `false` | Ausgabe als JSON |
| `--verbose` | `-v` | `false` | Detaillierte Verbindungsinformationen anzeigen |

**Beispielausgabe:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

Neue Kanalkonfiguration interaktiv oder über Flags hinzufügen.

```bash
prx channel add [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--type` | `-t` | | Kanaltyp (z.B. `telegram`, `discord`, `slack`) |
| `--name` | `-n` | automatisch generiert | Anzeigename für den Kanal |
| `--token` | | | Bot-Token oder API-Schlüssel |
| `--enabled` | | `true` | Kanal sofort aktivieren |
| `--interactive` | `-i` | `true` | Interaktiven Assistenten verwenden |

```bash
# Interaktiver Modus (geführte Eingabeaufforderungen)
prx channel add

# Nicht-interaktiv mit Flags
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

Kanalkonfiguration entfernen.

```bash
prx channel remove <NAME> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--force` | `-f` | `false` | Bestätigungsaufforderung überspringen |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

Einen bestimmten Kanal starten (oder neu starten), ohne den Daemon neu zu starten.

```bash
prx channel start <NAME>
```

```bash
# Einen fehlerhaften Kanal neu starten
prx channel start slack-team
```

Dieser Befehl sendet eine Steuernachricht an den laufenden Daemon. Der Daemon muss laufen, damit dieser Befehl funktioniert.

### `prx channel doctor`

Diagnose der Kanalverbindungen ausführen. Prüft Token-Gültigkeit, Netzwerkverbindung, Webhook-URLs und Berechtigungen.

```bash
prx channel doctor [NAME]
```

Wird `NAME` weggelassen, werden alle Kanäle geprüft.

```bash
# Alle Kanäle prüfen
prx channel doctor

# Bestimmten Kanal prüfen
prx channel doctor telegram-main
```

**Beispielausgabe:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## Beispiele

```bash
# Vollständiger Workflow: hinzufügen, überprüfen, starten
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# Kanäle als JSON für Skripte auflisten
prx channel list --json | jq '.[] | select(.status == "error")'
```

## Verwandte Themen

- [Kanalübersicht](/de/prx/channels/) -- ausführliche Kanaldokumentation
- [prx daemon](./daemon) -- der Daemon, der Kanalverbindungen ausführt
- [prx doctor](./doctor) -- vollständige Systemdiagnose einschließlich Kanälen
