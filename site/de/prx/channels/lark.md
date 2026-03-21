---
title: Lark / Feishu
description: PRX mit Lark (international) oder Feishu (China) IM verbinden
---

# Lark / Feishu

> PRX über die Open Platform API mit WebSocket-Langzeitverbindung oder HTTP-Webhook-Ereigniszustellung mit Lark (international) oder Feishu (China-Festland) verbinden.

## Voraussetzungen

- Ein Lark- oder Feishu-Mandant (Organisation)
- Eine App erstellt in der [Lark Developer Console](https://open.larksuite.com/app) oder [Feishu Developer Console](https://open.feishu.cn/app)
- App-ID, App Secret und Verifizierungstoken von der Entwicklerkonsole

## Schnelleinrichtung

### 1. Bot-App erstellen

1. Gehen Sie zur Entwicklerkonsole und erstellen Sie eine neue Custom App
2. Unter "Credentials" kopieren Sie die **App ID** und das **App Secret**
3. Unter "Event Subscriptions" kopieren Sie den **Verification Token**
4. Fügen Sie die Bot-Fähigkeit hinzu und konfigurieren Sie Berechtigungen:
   - `im:message`, `im:message.group_at_msg`, `im:message.p2p_msg`

### 2. Konfigurieren

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
allowed_users = ["ou_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"]
```

Für Feishu (China):

```toml
[channels_config.lark]
app_id = "cli_xxxxxxxxxxxxxxxx"
app_secret = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
verification_token = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
use_feishu = true
allowed_users = ["*"]
```

### 3. Überprüfen

```bash
prx channel doctor lark
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `app_id` | `String` | *erforderlich* | App-ID von der Lark/Feishu-Entwicklerkonsole |
| `app_secret` | `String` | *erforderlich* | App Secret von der Entwicklerkonsole |
| `verification_token` | `String` | `null` | Verifizierungstoken für Webhook-Validierung |
| `encrypt_key` | `String` | `null` | Verschlüsselungsschlüssel für Webhook-Nachrichtenentschlüsselung |
| `allowed_users` | `[String]` | `[]` | Erlaubte Benutzer-IDs oder Union-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |
| `mention_only` | `bool` | `false` | Bei true nur auf @-Erwähnungen in Gruppen antworten. DMs werden immer verarbeitet |
| `use_feishu` | `bool` | `false` | Bei true Feishu (CN) API-Endpunkte statt Lark (international) verwenden |
| `receive_mode` | `String` | `"websocket"` | Ereignisempfangsmodus: `"websocket"` (Standard, keine öffentliche URL nötig) oder `"webhook"` |
| `port` | `u16` | `null` | HTTP-Port nur für Webhook-Modus. Erforderlich wenn `receive_mode = "webhook"`, für WebSocket ignoriert |

## Funktionen

- **WebSocket-Langzeitverbindung** -- persistente WSS-Verbindung für Echtzeit-Ereignisse ohne öffentliche URL (Standardmodus)
- **HTTP-Webhook-Modus** -- alternative Ereigniszustellung über HTTP-Callbacks für Umgebungen, die dies erfordern
- **Lark- und Feishu-Unterstützung** -- wechselt automatisch API-Endpunkte zwischen Lark (international) und Feishu (China)
- **Bestätigungsreaktionen** -- reagiert auf eingehende Nachrichten mit sprachspezifischen Reaktionen (zh-CN, zh-TW, en, ja)
- **DM- und Gruppen-Messaging** -- verarbeitet sowohl Privatgespräche als auch Gruppenkonversationen
- **Mandanten-Zugriffstoken-Verwaltung** -- holt und erneuert automatisch Mandanten-Zugriffstoken
- **Nachrichtendeduplizierung** -- verhindert doppeltes Dispatching von WebSocket-Nachrichten innerhalb eines 30-Minuten-Fensters

## Einschränkungen

- WebSocket-Modus erfordert eine stabile ausgehende Verbindung zu Lark/Feishu-Servern
- Webhook-Modus erfordert einen öffentlich erreichbaren HTTPS-Endpunkt
- Der Bot muss einer Gruppe hinzugefügt werden, bevor er Gruppennachrichten empfangen kann
- Feishu und Lark verwenden verschiedene API-Domains; stellen Sie sicher, dass `use_feishu` Ihrer Mandantenregion entspricht
- Enterprise-App-Genehmigung kann je nach Admin-Richtlinien Ihres Mandanten erforderlich sein

## Fehlerbehebung

### Bot empfängt keine Nachrichten
- Im WebSocket-Modus prüfen Sie, ob ausgehende Verbindungen zu `open.larksuite.com` (oder `open.feishu.cn`) erlaubt sind
- Überprüfen Sie, ob die App die erforderlichen `im:message`-Berechtigungen hat und genehmigt/veröffentlicht wurde
- Stellen Sie sicher, dass der Bot der Gruppe hinzugefügt wurde oder der Benutzer einen DM mit ihm begonnen hat

### "Verification failed" bei Webhook-Ereignissen
- Prüfen Sie, ob `verification_token` mit dem Wert in der Entwicklerkonsole übereinstimmt
- Bei Verwendung von `encrypt_key` stellen Sie sicher, dass er genau der Konsoleneinstellung entspricht

### Falsche API-Region
- Wenn Sie einen Feishu (China) Mandanten verwenden, setzen Sie `use_feishu = true`
- Wenn Sie einen Lark (international) Mandanten verwenden, stellen Sie sicher, dass `use_feishu = false` (der Standard) ist
