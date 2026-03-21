---
title: Werkzeuge-Ubersicht
description: PRX bietet 46+ eingebaute Werkzeuge in 12 Kategorien. Werkzeuge sind Fahigkeiten, die der Agent wahrend agentischer Schleifen aufrufen kann, um mit dem Betriebssystem, Netzwerk, Gedachtnis und externen Diensten zu interagieren.
---

# Werkzeuge-Ubersicht

Werkzeuge sind die Fahigkeiten, die ein PRX-Agent wahrend seiner Reasoning-Schleife aufrufen kann. Wenn das LLM entscheidet, dass es eine Aktion durchfuhren muss -- einen Befehl ausfuhren, eine Datei lesen, das Web durchsuchen, eine Erinnerung speichern -- ruft es ein Werkzeug namentlich mit strukturierten JSON-Argumenten auf. PRX fuhrt das Werkzeug aus, wendet Sicherheitsrichtlinien an und gibt das Ergebnis an das LLM fur den nachsten Reasoning-Schritt zuruck.

PRX wird mit **46+ eingebauten Werkzeugen** in 12 Kategorien ausgeliefert, von grundlegender Datei-Ein-/Ausgabe bis hin zu Browser-Automatisierung, Multi-Agenten-Delegation und MCP-Protokoll-Integration.

## Werkzeug-Architektur

Jedes Werkzeug implementiert den `Tool`-Trait:

```rust
#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;
    fn description(&self) -> &str;
    fn parameters_schema(&self) -> serde_json::Value;
    async fn execute(&self, args: serde_json::Value) -> Result<ToolResult>;
}
```

Jedes Werkzeug stellt ein JSON-Schema fur seine Parameter bereit, das als Funktionsdefinition an das LLM gesendet wird. Das LLM generiert strukturierte Aufrufe, und PRX validiert die Argumente gegen das Schema vor der Ausfuhrung.

## Werkzeug-Registry: `default_tools()` vs `all_tools()`

PRX verwendet ein zweistufiges Registry-System:

### `default_tools()` -- Minimaler Kern (3 Werkzeuge)

Der minimale Werkzeugsatz fur leichtgewichtige oder eingeschrankte Agenten. Immer verfugbar, keine zusatzliche Konfiguration erforderlich:

| Werkzeug | Beschreibung |
|----------|-------------|
| `shell` | Shell-Befehlsausfuhrung mit Sandbox-Isolation |
| `file_read` | Dateiinhalte lesen (ACL-bewusst) |
| `file_write` | Dateiinhalte schreiben |

### `all_tools()` -- Vollstandige Registry (46+ Werkzeuge)

Der komplette Werkzeugsatz, basierend auf Ihrer Konfiguration zusammengestellt. Werkzeuge werden bedingt registriert, abhangig davon, welche Funktionen aktiviert sind:

- **Immer registriert**: Kern-Werkzeuge, Gedachtnis, Cron, Planung, Git, Vision, Nodes, Pushover, Canvas, Proxy-Konfiguration, Schema
- **Bedingt registriert**: Browser (erfordert `browser.enabled`), HTTP-Anfragen (erfordert `http_request.enabled`), Web-Suche (erfordert `web_search.enabled`), Web-Fetch (erfordert `web_search.fetch_enabled` + `browser.allowed_domains`), MCP (erfordert `mcp.enabled`), Composio (erfordert API-Schlussel), Delegate/Agents-Liste (erfordert Agenten-Definitionen)

## Kategorie-Referenz

### Kern (3 Werkzeuge) -- Immer verfugbar

Die grundlegenden Werkzeuge, die sowohl in `default_tools()` als auch in `all_tools()` vorhanden sind.

| Werkzeug | Beschreibung |
|----------|-------------|
| `shell` | Shell-Befehle mit konfigurierbarer Sandbox-Isolation ausfuhren (Landlock/Firejail/Bubblewrap/Docker). 60s Timeout, 1MB Ausgabelimit, bereinigte Umgebung. |
| `file_read` | Dateiinhalte mit Pfadvalidierung lesen. Wenn Gedachtnis-ACL aktiviert ist, blockiert es den Zugriff auf Gedachtnis-Markdown-Dateien zur Durchsetzung der Zugriffskontrolle. |
| `file_write` | Inhalte in Dateien schreiben. Unterliegt Sicherheitsrichtlinien-Prufungen. |

