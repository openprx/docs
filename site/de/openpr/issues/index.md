---
title: Issues & Tracking
description: "OpenPR-Issues sind die zentrale Arbeitseinheit. Aufgaben, Fehler und Funktionen mit Zuständen, Prioritäten, Bearbeitern, Labels und Kommentaren verfolgen."
---

# Issues & Tracking

Issues (auch Work Items genannt) sind die zentrale Arbeitseinheit in OpenPR. Sie repräsentieren Aufgaben, Fehler, Funktionen oder jeden verfolgbaren Teil der Arbeit innerhalb eines Projekts.

## Issue-Felder

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|-------------|
| Titel | string | Ja | Kurze Beschreibung der Arbeit |
| Beschreibung | markdown | Nein | Detaillierte Beschreibung mit Formatierung |
| Zustand | enum | Ja | Workflow-Zustand (siehe [Workflow](./workflow)) |
| Priorität | enum | Nein | `low`, `medium`, `high`, `urgent` |
| Bearbeiter | user | Nein | Für das Issue verantwortliches Teammitglied |
| Labels | list | Nein | Kategorisierungs-Tags (siehe [Labels](./labels)) |
| Sprint | sprint | Nein | Sprint-Zyklus, zu dem das Issue gehört |
| Fälligkeitsdatum | datetime | Nein | Ziel-Abschlussdatum |
| Anhänge | files | Nein | Angehängte Dateien (Bilder, Dokumente, Logs) |

## Issue-Bezeichner

Jedes Issue hat einen menschenlesbaren Bezeichner, zusammengesetzt aus dem Projektschlüssel und einer fortlaufenden Nummer:

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

Sie können jedes Issue über seinen Bezeichner in allen Projekten des Arbeitsbereichs nachschlagen.

## Issues erstellen

### Über die Web-UI

1. Zum Projekt navigieren.
2. Auf **Neues Issue** klicken.
3. Titel, Beschreibung und optionale Felder ausfüllen.
4. Auf **Erstellen** klicken.

### Über die REST-API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Benutzereinstellungsseite implementieren",
    "description": "Eine Einstellungsseite hinzufügen, wo Benutzer ihr Profil aktualisieren können.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### Über MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Benutzereinstellungsseite implementieren",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## Kommentare

Issues unterstützen Thread-Kommentare mit Markdown-Formatierung und Dateianhängen:

```bash
# Einen Kommentar hinzufügen
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "In Commit abc123 behoben. Bereit zum Review."}'
```

Kommentare sind auch über MCP-Tools verfügbar: `comments.create`, `comments.list`, `comments.delete`.

## Aktivitäts-Feed

Jede Änderung an einem Issue wird im Aktivitäts-Feed aufgezeichnet:

- Zustandsänderungen
- Bearbeiter-Änderungen
- Label-Hinzufügungen/-Entfernungen
- Kommentare
- Prioritätsaktualisierungen

Der Aktivitäts-Feed bietet einen vollständigen Prüfpfad für jedes Issue.

## Dateianhänge

Issues und Kommentare unterstützen Dateianhänge einschließlich Bilder, Dokumente, Logs und Archive. Upload über die API:

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

Unterstützte Dateitypen: Bilder (PNG, JPG, GIF, WebP), Dokumente (PDF, TXT), Daten (JSON, CSV, XML), Archive (ZIP, GZ) und Logs.

## Suche

OpenPR bietet Volltextsuche über alle Issues, Kommentare und Vorschläge mit PostgreSQL FTS:

```bash
# Suche über API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Suche über MCP
# work_items.search: Suche innerhalb eines Projekts
# search.all: Globale Suche über alle Projekte
```

## MCP-Tools

| Tool | Parameter | Beschreibung |
|------|-----------|-------------|
| `work_items.list` | `project_id` | Issues in einem Projekt auflisten |
| `work_items.get` | `work_item_id` | Issue nach UUID abrufen |
| `work_items.get_by_identifier` | `identifier` | Nach menschlicher ID abrufen (z.B. `API-42`) |
| `work_items.create` | `project_id`, `title` | Ein Issue erstellen |
| `work_items.update` | `work_item_id` | Beliebiges Feld aktualisieren |
| `work_items.delete` | `work_item_id` | Ein Issue löschen |
| `work_items.search` | `query` | Volltextsuche |
| `comments.create` | `work_item_id`, `content` | Kommentar hinzufügen |
| `comments.list` | `work_item_id` | Kommentare auflisten |
| `comments.delete` | `comment_id` | Kommentar löschen |
| `files.upload` | `filename`, `content_base64` | Datei hochladen |

## Nächste Schritte

- [Workflow-Zustände](./workflow) -- Den Issue-Lebenszyklus verstehen
- [Sprint-Planung](./sprints) -- Issues in Sprint-Zyklen organisieren
- [Labels](./labels) -- Issues mit Labels kategorisieren
