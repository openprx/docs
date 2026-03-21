---
title: prx onboard
description: Interaktiver Einrichtungsassistent für die erstmalige PRX-Konfiguration.
---

# prx onboard

Startet den Einrichtungsassistenten zur erstmaligen Konfiguration von PRX. Der Assistent führt durch Anbieterauswahl, API-Schlüssel-Einrichtung, Kanalkonfiguration und grundlegende Einstellungen.

## Verwendung

```bash
prx onboard [OPTIONS]
```

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--quick` | `-q` | `false` | Schnellmodus -- minimale Eingabeaufforderungen, sinnvolle Standardwerte |
| `--provider` | `-P` | | Anbieter vorauswählen (Anbieterwahl-Schritt überspringen) |
| `--config` | `-c` | `~/.config/prx/config.toml` | Ausgabepfad der Konfigurationsdatei |
| `--force` | `-f` | `false` | Vorhandene Konfigurationsdatei überschreiben |
| `--non-interactive` | | `false` | Nicht-interaktiver Modus (erfordert `--provider` und Umgebungsvariablen für Schlüssel) |

## Assistenten-Schritte

Der interaktive Assistent führt Sie durch folgende Schritte:

1. **Anbieterauswahl** -- wählen Sie Ihren primären LLM-Anbieter (Anthropic, OpenAI, Ollama usw.)
2. **API-Schlüssel-Konfiguration** -- geben Sie Ihren API-Schlüssel ein und validieren Sie ihn
3. **Modellauswahl** -- wählen Sie ein Standardmodell vom gewählten Anbieter
4. **Kanaleinrichtung** (optional) -- konfigurieren Sie einen oder mehrere Messaging-Kanäle
5. **Gedächtnis-Backend** -- wählen Sie, wo der Gesprächsspeicher gespeichert wird (Markdown, SQLite, PostgreSQL)
6. **Sicherheit** -- richten Sie Pairing-Code und Sandbox-Einstellungen ein
7. **Konfigurationsprüfung** -- Vorschau der generierten Konfiguration und Bestätigung

## Beispiele

```bash
# Vollständiger interaktiver Assistent
prx onboard

# Schnelleinrichtung mit Anthropic
prx onboard --quick --provider anthropic

# Nicht-interaktiv (API-Schlüssel aus Umgebung)
export ANTHROPIC_API_KEY="sk-ant-..."
prx onboard --non-interactive --provider anthropic

# Konfiguration in benutzerdefinierten Pfad schreiben
prx onboard --config /etc/prx/config.toml

# Assistenten erneut ausführen (vorhandene Konfiguration überschreiben)
prx onboard --force
```

## Schnellmodus

Der Schnellmodus (`--quick`) überspringt optionale Schritte und verwendet sinnvolle Standardwerte:

- Gedächtnis-Backend: SQLite
- Sicherheit: Sandbox aktiviert, kein Pairing erforderlich
- Kanäle: keine (später mit `prx channel add` hinzufügen)
- Evolution: deaktiviert (später in der Konfiguration aktivieren)

Dies ist der schnellste Weg zu einer funktionierenden Konfiguration:

```bash
prx onboard --quick --provider ollama
```

## Nach der Einrichtung

Nach Abschluss der Einrichtung können Sie:

```bash
# Konfiguration überprüfen
prx doctor

# Chat starten
prx chat

# Weitere Kanäle hinzufügen
prx channel add

# Vollständigen Daemon starten
prx daemon
```

## Verwandte Themen

- [Erste Schritte](/de/prx/getting-started/quickstart) -- Schnellstartanleitung
- [Konfigurationsübersicht](/de/prx/config/) -- Konfigurationsdateiformat und Optionen
- [prx config](./config) -- Konfiguration nach der Ersteinrichtung ändern
- [prx channel](./channel) -- Kanäle nach der Einrichtung hinzufügen
