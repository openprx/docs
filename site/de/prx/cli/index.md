---
title: CLI-Referenz
description: Vollständige Referenz für die prx-Befehlszeilenschnittstelle.
---

# CLI-Referenz

Die `prx`-Binärdatei ist der zentrale Einstiegspunkt für alle PRX-Operationen -- interaktiver Chat, Daemon-Verwaltung, Kanaladministration und Systemdiagnose.

## Globale Flags

Diese Flags werden von jedem Unterbefehl akzeptiert.

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Pfad zur Konfigurationsdatei |
| `--log-level` | `-l` | `info` | Log-Ausführlichkeit: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | Farbige Ausgabe deaktivieren |
| `--quiet` | `-q` | `false` | Nicht-essentielle Ausgabe unterdrücken |
| `--help` | `-h` | | Hilfeinformationen ausgeben |
| `--version` | `-V` | | Version ausgeben |

## Befehle

| Befehl | Beschreibung |
|--------|-------------|
| [`prx agent`](./agent) | Einzelne LLM-Interaktion (pipe-freundlich) |
| [`prx chat`](./chat) | Umfangreicher Terminal-Chat mit Streaming und Verlauf |
| [`prx daemon`](./daemon) | Vollständige PRX-Laufzeit starten (Gateway + Kanäle + Cron + Evolution) |
| [`prx gateway`](./gateway) | Eigenständiger HTTP/WebSocket-Gateway-Server |
| [`prx onboard`](./onboard) | Interaktiver Einrichtungsassistent |
| [`prx channel`](./channel) | Kanalverwaltung (list, add, remove, start, doctor) |
| [`prx cron`](./cron) | Cron-Aufgabenverwaltung (list, add, remove, pause, resume) |
| [`prx evolution`](./evolution) | Selbstentwicklungsoperationen (status, history, config, trigger) |
| [`prx auth`](./auth) | OAuth-Profilverwaltung (login, refresh, logout) |
| [`prx config`](./config) | Konfigurationsoperationen (schema, split, merge, get, set) |
| [`prx doctor`](./doctor) | Systemdiagnose (Daemon-Zustand, Kanalstatus, Modellverfügbarkeit) |
| [`prx service`](./service) | Systemd/OpenRC-Dienstverwaltung (install, start, stop, status) |
| [`prx skills`](./skills) | Skill-Verwaltung (list, install, remove) |
| `prx status` | System-Status-Dashboard |
| `prx models refresh` | Anbieter-Modellkataloge aktualisieren |
| `prx providers` | Alle unterstützten LLM-Anbieter auflisten |
| `prx completions` | Shell-Vervollständigungen generieren (bash, zsh, fish) |

## Schnellbeispiele

```bash
# Ersteinrichtung
prx onboard

# Interaktiven Chat starten
prx chat

# Einzelabfrage (skriptfähig)
echo "Summarize this file" | prx agent -f report.pdf

# Daemon mit allen Diensten starten
prx daemon

# Systemzustand prüfen
prx doctor
```

## Shell-Vervollständigungen

Generieren Sie Vervollständigungen für Ihre Shell und fügen Sie sie Ihrem Profil hinzu:

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## Umgebungsvariablen

PRX berücksichtigt die folgenden Umgebungsvariablen (diese überschreiben Konfigurationsdateiwerte):

| Variable | Beschreibung |
|----------|-------------|
| `PRX_CONFIG` | Pfad zur Konfigurationsdatei (wie `--config`) |
| `PRX_LOG` | Log-Stufe (wie `--log-level`) |
| `PRX_DATA_DIR` | Datenverzeichnis (Standard: `~/.local/share/prx`) |
| `ANTHROPIC_API_KEY` | API-Schlüssel für den Anthropic-Anbieter |
| `OPENAI_API_KEY` | API-Schlüssel für den OpenAI-Anbieter |
| `GOOGLE_API_KEY` | API-Schlüssel für den Google Gemini-Anbieter |

## Verwandte Themen

- [Konfigurationsübersicht](/de/prx/config/) -- Konfigurationsdateiformat und Optionen
- [Erste Schritte](/de/prx/getting-started/installation) -- Installationsanleitung
- [Fehlerbehebung](/de/prx/troubleshooting/) -- Häufige Fehler und Lösungen
