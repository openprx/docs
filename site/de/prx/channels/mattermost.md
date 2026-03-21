---
title: Mattermost
description: PRX über die REST-API mit Mattermost verbinden
---

# Mattermost

> PRX über die REST API v4 für Messaging in dieser Open-Source, selbstgehosteten Slack-Alternative mit Mattermost verbinden.

## Voraussetzungen

- Ein Mattermost-Server (selbstgehostet oder Cloud)
- Ein Bot-Konto in Mattermost mit einem persönlichen Zugriffstoken erstellt
- Der Bot in die Kanäle eingeladen, in denen er arbeiten soll

## Schnelleinrichtung

### 1. Bot-Konto erstellen

1. Gehen Sie zu **Systemkonsole > Integrationen > Bot-Konten** und aktivieren Sie Bot-Konten
2. Gehen Sie zu **Integrationen > Bot-Konten > Bot-Konto hinzufügen**
3. Setzen Sie Benutzernamen, Anzeigenamen und Rolle
4. Kopieren Sie das generierte **Zugriffstoken**

Alternativ erstellen Sie ein reguläres Benutzerkonto und generieren ein persönliches Zugriffstoken unter **Profil > Sicherheit > Persönliche Zugriffstoken**.

### 2. Konfigurieren

```toml
[channels_config.mattermost]
url = "https://mattermost.example.com"
bot_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
channel_id = "abc123def456ghi789"
allowed_users = ["user123456"]
```

### 3. Überprüfen

```bash
prx channel doctor mattermost
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `url` | `String` | *erforderlich* | Mattermost-Server-URL (z.B. `"https://mattermost.example.com"`) |
| `bot_token` | `String` | *erforderlich* | Bot-Zugriffstoken oder persönliches Zugriffstoken |
| `channel_id` | `String` | `null` | Optionale Kanal-ID zur Beschränkung des Bots auf einen einzelnen Kanal |
| `allowed_users` | `[String]` | `[]` | Erlaubte Mattermost-Benutzer-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |
| `thread_replies` | `bool` | `true` | Bei true werden Antworten im ursprünglichen Beitrag gethreaded. Bei false gehen Antworten zum Kanalstamm |
| `mention_only` | `bool` | `false` | Bei true nur auf Nachrichten antworten, die den Bot @-erwähnen |

## Funktionen

- **REST API v4** -- verwendet die Standard-Mattermost-API zum Senden und Empfangen von Nachrichten
- **Thread-Antworten** -- antwortet automatisch im ursprünglichen Thread
- **Tipp-Indikatoren** -- zeigt Tipp-Status während der Antwortgenerierung
- **Selbstgehostet-freundlich** -- funktioniert mit jeder Mattermost-Bereitstellung, keine externen Abhängigkeiten
- **Kanaleinschränkung** -- optional den Bot mit `channel_id` auf einen einzelnen Kanal beschränken
- **Erwähnungsfilterung** -- nur auf @-Erwähnungen in geschäftigen Kanälen antworten

## Einschränkungen

- Verwendet Polling statt WebSocket für die Nachrichtenzustellung, was leichte Latenz verursacht
- Der Bot muss Mitglied des Kanals sein, um Nachrichten lesen und senden zu können
- Bot-Konten erfordern einen Systemadministrator zur Aktivierung in der Mattermost-Systemkonsole
- Dateianhang-Verarbeitung wird derzeit nicht unterstützt
- Abschließende Schrägstriche in der URL werden automatisch entfernt

## Fehlerbehebung

### Bot antwortet nicht
- Überprüfen Sie, ob die `url` keinen abschließenden Schrägstrich hat (wird automatisch entfernt, aber prüfen Sie doppelt)
- Bestätigen Sie die Gültigkeit des Bot-Tokens: `curl -H "Authorization: Bearer <token>" https://your-mm.com/api/v4/users/me`
- Stellen Sie sicher, dass der Bot zum Kanal hinzugefügt wurde

### Antworten gehen an die falsche Stelle
- Wenn `thread_replies = true`, werden Antworten im `root_id` des Originalbeitrags gethreaded
- Wenn die Originalnachricht nicht in einem Thread ist, wird ein neuer Thread erstellt
- Setzen Sie `thread_replies = false`, um immer zum Kanalstamm zu posten

### Bot antwortet auf alles im Kanal
- Setzen Sie `mention_only = true`, um nur bei @-Erwähnung zu antworten
- Alternativ beschränken Sie auf einen dedizierten Kanal mit `channel_id`
