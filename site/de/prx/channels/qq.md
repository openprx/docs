---
title: QQ
description: PRX über die Bot-API mit QQ-Instant-Messaging verbinden
---

# QQ

> PRX über die offizielle Bot-API mit Unterstützung für Privatnachrichten, Gruppenchats, Gilden und Medienanhänge mit QQ verbinden.

## Voraussetzungen

- Ein QQ-Konto (privat oder geschäftlich)
- Eine Bot-Anwendung, registriert auf der [QQ Open Platform](https://q.qq.com/)
- Eine App-ID und ein App Secret von der Entwicklerkonsole
- Der Bot muss genehmigt und veröffentlicht sein (Sandbox-Modus zum Testen verfügbar)

## Schnelleinrichtung

### 1. QQ-Bot erstellen

1. Gehen Sie zur [QQ Open Platform](https://q.qq.com/) und melden Sie sich mit Ihrem QQ-Konto an
2. Navigieren Sie zu "Applications" und erstellen Sie eine neue Bot-Anwendung
3. Geben Sie Bot-Name, Beschreibung und Avatar ein
4. Unter "Development Settings" kopieren Sie die **App ID** und das **App Secret**
5. Konfigurieren Sie die Intents des Bots (Nachrichtentypen, die der Bot empfangen soll)
6. Zum Testen aktivieren Sie den Sandbox-Modus, der den Bot auf eine bestimmte Test-Gilde beschränkt

### 2. Konfigurieren

Fügen Sie Folgendes zu Ihrer PRX-Konfigurationsdatei hinzu:

```toml
[channels_config.qq]
app_id = "102012345"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["user_openid_1", "user_openid_2"]
sandbox = true
```

Setzen Sie `sandbox = false`, sobald der Bot für den Produktionseinsatz genehmigt wurde.

### 3. Überprüfen

```bash
prx channel doctor qq
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `app_id` | `String` | *erforderlich* | Anwendungs-ID von der QQ Open Platform Entwicklerkonsole |
| `app_secret` | `String` | *erforderlich* | Anwendungsgeheimnis von der Entwicklerkonsole |
| `allowed_users` | `[String]` | `[]` | Erlaubte Benutzer-OpenIDs. Leer = Pairing-Modus. `"*"` = alle erlauben |
| `sandbox` | `bool` | `false` | Bei true Verbindung zum Sandbox-Gateway zum Testen |
| `intents` | `[String]` | `["guilds", "guild_messages", "direct_messages"]` | Ereignis-Intents zum Abonnieren |
| `stream_mode` | `String` | `"none"` | Streaming-Modus: `"none"` oder `"typing"`. Tipp-Modus sendet einen Tipp-Indikator während der Generierung |
| `interrupt_on_new_message` | `bool` | `false` | Bei true bricht eine neue Nachricht desselben Absenders die laufende Anfrage ab |
| `mention_only` | `bool` | `false` | Bei true nur auf @-Erwähnungen in Gruppen- oder Gildenkanälen antworten. DMs werden immer verarbeitet |
| `ack_reactions` | `bool` | *geerbt* | Überschreibung für die globale `ack_reactions`-Einstellung. Fällt auf `[channels_config].ack_reactions` zurück, wenn nicht gesetzt |

## Funktionsweise

PRX verbindet sich mit der QQ Bot-API über einen WebSocket-basierten Ereignisstrom. Der Verbindungslebenszyklus ist:

1. **Authentifizierung** -- PRX erhält ein Zugriffstoken über die App-ID und das App Secret via OAuth2 Client Credentials
2. **Gateway-Erkennung** -- der Bot fordert die WebSocket-Gateway-URL von der QQ-API an
3. **Sitzungsaufbau** -- eine WebSocket-Verbindung wird zum Gateway mit dem Zugriffstoken geöffnet
4. **Intent-Abonnement** -- der Bot deklariert, welche Ereignistypen er empfangen möchte
5. **Ereignisschleife** -- eingehende Nachrichten werden an die PRX-Agent-Schleife weitergeleitet; Antworten werden über die REST-API gesendet

```
QQ Gateway (WSS) ──► PRX Channel Handler ──► Agent Loop
                                                │
QQ REST API ◄───── Reply with message ◄────────┘
```

## Funktionen

- **Gilden- und Gruppen-Messaging** -- antwortet auf Nachrichten in QQ-Gilden (Kanälen) und Gruppenchats
- **Direktnachrichten** -- verarbeitet 1:1-Privatkonversationen mit Benutzern
- **Pairing-Modus** -- sichere einmalige Codebindung, wenn keine erlaubten Benutzer konfiguriert sind
- **Medienanhänge** -- unterstützt Senden und Empfangen von Bildern, Dateien und Rich-Media-Karten
- **Markdown-Antworten** -- QQ-Bots unterstützen eine Teilmenge der Markdown-Formatierung in Antworten
- **Bestätigungsreaktionen** -- reagiert auf eingehende Nachrichten zur Empfangsbestätigung, wenn aktiviert
- **Sandbox-Modus** -- Bot in einer isolierten Gildenumgebung testen, bevor er in die Produktion geht
- **Automatische Token-Erneuerung** -- Zugriffstoken werden automatisch vor Ablauf erneuert
- **Plattformübergreifend** -- funktioniert auf QQ Desktop, Mobil und QQ für Linux

## Nachrichtentypen

Die QQ Bot-API unterstützt mehrere Nachrichteninhaltstypen:

| Typ | Richtung | Beschreibung |
|-----|----------|-------------|
| Text | Senden / Empfangen | Klartextnachrichten, bis zu 2.048 Zeichen |
| Markdown | Senden | Formatierter Text mit QQs Markdown-Teilmenge |
| Bild | Senden / Empfangen | Bildanhänge (JPEG, PNG, GIF) |
| Datei | Empfangen | Dateianhänge von Benutzern |
| Rich Embed | Senden | Strukturierte Kartennachrichten mit Titel, Beschreibung und Vorschaubild |
| Ark-Vorlage | Senden | Vorlagenbasierte Rich-Nachrichten mit QQs Ark-System |

## Intents

Intents steuern, welche Ereignisse der Bot empfängt. Verfügbare Intents:

| Intent | Ereignisse | Hinweise |
|--------|-----------|---------|
| `guilds` | Gilde erstellen, aktualisieren, löschen | Gilden-Metadatenänderungen |
| `guild_members` | Mitglied hinzufügen, aktualisieren, entfernen | Erfordert erhöhte Berechtigungen |
| `guild_messages` | Nachrichten in Gilden-Textkanälen | Häufigster Intent |
| `guild_message_reactions` | Reaktion hinzufügen/entfernen in Gilden | Emoji-Reaktionen |
| `direct_messages` | Private DMs mit dem Bot | Immer empfohlen |
| `group_and_c2c` | Gruppenchats und C2C-Nachrichten | Erfordert separate Genehmigung |
| `interaction` | Button-Klicks und Interaktionen | Für interaktive Nachrichtenkomponenten |

## Einschränkungen

- Die QQ Bot-API ist regionsbeschränkt; Bots sind hauptsächlich in Festlandchina verfügbar
- Sandbox-Modus beschränkt den Bot auf eine einzelne Test-Gilde mit einer kleinen Anzahl von Mitgliedern
- Produktions-Bots erfordern eine Genehmigung vom QQ Open Platform Review-Team
- Gruppenchat und C2C-Messaging erfordern einen separaten Berechtigungsantrag
- Datei-Uploads sind auf 20 MB pro Anhang begrenzt
- Nachrichteninhaltsmoderation wird von QQ erzwungen; Nachrichten mit verbotenem Inhalt werden stillschweigend verworfen
- Ratenbegrenzungen gelten: ca. 5 Nachrichten pro Sekunde pro Gilde, 2 pro Sekunde für DMs
- Der Bot kann keine Konversationen initiieren; Benutzer oder Admins müssen den Bot zuerst hinzufügen

## Fehlerbehebung

### Bot verbindet sich nicht mit dem QQ-Gateway

- Überprüfen Sie `app_id` und `app_secret` mit `prx channel doctor qq`
- Im Sandbox-Modus stellen Sie sicher, dass `sandbox = true` gesetzt ist (Sandbox und Produktion verwenden verschiedene Gateways)
- Prüfen Sie, ob ausgehende Verbindungen zu `api.sgroup.qq.com` und dem WebSocket-Gateway nicht blockiert sind

### Bot verbindet sich, empfängt aber keine Nachrichten

- Überprüfen Sie, ob die richtigen `intents` für Ihren Anwendungsfall konfiguriert sind
- In Gildenkanälen muss dem Bot möglicherweise die Berechtigung "Nachrichten empfangen" von einem Gilden-Admin erteilt werden
- Prüfen Sie, ob die OpenID des sendenden Benutzers in `allowed_users` enthalten ist, oder setzen Sie `allowed_users = ["*"]`

### Antworten werden nicht zugestellt

- QQ erzwingt Inhaltsmoderation; prüfen Sie die PRX-Logs auf Ablehnungsantworten von der API
- Stellen Sie sicher, dass der Bot die Berechtigung "Nachrichten senden" in der Ziel-Gilde oder -Gruppe hat
- Für DM-Antworten muss der Benutzer dem Bot zuerst geschrieben haben, um die Konversation zu öffnen

### Token-Erneuerungsfehler

- Das App Secret wurde möglicherweise in der Entwicklerkonsole rotiert; aktualisieren Sie die Konfiguration mit dem neuen Secret
- Netzwerkprobleme können die Token-Erneuerung verhindern; prüfen Sie die Konnektivität zu `bots.qq.com`

## Verwandte Seiten

- [Kanalübersicht](./)
- [DingTalk](./dingtalk) -- ähnliches Setup für die DingTalk-Plattform
- [Lark](./lark) -- ähnliches Setup für Lark / Feishu
- [Sicherheit: Pairing](../security/pairing) -- Details zum einmaligen Bindungscode-Pairing
