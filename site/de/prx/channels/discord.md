---
title: Discord
description: PRX über eine Bot-Anwendung mit Discord verbinden
---

# Discord

> PRX über eine Bot-Anwendung mit Gateway-WebSocket für Echtzeit-Messaging in Servern und DMs mit Discord verbinden.

## Voraussetzungen

- Ein Discord-Konto
- Eine Discord-Anwendung mit einem Bot-Benutzer, erstellt im [Developer Portal](https://discord.com/developers/applications)
- Der Bot in Ihren Server mit entsprechenden Berechtigungen eingeladen

## Schnelleinrichtung

### 1. Bot-Anwendung erstellen

1. Gehen Sie zum [Discord Developer Portal](https://discord.com/developers/applications)
2. Klicken Sie auf "New Application" und vergeben Sie einen Namen
3. Navigieren Sie zum Abschnitt "Bot" und klicken Sie auf "Add Bot"
4. Kopieren Sie den Bot-Token
5. Aktivieren Sie unter "Privileged Gateway Intents" den **Message Content Intent**

### 2. Bot einladen

Generieren Sie eine Einladungs-URL unter "OAuth2 > URL Generator":
- Scopes: `bot`
- Permissions: `Send Messages`, `Read Message History`, `Add Reactions`, `Attach Files`

### 3. Konfigurieren

```toml
[channels_config.discord]
bot_token = "MTIzNDU2Nzg5.XXXXXX.XXXXXXXXXXXXXXXXXXXXXXXXXXXX"
allowed_users = ["123456789012345678"]
```

### 4. Überprüfen

```bash
prx channel doctor discord
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `bot_token` | `String` | *erforderlich* | Discord-Bot-Token vom Developer Portal |
| `guild_id` | `String` | `null` | Optionale Gilden-(Server-)ID zur Beschränkung des Bots auf einen einzelnen Server |
| `allowed_users` | `[String]` | `[]` | Discord-Benutzer-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |
| `listen_to_bots` | `bool` | `false` | Bei true Nachrichten anderer Bots verarbeiten (eigene Nachrichten werden weiterhin ignoriert) |
| `mention_only` | `bool` | `false` | Bei true nur auf Nachrichten antworten, die den Bot @-erwähnen |

## Funktionen

- **Gateway-WebSocket** -- Echtzeit-Nachrichtenzustellung über Discords Gateway-API
- **Server- und DM-Unterstützung** -- antwortet in Gildenkanälen und Direktnachrichten
- **Textanhang-Verarbeitung** -- ruft `text/*`-Anhänge automatisch ab und integriert sie inline
- **Gilden-Einschränkung** -- optional den Bot mit `guild_id` auf einen einzelnen Server beschränken
- **Bot-zu-Bot-Kommunikation** -- `listen_to_bots` für Multi-Bot-Workflows aktivieren
- **Tipp-Indikatoren** -- zeigt Tipp-Status während der Antwortgenerierung

## Einschränkungen

- Discord-Nachrichten sind auf 2.000 Zeichen begrenzt (PRX teilt längere Antworten automatisch auf)
- Nur Anhänge mit `text/*`-MIME-Typ werden abgerufen und inline eingefügt; andere Dateitypen werden übersprungen
- Der "Message Content Intent" muss aktiviert sein, damit der Bot Nachrichtentext lesen kann
- Erfordert eine stabile WebSocket-Verbindung zu Discords Gateway

## Fehlerbehebung

### Bot ist online, antwortet aber nicht
- Stellen Sie sicher, dass "Message Content Intent" im Developer Portal unter Bot-Einstellungen aktiviert ist
- Überprüfen Sie, ob die Discord-Benutzer-ID des Absenders in `allowed_users` enthalten ist
- Prüfen Sie, ob der Bot die Berechtigungen `Send Messages` und `Read Message History` im Kanal hat

### Bot funktioniert nur in einigen Kanälen
- Wenn `guild_id` gesetzt ist, antwortet der Bot nur in diesem bestimmten Server
- Überprüfen Sie, ob der Bot mit den richtigen Berechtigungen für jeden Kanal eingeladen wurde

### Nachrichten anderer Bots werden ignoriert
- Setzen Sie `listen_to_bots = true`, um Nachrichten anderer Bot-Konten zu verarbeiten
- Der Bot ignoriert immer seine eigenen Nachrichten, um Feedback-Schleifen zu verhindern
