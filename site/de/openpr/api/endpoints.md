---
title: API-Endpunktreferenz
description: "Vollständige Referenz für alle OpenPR REST-API-Endpunkte einschließlich Authentifizierung, Projekte, Issues, Governance, KI und Admin-Operationen."
---

# API-Endpunktreferenz

Diese Seite bietet eine vollständige Referenz für alle OpenPR REST-API-Endpunkte. Alle Endpunkte erfordern Authentifizierung, sofern nicht anders angegeben.

## Authentifizierung

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|-------------|------|
| POST | `/api/auth/register` | Ein neues Konto erstellen | Nein |
| POST | `/api/auth/login` | Anmelden und Tokens erhalten | Nein |
| POST | `/api/auth/refresh` | Zugriffstoken erneuern | Nein |
| GET | `/api/auth/me` | Aktuelle Benutzerinformationen abrufen | Ja |

## Arbeitsbereiche

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/workspaces` | Arbeitsbereiche des Benutzers auflisten |
| POST | `/api/workspaces` | Einen Arbeitsbereich erstellen |
| GET | `/api/workspaces/:id` | Arbeitsbereichsdetails abrufen |
| PUT | `/api/workspaces/:id` | Arbeitsbereich aktualisieren |
| DELETE | `/api/workspaces/:id` | Arbeitsbereich löschen (nur Owner) |

## Arbeitsbereichsmitglieder

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/workspaces/:id/members` | Mitglieder auflisten |
| POST | `/api/workspaces/:id/members` | Ein Mitglied hinzufügen |
| PUT | `/api/workspaces/:id/members/:user_id` | Mitgliederrolle aktualisieren |
| DELETE | `/api/workspaces/:id/members/:user_id` | Mitglied entfernen |

## Bot-Tokens

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/workspaces/:id/bots` | Bot-Tokens auflisten |
| POST | `/api/workspaces/:id/bots` | Bot-Token erstellen |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | Bot-Token löschen |

## Projekte

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/workspaces/:ws_id/projects` | Projekte auflisten |
| POST | `/api/workspaces/:ws_id/projects` | Projekt erstellen |
| GET | `/api/workspaces/:ws_id/projects/:id` | Projekt mit Zählern abrufen |
| PUT | `/api/workspaces/:ws_id/projects/:id` | Projekt aktualisieren |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | Projekt löschen |

## Issues (Work Items)

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/projects/:id/issues` | Issues auflisten (Paginierung, Filter) |
| POST | `/api/projects/:id/issues` | Issue erstellen |
| GET | `/api/issues/:id` | Issue nach UUID abrufen |
| PATCH | `/api/issues/:id` | Issue-Felder aktualisieren |
| DELETE | `/api/issues/:id` | Issue löschen |

### Issue-Felder (Erstellen/Aktualisieren)

```json
{
  "title": "string (required on create)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "ISO 8601 datetime"
}
```

## Board

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/projects/:id/board` | Kanban-Board-Zustand abrufen |

## Kommentare

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/issues/:id/comments` | Kommentare zu einem Issue auflisten |
| POST | `/api/issues/:id/comments` | Einen Kommentar erstellen |
| DELETE | `/api/comments/:id` | Einen Kommentar löschen |

## Labels

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/labels` | Alle Arbeitsbereichs-Labels auflisten |
| POST | `/api/labels` | Ein Label erstellen |
| PUT | `/api/labels/:id` | Label aktualisieren |
| DELETE | `/api/labels/:id` | Label löschen |
| POST | `/api/issues/:id/labels` | Label zu Issue hinzufügen |
| DELETE | `/api/issues/:id/labels/:label_id` | Label von Issue entfernen |

## Sprints

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/projects/:id/sprints` | Sprints auflisten |
| POST | `/api/projects/:id/sprints` | Sprint erstellen |
| PUT | `/api/sprints/:id` | Sprint aktualisieren |
| DELETE | `/api/sprints/:id` | Sprint löschen |

## Vorschläge

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/proposals` | Vorschläge auflisten |
| POST | `/api/proposals` | Vorschlag erstellen |
| GET | `/api/proposals/:id` | Vorschlagsdetails abrufen |
| POST | `/api/proposals/:id/vote` | Eine Stimme abgeben |
| POST | `/api/proposals/:id/submit` | Zur Abstimmung einreichen |
| POST | `/api/proposals/:id/archive` | Vorschlag archivieren |

## Governance

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/governance/config` | Governance-Konfiguration abrufen |
| PUT | `/api/governance/config` | Governance-Konfiguration aktualisieren |
| GET | `/api/governance/audit-logs` | Governance-Prüfprotokolle auflisten |

## Entscheidungen

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/decisions` | Entscheidungen auflisten |
| GET | `/api/decisions/:id` | Entscheidungsdetails abrufen |

## Vertrauenspunkte

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/trust-scores` | Vertrauenspunkte auflisten |
| GET | `/api/trust-scores/:user_id` | Benutzer-Vertrauenspunkte abrufen |
| GET | `/api/trust-scores/:user_id/history` | Punkteverlauf abrufen |
| POST | `/api/trust-scores/:user_id/appeals` | Einspruch einlegen |

## Veto

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/veto` | Veto-Ereignisse auflisten |
| POST | `/api/veto` | Veto erstellen |
| POST | `/api/veto/:id/escalate` | Ein Veto eskalieren |

## KI-Agenten

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/projects/:id/ai-agents` | KI-Agenten auflisten |
| POST | `/api/projects/:id/ai-agents` | KI-Agenten registrieren |
| GET | `/api/projects/:id/ai-agents/:agent_id` | Agentendetails abrufen |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | Agenten aktualisieren |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | Agenten entfernen |

## KI-Aufgaben

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/projects/:id/ai-tasks` | KI-Aufgaben auflisten |
| POST | `/api/projects/:id/ai-tasks` | KI-Aufgabe erstellen |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | Aufgabenstatus aktualisieren |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | Aufgaben-Callback |

## Datei-Upload

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| POST | `/api/v1/upload` | Datei hochladen (multipart/form-data) |

Unterstützte Typen: Bilder (PNG, JPG, GIF, WebP), Dokumente (PDF, TXT), Daten (JSON, CSV, XML), Archive (ZIP, GZ), Logs.

## Webhooks

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/workspaces/:id/webhooks` | Webhooks auflisten |
| POST | `/api/workspaces/:id/webhooks` | Webhook erstellen |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | Webhook aktualisieren |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | Webhook löschen |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | Lieferprotokoll |

## Suche

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/search?q=<query>` | Volltextsuche über alle Entitäten |

## Admin

| Methode | Endpunkt | Beschreibung |
|---------|----------|-------------|
| GET | `/api/admin/users` | Alle Benutzer auflisten (nur Admin) |
| PUT | `/api/admin/users/:id` | Benutzer aktualisieren (nur Admin) |

## Integrität

| Methode | Endpunkt | Beschreibung | Auth |
|---------|----------|-------------|------|
| GET | `/health` | Integritätsprüfung | Nein |

## Nächste Schritte

- [Authentifizierung](./authentication) -- Token-Verwaltung und Bot-Tokens
- [API-Übersicht](./index) -- Antwortformat und Konventionen
- [MCP-Server](../mcp-server/) -- KI-freundliche Schnittstelle
