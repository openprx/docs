---
title: MCP-Integration
description: Model Context Protocol Client zur Verbindung mit externen MCP-Servern uber Stdio- oder HTTP-Transporte mit dynamischer Werkzeugerkennung und Namensraumbildung.
---

# MCP-Integration

PRX implementiert einen Model Context Protocol (MCP) Client, der sich mit externen MCP-Servern verbindet und deren Werkzeuge dem Agenten zur Verfugung stellt. MCP ist ein offenes Protokoll, das standardisiert, wie LLM-Anwendungen mit externen Werkzeuganbietern kommunizieren, und ermoglicht PRX die Integration mit einem wachsenden Okosystem MCP-kompatibler Server fur Dateisysteme, Datenbanken, APIs und mehr.

Das `mcp`-Werkzeug ist Feature-gesteuert und erfordert `mcp.enabled = true` mit mindestens einem definierten Server. PRX unterstutzt sowohl Stdio-Transport (lokale Prozesskommunikation) als auch HTTP-Transport (Remote-Server-Kommunikation). Werkzeuge von MCP-Servern werden zur Laufzeit dynamisch uber die `tools/list`-Protokollmethode erkannt und mit Namensraumen versehen, um Kollisionen mit eingebauten Werkzeugen zu vermeiden.

PRX unterstutzt auch die Workspace-lokale `mcp.json`-Erkennung, die dem gleichen Format folgt, das von VS Code und Claude Desktop verwendet wird, was das Teilen von MCP-Server-Konfigurationen uber Werkzeuge hinweg erleichtert.

## Konfiguration

### Server-Definitionen in config.toml

Definieren Sie MCP-Server unter dem Abschnitt `[mcp.servers]`:

```toml
[mcp]
enabled = true

# ── Stdio-Transport (lokaler Prozess) ──────────────────────────
[mcp.servers.filesystem]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
enabled = true
startup_timeout_ms = 10000
request_timeout_ms = 30000
tool_name_prefix = "fs"

[mcp.servers.github]
transport = "stdio"
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_xxxxxxxxxxxx" }
tool_name_prefix = "gh"

[mcp.servers.sqlite]
transport = "stdio"
command = "uvx"
args = ["mcp-server-sqlite", "--db-path", "/home/user/data.db"]
tool_name_prefix = "sql"

# ── HTTP-Transport (Remote-Server) ───────────────────────────
[mcp.servers.remote-api]
transport = "http"
url = "https://mcp.example.com/sse"
request_timeout_ms = 60000
tool_name_prefix = "api"

[mcp.servers.streamable]
transport = "streamable_http"
url = "http://localhost:8090/mcp"
request_timeout_ms = 30000
```

### Per-Server-Konfiguration

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `enabled` | `bool` | `true` | Diesen Server aktivieren oder deaktivieren |
| `transport` | `string` | `"stdio"` | Transporttyp: `"stdio"`, `"http"`, `"streamable_http"` |
| `command` | `string` | -- | Befehl fur Stdio-Transport (z.B. `"npx"`, `"uvx"`, `"node"`) |
| `args` | `string[]` | `[]` | Argumente fur den Stdio-Befehl |
| `url` | `string` | -- | URL fur HTTP-Transport |
| `env` | `map` | `{}` | Umgebungsvariablen fur den Stdio-Prozess |
| `startup_timeout_ms` | `u64` | `10000` | Maximale Wartezeit fur Server-Startup |
| `request_timeout_ms` | `u64` | `30000` | Per-Anfrage-Timeout |
| `tool_name_prefix` | `string` | `"mcp"` | Prafix fur Werkzeugnamen (z.B. `"fs"` ergibt `"fs_read_file"`) |
| `allow_tools` | `string[]` | `[]` | Werkzeug-Whitelist (leer = alle erkannten Werkzeuge erlauben) |
| `deny_tools` | `string[]` | `[]` | Werkzeug-Blacklist (hat Vorrang vor der Whitelist) |

### Workspace-lokale mcp.json

