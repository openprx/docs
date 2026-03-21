---
title: prx config
description: PRX-Konfiguration über die Befehlszeile inspizieren und ändern.
---

# prx config

PRX-Konfigurationsdatei lesen, schreiben, validieren und transformieren, ohne TOML von Hand zu bearbeiten.

## Verwendung

```bash
prx config <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx config get`

Konfigurationswert über seinen Punktpfad auslesen.

```bash
prx config get <KEY> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Konfigurationsdateipfad |
| `--json` | `-j` | `false` | Wert als JSON ausgeben |

```bash
# Standardanbieter abrufen
prx config get providers.default

# Gateway-Port abrufen
prx config get gateway.port

# Gesamten Abschnitt als JSON abrufen
prx config get providers --json
```

### `prx config set`

Konfigurationswert setzen.

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Konfigurationsdateipfad |

```bash
# Standardanbieter ändern
prx config set providers.default "anthropic"

# Gateway-Port ändern
prx config set gateway.port 8080

# Boolean setzen
prx config set evolution.l1.enabled true

# Verschachtelten Wert setzen
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

Vollständiges Konfigurations-JSON-Schema ausgeben. Nützlich für Editor-Autovervollständigung und Validierung.

```bash
prx config schema [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--output` | `-o` | stdout | Schema in eine Datei schreiben |
| `--format` | | `json` | Ausgabeformat: `json` oder `yaml` |

```bash
# Schema nach stdout ausgeben
prx config schema

# Schema für Editor-Integration speichern
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

Monolithische Konfigurationsdatei in separate Dateien pro Abschnitt aufteilen. Dies erstellt ein Konfigurationsverzeichnis mit separaten Dateien für Anbieter, Kanäle, Cron usw.

```bash
prx config split [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Quell-Konfigurationsdatei |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | Ausgabeverzeichnis |

```bash
prx config split

# Ergebnis:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

Aufgeteiltes Konfigurationsverzeichnis wieder in eine einzelne Datei zusammenführen.

```bash
prx config merge [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | Quellverzeichnis |
| `--output` | `-o` | `~/.config/prx/config.toml` | Ausgabedatei |
| `--force` | `-f` | `false` | Vorhandene Ausgabedatei überschreiben |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## Beispiele

```bash
# Schnelle Konfigurationsinspektion
prx config get .  # gesamte Konfiguration ausgeben

# Anbieterschlüssel aktualisieren
prx config set providers.anthropic.api_key "sk-ant-..."

# Schema für VS Code generieren
prx config schema --output ~/.config/prx/schema.json
# Dann in VS Code settings.json:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# Sichern und für Versionskontrolle aufteilen
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## Verwandte Themen

- [Konfigurationsübersicht](/de/prx/config/) -- Konfigurationsdateiformat und Struktur
- [Vollständige Referenz](/de/prx/config/reference) -- alle Konfigurationsoptionen
- [Hot-Reload](/de/prx/config/hot-reload) -- Laufzeitkonfigurations-Neuladen
- [Umgebungsvariablen](/de/prx/config/environment) -- Überschreibung per Umgebungsvariablen
