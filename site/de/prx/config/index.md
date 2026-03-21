---
title: Konfiguration
description: Überblick über das PRX-Konfigurationssystem -- TOML-basierte Konfiguration mit Hot-Reload, aufgeteilten Dateien, CLI-Werkzeugen und Schema-Export.
---

# Konfiguration

PRX verwendet ein TOML-basiertes Konfigurationssystem mit Hot-Reload-Unterstützung. Alle Einstellungen befinden sich in einer einzigen Datei (mit optionalen aufgeteilten Fragmenten), und die meisten Änderungen werden sofort wirksam, ohne den Daemon neu zu starten.

## Speicherort der Konfigurationsdatei

Die primäre Konfigurationsdatei ist:

```
~/.openprx/config.toml
```

PRX löst das Konfigurationsverzeichnis in folgender Reihenfolge auf:

1. Umgebungsvariable `OPENPRX_CONFIG_DIR` (falls gesetzt)
2. Umgebungsvariable `OPENPRX_WORKSPACE` (falls gesetzt)
3. Aktiver Workspace-Marker (`~/.openprx/active_workspace.toml`)
4. `~/.openprx/` (Standard)

Das Workspace-Verzeichnis (wo Gedächtnis, Sitzungen und Daten gespeichert werden) ist standardmäßig `~/.openprx/workspace/`.

## TOML-Format

Die PRX-Konfiguration verwendet [TOML](https://toml.io/) -- ein minimales, lesbares Format. Hier ist eine minimale funktionsfähige Konfiguration:

```toml
# Provider and model selection
default_provider = "anthropic"
default_model = "anthropic/claude-sonnet-4-6"
default_temperature = 0.7

# API key (or use ANTHROPIC_API_KEY env var)
api_key = "sk-ant-..."

# Memory backend
[memory]
backend = "sqlite"
auto_save = true

# Gateway server
[gateway]
port = 16830
host = "127.0.0.1"
```

## Konfigurationsabschnitte

Die Konfiguration ist in folgende Hauptabschnitte gegliedert:

| Abschnitt | Zweck |
|-----------|-------|
| *(Hauptebene)* | Standard-Anbieter, Modell, Temperatur, API-Schlüssel |
| `[gateway]` | HTTP-Gateway: Host, Port, Pairing, Ratenbegrenzungen |
| `[channels_config]` | Messaging-Kanäle: Telegram, Discord, Slack usw. |
| `[channels_config.telegram]` | Telegram-Bot-Konfiguration |
| `[channels_config.discord]` | Discord-Bot-Konfiguration |
| `[memory]` | Gedächtnis-Backend und Embedding-Einstellungen |
| `[router]` | Heuristischer LLM-Router und Automix |
| `[security]` | Sandbox, Ressourcenlimits, Audit-Logging |
| `[autonomy]` | Autonomiestufen und Werkzeugbereichsregeln |
| `[observability]` | Metriken- und Tracing-Backend |
| `[mcp]` | Model Context Protocol Server-Integration |
| `[browser]` | Einstellungen für Browser-Automatisierungswerkzeug |
| `[web_search]` | Einstellungen für Websuche- und Abruf-Werkzeug |
| `[xin]` | Xin autonome Aufgaben-Engine |
| `[reliability]` | Wiederholungs- und Fallback-Anbieterketten |
| `[cost]` | Ausgabenlimits und Modellpreise |
| `[cron]` | Definitionen geplanter Aufgaben |
| `[self_system]` | Steuerungen der Selbstentwicklungs-Engine |
| `[proxy]` | HTTP/HTTPS/SOCKS5-Proxy-Einstellungen |
| `[secrets]` | Verschlüsselter Zugangsdatenspeicher |
| `[auth]` | Import externer Zugangsdaten (Codex CLI usw.) |
| `[storage]` | Persistenter Speicheranbieter |
| `[tunnel]` | Öffentliche Tunnel-Bereitstellung |
| `[nodes]` | Remote-Node-Proxy-Konfiguration |

Siehe [Konfigurationsreferenz](/de/prx/config/reference) für die vollständige Feld-für-Feld-Dokumentation.

## Aufgeteilte Konfigurationsdateien

Für komplexe Bereitstellungen unterstützt PRX das Aufteilen der Konfiguration in Fragmentdateien unter einem `config.d/`-Verzeichnis neben `config.toml`:

```
~/.openprx/
  config.toml          # Hauptkonfiguration (Hauptebene + Überschreibungen)
  config.d/
    channels.toml      # [channels_config]-Abschnitt
    memory.toml        # [memory]- und [storage]-Abschnitte
    security.toml      # [security]- und [autonomy]-Abschnitte
    agents.toml        # [agents]- und [sessions_spawn]-Abschnitte
    identity.toml      # [identity]- und [identity_bindings]-Abschnitte
    network.toml       # [gateway]-, [tunnel]- und [proxy]-Abschnitte
    scheduler.toml     # [scheduler]-, [cron]- und [heartbeat]-Abschnitte
```

Fragmentdateien werden über `config.toml` zusammengeführt (Fragmente haben Vorrang). Dateien werden alphabetisch geladen.

## Bearbeitung

### Interaktiver Assistent

Der Einrichtungsassistent führt durch Anbieterauswahl, Kanaleinrichtung und Gedächtniskonfiguration:

```bash
prx onboard
```

### CLI-Konfigurationsbefehle

Konfiguration über die Befehlszeile anzeigen und ändern:

```bash
# Aktuelle Konfiguration anzeigen
prx config show

# Bestimmten Wert bearbeiten
prx config set default_provider anthropic
prx config set default_model "anthropic/claude-sonnet-4-6"

# Manuelles Neuladen auslösen
prx config reload
```

### Direkte Bearbeitung

Öffnen Sie `~/.openprx/config.toml` in einem beliebigen Texteditor. Änderungen werden automatisch vom Dateibeobachter erkannt und innerhalb von 1 Sekunde angewendet (siehe [Hot-Reload](/de/prx/config/hot-reload)).

### Schema-Export

Exportieren Sie das vollständige Konfigurationsschema als JSON Schema für Editor-Autovervollständigung und Validierung:

```bash
prx config schema
```

Dies gibt ein JSON-Schema-Dokument aus, das mit VS Code, IntelliJ oder jedem Editor verwendet werden kann, der TOML-Schema-Validierung unterstützt.

## Hot-Reload

Die meisten Konfigurationsänderungen werden sofort angewendet, ohne PRX neu zu starten. Der Dateibeobachter verwendet ein 1-Sekunden-Debounce-Fenster und tauscht die aktive Konfiguration bei erfolgreichem Parsen atomar aus. Wenn die neue Datei Syntaxfehler enthält, wird die vorherige Konfiguration beibehalten und eine Warnung protokolliert.

Siehe [Hot-Reload](/de/prx/config/hot-reload) für Details darüber, was einen Neustart erfordert.

## Nächste Schritte

- [Konfigurationsreferenz](/de/prx/config/reference) -- vollständige Feld-für-Feld-Dokumentation
- [Hot-Reload](/de/prx/config/hot-reload) -- was live geändert wird vs. was einen Neustart erfordert
- [Umgebungsvariablen](/de/prx/config/environment) -- Umgebungsvariablen, API-Schlüssel und `.env`-Unterstützung
- [LLM-Anbieter](/de/prx/providers/) -- anbieterspezifische Konfiguration
