---
title: CLI
description: PRX interaktiv über das Terminal per stdin/stdout verwenden
---

# CLI

> PRX direkt vom Terminal mit stdin/stdout für interaktive Gespräche ohne externe Dienstabhängigkeiten verwenden.

## Voraussetzungen

- PRX installiert und mit mindestens einem LLM-Anbieter konfiguriert
- Ein Terminal mit stdin/stdout-Unterstützung

## Schnelleinrichtung

### 1. Konfigurieren

Der CLI-Kanal ist standardmäßig aktiviert. Keine zusätzliche Konfiguration erforderlich.

```toml
[channels_config]
cli = true  # Standard, kann weggelassen werden
```

### 2. Starten

```bash
prx
```

PRX startet im interaktiven Modus, liest von stdin und schreibt Antworten nach stdout.

### 3. Verwendung

Geben Sie Ihre Nachricht ein und drücken Sie Enter. Spezialbefehle:

```
> Hello, how are you?
[PRX antwortet...]

> /quit    # Sitzung beenden
> /exit    # Sitzung beenden (Alternative)
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `cli` | `bool` | `true` | CLI-interaktiven Kanal aktivieren oder deaktivieren |

## Funktionen

- **Keine Abhängigkeiten** -- keine externen Konten, Token oder APIs nötig außer dem LLM-Anbieter
- **Immer verfügbar** -- standardmäßig aktiviert; funktioniert direkt nach der Installation
- **stdin/stdout-Schnittstelle** -- Standard-Unix-E/A für einfaches Skripten und Piping
- **Leerzeilen-Filterung** -- leere Zeilen werden stillschweigend ignoriert
- **Ordnungsgemäßes Beenden** -- `/quit` oder `/exit` eingeben, um die Sitzung sauber zu beenden
- **Voller Werkzeugzugriff** -- alle konfigurierten Werkzeuge (Shell, Datei, Browser, Gedächtnis usw.) sind verfügbar

## Einschränkungen

- Nur Einzelbenutzer, Einzelsitzung
- Kein persistenter Gesprächsverlauf über Sitzungen hinweg (es sei denn, Sitzungspersistenz ist global aktiviert)
- Keine Medien- oder Dateianhang-Unterstützung (nur Texteingabe)
- Kein Streaming/progressive Ausgabe (Antworten werden vollständig nach der Generierung ausgegeben)
- Kann nicht gleichzeitig mit anderen Kanälen im selben Prozess laufen, es sei denn explizit konfiguriert

## Fehlerbehebung

### PRX startet nicht im CLI-Modus
- Stellen Sie sicher, dass `cli = true` (oder weglassen, da der Standard `true` ist) in `[channels_config]`
- Wenn andere Kanäle konfiguriert sind, priorisiert PRX diese möglicherweise; prüfen Sie die Start-Logs
- Überprüfen Sie, ob mindestens ein LLM-Anbieter konfiguriert ist

### Eingabe wird nicht verarbeitet
- Stellen Sie sicher, dass Sie im Terminal tippen, in dem PRX läuft (kein Hintergrundprozess)
- Leere Zeilen werden ignoriert; geben Sie eine nicht-leere Nachricht ein
- Prüfen Sie, ob stdin verbunden ist (nicht von `/dev/null` umgeleitet)

### CLI mit Pipes verwenden
- PRX liest von stdin Zeile für Zeile, sodass Sie Eingabe weiterleiten können:
  ```bash
  echo "What is 2 + 2?" | prx
  ```
- Für Mehrrunden-Konversationen über Skripte verwenden Sie einen FIFO- oder `expect`-basierten Ansatz
