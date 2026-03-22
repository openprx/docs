---
title: Labels
description: "Issues mit farbcodierten Labels in OpenPR organisieren und kategorisieren. Labels können arbeitsbereichsweit oder projektbezogen sein."
---

# Labels

Labels bieten eine flexible Möglichkeit, Issues zu kategorisieren und zu filtern. Jedes Label hat einen Namen, eine Farbe und eine optionale Beschreibung.

## Labels erstellen

### Über die Web-UI

1. Zu den Projekt- oder Arbeitsbereich-Einstellungen navigieren.
2. Zu **Labels** gehen.
3. Auf **Neues Label** klicken.
4. Einen Namen eingeben (z.B. "bug", "feature", "documentation").
5. Eine Farbe wählen (Hex-Format, z.B. `#ef4444` für rot).
6. Auf **Erstellen** klicken.

### Über die API

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Something is not working"
  }'
```

### Über MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## Gängige Label-Schemata

Hier sind einige beliebte Label-Organisationen:

### Nach Typ

| Label | Farbe | Beschreibung |
|-------|-------|-------------|
| `bug` | `#ef4444` (rot) | Etwas ist defekt |
| `feature` | `#3b82f6` (blau) | Neue Funktionsanfrage |
| `enhancement` | `#8b5cf6` (lila) | Verbesserung einer bestehenden Funktion |
| `documentation` | `#06b6d4` (cyan) | Dokumentationsaktualisierungen |
| `refactor` | `#f59e0b` (amber) | Code-Refactoring |

### Nach Priorität

| Label | Farbe | Beschreibung |
|-------|-------|-------------|
| `P0-critical` | `#dc2626` (rot) | Produktion ausgefallen |
| `P1-high` | `#ea580c` (orange) | Wichtige Funktion defekt |
| `P2-medium` | `#eab308` (gelb) | Nicht kritisches Problem |
| `P3-low` | `#22c55e` (grün) | Nice-to-have |

## Labels zu Issues hinzufügen

### Über die Web-UI

Ein Issue öffnen und auf das Feld **Labels** klicken, um Labels hinzuzufügen oder zu entfernen.

### Über die API

```bash
# Ein Label zu einem Issue hinzufügen
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### Über MCP

| Tool | Parameter | Beschreibung |
|------|-----------|-------------|
| `work_items.add_label` | `work_item_id`, `label_id` | Ein Label hinzufügen |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Mehrere Labels hinzufügen |
| `work_items.remove_label` | `work_item_id`, `label_id` | Ein Label entfernen |
| `work_items.list_labels` | `work_item_id` | Labels eines Issues auflisten |

## MCP-Tools zur Label-Verwaltung

| Tool | Parameter | Beschreibung |
|------|-----------|-------------|
| `labels.list` | -- | Alle Arbeitsbereichs-Labels auflisten |
| `labels.list_by_project` | `project_id` | Labels eines Projekts auflisten |
| `labels.create` | `name`, `color` | Ein Label erstellen |
| `labels.update` | `label_id` | Name, Farbe oder Beschreibung aktualisieren |
| `labels.delete` | `label_id` | Ein Label löschen |

## Nächste Schritte

- [Issues-Übersicht](./index) -- Vollständige Issue-Feldreferenz
- [Workflow-Zustände](./workflow) -- Issue-Lebenszyklusverwaltung
- [Sprint-Planung](./sprints) -- Markierte Issues in Sprints organisieren
