---
title: Plugin-System
description: Ubersicht uber das PRX WASM-basierte Plugin-System zur Erweiterung der Agenten-Fahigkeiten.
---

# Plugin-System

PRX unterstutzt ein WebAssembly (WASM)-Plugin-System, das die Erweiterung der Agenten-Fahigkeiten ermoglicht, ohne die Kern-Codebasis zu modifizieren. Plugins laufen in einer sandboxten WASM-Laufzeitumgebung mit kontrolliertem Zugriff auf Host-Funktionen.

## Ubersicht

Das Plugin-System bietet:

- **Sandbox-Ausfuhrung** -- Plugins laufen in WASM mit Speicherisolation
- **Host-Funktions-API** -- kontrollierter Zugriff auf HTTP, Dateisystem und Agentenzustand
- **Hot Reloading** -- Plugins laden und entladen, ohne den Daemon neu zu starten
- **Mehrsprachige Unterstutzung** -- Plugins in Rust, Go, C oder jeder Sprache schreiben, die nach WASM kompiliert

## Plugin-Typen

| Typ | Beschreibung | Beispiel |
|-----|-------------|---------|
| **Werkzeug-Plugins** | Dem Agenten neue Werkzeuge hinzufugen | Benutzerdefinierte API-Integrationen |
| **Kanal-Plugins** | Neue Messaging-Kanale hinzufugen | Benutzerdefinierte Chat-Plattform |
| **Filter-Plugins** | Nachrichten vor/nach der Verarbeitung filtern | Inhaltsmoderation |
| **Anbieter-Plugins** | Neue LLM-Anbieter hinzufugen | Benutzerdefinierte Modell-Endpunkte |

## Schnellstart

```bash
# Ein Plugin von einer URL installieren
prx plugin install https://example.com/my-plugin.wasm

# Installierte Plugins auflisten
prx plugin list

# Ein Plugin aktivieren/deaktivieren
prx plugin enable my-plugin
prx plugin disable my-plugin
```

## Konfiguration

```toml
[plugins]
enabled = true
directory = "~/.local/share/openprx/plugins"
max_memory_mb = 64
max_execution_time_ms = 5000

[[plugins.registry]]
name = "my-plugin"
path = "~/.local/share/openprx/plugins/my-plugin.wasm"
enabled = true
```

## Verwandte Seiten

- [Architektur](./architecture)
- [Entwicklerhandbuch](./developer-guide)
- [Host-Funktionen](./host-functions)
- [PDK (Plugin Development Kit)](./pdk)
- [Beispiele](./examples)
