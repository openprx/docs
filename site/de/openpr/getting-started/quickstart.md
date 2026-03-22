---
title: Schnellstart
description: "OpenPR in Betrieb nehmen und den ersten Arbeitsbereich, das erste Projekt und die ersten Issues in 5 Minuten erstellen."
---

# Schnellstart

Diese Anleitung führt Sie durch die Einrichtung von OpenPR und die Erstellung Ihres ersten Arbeitsbereichs, Projekts und Ihrer ersten Issues. Sie setzt voraus, dass Sie bereits die [Installation](./installation) abgeschlossen haben.

## Schritt 1: OpenPR starten

Falls noch nicht geschehen, die Dienste starten:

```bash
cd openpr
docker-compose up -d
```

Warten, bis alle Dienste gesund sind:

```bash
docker-compose ps
```

## Schritt 2: Admin-Konto registrieren

http://localhost:3000 im Browser öffnen. Auf **Registrieren** klicken und ein Konto erstellen.

::: tip Erster Benutzer ist Admin
Der erste registrierte Benutzer erhält automatisch die **Admin**-Rolle. Dieser Benutzer kann alle Arbeitsbereiche, Projekte und Systemeinstellungen verwalten.
:::

## Schritt 3: Arbeitsbereich erstellen

Nach dem Einloggen den ersten Arbeitsbereich erstellen:

1. Auf dem Dashboard auf **Arbeitsbereich erstellen** klicken.
2. Einen Namen (z.B. "Mein Team") und einen Slug (z.B. "mein-team") eingeben.
3. Auf **Erstellen** klicken.

Ein Arbeitsbereich ist der übergeordnete Container für alle Ihre Projekte und Mitglieder.

## Schritt 4: Projekt erstellen

Im Arbeitsbereich:

1. Auf **Neues Projekt** klicken.
2. Einen Namen (z.B. "Backend API") und einen Projektschlüssel (z.B. "API") eingeben. Der Schlüssel wird als Präfix für Issue-Bezeichner verwendet (z.B. API-1, API-2).
3. Auf **Erstellen** klicken.

## Schritt 5: Issues erstellen

Zum Projekt navigieren und Issues erstellen:

1. Auf **Neues Issue** klicken.
2. Titel und Beschreibung eingeben.
3. Den Zustand setzen (backlog, todo, in_progress oder done).
4. Optional Priorität (low, medium, high, urgent), Bearbeiter und Labels setzen.
5. Auf **Erstellen** klicken.

Issues können auch über die API oder den MCP-Server erstellt werden:

```bash
# Ein Issue über die REST-API erstellen
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "CI-Pipeline einrichten",
    "state": "todo",
    "priority": "high"
  }'
```

## Schritt 6: Kanban-Board einrichten

Zur **Board**-Ansicht in Ihrem Projekt navigieren. Issues sind in Spalten nach Zustand organisiert:

| Spalte | Zustand | Beschreibung |
|--------|---------|-------------|
| Backlog | `backlog` | Ideen und zukünftige Arbeit |
| Zu tun | `todo` | Für den aktuellen Zyklus geplant |
| In Bearbeitung | `in_progress` | Wird aktiv bearbeitet |
| Erledigt | `done` | Abgeschlossene Arbeit |

Issues per Drag-and-Drop zwischen Spalten verschieben, um deren Zustand zu aktualisieren.

## Schritt 7: Teammitglieder einladen

Zu **Arbeitsbereich-Einstellungen** > **Mitglieder** gehen:

1. Auf **Mitglied einladen** klicken.
2. Die E-Mail-Adresse eingeben.
3. Eine Rolle auswählen: **Owner**, **Admin** oder **Mitglied**.

| Rolle | Berechtigungen |
|-------|--------------|
| Owner | Vollzugriff, kann Arbeitsbereich löschen |
| Admin | Projekte, Mitglieder und Einstellungen verwalten |
| Mitglied | Issues und Kommentare erstellen und verwalten |

## Schritt 8: KI-Assistenten verbinden (Optional)

Den MCP-Server einrichten, damit KI-Assistenten Ihre Projekte verwalten können:

1. Zu **Arbeitsbereich-Einstellungen** > **Bot-Tokens** gehen.
2. Ein neues Bot-Token erstellen. Es hat das `opr_`-Präfix.
3. Den KI-Assistenten mit dem Token konfigurieren.

Beispiel-Claude-Desktop-Konfiguration:

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

Der KI-Assistent kann nun Projekte auflisten, Issues erstellen, Sprints verwalten und vieles mehr durch 34 MCP-Tools.

## Was als Nächstes?

- [Arbeitsbereichsverwaltung](../workspace/) -- Mehr über Arbeitsbereichsorganisation und Mitglieder-Rollen erfahren
- [Issues & Workflow](../issues/) -- Tiefer in Issue-Tracking und Zustandsverwaltung eintauchen
- [Sprint-Planung](../issues/sprints) -- Sprint-Zyklen einrichten
- [Governance-Center](../governance/) -- Vorschläge, Abstimmungen und Vertrauenspunkte aktivieren
- [API-Referenz](../api/) -- Integration mit externen Tools
- [MCP-Server](../mcp-server/) -- Vollständige MCP-Tool-Referenz für KI-Assistenten
