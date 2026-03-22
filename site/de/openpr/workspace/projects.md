---
title: Projektverwaltung
description: "Projekte organisieren Issues, Sprints und Labels innerhalb eines Arbeitsbereichs. Erfahren Sie, wie Sie Projekte in OpenPR erstellen und verwalten."
---

# Projektverwaltung

Ein **Projekt** lebt innerhalb eines Arbeitsbereichs und dient als Container für Issues, Sprints, Labels und Governance-Vorschläge. Jedes Projekt hat einen eindeutigen **Schlüssel** (z.B. `API`, `FRONT`, `OPS`), der Issue-Bezeichner als Präfix voranstellt.

## Ein Projekt erstellen

Zum Arbeitsbereich navigieren und auf **Neues Projekt** klicken:

| Feld | Erforderlich | Beschreibung | Beispiel |
|------|-------------|-------------|---------|
| Name | Ja | Anzeigename | "Backend API" |
| Schlüssel | Ja | 2-5 Zeichen Präfix für Issues | "API" |
| Beschreibung | Nein | Projektzusammenfassung | "REST-API und Geschäftslogik" |

Der Schlüssel muss im Arbeitsbereich eindeutig sein und bestimmt Issue-Bezeichner: `API-1`, `API-2`, usw.

## Projekt-Dashboard

Jedes Projekt bietet:

- **Board** -- Kanban-Ansicht mit Drag-and-Drop-Spalten (Backlog, Zu tun, In Bearbeitung, Erledigt).
- **Issues** -- Listenansicht mit Filterung, Sortierung und Volltextsuche.
- **Sprints** -- Sprint-Planung und Zyklusverwaltung. Siehe [Sprints](../issues/sprints).
- **Labels** -- Projekteigene Labels zur Kategorisierung. Siehe [Labels](../issues/labels).
- **Einstellungen** -- Projektname, Schlüssel, Beschreibung und Mitgliedereinstellungen.

## Issue-Zähler

Die Projektübersicht zeigt Issue-Zähler nach Zustand:

| Zustand | Beschreibung |
|---------|-------------|
| Backlog | Ideen und zukünftige Arbeit |
| Zu tun | Für den aktuellen Zyklus geplant |
| In Bearbeitung | Wird aktiv bearbeitet |
| Erledigt | Abgeschlossene Arbeit |

## API-Referenz

```bash
# Projekte in einem Arbeitsbereich auflisten
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Ein Projekt erstellen
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "Backend API", "key": "API"}'

# Projekt mit Issue-Zählern abrufen
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## MCP-Tools

| Tool | Parameter | Beschreibung |
|------|-----------|-------------|
| `projects.list` | -- | Alle Projekte im Arbeitsbereich auflisten |
| `projects.get` | `project_id` | Projektdetails mit Issue-Zählern abrufen |
| `projects.create` | `key`, `name` | Ein neues Projekt erstellen |
| `projects.update` | `project_id` | Name oder Beschreibung aktualisieren |
| `projects.delete` | `project_id` | Ein Projekt löschen |

## Nächste Schritte

- [Issues](../issues/) -- Issues innerhalb von Projekten erstellen und verwalten
- [Mitglieder](./members) -- Projektzugriff über Arbeitsbereichs-Rollen verwalten
