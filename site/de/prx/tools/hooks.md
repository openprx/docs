---
title: Hooks
description: Ereignisgesteuertes Erweiterungssystem mit 8 Lebenszyklus-Ereignissen, Shell-Hook-Ausfuhrung, WASM-Plugin-Callbacks, HTTP-API-Verwaltung und Event-Bus-Integration fur Observability und Automatisierung.
---

# Hooks

PRX-Hooks bieten ein ereignisgesteuertes Erweiterungssystem, mit dem Sie auf Lebenszyklus-Ereignisse wahrend der Agentenausfuhrung reagieren konnen. Jeder bedeutende Moment in der Agentenschleife -- Start eines Turns, Aufruf eines LLM, Aufruf eines Werkzeugs, Auftreten eines Fehlers -- emittiert ein Hook-Ereignis. Sie hangen Aktionen uber eine `hooks.json`-Konfigurationsdatei, WASM-Plugin-Manifeste oder die HTTP-API an diese Ereignisse an.

Hooks sind designmassig **Fire-and-Forget**. Sie blockieren nie die Agentenschleife, andern nie den Ausfuhrungsfluss und injizieren nie Daten zuruck in die Konversation. Das macht sie ideal fur Audit-Protokollierung, Metriksammlung, externe Benachrichtigungen und Nebeneffekt-Automatisierung, ohne Latenz oder Fehlermodi in die Kern-Agenten-Pipeline einzufuhren.

Es gibt drei Hook-Ausfuhrungs-Backends:

- **Shell-Hooks** -- Fuhren einen externen Befehl aus, wobei die Ereignis-Payload uber Umgebungsvariable, Temp-Datei oder Stdin ubergeben wird. Konfiguriert in `hooks.json`.
- **WASM-Plugin-Hooks** -- Rufen die `on-event`-Funktion auf, die von einem WASM-Plugin exportiert wird. Deklariert im `plugin.toml`-Manifest des Plugins.
- **Event-Bus-Hooks** -- Veroffentlichen auf dem internen Event-Bus zum Thema `prx.lifecycle.<event>`. Immer aktiv; keine Konfiguration notig.

## Hook-Ereignisse

PRX emittiert 8 Lebenszyklus-Ereignisse. Jedes Ereignis tragt eine JSON-Payload mit kontextspezifischen Feldern.

| Ereignis | Wann emittiert | Payload-Felder |
|----------|---------------|----------------|
| `agent_start` | Agentenschleife beginnt einen neuen Turn | `agent` (String), `session` (String) |
| `agent_end` | Agentenschleife beendet einen Turn | `success` (Bool), `messages_count` (Zahl) |
| `llm_request` | Vor dem Senden einer Anfrage an den LLM-Anbieter | `provider` (String), `model` (String), `messages_count` (Zahl) |
| `llm_response` | Nach Empfang der LLM-Antwort | `provider` (String), `model` (String), `duration_ms` (Zahl), `success` (Bool) |
| `tool_call_start` | Bevor ein Werkzeug die Ausfuhrung beginnt | `tool` (String), `arguments` (Objekt) |
| `tool_call` | Nachdem ein Werkzeug die Ausfuhrung beendet hat | `tool` (String), `success` (Bool), `output` (String) |
| `turn_complete` | Vollstandiger Turn beendet (alle Werkzeuge aufgelost) | _(leeres Objekt)_ |
| `error` | Jeder Fehler wahrend der Ausfuhrung | `component` (String), `message` (String) |

### Payload-Schemas

Alle Payloads sind JSON-Objekte. Die Top-Level-Struktur umschliesst die ereignisspezifischen Felder:

```json
{
  "event": "llm_response",
  "timestamp": "2026-03-21T08:15:30.123Z",
  "session_id": "sess_abc123",
  "payload": {
    "provider": "openai",
    "model": "gpt-4o",
    "duration_ms": 1842,
    "success": true
  }
}
```