### Gedachtnis (5 Werkzeuge)

Langzeitgedachtnis-Operationen zum Speichern, Abrufen und Verwalten des persistenten Wissens des Agenten.

| Werkzeug | Beschreibung |
|----------|-------------|
| `memory_store` | Fakten, Praferenzen oder Notizen im Langzeitgedachtnis speichern. Unterstutzt Kategorien: `core` (permanent), `daily` (Sitzung), `conversation` (Chat-Kontext) oder benutzerdefiniert. |
| `memory_forget` | Bestimmte Eintrage aus dem Langzeitgedachtnis entfernen. |
| `memory_get` | Einen bestimmten Gedachtniseintrag nach Schlussel abrufen. ACL-bewusst, wenn aktiviert. |
| `memory_recall` | Erinnerungen nach Stichwort oder semantischer Ahnlichkeit abrufen. Deaktiviert, wenn Gedachtnis-ACL aktiviert ist. |
| `memory_search` | Volltext- und Vektorsuche uber Gedachtniseintrage. ACL-bewusst, wenn aktiviert. |

### Cron / Planung (9 Werkzeuge)

Zeitbasierte Aufgabenautomatisierung und die Xin-Planungsengine.

| Werkzeug | Beschreibung |
|----------|-------------|
| `cron` | Legacy-Cron-Einstiegspunkt -- geplante Aufgaben erstellen oder verwalten. |
| `cron_add` | Einen neuen Cron-Job mit Cron-Ausdruck, Befehl und optionaler Beschreibung hinzufugen. |
| `cron_list` | Alle registrierten Cron-Jobs mit ihren Zeitplanen und Status auflisten. |
| `cron_remove` | Einen Cron-Job nach ID entfernen. |
| `cron_update` | Zeitplan, Befehl oder Einstellungen eines bestehenden Cron-Jobs aktualisieren. |
| `cron_run` | Einen Cron-Job sofort manuell auslosen. |
| `cron_runs` | Ausfuhrungsverlauf und Protokolle von Cron-Job-Laufen anzeigen. |
| `schedule` | Eine einmalige oder wiederkehrende Aufgabe mit naturlichsprachlichen Zeitausdrucken planen. |
| `xin` | Die Xin-Planungsengine -- erweiterte Aufgabenplanung mit Abhangigkeitsketten und bedingter Ausfuhrung. |

### Browser / Vision (5 Werkzeuge)

Web-Automatisierung und Bildverarbeitung. Browser-Werkzeuge erfordern `[browser] enabled = true`.

| Werkzeug | Beschreibung |
|----------|-------------|
| `browser` | Vollstandige Browser-Automatisierung mit austauschbaren Backends (agent-browser CLI, Rust-nativ, Computer-Use-Sidecar). Unterstutzt Navigation, Formularausfullung, Klicken, Screenshots und OS-Aktionen. |
| `browser_open` | Einfaches Offnen einer URL im Browser. Domain-beschrankt uber `browser.allowed_domains`. |
| `screenshot` | Screenshots des aktuellen Bildschirms oder bestimmter Fenster aufnehmen. |
| `image` | Bilder verarbeiten und transformieren (Grossenanderung, Zuschnitt, Formatkonvertierung). |
| `image_info` | Metadaten und Abmessungen aus Bilddateien extrahieren. |

### Netzwerk (4 Werkzeuge)

HTTP-Anfragen, Web-Suche, Web-Abruf und MCP-Protokoll-Integration.

| Werkzeug | Beschreibung |
|----------|-------------|
| `http_request` | HTTP-Anfragen an APIs stellen. Standardmassig verweigert: Nur `allowed_domains` sind erreichbar. Konfigurierbarer Timeout und maximale Antwortgrosse. |
| `web_search_tool` | Das Web uber DuckDuckGo (kostenlos, kein Schlussel) oder Brave Search (erfordert API-Schlussel) durchsuchen. |
| `web_fetch` | Inhalte von Webseiten abrufen und extrahieren. Erfordert `web_search.fetch_enabled` und `browser.allowed_domains`. |
| `mcp` | Model Context Protocol Client -- Verbindung zu externen MCP-Servern (Stdio- oder HTTP-Transporte) und Aufruf ihrer Werkzeuge. Unterstutzt Workspace-lokale `mcp.json`-Erkennung. |

