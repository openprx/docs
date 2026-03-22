---
title: CLI-Referenz
description: "Befehlszeilenschnittstelle für OpenPR. Projekte, Issues, Kommentare, Labels und Sprints direkt vom Terminal aus verwalten."
---

# CLI-Referenz

OpenPR enthält eine Befehlszeilenschnittstelle, die in das `openpr-mcp`-Binary integriert ist. Neben dem Betrieb des MCP-Servers bietet sie Befehle zur Verwaltung von Projekten, Work Items, Kommentaren, Labels, Sprints und mehr direkt vom Terminal aus.

## Installation

Die CLI ist als Teil des `mcp-server`-Crates verfügbar. Nach dem Erstellen heißt das Binary `openpr-mcp`.

```bash
cargo build --release -p mcp-server
```

## Globale Flags

Diese Flags gelten für alle Befehle:

| Flag | Beschreibung | Standard |
|------|-------------|---------|
| `--api-url <URL>` | API-Server-Endpunkt | `http://localhost:8080` |
| `--bot-token <TOKEN>` | Authentifizierungstoken (Präfix `opr_`) | -- |
| `--workspace-id <UUID>` | Arbeitsbereichskontext für Operationen | -- |
| `--format json\|table` | Ausgabeformat | `table` |

Diese können auch über Umgebungsvariablen gesetzt werden:

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## Befehle

### serve -- MCP-Server starten

Den MCP-Server für die KI-Tool-Integration ausführen.

```bash
# HTTP-Transport (Standard)
openpr-mcp serve --transport http --port 8090

# Stdio-Transport (für direkte Integration)
openpr-mcp serve --transport stdio
```

### projects -- Projektverwaltung

```bash
# Alle Projekte im Arbeitsbereich auflisten
openpr-mcp projects list --format table

# Details eines bestimmten Projekts abrufen
openpr-mcp projects get <project_id>

# Ein neues Projekt erstellen
openpr-mcp projects create --name "My Project" --key "MP"
```

### work-items -- Work-Item-Verwaltung

```bash
# Work Items mit Filtern auflisten
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Ein bestimmtes Work Item abrufen
openpr-mcp work-items get <id>

# Ein Work Item erstellen
openpr-mcp work-items create --project-id <id> --title "Fix bug" --state todo
openpr-mcp work-items create --project-id <id> --title "New feature" --state backlog --priority high

# Ein Work Item aktualisieren
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Work Items nach Text suchen
openpr-mcp work-items search --query "authentication"
```

### comments -- Kommentarverwaltung

```bash
# Kommentare zu einem Work Item auflisten
openpr-mcp comments list --work-item-id <id>

# Einen Kommentar hinzufügen
openpr-mcp comments create --work-item-id <id> --content "Fixed in commit abc123"
```

### labels -- Label-Verwaltung

```bash
# Labels auf Arbeitsbereichsebene auflisten
openpr-mcp labels list --workspace

# Labels auf Projektebene auflisten
openpr-mcp labels list --project-id <id>
```

### sprints -- Sprint-Verwaltung

```bash
# Sprints für ein Projekt auflisten
openpr-mcp sprints list --project-id <id>
```

### search -- Globale Suche

```bash
# Über alle Entitäten suchen
openpr-mcp search --query "bug"
```

### files -- Dateianhänge

```bash
# Eine Datei zu einem Work Item hochladen
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## Verwendungsbeispiele

### Typischer Workflow

```bash
# Zugangsdaten einrichten
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# Projekte auflisten
openpr-mcp projects list

# To-Do-Elemente für ein Projekt anzeigen
openpr-mcp work-items list --project-id <id> --state todo --format table

# Ein Work Item aufnehmen
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Kommentar hinzufügen, wenn fertig
openpr-mcp comments create --work-item-id <item_id> --content "Completed. See PR #42."

# Als erledigt markieren
openpr-mcp work-items update <item_id> --state done
```

### JSON-Ausgabe für Skripting

`--format json` verwenden, um maschinenlesbare Ausgabe zu erhalten, die sich für die Weiterleitung an `jq` oder andere Tools eignet:

```bash
# Alle laufenden Elemente als JSON abrufen
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Elemente nach Status zählen
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## Siehe auch

- [MCP-Server](../mcp-server/) -- MCP-Tool-Integration für KI-Agenten
- [API-Referenz](../api/) -- Vollständige REST-API-Dokumentation
- [Workflow-Zustände](../issues/workflow) -- Issue-Zustandsverwaltung und benutzerdefinierte Workflows
