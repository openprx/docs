---
title: Authentifizierung
description: "OpenPR verwendet JWT-Tokens für die Benutzerauthentifizierung und Bot-Tokens für KI/MCP-Zugriff. Erfahren Sie mehr über Registrierung, Anmeldung, Token-Erneuerung und Bot-Tokens."
---

# Authentifizierung

OpenPR verwendet **JWT (JSON Web Tokens)** für die Benutzerauthentifizierung und **Bot-Tokens** für den Zugriff von KI-Assistenten und MCP-Server.

## Benutzerauthentifizierung (JWT)

### Registrieren

Ein neues Konto erstellen:

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

Antwort:

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip Erster Benutzer
Der erste registrierte Benutzer erhält automatisch die `admin`-Rolle. Alle weiteren Benutzer sind standardmäßig `user`.
:::

### Anmelden

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

Die Antwort enthält `access_token`, `refresh_token` und Benutzerinformationen mit `role`.

### Das Zugriffstoken verwenden

Das Zugriffstoken im `Authorization`-Header für alle authentifizierten Anfragen einfügen:

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### Token-Erneuerung

Wenn das Zugriffstoken abläuft, das Aktualisierungstoken verwenden, um ein neues Tokenpaar zu erhalten:

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### Aktuellen Benutzer abrufen

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

Gibt das Profil des aktuellen Benutzers zurück, einschließlich `role` (admin/user).

## Token-Konfiguration

JWT-Token-Lebensdauern werden über Umgebungsvariablen konfiguriert:

| Variable | Standard | Beschreibung |
|----------|---------|-------------|
| `JWT_SECRET` | `change-me-in-production` | Geheimschlüssel zum Signieren von Tokens |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 Tage) | Zugriffstoken-Lebensdauer |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 Tage) | Aktualisierungstoken-Lebensdauer |

::: danger Produktionssicherheit
`JWT_SECRET` immer auf einen starken, zufälligen Wert in der Produktion setzen. Der Standardwert ist unsicher.
:::

## Bot-Token-Authentifizierung

Bot-Tokens bieten Authentifizierung für KI-Assistenten und automatisierte Tools. Sie sind arbeitsbereichsbezogen und verwenden das Präfix `opr_`.

### Bot-Tokens erstellen

Bot-Tokens werden über die Arbeitsbereichs-Einstellungs-UI oder API verwaltet:

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### Bot-Tokens verwenden

Bot-Tokens werden genauso wie JWT-Tokens verwendet:

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### Bot-Token-Eigenschaften

| Eigenschaft | Beschreibung |
|-------------|-------------|
| Präfix | `opr_` |
| Geltungsbereich | Ein Arbeitsbereich |
| Entity-Typ | Erstellt eine `bot_mcp`-Benutzerentität |
| Berechtigungen | Gleich wie Arbeitsbereichsmitglied |
| Prüfpfad | Alle Aktionen werden unter Bot-Benutzer protokolliert |

## Authentifizierungs-Endpunkte Übersicht

| Endpunkt | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/auth/register` | POST | Konto erstellen |
| `/api/auth/login` | POST | Anmelden und Tokens erhalten |
| `/api/auth/refresh` | POST | Token-Paar erneuern |
| `/api/auth/me` | GET | Aktuelle Benutzerinformationen abrufen |

## Nächste Schritte

- [Endpunktreferenz](./endpoints) -- Vollständige API-Dokumentation
- [MCP-Server](../mcp-server/) -- Bot-Token-Verwendung mit MCP
- [Mitglieder & Berechtigungen](../workspace/members) -- Rollenbasierter Zugriff
