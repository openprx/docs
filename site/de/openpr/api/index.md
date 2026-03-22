---
title: REST-API-Übersicht
description: "OpenPR bietet eine umfassende REST-API zur Verwaltung von Arbeitsbereichen, Projekten, Issues, Governance und mehr. Aufgebaut mit Rust und Axum."
---

# REST-API-Übersicht

OpenPR bietet eine RESTful-API, aufgebaut mit **Rust** und **Axum**, für programmatischen Zugriff auf alle Plattformfunktionen. Die API unterstützt JSON-Anfrage/Antwort-Formate und JWT-basierte Authentifizierung.

## Basis-URL

```
http://localhost:8080/api
```

In Produktionsbereitstellungen hinter einem Reverse-Proxy (Caddy/Nginx) wird die API typischerweise über die Frontend-URL weitergeleitet.

## Antwortformat

Alle API-Antworten folgen einer einheitlichen JSON-Struktur:

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
  "message": "Detailed error description"
}
```

Gängige Fehlercodes:

| Code | Bedeutung |
|------|-----------|
| 400 | Ungültige Anfrage (Validierungsfehler) |
| 401 | Nicht autorisiert (fehlendes oder ungültiges Token) |
| 403 | Verboten (unzureichende Berechtigungen) |
| 404 | Nicht gefunden |
| 500 | Interner Serverfehler |

## API-Kategorien

| Kategorie | Basispfad | Beschreibung |
|-----------|-----------|-------------|
| [Authentifizierung](./authentication) | `/api/auth/*` | Registrieren, anmelden, Token erneuern |
| Projekte | `/api/workspaces/*/projects/*` | CRUD, Mitglieder, Einstellungen |
| Issues | `/api/projects/*/issues/*` | CRUD, zuweisen, labeln, kommentieren |
| Board | `/api/projects/*/board` | Kanban-Board-Zustand |
| Sprints | `/api/projects/*/sprints/*` | Sprint-CRUD und -Planung |
| Labels | `/api/labels/*` | Label-CRUD |
| Suche | `/api/search` | Volltextsuche |
| Vorschläge | `/api/proposals/*` | Erstellen, abstimmen, einreichen, archivieren |
| Governance | `/api/governance/*` | Konfiguration, Prüfprotokolle |
| Entscheidungen | `/api/decisions/*` | Entscheidungsaufzeichnungen |
| Vertrauenspunkte | `/api/trust-scores/*` | Punkte, Verlauf, Einsprüche |
| Veto | `/api/veto/*` | Veto, Eskalation |
| KI-Agenten | `/api/projects/*/ai-agents/*` | Agentenverwaltung |
| KI-Aufgaben | `/api/projects/*/ai-tasks/*` | Aufgabenzuweisung |
| Bot-Tokens | `/api/workspaces/*/bots` | Bot-Token-CRUD |
| Datei-Upload | `/api/v1/upload` | Mehrteiliger Datei-Upload |
| Webhooks | `/api/workspaces/*/webhooks/*` | Webhook-CRUD |
| Admin | `/api/admin/*` | Systemverwaltung |

Siehe [Endpunktreferenz](./endpoints) für die vollständige API-Referenz.

## Content-Type

Alle POST/PUT/PATCH-Anfragen müssen `Content-Type: application/json` verwenden, außer Datei-Uploads, die `multipart/form-data` verwenden.

## Paginierung

Listen-Endpunkte unterstützen Paginierung:

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## Volltextsuche

Der Such-Endpunkt verwendet PostgreSQL-Volltextsuche über Issues, Kommentare und Vorschläge:

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## Integritätsprüfung

Der API-Server stellt einen Integritäts-Endpunkt bereit, der keine Authentifizierung erfordert:

```bash
curl http://localhost:8080/health
```

## Nächste Schritte

- [Authentifizierung](./authentication) -- JWT-Authentifizierung und Bot-Tokens
- [Endpunktreferenz](./endpoints) -- Vollständige Endpunktdokumentation
- [MCP-Server](../mcp-server/) -- KI-freundliche Schnittstelle mit 34 Tools