### Messaging (2 Werkzeuge)

Nachrichten uber Kommunikationskanale senden.

| Werkzeug | Beschreibung |
|----------|-------------|
| `message_send` | Eine Nachricht (Text, Medien, Sprache) an jeden konfigurierten Kanal und Empfanger senden. Routet automatisch zum aktiven Kanal. |
| `gateway` | Low-Level-Gateway-Zugriff zum Senden roher Nachrichten uber das Axum HTTP/WebSocket-Gateway. |

### Sitzungen / Agenten (8 Werkzeuge)

Multi-Agenten-Orchestrierung: Sub-Agenten starten, Aufgaben delegieren und gleichzeitige Sitzungen verwalten.

| Werkzeug | Beschreibung |
|----------|-------------|
| `sessions_spawn` | Einen asynchronen Sub-Agenten starten, der im Hintergrund lauft. Gibt sofort eine Run-ID zuruck; das Ergebnis wird bei Abschluss automatisch bekanntgegeben. Unterstutzt `history`- und `steer`-Aktionen. |
| `sessions_send` | Eine Nachricht an eine laufende Sub-Agenten-Sitzung senden. |
| `sessions_list` | Alle aktiven Sub-Agenten-Sitzungen mit Status auflisten. |
| `sessions_history` | Das Gesprächsprotokoll eines Sub-Agenten-Laufs anzeigen. |
| `session_status` | Den Status einer bestimmten Sitzung prufen. |
| `subagents` | Den Sub-Agenten-Pool verwalten -- Sub-Agenten auflisten, stoppen oder inspizieren. |
| `agents_list` | Alle konfigurierten Delegationsagenten mit ihren Modellen und Fahigkeiten auflisten. Nur registriert, wenn Agenten in der Konfiguration definiert sind. |
| `delegate` | Eine Aufgabe an einen benannten Agenten mit eigenem Anbieter, Modell und Werkzeugsatz delegieren. Unterstutzt Fallback-Anmeldedaten und isolierte agentische Schleifen. |

### Remote-Gerate (2 Werkzeuge)

Interaktion mit Remote-Nodes und Push-Benachrichtigungen.

| Werkzeug | Beschreibung |
|----------|-------------|
| `nodes` | Remote-PRX-Nodes in einer verteilten Bereitstellung verwalten und mit ihnen kommunizieren. |
| `pushover` | Push-Benachrichtigungen uber den Pushover-Dienst senden. |

### Git (1 Werkzeug)

Versionskontroll-Operationen.

| Werkzeug | Beschreibung |
|----------|-------------|
| `git_operations` | Git-Operationen (Status, Diff, Commit, Push, Pull, Log, Branch) auf dem Workspace-Repository durchfuhren. |

### Konfiguration (2 Werkzeuge)

Laufzeit-Konfigurationsverwaltung.

| Werkzeug | Beschreibung |
|----------|-------------|
| `config_reload` | Die PRX-Konfigurationsdatei ohne Neustart des Prozesses hot-reloaden. |
| `proxy_config` | Proxy-/Netzwerk-Konfiguration zur Laufzeit anzeigen und andern. |

### Drittanbieter-Integration (1 Werkzeug)

Externe Plattform-Konnektoren.

| Werkzeug | Beschreibung |
|----------|-------------|
| `composio` | Verbindung zu 250+ Apps und Diensten uber die Composio-Plattform. Erfordert einen Composio-API-Schlussel. |

### Rendering (2 Werkzeuge)

Inhaltsgenerierung und Ausgabeformatierung.

| Werkzeug | Beschreibung |
|----------|-------------|
| `canvas` | Strukturierte Inhalte (Tabellen, Diagramme, Grafiken) fur visuelle Ausgabe rendern. |
| `tts` | Text-to-Speech -- Text in eine Sprachnachricht umwandeln und an die aktuelle Konversation senden. Handhabt MP3-Generierung, M4A-Konvertierung und Zustellung automatisch. |

### Admin (1 Werkzeug)

Internes Schema und Diagnose.

| Werkzeug | Beschreibung |
|----------|-------------|
| `schema` | JSON-Schema-Bereinigung und -Normalisierung fur anbieterubergreifende LLM-Kompatibilitat. Lost `$ref` auf, flacht Unions ab, entfernt nicht unterstutzte Schlusselworter. |