PRX erkennt MCP-Server aus einer Workspace-lokalen `mcp.json`-Datei, die dem gleichen Format wie VS Code und Claude Desktop folgt:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    },
    "python-tools": {
      "command": "python3",
      "args": ["-m", "my_mcp_module"],
      "env": {}
    }
  }
}
```

Platzieren Sie diese Datei im Workspace-Stammverzeichnis. PRX pruft `mcp.json` beim Start und wenn Werkzeuge aktualisiert werden.

**Sichere-Launcher-Whitelist**: Befehle in `mcp.json` sind auf eine Whitelist sicherer Launcher beschrankt:

| Launcher | Sprache / Plattform |
|----------|-------------------|
| `npx` | Node.js (npm) |
| `node` | Node.js |
| `python` | Python |
| `python3` | Python 3 |
| `uvx` | Python (uv) |
| `uv` | Python (uv) |
| `deno` | Deno |
| `bun` | Bun |
| `docker` | Docker |
| `cargo` | Rust |
| `go` | Go |
| `ruby` | Ruby |
| `php` | PHP |
| `dotnet` | .NET |
| `java` | Java |

Befehle, die nicht in dieser Whitelist stehen, werden abgelehnt, um die Ausfuhrung beliebiger Binardateien uber `mcp.json`-Dateien zu verhindern.

## Verwendung

### Dynamische Werkzeugerkennung

MCP-Werkzeuge werden automatisch erkannt, wenn der MCP-Client sich mit Servern verbindet. Der Agent sieht sie als regulare Werkzeuge in seiner Werkzeug-Registry:

```
Verfugbare MCP-Werkzeuge:
  fs_read_file          - Read the contents of a file
  fs_write_file         - Write content to a file
  fs_list_directory     - List directory contents
  gh_create_issue       - Create a GitHub issue
  gh_search_code        - Search code on GitHub
  sql_query             - Execute a SQL query
  sql_list_tables       - List database tables
```

### Werkzeug-Namensraumbildung

Die Werkzeuge jedes MCP-Servers werden mit dem konfigurierten `tool_name_prefix` versehen, um Namenskollisionen zu vermeiden:

- Server `filesystem` mit Prafix `"fs"` stellt `fs_read_file`, `fs_write_file` usw. bereit
- Server `github` mit Prafix `"gh"` stellt `gh_create_issue`, `gh_search_code` usw. bereit
- Server `sqlite` mit Prafix `"sql"` stellt `sql_query`, `sql_list_tables` usw. bereit

Wenn zwei Server ein Werkzeug mit demselben Basisnamen bereitstellen, unterscheidet das Prafix sie.

### Werkzeug-Aktualisierung

Das `mcp`-Werkzeug unterstutzt einen `refresh()`-Hook, der Werkzeuge vor jedem Agenten-Turn neu erkennt. Das bedeutet:

- Neue Werkzeuge, die einem MCP-Server hinzugefugt werden, sind ohne Neustart von PRX verfugbar
- Entfernte Werkzeuge werden dem LLM nicht mehr angeboten
- Werkzeug-Schema-Anderungen werden sofort reflektiert

### Agenten-Aufruf

Der Agent ruft MCP-Werkzeuge genauso auf wie eingebaute Werkzeuge:

```json
{
  "name": "gh_create_issue",
  "arguments": {
    "owner": "openprx",
    "repo": "prx",
    "title": "Add support for MCP resource subscriptions",
    "body": "PRX should support MCP resource change notifications..."
  }
}
```

PRX leitet diesen Aufruf an den entsprechenden MCP-Server weiter, sendet die Anfrage uber den konfigurierten Transport und gibt das Ergebnis an das LLM zuruck.

## Transport-Details

### Stdio-Transport

Der Stdio-Transport startet den MCP-Server als Kindprozess und kommuniziert uber Stdin/Stdout mit JSON-RPC:

```
PRX-Prozess
    │
    ├── stdin  ──→ MCP-Server-Prozess
    └── stdout ←── MCP-Server-Prozess
```

- Server wird bei erster Verwendung gestartet (Lazy-Initialisierung) oder beim Daemon-Start
- Prozess-Lebenszyklus wird von PRX verwaltet (Auto-Neustart bei Absturz)
- stderr-Ausgabe des Servers wird fur Diagnose erfasst

### HTTP-Transport

Der HTTP-Transport verbindet sich mit einem Remote-MCP-Server uber HTTP:

```
PRX  ──HTTP/SSE──→  Remote-MCP-Server
```

- Unterstutzt Server-Sent Events (SSE) fur Streaming-Antworten
- Verbindung wird beim ersten Werkzeugaufruf hergestellt
- Unterstutzt Authentifizierung uber Header (pro Server konfigurierbar)

### Streamable-HTTP-Transport

Der Streamable-HTTP-Transport verwendet das neuere MCP-Streamable-HTTP-Protokoll:

```
PRX  ──HTTP POST──→  MCP-Server (streamable)
     ←──Streaming──
