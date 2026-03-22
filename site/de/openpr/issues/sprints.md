---
title: Sprint-Verwaltung
description: "Arbeit in zeitlich begrenzten Iterationen mit OpenPR-Sprints planen und verfolgen. Sprints erstellen, Issues zuweisen und Fortschritt überwachen."
---

# Sprint-Verwaltung

Sprints sind zeitlich begrenzte Iterationen zur Organisation und Verfolgung von Arbeit. Jeder Sprint gehört zu einem Projekt und hat ein Start- und Enddatum sowie eine Reihe zugewiesener Issues.

## Einen Sprint erstellen

### Über die Web-UI

1. Zum Projekt navigieren.
2. Zum Abschnitt **Sprints** gehen.
3. Auf **Neuer Sprint** klicken.
4. Sprint-Name, Startdatum und Enddatum eingeben.

### Über die API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### Über MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## Sprint-Felder

| Feld | Typ | Erforderlich | Beschreibung |
|------|-----|-------------|-------------|
| Name | string | Ja | Sprint-Name (z.B. "Sprint 1", "Q1 Woche 3") |
| Startdatum | date | Nein | Sprint-Startdatum |
| Enddatum | date | Nein | Sprint-Enddatum |
| Status | enum | Auto | Aktiv, abgeschlossen oder geplant |

## Issues einem Sprint zuweisen

Issues einem Sprint durch Aktualisieren der `sprint_id` des Issues zuweisen:

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

Oder über die Web-UI, Issues in den Sprint-Bereich ziehen oder das Issue-Detailfeld verwenden.

## Sprint-Planungs-Workflow

Ein typischer Sprint-Planungs-Workflow:

1. **Sprint erstellen** mit Start- und Enddatum.
2. **Backlog überprüfen** -- Issues identifizieren, die einbezogen werden sollen.
3. **Issues verschieben** aus Backlog/Zu tun in den Sprint.
4. **Prioritäten setzen** und Bearbeiter für Sprint-Issues festlegen.
5. **Sprint starten** -- Team beginnt Arbeit.
6. **Fortschritt verfolgen** im Board und Sprint-Ansicht.
7. **Sprint abschließen** -- Erledigte/verbleibende Elemente überprüfen.

## MCP-Tools

| Tool | Parameter | Beschreibung |
|------|-----------|-------------|
| `sprints.list` | `project_id` | Sprints in einem Projekt auflisten |
| `sprints.create` | `project_id`, `name` | Sprint mit optionalen Daten erstellen |
| `sprints.update` | `sprint_id` | Name, Daten oder Status aktualisieren |
| `sprints.delete` | `sprint_id` | Einen Sprint löschen |

## Nächste Schritte

- [Workflow-Zustände](./workflow) -- Issue-Zustandsübergänge verstehen
- [Labels](./labels) -- Sprint-Issues kategorisieren
- [Issues-Übersicht](./index) -- Vollständige Issue-Feldreferenz