## Vollstandige Werkzeug-Matrix

| Werkzeug | Kategorie | Standard | Bedingung |
|----------|-----------|----------|-----------|
| `shell` | Kern | Ja | Immer |
| `file_read` | Kern | Ja | Immer |
| `file_write` | Kern | Ja | Immer |
| `memory_store` | Gedachtnis | -- | `all_tools()` |
| `memory_forget` | Gedachtnis | -- | `all_tools()` |
| `memory_get` | Gedachtnis | -- | `all_tools()` |
| `memory_recall` | Gedachtnis | -- | `all_tools()`, deaktiviert wenn `memory.acl_enabled = true` |
| `memory_search` | Gedachtnis | -- | `all_tools()` |
| `cron` | Cron | -- | `all_tools()` |
| `cron_add` | Cron | -- | `all_tools()` |
| `cron_list` | Cron | -- | `all_tools()` |
| `cron_remove` | Cron | -- | `all_tools()` |
| `cron_update` | Cron | -- | `all_tools()` |
| `cron_run` | Cron | -- | `all_tools()` |
| `cron_runs` | Cron | -- | `all_tools()` |
| `schedule` | Planung | -- | `all_tools()` |
| `xin` | Planung | -- | `all_tools()` |
| `browser` | Browser | -- | `browser.enabled = true` |
| `browser_open` | Browser | -- | `browser.enabled = true` |
| `screenshot` | Vision | -- | `all_tools()` |
| `image` | Vision | -- | `all_tools()` (implizit, uber ImageTool) |
| `image_info` | Vision | -- | `all_tools()` |
| `http_request` | Netzwerk | -- | `http_request.enabled = true` |
| `web_search_tool` | Netzwerk | -- | `web_search.enabled = true` |
| `web_fetch` | Netzwerk | -- | `web_search.fetch_enabled = true` + `browser.allowed_domains` |
| `mcp` | Netzwerk | -- | `mcp.enabled = true` + Server definiert |
| `message_send` | Messaging | -- | Kanal aktiv (auf Gateway-Ebene registriert) |
| `gateway` | Messaging | -- | `all_tools()` |
| `sessions_spawn` | Sitzungen | -- | `all_tools()` |
| `sessions_send` | Sitzungen | -- | `all_tools()` |
| `sessions_list` | Sitzungen | -- | `all_tools()` |
| `sessions_history` | Sitzungen | -- | `all_tools()` |
| `session_status` | Sitzungen | -- | `all_tools()` |
| `subagents` | Sitzungen | -- | `all_tools()` |
| `agents_list` | Agenten | -- | `[agents.*]`-Abschnitte definiert |
| `delegate` | Agenten | -- | `[agents.*]`-Abschnitte definiert |
| `nodes` | Remote | -- | `all_tools()` |
| `pushover` | Remote | -- | `all_tools()` |
| `git_operations` | Git | -- | `all_tools()` |
| `config_reload` | Konfiguration | -- | `all_tools()` |
| `proxy_config` | Konfiguration | -- | `all_tools()` |
| `composio` | Drittanbieter | -- | `composio.api_key` gesetzt |
| `canvas` | Rendering | -- | `all_tools()` |
| `tts` | Rendering | -- | Kanal aktiv (auf Gateway-Ebene registriert) |
| `schema` | Admin | -- | Intern (Schema-Normalisierungsmodul) |

## Werkzeuge aktivieren und deaktivieren

### Feature-gesteuerte Werkzeuge

Viele Werkzeuge werden uber ihre jeweiligen Konfigurationsabschnitte aktiviert. Fugen Sie diese zu Ihrer `config.toml` hinzu:

