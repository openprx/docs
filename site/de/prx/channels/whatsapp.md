---
title: WhatsApp (Cloud-API)
description: PRX über die Business Cloud-API mit WhatsApp verbinden
---

# WhatsApp (Cloud-API)

> PRX über die Meta Business Cloud-API für Webhook-basiertes Messaging mit der WhatsApp-Business-Plattform verbinden.

## Voraussetzungen

- Ein [Meta-Business-Konto](https://business.facebook.com/)
- Eine WhatsApp Business API-Anwendung im [Meta Developer Portal](https://developers.facebook.com/)
- Eine Telefonnummer-ID und ein Zugriffstoken von der WhatsApp Business API
- Ein öffentlich erreichbarer HTTPS-Endpunkt für Webhooks

## Schnelleinrichtung

### 1. WhatsApp Business API einrichten

1. Gehen Sie zum [Meta Developer Portal](https://developers.facebook.com/) und erstellen Sie eine App
2. Fügen Sie das "WhatsApp"-Produkt zu Ihrer App hinzu
3. Unter "WhatsApp > API Setup" notieren Sie Ihre **Phone Number ID** und generieren Sie ein **Permanent Access Token**

### 2. PRX konfigurieren

```toml
[channels_config.whatsapp]
access_token = "EAAxxxxxxxxxxxxxxxxxxxxxxxx"
phone_number_id = "123456789012345"
verify_token = "my-secret-verify-token"
allowed_numbers = ["+1234567890"]
```

### 3. Webhooks einrichten

1. Im Meta Developer Portal gehen Sie zu "WhatsApp > Configuration"
2. Setzen Sie die Webhook-URL auf `https://your-domain.com/whatsapp`
3. Geben Sie denselben `verify_token` ein, den Sie in PRX konfiguriert haben
4. Abonnieren Sie das `messages`-Webhook-Feld

### 4. Überprüfen

```bash
prx channel doctor whatsapp
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `access_token` | `String` | *erforderlich* | Permanentes Zugriffstoken von der Meta Business API |
| `phone_number_id` | `String` | *erforderlich* | Telefonnummer-ID von der Meta Business API. Vorhandensein dieses Feldes wählt den Cloud-API-Modus |
| `verify_token` | `String` | *erforderlich* | Gemeinsames Geheimnis für die Webhook-Verifizierungshandshake |
| `app_secret` | `String` | `null` | App-Secret für Webhook-Signaturverifizierung (HMAC-SHA256). Kann auch über `ZEROCLAW_WHATSAPP_APP_SECRET` Umgebungsvariable gesetzt werden |
| `allowed_numbers` | `[String]` | `[]` | Erlaubte Telefonnummern im E.164-Format (z.B. `"+1234567890"`). `"*"` = alle erlauben |

## Funktionen

- **Webhook-basiertes Messaging** -- empfängt Nachrichten über Meta-Webhook-Push-Benachrichtigungen
- **E.164-Telefonnummernfilterung** -- Zugriff auf bestimmte Telefonnummern beschränken
- **HTTPS-Erzwingung** -- verweigert die Datenübertragung über Nicht-HTTPS-URLs
- **Webhook-Signaturverifizierung** -- optionale HMAC-SHA256-Validierung mit `app_secret`
- **Text- und Mediennachrichten** -- verarbeitet eingehenden Text, Bilder und andere Medientypen

## Einschränkungen

- Erfordert einen öffentlich erreichbaren HTTPS-Endpunkt für die Webhook-Zustellung
- Metas Cloud-API hat Ratenbegrenzungen basierend auf Ihrer Geschäftsstufe
- 24-Stunden-Nachrichtenfenster: Sie können nur innerhalb von 24 Stunden nach der letzten Nachricht des Benutzers antworten (es sei denn, Sie verwenden Nachrichtenvorlagen)
- Telefonnummern müssen im E.164-Format für die Allowlist sein

## Fehlerbehebung

### Webhook-Verifizierung schlägt fehl
- Stellen Sie sicher, dass `verify_token` in der PRX-Konfiguration genau dem entspricht, was Sie im Meta Developer Portal eingegeben haben
- Der Webhook-Endpunkt muss auf GET-Anfragen mit dem `hub.challenge`-Parameter antworten

### Nachrichten werden nicht empfangen
- Prüfen Sie, ob das Webhook-Abonnement das `messages`-Feld enthält
- Überprüfen Sie, ob die Webhook-URL öffentlich über HTTPS erreichbar ist
- Prüfen Sie die Webhook-Zustellungsprotokolle im Meta Developer Portal

### "Refusing to transmit over non-HTTPS"-Fehler
- Alle WhatsApp-Cloud-API-Kommunikation erfordert HTTPS
- Stellen Sie sicher, dass Ihr PRX-Gateway hinter einem TLS-terminierenden Proxy liegt (z.B. Caddy, Nginx mit SSL)

::: tip WhatsApp Web-Modus
Für einen nativen WhatsApp-Web-Client, der kein Meta-Business-API-Setup erfordert, siehe [WhatsApp Web](./whatsapp-web).
:::
