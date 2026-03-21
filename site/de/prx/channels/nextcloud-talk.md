---
title: Nextcloud Talk
description: PRX über die OCS-API mit Nextcloud Talk verbinden
---

# Nextcloud Talk

> PRX über die OCS-API und Webhook-basierte Nachrichtenzustellung für selbstgehostetes Team-Messaging mit Nextcloud Talk verbinden.

## Voraussetzungen

- Eine Nextcloud-Instanz (Version 25 oder neuer empfohlen) mit aktivierter Talk-App
- Ein Bot-App-Token für die OCS-API-Authentifizierung
- Webhook-Konfiguration für eingehende Nachrichtenzustellung

## Schnelleinrichtung

### 1. Bot-App-Token erstellen

In Nextcloud ein App-Passwort generieren:
1. Gehen Sie zu **Einstellungen > Sicherheit > Geräte & Sitzungen**
2. Erstellen Sie ein neues App-Passwort mit einem beschreibenden Namen (z.B. "PRX Bot")
3. Kopieren Sie das generierte Token

Alternativ für die Nextcloud Talk Bot-API (Nextcloud 27+):
1. Verwenden Sie `occ` zum Registrieren eines Bots: `php occ talk:bot:setup "PRX" <secret> <webhook-url>`

### 2. Konfigurieren

```toml
[channels_config.nextcloud_talk]
base_url = "https://cloud.example.com"
app_token = "xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
allowed_users = ["admin", "alice"]
```

### 3. Webhooks einrichten

Konfigurieren Sie Ihren Nextcloud-Talk-Bot, um Webhook-Ereignisse an den Gateway-Endpunkt von PRX zu senden:

```
POST https://your-prx-domain.com/nextcloud-talk
```

### 4. Überprüfen

```bash
prx channel doctor nextcloud_talk
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `base_url` | `String` | *erforderlich* | Nextcloud-Basis-URL (z.B. `"https://cloud.example.com"`) |
| `app_token` | `String` | *erforderlich* | Bot-App-Token für OCS-API-Bearer-Authentifizierung |
| `webhook_secret` | `String` | `null` | Gemeinsames Geheimnis für HMAC-SHA256-Webhook-Signaturverifizierung. Kann auch über `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET` Umgebungsvariable gesetzt werden |
| `allowed_users` | `[String]` | `[]` | Erlaubte Nextcloud-Actor-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |

## Funktionen

- **Webhook-basierte Zustellung** -- empfängt Nachrichten über HTTP-Webhook-Push von Nextcloud Talk
- **OCS-API-Antworten** -- sendet Antworten über die Nextcloud Talk OCS REST-API
- **HMAC-SHA256-Verifizierung** -- optionale Webhook-Signaturvalidierung mit `webhook_secret`
- **Mehrere Payload-Formate** -- unterstützt sowohl Legacy/benutzerdefiniertes Format als auch Activity Streams 2.0-Format (Nextcloud Talk Bot-Webhooks)
- **Selbstgehostet** -- funktioniert mit jeder Nextcloud-Instanz, alle Daten bleiben auf Ihrer Infrastruktur

## Einschränkungen

- Erfordert einen öffentlich erreichbaren HTTPS-Endpunkt für die Webhook-Zustellung (oder einen Reverse-Proxy)
- Nextcloud Talk Bot-API ist ab Nextcloud 27+ verfügbar; ältere Versionen erfordern benutzerdefiniertes Webhook-Setup
- Der Bot muss im Talk-Raum registriert sein, um Nachrichten zu empfangen
- Datei- und Medienanhang-Verarbeitung wird derzeit nicht unterstützt
- Webhook-Payloads mit Millisekunden-Zeitstempeln werden automatisch auf Sekunden normalisiert

## Fehlerbehebung

### Webhook-Ereignisse werden nicht empfangen
- Überprüfen Sie, ob die Webhook-URL öffentlich erreichbar ist und auf `https://your-domain/nextcloud-talk` zeigt
- Stellen Sie sicher, dass der Bot im Talk-Raum registriert ist
- Prüfen Sie Nextcloud-Server-Logs auf Webhook-Zustellungsfehler

### Signaturverifizierung schlägt fehl
- Stellen Sie sicher, dass `webhook_secret` mit dem bei der Bot-Registrierung verwendeten Geheimnis übereinstimmt
- Das Geheimnis kann über die Konfiguration oder die `ZEROCLAW_NEXTCLOUD_TALK_WEBHOOK_SECRET`-Umgebungsvariable gesetzt werden

### Antworten werden nicht gepostet
- Überprüfen Sie, ob `base_url` korrekt und vom PRX-Server aus erreichbar ist
- Prüfen Sie, ob das `app_token` die Berechtigung hat, Nachrichten im Raum zu posten
- Prüfen Sie die OCS-API-Antwort auf Authentifizierungs- oder Berechtigungsfehler
