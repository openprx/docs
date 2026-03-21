---
title: Host-Funktionen
description: Referenz fur Host-Funktionen, die PRX-WASM-Plugins zur Verfugung stehen.
---

# Host-Funktionen

Host-Funktionen sind die API-Oberflache, die PRX fur WASM-Plugins bereitstellt. Sie bieten kontrollierten Zugriff auf Host-Fahigkeiten wie HTTP-Anfragen, Dateioperationen und Agentenzustand.

## Verfugbare Host-Funktionen

### HTTP

| Funktion | Beschreibung | Berechtigung |
|----------|-------------|-------------|
| `http_request(method, url, headers, body)` | Eine HTTP-Anfrage ausfuhren | `net.http` |
| `http_get(url)` | Kurzform fur GET-Anfrage | `net.http` |
| `http_post(url, body)` | Kurzform fur POST-Anfrage | `net.http` |

### Dateisystem

| Funktion | Beschreibung | Berechtigung |
|----------|-------------|-------------|
| `fs_read(path)` | Eine Datei lesen | `fs.read` |
| `fs_write(path, data)` | Eine Datei schreiben | `fs.write` |
| `fs_list(path)` | Verzeichnisinhalt auflisten | `fs.read` |

### Agentenzustand

| Funktion | Beschreibung | Berechtigung |
|----------|-------------|-------------|
| `memory_get(key)` | Aus dem Agentengedachtnis lesen | `agent.memory.read` |
| `memory_set(key, value)` | In das Agentengedachtnis schreiben | `agent.memory.write` |
| `config_get(key)` | Plugin-Konfiguration lesen | `agent.config` |

### Protokollierung

| Funktion | Beschreibung | Berechtigung |
|----------|-------------|-------------|
| `log_info(msg)` | Auf Info-Ebene protokollieren | Immer erlaubt |
| `log_warn(msg)` | Auf Warn-Ebene protokollieren | Immer erlaubt |
| `log_error(msg)` | Auf Error-Ebene protokollieren | Immer erlaubt |

## Berechtigungsmanifest

Jedes Plugin deklariert erforderliche Berechtigungen in seinem Manifest:

```toml
[permissions]
net.http = ["api.example.com"]
fs.read = ["/data/*"]
agent.memory.read = true
```

## Verwandte Seiten

- [Plugin-Architektur](./architecture)
- [PDK-Referenz](./pdk)
- [Sicherheits-Sandbox](/de/prx/security/sandbox)