```toml
# ── Browser-Werkzeuge ──────────────────────────────────────────────
[browser]
enabled = true
allowed_domains = ["github.com", "stackoverflow.com", "*.openprx.dev"]
backend = "agent_browser"   # "agent_browser" | "rust_native" | "computer_use"

# ── HTTP-Anfrage-Werkzeug ─────────────────────────────────────────
[http_request]
enabled = true
allowed_domains = ["api.github.com", "api.openai.com"]
max_response_size = 1000000  # 1MB
timeout_secs = 30

# ── Web-Suche-Werkzeug ───────────────────────────────────────────
[web_search]
enabled = true
provider = "duckduckgo"      # "duckduckgo" (kostenlos) oder "brave" (erfordert API-Schlussel)
# brave_api_key = "..."
max_results = 5
timeout_secs = 10

# Auch web_fetch fur Seiteninhalt-Extraktion aktivieren:
fetch_enabled = true
fetch_max_chars = 50000

# ── Composio-Integration ──────────────────────────────────────────
[composio]
enabled = true
api_key = "your-composio-key"
entity_id = "default"
```

### Werkzeug-Richtlinien-Pipeline

Fur feingranulare Kontrolle verwenden Sie den Abschnitt `[security.tool_policy]`, um einzelne Werkzeuge oder Gruppen zu erlauben, zu verweigern oder zu uberwachen:

```toml
[security.tool_policy]
# Standard-Richtlinie: "allow", "deny" oder "supervised"
default = "allow"

# Gruppenebene-Richtlinien
[security.tool_policy.groups]
sessions = "allow"
automation = "allow"
hardware = "deny"

# Per-Werkzeug-Uberschreibungen (hochste Prioritat)
[security.tool_policy.tools]
shell = "supervised"     # Erfordert Genehmigung vor Ausfuhrung
gateway = "allow"
composio = "deny"        # Composio deaktivieren, auch wenn API-Schlussel gesetzt ist
```

Richtlinien-Auflosungsreihenfolge (hochste Prioritat zuerst):
1. Per-Werkzeug-Richtlinie (`security.tool_policy.tools.<name>`)
2. Gruppen-Richtlinie (`security.tool_policy.groups.<group>`)
3. Standard-Richtlinie (`security.tool_policy.default`)

### Werkzeug-Einschrankungen fur Delegationsagenten

Bei der Konfiguration von Delegationsagenten konnen Sie einschranken, auf welche Werkzeuge sie zugreifen konnen:

```toml
[agents.researcher]
provider = "anthropic"
model = "claude-sonnet-4-20250514"
system_prompt = "You are a research assistant."
agentic = true
max_iterations = 10
allowed_tools = ["web_search_tool", "web_fetch", "file_read", "memory_store"]
```

## MCP-Werkzeug-Integration

PRX implementiert den Model Context Protocol (MCP) Client, der eine Verbindung zu externen MCP-Servern herstellen und deren Werkzeuge dem Agenten zur Verfugung stellen kann.

### Konfiguration

Definieren Sie MCP-Server in der `config.toml`:

```toml
[mcp]
enabled = true

[mcp.servers.filesystem]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-filesystem", "/home/user/docs"]
transport = "stdio"

[mcp.servers.github]
command = "npx"
args = ["-y", "@modelcontextprotocol/server-github"]
transport = "stdio"
env = { GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..." }

[mcp.servers.remote-api]
url = "https://mcp.example.com/sse"
transport = "streamable_http"
```

### Workspace-lokale `mcp.json`

