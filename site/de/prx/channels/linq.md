---
title: LINQ
description: PRX über die Linq Partner-API mit iMessage, RCS und SMS verbinden
---

# LINQ

> PRX über die Linq Partner V3-API für Multi-Protokoll-Mobilnachrichten mit iMessage, RCS und SMS verbinden.

## Voraussetzungen

- Ein [Linq](https://linqapp.com) Partner-Konto mit API-Zugriff
- Ein Linq-API-Token
- Eine über Linq bereitgestellte Telefonnummer zum Senden von Nachrichten

## Schnelleinrichtung

### 1. API-Zugangsdaten erhalten

1. Registrieren Sie sich für ein Linq Partner-Konto unter [linqapp.com](https://linqapp.com)
2. Erhalten Sie Ihr **API Token** vom Partner-Dashboard
3. Notieren Sie die Ihrem Konto zugewiesene **Telefonnummer** zum Senden

### 2. Konfigurieren

```toml
[channels_config.linq]
api_token = "your-linq-api-token"
from_phone = "+15551234567"
allowed_senders = ["+1987654321"]
```

### 3. Webhooks einrichten

Konfigurieren Sie Linq, um Webhook-Ereignisse an den Gateway-Endpunkt von PRX zu senden:

```
POST https://your-prx-domain.com/linq
```

### 4. Überprüfen

```bash
prx channel doctor linq
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `api_token` | `String` | *erforderlich* | Linq Partner API-Token (wird als Bearer-Auth verwendet) |
| `from_phone` | `String` | *erforderlich* | Telefonnummer zum Senden (E.164-Format, z.B. `"+15551234567"`) |
| `signing_secret` | `String` | `null` | Webhook-Signierungsgeheimnis für HMAC-Signaturverifizierung |
| `allowed_senders` | `[String]` | `[]` | Erlaubte Absender-Telefonnummern im E.164-Format. `"*"` = alle erlauben |

## Funktionen

- **Multi-Protokoll-Messaging** -- Senden und Empfangen über iMessage, RCS und SMS durch eine einzige Integration
- **Webhook-basierte Zustellung** -- empfängt Nachrichten über HTTP-Webhook-Push von Linq
- **Bildunterstützung** -- verarbeitet eingehende Bildanhänge und rendert sie als Bildmarker
- **Ausgehend/Eingehend-Erkennung** -- filtert automatisch eigene ausgehende Nachrichten heraus
- **Signaturverifizierung** -- optionale HMAC-Webhook-Signaturvalidierung mit `signing_secret`
- **E.164-Telefonnummernfilterung** -- Zugriff auf bestimmte Absender-Telefonnummern beschränken

## Einschränkungen

- Erfordert einen öffentlich erreichbaren HTTPS-Endpunkt für die Webhook-Zustellung
- Linq Partner API-Zugriff erfordert ein Partner-Konto (kein Verbraucher-Konto)
- Nachrichtenzustellung hängt vom Messaging-Protokoll des Empfängers ab (iMessage, RCS oder SMS-Fallback)
- Nur Bild-MIME-Typen werden für Inline-Anhänge verarbeitet; andere Medientypen werden übersprungen
- API-Ratenbegrenzungen hängen von Ihrer Linq Partner-Stufe ab

## Fehlerbehebung

### Webhook-Ereignisse werden nicht empfangen
- Überprüfen Sie, ob die Webhook-URL öffentlich erreichbar ist und auf `https://your-domain/linq` zeigt
- Prüfen Sie das Linq Partner-Dashboard auf Webhook-Zustellungsprotokolle und Fehler
- Stellen Sie sicher, dass das PRX-Gateway läuft und auf dem richtigen Port lauscht

### Nachrichten werden gesendet, aber Antworten schlagen fehl
- Überprüfen Sie, ob das `api_token` gültig ist und nicht abgelaufen ist
- Prüfen Sie, ob `from_phone` eine gültige, bereitgestellte Telefonnummer in Ihrem Linq-Konto ist
- Prüfen Sie die Linq-API-Antwort auf Fehlerdetails

### Bot antwortet auf eigene Nachrichten
- Dies sollte nicht passieren; PRX filtert ausgehende Nachrichten automatisch über die Felder `is_from_me` und `direction`
- Wenn es auftritt, prüfen Sie, ob das Webhook-Payload-Format der erwarteten Linq V3-Struktur entspricht