```

Dieser Transport ist effizienter als SSE fur bidirektionale Kommunikation und ist der empfohlene Transport fur neue MCP-Server-Implementierungen.

## Parameter

Das MCP-Werkzeug selbst hat keine festen Parameter. Jeder MCP-Server stellt seine eigenen Werkzeuge mit ihren eigenen Parameter-Schemas bereit, die uber die `tools/list`-Protokollmethode erkannt werden. Die Parameter werden von den individuellen MCP-Server-Implementierungen definiert.

Das MCP-Meta-Werkzeug (fur Verwaltung) unterstutzt:

| Parameter | Typ | Erforderlich | Standard | Beschreibung |
|-----------|-----|-------------|----------|-------------|
| `action` | `string` | Nein | -- | Verwaltungsaktion: `"status"`, `"refresh"`, `"servers"` |

## Sicherheit

### Umgebungsvariablen-Bereinigung

PRX entfernt automatisch gefahrliche Umgebungsvariablen aus MCP-Server-Prozessen, um Injektionsangriffe zu verhindern:

| Entfernte Variable | Risiko |
|-------------------|-------|
| `LD_PRELOAD` | Bibliotheksinjektion (Linux) |
| `DYLD_INSERT_LIBRARIES` | Bibliotheksinjektion (macOS) |
| `NODE_OPTIONS` | Node.js-Laufzeit-Manipulation |
| `PYTHONPATH` | Python-Modulpfad-Hijacking |
| `PYTHONSTARTUP` | Python-Startskript-Injektion |
| `RUBYOPT` | Ruby-Laufzeitoptionen-Injektion |
| `PERL5OPT` | Perl-Laufzeitoptionen-Injektion |

Nur die explizit konfigurierten `env`-Variablen plus sichere Systemvariablen werden an den Kindprozess ubergeben.

### Befehls-Whitelist fur mcp.json

Das `mcp.json`-Dateiformat ist bequem, aber potenziell gefahrlich. PRX mindert dies, indem Befehle auf eine Whitelist bekannter sicherer Launcher beschrankt werden. Dies verhindert, dass eine bosartige `mcp.json` beliebige Binardateien ausfuhrt.

### Werkzeug-Erlaubnis-/Sperrlisten

Per-Server-Werkzeugfilterung steuert, welche Werkzeuge dem Agenten bereitgestellt werden:

```toml
[mcp.servers.filesystem]
# Nur diese Werkzeuge bereitstellen
allow_tools = ["read_file", "list_directory"]
# Diese Werkzeuge blockieren, auch wenn erkannt
deny_tools = ["write_file", "delete_file"]
```

Die Sperrliste hat Vorrang vor der Erlaubnisliste. Dies ermoglicht einen Defense-in-Depth-Ansatz, bei dem Sie standardmassig alle Werkzeuge erlauben, aber gefahrliche explizit blockieren konnen.

### Netzwerk-Isolation

Fur Stdio-Transport-Server erbt der Server-Prozess die Sandbox-Konfiguration. Wenn die Sandbox den Netzwerkzugriff blockiert, kann auch der MCP-Server keine Netzwerkanfragen stellen.

Fur HTTP-Transport-Server liegt die Sicherheit des Remote-Servers ausserhalb der Kontrolle von PRX. Stellen Sie sicher, dass HTTP-Transport-URLs nur auf vertrauenswurdige Server verweisen.

### Richtlinien-Engine

MCP-Werkzeuge unterliegen der Sicherheitsrichtlinien-Engine:

```toml
[security.tool_policy.tools]
mcp = "allow"           # Alle MCP-Werkzeuge global erlauben
fs_write_file = "deny"  # Bestimmte MCP-Werkzeuge nach Prafix-Name blockieren
```

### Audit-Protokollierung

Alle MCP-Werkzeugaufrufe werden im Audit-Protokoll aufgezeichnet, einschliesslich:

- Servername und Werkzeugname
- Argumente (mit redigierten sensiblen Werten)
- Antwortstatus
- Ausfuhrungszeit

## Verwandte Seiten

- [Konfigurationsreferenz](/de/prx/config/reference) -- `[mcp]`- und `[mcp.servers]`-Einstellungen
- [Werkzeuge-Ubersicht](/de/prx/tools/) -- eingebaute Werkzeuge und MCP-Integrationsubersicht
- [Sicherheits-Sandbox](/de/prx/security/sandbox) -- Sandbox fur MCP-Server-Prozesse
- [Geheimnis-Verwaltung](/de/prx/security/secrets) -- verschlusselte Speicherung fur MCP-Server-Anmeldedaten
- [Shell-Ausfuhrung](/de/prx/tools/shell) -- Alternative zur Werkzeugausfuhrung uber Shell-Befehle