Die Felder `event`, `timestamp` und `session_id` sind bei jedem Hook-Ereignis vorhanden. Das `payload`-Objekt variiert je nach Ereignistyp wie in der obigen Tabelle beschrieben.

## Konfiguration

Shell-Hooks werden in einer `hooks.json`-Datei konfiguriert, die im Workspace-Verzeichnis platziert wird (dasselbe Verzeichnis wie `config.toml`). PRX uberwacht diese Datei auf Anderungen und **ladt die Konfiguration hot-reload** neu, ohne einen Neustart zu erfordern.

### Grundstruktur

```json
{
  "hooks": {
    "<event_name>": [
      {
        "command": "/path/to/script",
        "args": ["--flag", "value"],
        "env": {
          "CUSTOM_VAR": "value"
        },
        "cwd": "/working/directory",
        "timeout_ms": 5000,
        "stdin_json": true
      }
    ]
  }
}
```

Jeder Ereignisname wird einem Array von Hook-Aktionen zugeordnet. Mehrere Aktionen konnen an dasselbe Ereignis angehangt werden; sie werden gleichzeitig und unabhangig ausgefuhrt.

### Vollstandiges Beispiel

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/usr/local/bin/notify",
        "args": ["--channel", "ops", "--title", "Agent Started"],
        "timeout_ms": 3000
      }
    ],
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/log_latency.py"],
        "stdin_json": true,
        "timeout_ms": 2000
      }
    ],
    "tool_call": [
      {
        "command": "/opt/hooks/audit_tool_usage.sh",
        "env": {
          "LOG_DIR": "/var/log/prx/audit"
        },
        "timeout_ms": 5000
      }
    ],
    "error": [
      {
        "command": "curl",
        "args": [
          "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

## Hook-Aktionsfelder

Jedes Hook-Aktionsobjekt unterstutzt die folgenden Felder:

| Feld | Typ | Erforderlich | Standard | Beschreibung |
|------|-----|-------------|----------|-------------|
| `command` | String | Ja | -- | Absoluter Pfad zur ausfuhrbaren Datei oder ein Befehlsname im bereinigten PATH |
| `args` | String[] | Nein | `[]` | An den Befehl ubergebene Argumente |
| `env` | Objekt | Nein | `{}` | Zusatzliche Umgebungsvariablen, die in die bereinigte Ausfuhrungsumgebung eingefugt werden |
| `cwd` | String | Nein | Workspace-Verzeichnis | Arbeitsverzeichnis fur den gestarteten Prozess |
| `timeout_ms` | Zahl | Nein | `30000` | Maximale Ausfuhrungszeit in Millisekunden. Der Prozess wird beendet (SIGKILL), wenn er dieses Limit uberschreitet |
| `stdin_json` | Bool | Nein | `false` | Wenn `true`, wird die vollstandige Ereignis-Payload-JSON uber Stdin an den Prozess geleitet |

### Hinweise zu `command`

Das `command`-Feld unterliegt einer Sicherheitsvalidierung vor der Ausfuhrung. Es darf keine Shell-Metazeichen (`;`, `|`, `&`, `` ` ``, `$()`) enthalten -- diese werden abgelehnt, um Shell-Injection zu verhindern. Wenn Sie Shell-Funktionen benotigen, kapseln Sie diese in einer Skriptdatei und verweisen Sie `command` auf dieses Skript.

Relative Pfade werden gegen das Workspace-Verzeichnis aufgelost. Die Verwendung absoluter Pfade wird jedoch fur Vorhersagbarkeit empfohlen.

## Payload-Zustellung

Hook-Aktionen empfangen die Ereignis-Payload uber drei Kanale gleichzeitig. Diese Redundanz stellt sicher, dass Skripte in jeder Sprache auf die Daten uber die bequemste Methode zugreifen konnen.

### 1. Umgebungsvariable (`ZERO_HOOK_PAYLOAD`)

Der Payload-JSON-String wird als `ZERO_HOOK_PAYLOAD`-Umgebungsvariable gesetzt. Dies ist die einfachste Zugriffsmethode fur Shell-Skripte:

```bash
#!/bin/bash
# Payload aus Umgebungsvariable lesen
echo "$ZERO_HOOK_PAYLOAD" | jq '.payload.tool'
```

**Grossenlimit**: 8 KB. Wenn die serialisierte Payload 8 KB uberschreitet, wird die Umgebungsvariable **nicht gesetzt** und die Payload ist nur uber die Temp-Datei und Stdin-Kanale verfugbar.

### 2. Temporare Datei (`ZERO_HOOK_PAYLOAD_FILE`)

Die Payload wird in eine temporare Datei geschrieben, und der Dateipfad wird in der `ZERO_HOOK_PAYLOAD_FILE`-Umgebungsvariable gesetzt. Die Temp-Datei wird nach dem Beenden des Hook-Prozesses automatisch geloscht.

```python
import os, json

payload_file = os.environ["ZERO_HOOK_PAYLOAD_FILE"]
with open(payload_file) as f:
    data = json.load(f)
print(f"Tool: {data['payload']['tool']}, Success: {data['payload']['success']}")
```

Dieser Kanal hat kein Grossenlimit und ist die empfohlene Methode fur Payloads, die gross sein konnten (z.B. `tool_call` mit ausfuhrlicher Ausgabe).

### 3. Standardeingabe (Stdin)

Wenn `stdin_json` in der Hook-Aktion auf `true` gesetzt ist, wird die Payload-JSON uber Stdin an den Prozess geleitet. Dies ist nutzlich fur Befehle, die nativ von Stdin lesen, wie `curl -d @-` oder `jq`.

```bash
#!/bin/bash
# Von Stdin lesen (erfordert stdin_json: true in der Hook-Konfiguration)
read -r payload
echo "$payload" | jq -r '.payload.message'
```

## Umgebungsvariablen

Jeder Hook-Prozess empfangt die folgenden Umgebungsvariablen, zusatzlich zu `ZERO_HOOK_PAYLOAD` und `ZERO_HOOK_PAYLOAD_FILE`:

| Variable | Beschreibung | Beispiel |
|----------|-------------|---------|
| `ZERO_HOOK_EVENT` | Der Ereignisname, der diesen Hook ausgelost hat | `tool_call` |
| `ZERO_HOOK_SESSION` | Aktuelle Sitzungskennung | `sess_abc123` |
| `ZERO_HOOK_TIMESTAMP` | ISO-8601-Zeitstempel des Ereignisses | `2026-03-21T08:15:30.123Z` |
| `ZERO_HOOK_PAYLOAD` | Vollstandige Payload als JSON-String (weggelassen wenn >8 KB) | `{"event":"tool_call",...}` |
| `ZERO_HOOK_PAYLOAD_FILE` | Pfad zur Temp-Datei mit der Payload | `/tmp/prx-hook-a1b2c3.json` |

Die Ausfuhrungsumgebung wird **bereinigt**, bevor der Hook-Prozess startet. Sensible und gefahrliche Umgebungsvariablen werden entfernt (siehe [Sicherheit](#sicherheit) unten), und nur die oben aufgefuhrten Variablen plus eventuelle `env`-Uberschreibungen aus der Hook-Aktion sind verfugbar.

## WASM-Plugin-Hooks

WASM-Plugins konnen Hook-Ereignisse abonnieren, indem sie die `on-event`-Funktion exportieren, die in der PRX-WIT-Schnittstelle (WebAssembly Interface Types) definiert ist.

### WIT-Schnittstelle

```wit
interface hooks {
    /// Called when a subscribed event fires.
    /// Returns Ok(()) on success, Err(message) on failure.
    on-event: func(event: string, payload-json: string) -> result<_, string>;
}
```

Der `event`-Parameter ist der Ereignisname (z.B. `"tool_call"`), und `payload-json` ist die vollstandige Payload, die als JSON-String serialisiert ist, identisch zu dem, was Shell-Hooks empfangen.

### Ereignis-Abonnement-Muster

Plugins deklarieren, welche Ereignisse sie empfangen mochten, in ihrem `plugin.toml`-Manifest unter Verwendung von Musterabgleich:

| Muster | Stimmt uberein mit | Beispiel |
|--------|-------------------|---------|
| Exakte Ubereinstimmung | Ein einzelnes bestimmtes Ereignis | `"tool_call"` |
| Platzhalter-Suffix | Alle Ereignisse mit einem Prafix | `"prx.lifecycle.*"` |
| Universal | Jedes Ereignis | `"*"` |

### Plugin-Manifest-Beispiel

```toml
[plugin]
name = "audit-logger"
version = "0.1.0"
description = "Logs all lifecycle events to an audit trail"

[[capabilities]]
type = "hook"
events = ["agent_start", "agent_end", "error"]

[[capabilities]]
type = "hook"
events = ["prx.lifecycle.*"]
```

Ein einzelnes Plugin kann mehrere `[[capabilities]]`-Blocke mit verschiedenen Ereignismustern deklarieren. Die Vereinigung aller ubereinstimmenden Ereignisse bestimmt, welche Ereignisse das Plugin empfangt.

### Ausfuhrungsmodell

WASM-Plugin-Hooks laufen innerhalb der WASM-Sandbox mit denselben Ressourcenlimits wie andere Plugin-Funktionen. Sie unterliegen:

- **Speicherlimit**: Definiert in der Ressourcenkonfiguration des Plugins (Standard 64 MB)
- **Ausfuhrungs-Timeout**: Gleich wie `timeout_ms` fur Shell-Hooks (Standard 30 Sekunden)
- **Kein Dateisystemzugriff**: Es sei denn, explizit uber WASI-Fahigkeiten gewahrt
- **Kein Netzwerkzugriff**: Es sei denn, explizit uber Fahigkeits-Flags gewahrt

Wenn ein WASM-Hook `Err(message)` zuruckgibt, wird der Fehler protokolliert, beeinflusst aber nicht die Agentenschleife. Hooks sind immer Fire-and-Forget.

## Event-Bus-Integration

Jedes Hook-Ereignis wird automatisch auf dem internen Event-Bus zum Thema `prx.lifecycle.<event>` veroffentlicht. Dies geschieht unabhangig davon, ob Shell- oder WASM-Hooks konfiguriert sind.

### Themenformat

```
prx.lifecycle.agent_start
prx.lifecycle.agent_end
prx.lifecycle.llm_request
prx.lifecycle.llm_response
prx.lifecycle.tool_call_start
prx.lifecycle.tool_call
prx.lifecycle.turn_complete
prx.lifecycle.error
```

### Abonnementtypen

Interne Komponenten und Plugins konnen Event-Bus-Themen mit drei Mustern abonnieren:

- **Exakt**: `prx.lifecycle.tool_call` -- empfangt nur `tool_call`-Ereignisse
- **Platzhalter**: `prx.lifecycle.*` -- empfangt alle Lebenszyklus-Ereignisse
- **Hierarchisch**: `prx.*` -- empfangt alle PRX-Domain-Ereignisse (Lebenszyklus, Metriken usw.)

### Payload-Limits

| Einschrankung | Wert |
|---------------|------|
| Maximale Payload-Grosse | 64 KB |
| Maximale Rekursionstiefe | 8 Ebenen |
| Dispatch-Modell | Fire-and-Forget (async) |
| Zustellungsgarantie | At-most-once |

Wenn ein Hook-Ereignis ein weiteres Hook-Ereignis auslost (z.B. ein Hook-Skript ruft ein Werkzeug auf, das `tool_call` emittiert), wird der Rekursionszahler inkrementiert. Bei 8 Ebenen Tiefe werden weitere Ereignis-Emissionen stillschweigend verworfen, um Endlosschleifen zu verhindern.

## HTTP-API

Hooks konnen programmatisch uber die HTTP-API verwaltet werden. Alle Endpunkte erfordern Authentifizierung und geben JSON-Antworten zuruck.

### Alle Hooks auflisten

```
GET /api/hooks
```

Antwort:

```json
{
  "hooks": [
    {
      "id": "hook_01",
      "event": "error",
      "action": {
        "command": "/opt/hooks/notify_error.sh",
        "args": [],
        "timeout_ms": 5000,
        "stdin_json": false
      },
      "enabled": true,
      "created_at": "2026-03-20T10:00:00Z",
      "updated_at": "2026-03-20T10:00:00Z"
    }
  ]
}
```

### Einen Hook erstellen

```
POST /api/hooks
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true
}
```

Antwort (201 Created):

```json
{
  "id": "hook_02",
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency.py"],
    "stdin_json": true,
    "timeout_ms": 3000
  },
  "enabled": true,
  "created_at": "2026-03-21T08:00:00Z",
  "updated_at": "2026-03-21T08:00:00Z"
}
```

### Einen Hook aktualisieren

```
PUT /api/hooks/hook_02
Content-Type: application/json

{
  "event": "llm_response",
  "action": {
    "command": "python3",
    "args": ["/opt/hooks/track_latency_v2.py"],
    "stdin_json": true,
    "timeout_ms": 5000
  },
  "enabled": true
}
```

Antwort (200 OK): Gibt das aktualisierte Hook-Objekt zuruck.

### Einen Hook loschen

```
DELETE /api/hooks/hook_02
```

Antwort (204 No Content): Leerer Body bei Erfolg.

### Einen Hook umschalten

```
PATCH /api/hooks/hook_01/toggle
```

Antwort (200 OK):

```json
{
  "id": "hook_01",
  "enabled": false
}
```

Dieser Endpunkt wechselt den `enabled`-Status. Deaktivierte Hooks bleiben in der Konfiguration, werden aber nicht ausgefuhrt, wenn ihr Ereignis ausgelost wird.

## Sicherheit

Die Hook-Ausfuhrung unterliegt mehreren Sicherheitsmassnahmen, um Privilegieneskalation, Datenexfiltration und Denial-of-Service zu verhindern.

### Blockierte Umgebungsvariablen

Die folgenden Umgebungsvariablen werden aus der Hook-Ausfuhrungsumgebung entfernt und konnen nicht uber das `env`-Feld in Hook-Aktionen uberschrieben werden:

| Variable | Grund |
|----------|-------|
| `LD_PRELOAD` | Bibliotheksinjektions-Angriffsvektor |
| `LD_LIBRARY_PATH` | Manipulation des Bibliothekssuchpfads |
| `DYLD_INSERT_LIBRARIES` | macOS-Bibliotheksinjektion |
| `DYLD_LIBRARY_PATH` | macOS-Bibliothekspfad-Manipulation |
| `PATH` | Verhindert PATH-Hijacking; ein minimaler sicherer PATH wird bereitgestellt |
| `HOME` | Verhindert Home-Verzeichnis-Spoofing |

### Eingabevalidierung

- **Null-Byte-Ablehnung**: Jeder `command`, `args`, `env`-Schlussel oder `env`-Wert, der ein Null-Byte (`\0`) enthalt, wird abgelehnt. Dies verhindert Null-Byte-Injektionsangriffe, die Strings auf OS-Ebene abschneiden konnten.
- **Shell-Metazeichen-Ablehnung**: Das `command`-Feld darf keine `;`, `|`, `&`, `` ` ``, `$(` oder andere Shell-Metazeichen enthalten. Dies verhindert Shell-Injection, selbst wenn der Befehl versehentlich durch eine Shell geleitet wird.
- **Pfaddurchquerung**: Das `cwd`-Feld wird validiert, um sicherzustellen, dass es nicht uber `..`-Komponenten aus dem Workspace-Verzeichnis ausbrechen kann.

### Timeout-Durchsetzung

Jeder Hook-Prozess unterliegt dem konfigurierten `timeout_ms` (Standard 30 Sekunden). Wenn der Prozess dieses Limit uberschreitet:

1. `SIGTERM` wird an den Prozess gesendet
2. Nach einer 5-Sekunden-Gnadenfrist wird `SIGKILL` gesendet
3. Der Hook wird in internen Metriken als Timeout markiert
4. Die Agentenschleife wird **nicht** beeinflusst

### Ressourcenisolation

Hook-Prozesse erben dieselben cgroup- und Namespace-Einschrankungen wie Shell-Werkzeugausfuhrungen, wenn ein Sandbox-Backend aktiv ist. Im Docker-Sandbox-Modus laufen Hooks in einem separaten Container ohne Netzwerkzugriff standardmassig.

## Beispiele

### Audit-Protokollierungs-Hook

Jeden Werkzeugaufruf in eine Datei fur Compliance-Auditing protokollieren:

```json
{
  "hooks": {
    "tool_call": [
      {
        "command": "/opt/hooks/audit_log.sh",
        "env": {
          "AUDIT_LOG": "/var/log/prx/tool_audit.jsonl"
        },
        "timeout_ms": 2000
      }
    ]
  }
}
```

`/opt/hooks/audit_log.sh`:

```bash
#!/bin/bash
echo "$ZERO_HOOK_PAYLOAD" >> "$AUDIT_LOG"
```

### Fehlerbenachrichtigungs-Hook

Fehlerereignisse an einen Slack-Kanal senden:

```json
{
  "hooks": {
    "error": [
      {
        "command": "curl",
        "args": [
          "-s", "-X", "POST",
          "-H", "Content-Type: application/json",
          "-d", "@-",
          "https://hooks.slack.com/services/T00/B00/xxxxx"
        ],
        "stdin_json": true,
        "timeout_ms": 10000
      }
    ]
  }
}
```

### LLM-Latenz-Metriken-Hook

LLM-Antwortzeiten fur Uberwachungs-Dashboards verfolgen:

```json
{
  "hooks": {
    "llm_response": [
      {
        "command": "python3",
        "args": ["/opt/hooks/metrics.py"],
        "stdin_json": true,
        "timeout_ms": 3000
      }
    ]
  }
}
```

`/opt/hooks/metrics.py`:

```python
import sys, json

data = json.load(sys.stdin)
payload = data["payload"]
provider = payload["provider"]
model = payload["model"]
duration = payload["duration_ms"]
success = payload["success"]

# An StatsD, Prometheus Pushgateway oder ein beliebiges Metriken-Backend senden
print(f"prx.llm.duration,provider={provider},model={model} {duration}")
print(f"prx.llm.success,provider={provider},model={model} {1 if success else 0}")
```

### Sitzungs-Lebenszyklus-Verfolgung

Agenten-Sitzungsstart und -ende fur Nutzungsanalysen verfolgen:

```json
{
  "hooks": {
    "agent_start": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["start"],
        "timeout_ms": 2000
      }
    ],
    "agent_end": [
      {
        "command": "/opt/hooks/session_tracker.sh",
        "args": ["end"],
        "timeout_ms": 2000
      }
    ]
  }
}
```

## Verwandte Seiten

- [Shell-Ausfuhrung](/de/prx/tools/shell) -- Shell-Werkzeug, das Hooks oft umschliesst
- [MCP-Integration](/de/prx/tools/mcp) -- Externes Werkzeugprotokoll, das `tool_call`-Ereignisse emittiert
- [Plugins](/de/prx/plugins/) -- WASM-Plugin-System einschliesslich Hook-Fahigkeiten
- [Observability](/de/prx/observability/) -- Metriken und Tracing, die Hooks erganzen
- [Sicherheit](/de/prx/security/) -- Sandbox und Richtlinien-Engine, die die Hook-Ausfuhrung steuern
