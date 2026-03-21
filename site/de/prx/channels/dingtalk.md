---
title: DingTalk
description: PRX über den Stream-Modus mit DingTalk (Alibaba) verbinden
---

# DingTalk

> PRX über die Stream-Mode-WebSocket-API für Echtzeit-Bot-Messaging in der Alibaba-Arbeitsplatzplattform mit DingTalk verbinden.

## Voraussetzungen

- Eine DingTalk-Organisation (Unternehmen oder Team)
- Eine Bot-Anwendung erstellt in der [DingTalk Developer Console](https://open-dev.dingtalk.com/)
- Client-ID (AppKey) und Client Secret (AppSecret) von der Entwicklerkonsole

## Schnelleinrichtung

### 1. DingTalk-Bot erstellen

1. Gehen Sie zur [DingTalk Open Platform](https://open-dev.dingtalk.com/) und melden Sie sich an
2. Erstellen Sie eine neue "Enterprise Internal Application" (oder "H5 Micro Application")
3. Fügen Sie die "Robot"-Fähigkeit zu Ihrer Anwendung hinzu
4. Unter "Credentials" kopieren Sie die **Client ID** (AppKey) und das **Client Secret** (AppSecret)
5. Aktivieren Sie "Stream Mode" unter der Bot-Konfiguration

### 2. Konfigurieren

```toml
[channels_config.dingtalk]
client_id = "dingxxxxxxxxxxxxxxxxxx"
client_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["manager1234"]
```

### 3. Überprüfen

```bash
prx channel doctor dingtalk
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `client_id` | `String` | *erforderlich* | Client-ID (AppKey) von der DingTalk-Entwicklerkonsole |
| `client_secret` | `String` | *erforderlich* | Client Secret (AppSecret) von der Entwicklerkonsole |
| `allowed_users` | `[String]` | `[]` | Erlaubte DingTalk-Mitarbeiter-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |

## Funktionen

- **Stream-Mode-WebSocket** -- persistente WebSocket-Verbindung zum DingTalk-Gateway für Echtzeit-Nachrichtenzustellung
- **Keine öffentliche URL erforderlich** -- Stream Mode stellt eine ausgehende Verbindung her, kein eingehendes Webhook-Setup nötig
- **Private und Gruppenchats** -- verarbeitet sowohl 1:1-Konversationen als auch Gruppenchat-Nachrichten
- **Sitzungs-Webhooks** -- antwortet über pro-Nachricht-Sitzungs-Webhook-URLs, die von DingTalk bereitgestellt werden
- **Automatische Gateway-Registrierung** -- registriert sich beim DingTalk-Gateway, um einen WebSocket-Endpunkt und ein Ticket zu erhalten
- **Konversationstyp-Erkennung** -- unterscheidet zwischen Privatgesprächen und Gruppenkonversationen

## Einschränkungen

- Stream Mode erfordert eine stabile ausgehende WebSocket-Verbindung zu DingTalk-Servern
- Antworten verwenden pro-Nachricht-Sitzungs-Webhooks, die ablaufen können, wenn sie nicht zeitnah verwendet werden
- Bot muss von einem Admin zum Gruppenchat hinzugefügt werden, bevor er Gruppennachrichten empfangen kann
- DingTalk-APIs sind hauptsächlich auf Chinesisch dokumentiert; internationale Unterstützung ist begrenzt
- Enterprise-Admin-Genehmigung kann für die Bereitstellung interner Anwendungen erforderlich sein

## Fehlerbehebung

### Bot verbindet sich nicht mit DingTalk
- Überprüfen Sie, ob `client_id` und `client_secret` korrekt sind
- Stellen Sie sicher, dass "Stream Mode" in der DingTalk-Entwicklerkonsole unter Bot-Einstellungen aktiviert ist
- Prüfen Sie, ob ausgehende Verbindungen zu DingTalk-Servern nicht durch eine Firewall blockiert werden

### Nachrichten werden empfangen, aber Antworten schlagen fehl
- Sitzungs-Webhooks sind pro Nachricht und können ablaufen; stellen Sie sicher, dass Antworten zeitnah gesendet werden
- Prüfen Sie, ob der Bot die notwendigen API-Berechtigungen in der Entwicklerkonsole hat

### Gruppennachrichten werden nicht empfangen
- Der Bot muss explizit von einem Admin zur Gruppe hinzugefügt werden
- Überprüfen Sie, ob die Mitarbeiter-ID des Absenders in `allowed_users` enthalten ist, oder setzen Sie `allowed_users = ["*"]`
