---
title: prx chat
description: Umfangreicher Terminal-Chat mit Streaming-Antworten, Verlaufsnavigation und mehrzeiliger Eingabe.
---

# prx chat

Startet eine interaktive Chat-Sitzung im Terminal mit Streaming-Antworten, Gesprächsverlauf und vollem Werkzeugzugriff.

## Verwendung

```bash
prx chat [OPTIONS]
```

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--provider` | `-P` | Konfigurationsstandard | Zu verwendender LLM-Anbieter (z.B. `anthropic`, `openai`, `ollama`) |
| `--model` | `-m` | Anbieterstandard | Modellbezeichner (z.B. `claude-sonnet-4-20250514`, `gpt-4o`) |
| `--system` | `-s` | | Benutzerdefinierter System-Prompt (überschreibt Konfiguration) |
| `--session` | `-S` | neue Sitzung | Benannte Sitzung fortsetzen |
| `--no-tools` | | `false` | Werkzeugverwendung für diese Sitzung deaktivieren |
| `--no-memory` | | `false` | Gedächtnis-Lesen und -Schreiben deaktivieren |
| `--no-stream` | | `false` | Auf vollständige Antwort warten statt Streaming |
| `--max-turns` | | unbegrenzt | Maximale Gesprächsrunden vor automatischem Beenden |
| `--temperature` | `-t` | Anbieterstandard | Sampling-Temperatur (0.0 - 2.0) |

## Interaktive Steuerung

Innerhalb der Chat-Sitzung stehen folgende Tastenkombinationen zur Verfügung:

| Taste | Aktion |
|-------|--------|
| `Enter` | Nachricht senden |
| `Shift+Enter` oder `\` dann `Enter` | Neue Zeile (mehrzeilige Eingabe) |
| `Hoch` / `Runter` | Nachrichtenverlauf durchblättern |
| `Ctrl+C` | Aktuelle Generierung abbrechen |
| `Ctrl+D` | Chat-Sitzung beenden |
| `Ctrl+L` | Bildschirm löschen |

## Schrägstrich-Befehle

Geben Sie diese Befehle direkt in die Chat-Eingabe ein:

| Befehl | Beschreibung |
|--------|-------------|
| `/help` | Verfügbare Befehle anzeigen |
| `/model <Name>` | Modell während der Sitzung wechseln |
| `/provider <Name>` | Anbieter während der Sitzung wechseln |
| `/system <Prompt>` | System-Prompt aktualisieren |
| `/clear` | Gesprächsverlauf löschen |
| `/save [Name]` | Aktuelle Sitzung speichern |
| `/load <Name>` | Gespeicherte Sitzung laden |
| `/sessions` | Gespeicherte Sitzungen auflisten |
| `/tools` | Verfügbare Werkzeuge auflisten |
| `/exit` | Chat beenden |

## Beispiele

```bash
# Mit Standardeinstellungen starten
prx chat

# Bestimmtes Modell verwenden
prx chat --provider anthropic --model claude-sonnet-4-20250514

# Vorherige Sitzung fortsetzen
prx chat --session project-planning

# Schnelle Frage mit lokalem Modell
prx chat --provider ollama --model llama3

# Auf 10 Runden begrenzen (nützlich für skriptgesteuerte Workflows)
prx chat --max-turns 10
```

## Sitzungsverwaltung

Chat-Sitzungen werden beim Beenden automatisch gespeichert. Jede Sitzung zeichnet auf:

- Gesprächsnachrichten (Benutzer + Assistent)
- Werkzeugaufrufe und Ergebnisse
- Verwendeter Anbieter und Modell
- Zeitstempel und Dauer

Sitzungen werden im PRX-Datenverzeichnis gespeichert (standardmäßig `~/.local/share/prx/sessions/`).

```bash
# Alle Sitzungen auflisten
prx chat --session ""  # leerer Name listet Sitzungen auf

# Nach Name fortsetzen
prx chat --session my-project
```

## Mehrzeilige Eingabe

Für längere Prompts verwenden Sie den mehrzeiligen Modus. Drücken Sie `Shift+Enter`, um eine neue Zeile einzufügen, ohne zu senden. Die Eingabeaufforderung wechselt von `>` zu `...`, um anzuzeigen, dass Sie sich im mehrzeiligen Modus befinden.

Alternativ können Sie Eingaben aus einer Datei weiterleiten:

```bash
# Der Chat öffnet sich weiterhin interaktiv, mit dem Dateiinhalt als erste Nachricht
prx chat < prompt.txt
```

## Anbieter- und Modell-Überschreibung

Die Flags `--provider` und `--model` überschreiben die Standardwerte aus Ihrer Konfigurationsdatei für die Dauer der Sitzung. Sie können auch während der Sitzung mit Schrägstrich-Befehlen wechseln.

```bash
# Mit OpenAI starten, während des Gesprächs zu Anthropic wechseln
prx chat --provider openai
# Im Chat: /provider anthropic
# Im Chat: /model claude-sonnet-4-20250514
```

## Verwandte Themen

- [prx agent](./agent) -- nicht-interaktiver Einzelabfragemodus
- [Anbieterübersicht](/de/prx/providers/) -- unterstützte LLM-Anbieter
- [Gedächtnisübersicht](/de/prx/memory/) -- wie Gedächtnis in Gesprächen funktioniert
- [Werkzeugübersicht](/de/prx/tools/) -- verfügbare Werkzeuge während des Chats
