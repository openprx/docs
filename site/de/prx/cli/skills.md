---
title: prx skills
description: Installierbare Skills verwalten, die die Fähigkeiten des PRX-Agenten erweitern.
---

# prx skills

Skills verwalten -- modulare Fähigkeitspakete, die erweitern, was der PRX-Agent leisten kann. Skills bündeln Prompts, Werkzeugkonfigurationen und WASM-Plugins in installierbaren Einheiten.

## Verwendung

```bash
prx skills <UNTERBEFEHL> [OPTIONS]
```

## Unterbefehle

### `prx skills list`

Installierte Skills und verfügbare Skills aus der Registry auflisten.

```bash
prx skills list [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--installed` | | `false` | Nur installierte Skills anzeigen |
| `--available` | | `false` | Nur verfügbare (noch nicht installierte) Skills anzeigen |
| `--json` | `-j` | `false` | Ausgabe als JSON |

**Beispielausgabe:**

```
 Name              Version   Status      Description
 code-review       1.2.0     installed   Automated code review with context
 web-research      1.0.3     installed   Deep web research with source citing
 image-gen         0.9.1     available   Image generation via DALL-E / Stable Diffusion
 data-analysis     1.1.0     available   CSV/JSON data analysis and visualization
 git-workflow      1.0.0     installed   Git branch management and PR creation
```

### `prx skills install`

Einen Skill aus der Registry oder von einem lokalen Pfad installieren.

```bash
prx skills install <NAME|PFAD> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--version` | `-v` | neueste | Bestimmte zu installierende Version |
| `--force` | `-f` | `false` | Auch bei bereits installierten Skills neu installieren |

```bash
# Aus der Registry installieren
prx skills install code-review

# Bestimmte Version installieren
prx skills install web-research --version 1.0.2

# Von lokalem Pfad installieren
prx skills install ./my-custom-skill/

# Neuinstallation erzwingen
prx skills install code-review --force
```

### `prx skills remove`

Einen Skill deinstallieren.

```bash
prx skills remove <NAME> [OPTIONS]
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--force` | `-f` | `false` | Bestätigungsaufforderung überspringen |

```bash
prx skills remove image-gen
prx skills remove image-gen --force
```

## Skill-Struktur

Ein Skill-Paket enthält:

```
my-skill/
  skill.toml          # Skill-Metadaten und Konfiguration
  system_prompt.md    # Zusätzliche System-Prompt-Anweisungen
  tools.toml          # Werkzeugdefinitionen und Berechtigungen
  plugin.wasm         # Optionale WASM-Plugin-Binärdatei
```

Das `skill.toml`-Manifest:

```toml
[skill]
name = "my-skill"
version = "1.0.0"
description = "What this skill does"
author = "your-name"

[permissions]
tools = ["shell", "http_request"]
memory = true
```

## Skill-Verzeichnis

Installierte Skills werden gespeichert unter:

```
~/.local/share/prx/skills/
  code-review/
  web-research/
  git-workflow/
```

## Verwandte Themen

- [Plugin-Übersicht](/de/prx/plugins/) -- WASM-Plugin-System
- [Werkzeugübersicht](/de/prx/tools/) -- Integrierte Werkzeuge
- [Entwicklerleitfaden](/de/prx/plugins/developer-guide) -- Eigene Plugins erstellen
