---
title: Slack
description: PRX über die Bot-API und Socket Mode mit Slack verbinden
---

# Slack

> PRX über einen Bot mit OAuth-Tokens, Socket Mode für Echtzeit-Ereignisse und Thread-basierter Konversationsunterstützung mit Slack verbinden.

## Voraussetzungen

- Ein Slack-Workspace, in dem Sie die Berechtigung haben, Apps zu installieren
- Eine Slack-App, erstellt unter [api.slack.com/apps](https://api.slack.com/apps)
- Ein Bot-Token (`xoxb-...`) und optional ein App-Level-Token (`xapp-...`) für Socket Mode

## Schnelleinrichtung

### 1. Slack-App erstellen

1. Gehen Sie zu [api.slack.com/apps](https://api.slack.com/apps) und klicken Sie auf "Create New App"
2. Wählen Sie "From scratch" und wählen Sie Ihren Workspace
3. Unter "OAuth & Permissions" fügen Sie diese Bot-Scopes hinzu:
   - `chat:write`, `channels:history`, `groups:history`, `im:history`, `mpim:history`
   - `files:read`, `files:write`, `reactions:write`, `users:read`
4. Installieren Sie die App in Ihrem Workspace und kopieren Sie das **Bot User OAuth Token** (`xoxb-...`)

### 2. Socket Mode aktivieren (empfohlen)

1. Unter "Socket Mode" aktivieren Sie es und generieren Sie ein App-Level-Token (`xapp-...`) mit dem `connections:write`-Scope
2. Unter "Event Subscriptions" abonnieren Sie: `message.channels`, `message.groups`, `message.im`, `message.mpim`

### 3. Konfigurieren

```toml
[channels_config.slack]
bot_token = "xoxb-your-bot-token-here"
app_token = "xapp-your-app-token-here"
allowed_users = ["U01ABCDEF"]
```

### 4. Überprüfen

```bash
prx channel doctor slack
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `bot_token` | `String` | *erforderlich* | Slack-Bot-OAuth-Token (`xoxb-...`) |
| `app_token` | `String` | `null` | App-Level-Token (`xapp-...`) für Socket Mode. Ohne dieses fällt auf Polling zurück |
| `channel_id` | `String` | `null` | Bot auf einen einzelnen Kanal beschränken. Weglassen oder `"*"` setzen, um in allen Kanälen zu lauschen |
| `allowed_users` | `[String]` | `[]` | Slack-Benutzer-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |
| `interrupt_on_new_message` | `bool` | `false` | Bei true bricht eine neue Nachricht desselben Absenders die laufende Anfrage ab |
| `thread_replies` | `bool` | `true` | Bei true bleiben Antworten im ursprünglichen Thread. Bei false gehen Antworten zum Kanalstamm |
| `mention_only` | `bool` | `false` | Bei true nur auf @-Erwähnungen antworten. DMs werden immer verarbeitet |

## Funktionen

- **Socket Mode** -- Echtzeit-Ereigniszustellung ohne öffentliche URL (erfordert `app_token`)
- **Thread-Antworten** -- antwortet automatisch im ursprünglichen Thread
- **Dateianhänge** -- lädt Textdateien herunter und integriert sie inline; verarbeitet Bilder bis 5 MB
- **Benutzer-Anzeigenamen** -- löst Slack-Benutzer-IDs zu Anzeigenamen auf mit Caching (6 Stunden TTL)
- **Multi-Kanal-Unterstützung** -- lauscht in mehreren Kanälen oder beschränkt auf einen
- **Tipp-Indikatoren** -- zeigt Tipp-Status während der Antwortgenerierung
- **Unterbrechungsunterstützung** -- bricht laufende Anfragen ab, wenn der Benutzer eine Folgenachricht sendet

## Einschränkungen

- Slack-Nachrichten sind auf 40.000 Zeichen begrenzt (selten ein Problem)
- Dateidownloads sind auf 256 KB für Text und 5 MB für Bilder begrenzt
- Maximal 8 Dateianhänge pro Nachricht verarbeitet
- Socket Mode erfordert den `connections:write`-Scope auf einem App-Level-Token
- Ohne Socket Mode (`app_token`) fällt der Kanal auf Polling mit höherer Latenz zurück

## Fehlerbehebung

### Bot empfängt keine Nachrichten
- Überprüfen Sie, ob Socket Mode aktiviert ist und das `app_token` korrekt ist
- Prüfen Sie, ob "Event Subscriptions" die notwendigen `message.*`-Ereignisse enthalten
- Stellen Sie sicher, dass der Bot zum Kanal eingeladen wurde (`/invite @botname`)

### Antworten gehen zum Kanal statt zum Thread
- Prüfen Sie, ob `thread_replies` nicht auf `false` gesetzt ist
- Thread-Antworten erfordern, dass die ursprüngliche Nachricht einen `thread_ts` hat

### Dateianhänge werden nicht verarbeitet
- Stellen Sie sicher, dass der Bot den `files:read`-Scope hat
- Nur `text/*`- und gängige Bild-MIME-Typen werden unterstützt
- Dateien, die die Größenlimits überschreiten, werden stillschweigend übersprungen
