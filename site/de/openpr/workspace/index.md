---
title: Arbeitsbereichsverwaltung
description: "Arbeitsbereiche sind die übergeordnete Organisationseinheit in OpenPR. Erfahren Sie, wie Sie Arbeitsbereiche erstellen, konfigurieren und verwalten."
---

# Arbeitsbereichsverwaltung

Ein **Arbeitsbereich** ist die übergeordnete Organisationseinheit in OpenPR. Er bietet Mandantentrennung -- jeder Arbeitsbereich hat eigene Projekte, Mitglieder, Labels, Bot-Tokens und Governance-Einstellungen. Benutzer können zu mehreren Arbeitsbereichen gehören.

## Einen Arbeitsbereich erstellen

Nach dem Einloggen auf dem Dashboard auf **Arbeitsbereich erstellen** klicken oder zu **Einstellungen** > **Arbeitsbereiche** > **Neu** navigieren.

Angaben machen:

| Feld | Erforderlich | Beschreibung |
|------|-------------|-------------|
| Name | Ja | Anzeigename (z.B. "Engineering-Team") |
| Slug | Ja | URL-freundlicher Bezeichner (z.B. "engineering") |

Der erstellende Benutzer wird automatisch der **Owner**-Rolle zugewiesen.

## Arbeitsbereichsstruktur

```mermaid
graph TB
    WS["Arbeitsbereich"]
    WS --> P1["Projekt A<br/>(Schlüssel: PROJ)"]
    WS --> P2["Projekt B<br/>(Schlüssel: API)"]
    WS --> M["Mitglieder<br/>Owner · Admin · Mitglied"]
    WS --> BOT["Bot-Tokens<br/>(opr_-Präfix)"]
    WS --> GOV["Governance-Konfiguration"]

    P1 --> I1["Issues"]
    P1 --> S1["Sprints"]
    P1 --> L1["Labels"]
    P2 --> I2["Issues"]
    P2 --> S2["Sprints"]
    P2 --> L2["Labels"]
```

## Arbeitsbereich-Einstellungen

Auf Arbeitsbereich-Einstellungen über das Zahnrad-Symbol oder **Einstellungen** in der Seitenleiste zugreifen:

- **Allgemein** -- Arbeitsbereichsname, Slug und Beschreibung aktualisieren.
- **Mitglieder** -- Benutzer einladen, Rollen ändern, Mitglieder entfernen. Siehe [Mitglieder](./members).
- **Bot-Tokens** -- MCP-Bot-Tokens erstellen und verwalten.
- **Governance** -- Abstimmungsschwellenwerte, Vorschlagsvorlagen und Vertrauenspunkt-Regeln konfigurieren. Siehe [Governance](../governance/).
- **Webhooks** -- Webhook-Endpunkte für externe Integrationen einrichten.

## API-Zugriff

```bash
# Arbeitsbereiche auflisten
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces

# Arbeitsbereichsdetails abrufen
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>
```

## MCP-Zugriff

Über den MCP-Server arbeiten KI-Assistenten innerhalb des Arbeitsbereichs, der durch die Umgebungsvariable `OPENPR_WORKSPACE_ID` angegeben wird. Alle MCP-Tools beschränken Operationen automatisch auf diesen Arbeitsbereich.

## Nächste Schritte

- [Projekte](./projects) -- Projekte innerhalb eines Arbeitsbereichs erstellen und verwalten
- [Mitglieder & Berechtigungen](./members) -- Benutzer einladen und Rollen konfigurieren
