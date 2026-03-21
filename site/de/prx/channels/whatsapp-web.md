---
title: WhatsApp Web
description: PRX über den nativen Web-Client (wa-rs) mit WhatsApp verbinden
---

# WhatsApp Web

> PRX über einen nativen Rust Web-Client (wa-rs) mit Ende-zu-Ende-Verschlüsselung, QR-Code- oder Paarcode-Verknüpfung und voller Medienunterstützung mit WhatsApp verbinden.

## Voraussetzungen

- Ein WhatsApp-Konto mit einer aktiven Telefonnummer
- PRX mit dem `whatsapp-web`-Feature-Flag kompiliert
- Kein Meta-Business-API-Konto erforderlich

## Schnelleinrichtung

### 1. Feature-Flag aktivieren

PRX mit WhatsApp-Web-Unterstützung kompilieren:

```bash
cargo build --release --features whatsapp-web
```

### 2. Konfigurieren

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
allowed_numbers = ["+1234567890", "*"]
```

Für Paarcode-Verknüpfung (statt QR-Code):

```toml
[channels_config.whatsapp]
session_path = "~/.config/openprx/whatsapp-session.db"
pair_phone = "15551234567"
allowed_numbers = ["*"]
```

### 3. Konto verknüpfen

Starten Sie PRX. Beim ersten Start wird entweder angezeigt:
- Ein **QR-Code** im Terminal zum Scannen mit Ihrer WhatsApp-Mobil-App, oder
- Ein **Paarcode**, wenn `pair_phone` gesetzt ist (Code in WhatsApp > Verknüpfte Geräte eingeben)

### 4. Überprüfen

```bash
prx channel doctor whatsapp
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `session_path` | `String` | *erforderlich* | Pfad zur Sitzungs-SQLite-Datenbank. Vorhandensein dieses Feldes wählt den Web-Modus |
| `pair_phone` | `String` | `null` | Telefonnummer für Paarcode-Verknüpfung (Format: Ländervorwahl + Nummer, z.B. `"15551234567"`). Wenn nicht gesetzt, wird QR-Code-Kopplung verwendet |
| `pair_code` | `String` | `null` | Benutzerdefinierter Paarcode für die Verknüpfung. Leer lassen, damit WhatsApp einen generiert |
| `allowed_numbers` | `[String]` | `[]` | Erlaubte Telefonnummern im E.164-Format (z.B. `"+1234567890"`). `"*"` = alle erlauben |

## Funktionen

- **Keine Meta-Business-API erforderlich** -- verbindet sich direkt als verknüpftes Gerät über das WhatsApp-Web-Protokoll
- **Ende-zu-Ende-Verschlüsselung** -- Nachrichten werden über das Signal-Protokoll verschlüsselt, wie bei den offiziellen WhatsApp-Clients
- **QR-Code- und Paarcode-Verknüpfung** -- zwei Wege zur Verknüpfung Ihres WhatsApp-Kontos
- **Persistente Sitzungen** -- Sitzungszustand in einer lokalen SQLite-Datenbank gespeichert, überlebt Neustarts
- **Gruppen und DMs** -- unterstützt sowohl Privatgespräche als auch Gruppenkonversationen
- **Mediennachrichten** -- verarbeitet Bilder, Dokumente und andere Medientypen
- **Sprachnachrichten-Unterstützung** -- transkribiert eingehende Sprachnachrichten (wenn STT konfiguriert) und antwortet optional mit Sprachnachrichten (wenn TTS konfiguriert)
- **Präsenz und Reaktionen** -- unterstützt Tipp-Indikatoren und Nachrichtenreaktionen

## Einschränkungen

- Erfordert das `whatsapp-web`-Feature-Flag zur Kompilierzeit
- Nur eine verknüpfte Gerätesitzung pro Telefonnummer unterstützt (WhatsApp-Beschränkung)
- Sitzung kann ablaufen, wenn sie längere Zeit nicht verwendet wird; Neuverknüpfung erforderlich
- Nur macOS, Linux und Windows WSL2 (wie PRX selbst)
- WhatsApp kann gelegentlich eine erneute Authentifizierung erfordern

## Fehlerbehebung

### QR-Code erscheint nicht
- Stellen Sie sicher, dass `session_path` gesetzt ist und das Verzeichnis beschreibbar ist
- Prüfen Sie, ob PRX mit `--features whatsapp-web` kompiliert wurde
- Löschen Sie die Sitzungsdatenbank und starten Sie neu, um eine neue Kopplung zu erzwingen

### Sitzung abgelaufen oder getrennt
- Löschen Sie die Sitzungsdatenbank am konfigurierten `session_path`
- Starten Sie PRX neu, um einen neuen QR-Code- oder Paarcode-Flow auszulösen

### Sprachnachrichten werden nicht transkribiert
- Konfigurieren Sie den `[transcription]`-Abschnitt in Ihrer PRX-Konfiguration, um STT zu aktivieren
- Unterstützte STT-Backends: OpenAI Whisper, Deepgram, AssemblyAI, Google STT

::: tip Cloud-API-Modus
Wenn Sie ein Meta-Business-Konto haben und Webhook-basiertes Messaging bevorzugen, siehe [WhatsApp (Cloud-API)](./whatsapp).
:::
