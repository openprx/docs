---
title: Mitglieder & Berechtigungen
description: "Arbeitsbereichsmitglieder, Rollen und Bot-Tokens in OpenPR verwalten. Rollenbasierte Zugangskontrolle mit Owner-, Admin- und Mitglieder-Ebenen."
---

# Mitglieder & Berechtigungen

OpenPR verwendet rollenbasierte Zugangskontrolle (RBAC), die auf Arbeitsbereiche beschränkt ist. Jedes Arbeitsbereichsmitglied hat eine Rolle, die seine Berechtigungen bestimmt.

## Rollen

| Rolle | Beschreibung | Berechtigungen |
|-------|-------------|--------------|
| **Owner** | Arbeitsbereichsersteller oder beförderte Owner | Vollzugriff: Arbeitsbereich löschen, alle Einstellungen verwalten, Mitglieder befördern/degradieren |
| **Admin** | Arbeitsbereichsadministrator | Projekte, Mitglieder (außer Owners), Einstellungen und Governance-Konfiguration verwalten |
| **Mitglied** | Reguläres Teammitglied | Issues, Kommentare, Labels erstellen und verwalten; an Governance teilnehmen |

## Mitglieder einladen

Zu **Arbeitsbereich-Einstellungen** > **Mitglieder** > **Einladen** navigieren:

1. Die E-Mail-Adresse des Benutzers eingeben.
2. Eine Rolle auswählen (Owner, Admin oder Mitglied).
3. Auf **Einladen** klicken.

Der eingeladene Benutzer muss ein OpenPR-Konto haben. Falls nicht, muss er sich zuerst registrieren.

## Mitglieder verwalten

Aus der Mitgliederliste können Sie:

- **Rolle ändern** -- Mitglieder befördern oder degradieren (Admins können Owner-Rollen nicht ändern).
- **Entfernen** -- Ein Mitglied aus dem Arbeitsbereich entfernen.

## Benutzertypen

OpenPR unterstützt zwei Entity-Typen:

| Typ | Beschreibung | Erstellt von |
|-----|-------------|-------------|
| `human` | Reguläre menschliche Benutzer | Benutzerregistrierung |
| `bot` | Bot/KI-Konten | Bot-Token-Erstellung |

Bot-Benutzer werden automatisch erstellt, wenn ein Bot-Token generiert wird. Sie erscheinen in Aktivitäts-Feeds und Auditprotokollen mit ihrem Anzeigenamen.

## Bot-Tokens

Bot-Tokens ermöglichen KI-Assistenten und externen Tools die Authentifizierung beim MCP-Server und der API. Jedes Token:

- Hat ein `opr_`-Präfix.
- Ist auf einen Arbeitsbereich beschränkt.
- Erstellt eine entsprechende `bot_mcp`-Benutzerentität.
- Unterstützt alle Lese-/Schreiboperationen, die Arbeitsbereichsmitgliedern zur Verfügung stehen.

### Ein Bot-Token erstellen

Zu **Arbeitsbereich-Einstellungen** > **Bot-Tokens** > **Erstellen** navigieren:

1. Einen Anzeigenamen eingeben (z.B. "Claude Assistant").
2. Auf **Erstellen** klicken.
3. Das Token sofort kopieren -- es wird nicht noch einmal angezeigt.

### Bot-Tokens verwenden

Bot-Tokens werden in der MCP-Server-Konfiguration verwendet:

```bash
# Umgebungsvariable
OPENPR_BOT_TOKEN=opr_your_token_here
```

Oder in API-Anfragen:

```bash
curl -H "Authorization: Bearer opr_your_token_here" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

## API-Referenz

```bash
# Arbeitsbereichsmitglieder auflisten
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/members

# Bot-Tokens auflisten
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/bots
```

## MCP-Tools

| Tool | Beschreibung |
|------|-------------|
| `members.list` | Alle Arbeitsbereichsmitglieder und ihre Rollen auflisten |

## Nächste Schritte

- [Arbeitsbereichsverwaltung](./index) -- Arbeitsbereichskonfiguration
- [MCP-Server](../mcp-server/) -- KI-Assistenten mit Bot-Tokens konfigurieren