PRX erkennt auch MCP-Server aus einer Workspace-lokalen `mcp.json`-Datei, die dem gleichen Format wie VS Code und Claude Desktop folgt:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["./my-mcp-server/index.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```

Befehle in `mcp.json` sind auf eine Whitelist sicherer Launcher beschrankt: `npx`, `node`, `python`, `python3`, `uvx`, `uv`, `deno`, `bun`, `docker`, `cargo`, `go`, `ruby`, `php`, `dotnet`, `java`.

### Dynamische Werkzeug-Erkennung

MCP-Werkzeuge werden zur Laufzeit uber die `tools/list`-Protokollmethode erkannt. Die Werkzeuge jedes MCP-Servers werden mit Namensraumen versehen und dem LLM als aufrufbare Funktionen bereitgestellt. Das `mcp`-Werkzeug unterstutzt einen `refresh()`-Hook, der Werkzeuge vor jedem Agenten-Turn neu erkennt.

Gefahrliche Umgebungsvariablen (`LD_PRELOAD`, `DYLD_INSERT_LIBRARIES`, `NODE_OPTIONS`, `PYTHONPATH` usw.) werden automatisch aus MCP-Server-Prozessen entfernt.

## Sicherheit: Sandboxing und ACL

### Werkzeug-Sandboxing

Das `shell`-Werkzeug fuhrt Befehle innerhalb einer konfigurierbaren Sandbox aus. PRX unterstutzt 4 Sandbox-Backends plus ein No-Op-Fallback:

```toml
[security.sandbox]
enabled = true           # None = automatische Erkennung, true/false = explizit
backend = "auto"         # "auto" | "landlock" | "firejail" | "bubblewrap" | "docker" | "none"

# Benutzerdefinierte Firejail-Argumente (wenn backend = "firejail")
firejail_args = ["--net=none", "--noroot"]
```

| Backend | Plattform | Isolationsgrad | Hinweise |
|---------|-----------|----------------|----------|
| Landlock | Linux (Kernel-LSM) | Dateisystem | Kernel-nativ, keine zusatzlichen Abhangigkeiten |
| Firejail | Linux | Voll (Netzwerk, Dateisystem, PID) | User-Space, weit verbreitet |
| Bubblewrap | Linux, macOS | Namespace-basiert | User-Namespaces, leichtgewichtig |
| Docker | Alle | Container | Vollstandige Container-Isolation |
| None | Alle | Nur Anwendungsschicht | Keine OS-Level-Isolation |

Der Auto-Erkennungsmodus (`backend = "auto"`) pruft verfugbare Backends in der Reihenfolge: Landlock, Firejail, Bubblewrap, Docker und fallt dann mit einer Warnung auf None zuruck.

### Shell-Umgebungsbereinigung

Das `shell`-Werkzeug ubergibt nur eine strikte Whitelist von Umgebungsvariablen an Kindprozesse: `PATH`, `HOME`, `TERM`, `LANG`, `LC_ALL`, `LC_CTYPE`, `USER`, `SHELL`, `TMPDIR`. API-Schlussel, Tokens und Geheimnisse werden nie exponiert.

### Gedachtnis-ACL

Wenn `memory.acl_enabled = true`, wird die Zugriffskontrolle bei Gedachtnisoperationen durchgesetzt:

- `file_read` blockiert den Zugriff auf Gedachtnis-Markdown-Dateien
- `memory_recall` wird vollstandig deaktiviert (aus der Werkzeug-Registry entfernt)
- `memory_get` und `memory_search` setzen per-Prinzipal-Zugriffsbeschrankungen durch

### Sicherheitsrichtlinie

Jeder Werkzeugaufruf durchlauft die `SecurityPolicy`-Schicht vor der Ausfuhrung. Die Richtlinien-Engine kann:

- Operationen basierend auf Werkzeug-Richtlinienregeln blockieren
- Supervisor-Genehmigung fur `supervised`-Werkzeuge erfordern
- Alle Werkzeugaufrufe auditieren
- Ratenlimits und Ressourcenbeschrankungen durchsetzen

```toml
[security.resources]
max_memory_mb = 512
max_cpu_percent = 80
max_open_files = 256
```

## Erweiterung: Benutzerdefinierte Werkzeuge schreiben

Um ein neues Werkzeug hinzuzufugen:

1. Erstellen Sie ein neues Modul in `src/tools/`, das den `Tool`-Trait implementiert
2. Registrieren Sie es in `all_tools_with_runtime_ext()` in `src/tools/mod.rs`
3. Fugen Sie die `pub mod`- und `pub use`-Eintrage in `mod.rs` hinzu

Beispiel:

```rust
use super::traits::{Tool, ToolResult};
use async_trait::async_trait;
use serde_json::json;

pub struct MyTool { /* ... */ }

#[async_trait]
impl Tool for MyTool {
    fn name(&self) -> &str { "my_tool" }

    fn description(&self) -> &str {
        "Does something useful."
    }

    fn parameters_schema(&self) -> serde_json::Value {
        json!({
            "type": "object",
            "properties": {
                "input": { "type": "string", "description": "The input value" }
            },
            "required": ["input"]
        })
    }

    async fn execute(&self, args: serde_json::Value) -> anyhow::Result<ToolResult> {
        let input = args["input"].as_str().unwrap_or_default();
        Ok(ToolResult {
            success: true,
            output: format!("Processed: {input}"),
            error: None,
        })
    }
}
```

Siehe `AGENTS.md` Abschnitt 7.3 fur das vollstandige Anderungs-Playbook.
