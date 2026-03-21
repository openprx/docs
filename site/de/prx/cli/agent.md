---
title: prx agent
description: Einzelne LLM-Interaktion für Skripte und Piping.
---

# prx agent

Führt eine einzelne LLM-Interaktion aus. Der Agent verarbeitet einen Prompt, gibt die Antwort zurück und beendet sich. Konzipiert für Skripte, Piping und Integration mit anderen Werkzeugen.

## Verwendung

```bash
prx agent [OPTIONS] [PROMPT]
```

Wird `PROMPT` weggelassen, wird die Eingabe von stdin gelesen.

## Optionen

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--provider` | `-P` | Konfigurationsstandard | Zu verwendender LLM-Anbieter |
| `--model` | `-m` | Anbieterstandard | Modellbezeichner |
| `--system` | `-s` | | Benutzerdefinierter System-Prompt |
| `--file` | `-f` | | Datei an den Prompt-Kontext anhängen |
| `--no-tools` | | `false` | Werkzeugverwendung deaktivieren |
| `--no-memory` | | `false` | Gedächtnis-Lesen und -Schreiben deaktivieren |
| `--json` | `-j` | `false` | Rohe JSON-Antwort ausgeben |
| `--temperature` | `-t` | Anbieterstandard | Sampling-Temperatur (0.0 - 2.0) |
| `--max-tokens` | | Anbieterstandard | Maximale Antwort-Token |
| `--timeout` | | `120` | Zeitlimit in Sekunden |

## Beispiele

```bash
# Einfache Frage
prx agent "What is the capital of France?"

# Inhalt zur Analyse weiterleiten
cat error.log | prx agent "Summarize these errors"

# Datei anhängen
prx agent -f report.pdf "Summarize the key findings"

# Bestimmtes Modell verwenden
prx agent -P anthropic -m claude-sonnet-4-20250514 "Explain quantum entanglement"

# JSON-Ausgabe für Skripte
prx agent --json "List 5 programming languages" | jq '.content'

# Mit anderen Befehlen verketten
git diff HEAD~1 | prx agent "Write a commit message for this diff"
```

## Stdin vs. Argument

Der Prompt kann als Positionsargument oder über stdin bereitgestellt werden. Wenn beides vorhanden ist, werden sie zusammengefügt (stdin-Inhalt zuerst, dann das Argument als Anweisung).

```bash
# Nur Argument
prx agent "Hello"

# Nur stdin
echo "Hello" | prx agent

# Beides: stdin als Kontext, Argument als Anweisung
cat data.csv | prx agent "Find anomalies in this dataset"
```

## Dateianhänge

Das `--file`-Flag fügt Dateiinhalt zum Prompt-Kontext hinzu. Mehrere Dateien können angehängt werden:

```bash
prx agent -f src/main.rs -f src/lib.rs "Review this code for bugs"
```

Unterstützte Dateitypen umfassen Textdateien, PDFs, Bilder (für Modelle mit Bilderkennung) und gängige Dokumentformate.

## Exit-Codes

| Code | Bedeutung |
|------|-----------|
| `0` | Erfolg |
| `1` | Allgemeiner Fehler (ungültige Konfiguration, Netzwerkfehler) |
| `2` | Zeitlimit überschritten |
| `3` | Anbieterfehler (Ratenbegrenzung, Authentifizierungsfehler) |

## Verwandte Themen

- [prx chat](./chat) -- interaktiver Mehrrunden-Chat
- [Anbieterübersicht](/de/prx/providers/) -- unterstützte LLM-Anbieter
- [Werkzeugübersicht](/de/prx/tools/) -- verfügbare Werkzeuge während der Agent-Ausführung
