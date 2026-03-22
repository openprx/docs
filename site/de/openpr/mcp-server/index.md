---
title: MCP-Server
description: "OpenPR enthält einen eingebauten MCP-Server mit 34 Tools über HTTP-, stdio- und SSE-Transporte. KI-Assistenten wie Claude, Codex und Cursor mit dem Projektmanagement integrieren."
---

# MCP-Server

OpenPR enthält einen eingebauten **MCP (Model Context Protocol)-Server**, der 34 Tools für KI-Assistenten bereitstellt, um Projekte, Issues, Sprints, Labels, Kommentare, Vorschläge und Dateien zu verwalten. Der Server unterstützt gleichzeitig drei Transportprotokolle.

## Transportprotokolle

| Protokoll | Anwendungsfall | Endpunkt |
|-----------|---------------|---------|
| **HTTP** | Web-Integrationen, OpenClaw-Plugins | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, lokale CLI | stdin/stdout JSON-RPC |
| **SSE** | Streaming-Clients, Echtzeit-UIs | `GET /sse` + `POST /messages` |

::: tip Multi-Protokoll
Im HTTP-Modus sind alle drei Protokolle auf einem einzigen Port verfügbar: `/mcp/rpc` (HTTP), `/sse` + `/messages` (SSE) und `/health` (Integritätsprüfung).
:::

## Konfiguration

### Umgebungsvariablen

| Variable | Erforderlich | Beschreibung | Beispiel |
|----------|-------------|-------------|---------|
| `OPENPR_API_URL` | Ja | API-Server-Basis-URL | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | Ja | Bot-Token mit `opr_`-Präfix | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | Ja | Standard-Arbeitsbereichs-UUID | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

Zur MCP-Client-Konfiguration hinzufügen:

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

### HTTP-Modus

```bash
# Den MCP-Server starten
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Überprüfen
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### SSE-Modus

```bash
# 1. SSE-Stream verbinden (gibt Session-Endpunkt zurück)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. Anfrage an den zurückgegebenen Endpunkt senden
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> Antwort kommt über SSE-Stream als event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## Tool-Referenz (34 Tools)

### Projekte (5)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `projects.list` | -- | Alle Projekte im Arbeitsbereich auflisten |
| `projects.get` | `project_id` | Projektdetails mit Issue-Zählern abrufen |
| `projects.create` | `key`, `name` | Ein Projekt erstellen |
| `projects.update` | `project_id` | Name/Beschreibung aktualisieren |
| `projects.delete` | `project_id` | Ein Projekt löschen |

### Work Items / Issues (11)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `work_items.list` | `project_id` | Issues in einem Projekt auflisten |
| `work_items.get` | `work_item_id` | Issue nach UUID abrufen |
| `work_items.get_by_identifier` | `identifier` | Nach menschlicher ID abrufen (z.B. `API-42`) |
| `work_items.create` | `project_id`, `title` | Issue mit optionalem Status, Priorität, Beschreibung, assignee_id, due_at, Anhängen erstellen |
| `work_items.update` | `work_item_id` | Beliebiges Feld aktualisieren |
| `work_items.delete` | `work_item_id` | Ein Issue löschen |
| `work_items.search` | `query` | Volltextsuche über alle Projekte |
| `work_items.add_label` | `work_item_id`, `label_id` | Ein Label hinzufügen |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Mehrere Labels hinzufügen |
| `work_items.remove_label` | `work_item_id`, `label_id` | Ein Label entfernen |
| `work_items.list_labels` | `work_item_id` | Labels eines Issues auflisten |

### Kommentare (3)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `comments.create` | `work_item_id`, `content` | Kommentar mit optionalen Anhängen erstellen |
| `comments.list` | `work_item_id` | Kommentare eines Issues auflisten |
| `comments.delete` | `comment_id` | Einen Kommentar löschen |

### Dateien (1)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `files.upload` | `filename`, `content_base64` | Datei hochladen (base64), gibt URL und Dateiname zurück |

### Labels (5)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `labels.list` | -- | Alle Arbeitsbereichs-Labels auflisten |
| `labels.list_by_project` | `project_id` | Labels eines Projekts auflisten |
| `labels.create` | `name`, `color` | Label erstellen (Farbe: hex, z.B. `#2563eb`) |
| `labels.update` | `label_id` | Name/Farbe/Beschreibung aktualisieren |
| `labels.delete` | `label_id` | Ein Label löschen |

### Sprints (4)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `sprints.list` | `project_id` | Sprints in einem Projekt auflisten |
| `sprints.create` | `project_id`, `name` | Sprint mit optionalen start_date, end_date erstellen |
| `sprints.update` | `sprint_id` | Name/Daten/Status aktualisieren |
| `sprints.delete` | `sprint_id` | Einen Sprint löschen |

### Vorschläge (3)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `proposals.list` | `project_id` | Vorschläge mit optionalem Statusfilter auflisten |
| `proposals.get` | `proposal_id` | Vorschlagsdetails abrufen |
| `proposals.create` | `project_id`, `title`, `description` | Einen Governance-Vorschlag erstellen |

### Mitglieder & Suche (2)

| Tool | Erforderliche Parameter | Beschreibung |
|------|------------------------|-------------|
| `members.list` | -- | Arbeitsbereichsmitglieder und Rollen auflisten |
| `search.all` | `query` | Globale Suche über Projekte, Issues, Kommentare |

## Antwortformat

Alle MCP-Tool-Antworten folgen dieser Struktur:

### Erfolg

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Fehler

```json
{
  "code": 400,
  "message": "error description"
}
```

## Bot-Token-Authentifizierung

Der MCP-Server authentifiziert sich über **Bot-Tokens** (Präfix `opr_`). Bot-Tokens in **Arbeitsbereich-Einstellungen** > **Bot-Tokens** erstellen.

Jedes Bot-Token:
- Hat einen Anzeigenamen (wird in Aktivitäts-Feeds angezeigt)
- Ist auf einen Arbeitsbereich beschränkt
- Erstellt eine `bot_mcp`-Benutzerentität für die Prüfpfadintegrität
- Unterstützt alle Lese-/Schreiboperationen, die Arbeitsbereichsmitgliedern zur Verfügung stehen

## Agenten-Integration

Für Coding-Agenten bietet OpenPR:

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) -- Workflow-Muster und Tool-Beispiele für Agenten.
- **Skill-Paket** (`skills/openpr-mcp/SKILL.md`) -- Verwaltetes Skill mit Workflow-Vorlagen und Skripten.

Empfohlener Agenten-Workflow:
1. `AGENTS.md` für Tool-Semantik laden.
2. `tools/list` verwenden, um verfügbare Tools zur Laufzeit aufzulisten.
3. Workflow-Muster befolgen: suchen -> erstellen -> labeln -> kommentieren.

## Nächste Schritte

- [API-Übersicht](../api/) -- REST-API-Referenz
- [Mitglieder & Berechtigungen](../workspace/members) -- Bot-Token-Verwaltung
- [Konfiguration](../configuration/) -- Alle Umgebungsvariablen
