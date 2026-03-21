---
title: iMessage
description: PRX unter macOS mit iMessage verbinden
---

# iMessage

> PRX über die macOS Messages-Datenbank und AppleScript-Brücke für native iMessage-Integration mit iMessage verbinden.

## Voraussetzungen

- **Nur macOS** -- iMessage-Integration erfordert macOS (Monterey 12.0 oder neuer empfohlen)
- Ein aktives iMessage-Konto, das in der Messages-App angemeldet ist
- Vollständiger Festplattenzugriff für den PRX-Prozess erteilt (zum Lesen der Messages-Datenbank)

## Schnelleinrichtung

### 1. Vollständigen Festplattenzugriff erteilen

1. Öffnen Sie **Systemeinstellungen > Datenschutz & Sicherheit > Voller Festplattenzugriff**
2. Fügen Sie die Terminal-Anwendung oder PRX-Binärdatei zur Liste hinzu
3. Starten Sie das Terminal oder den PRX-Prozess neu

### 2. Konfigurieren

```toml
[channels_config.imessage]
allowed_contacts = ["+1234567890", "user@icloud.com"]
```

### 3. Überprüfen

```bash
prx channel doctor imessage
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `allowed_contacts` | `[String]` | *erforderlich* | Erlaubte iMessage-Kontakte: Telefonnummern (E.164) oder E-Mail-Adressen. Leer = alle ablehnen |

## Funktionen

- **Native macOS-Integration** -- liest direkt aus der Messages SQLite-Datenbank
- **AppleScript-Brücke** -- sendet Antworten über `osascript` für zuverlässige Nachrichtenzustellung
- **Telefon- und E-Mail-Kontakte** -- Filterung nach Telefonnummern oder Apple-ID-E-Mail-Adressen
- **Moderne macOS-Unterstützung** -- verarbeitet das `attributedBody` Typedstream-Format von macOS Ventura und neuer
- **Polling-basiert** -- prüft regelmäßig die Messages-Datenbank auf neue Nachrichten

## Einschränkungen

- **Nur macOS** -- nicht verfügbar unter Linux oder Windows
- Erfordert vollständigen Festplattenzugriff zum Lesen von `~/Library/Messages/chat.db`
- Die Messages-App muss laufen (oder zumindest angemeldet sein)
- Kann keine Konversationen mit neuen Kontakten initiieren; der Kontakt muss eine bestehende Konversation haben
- Gruppen-iMessage-Chats werden derzeit nicht unterstützt
- Polling-Intervall verursacht leichte Latenz im Vergleich zu Push-basierten Kanälen
- AppleScript-basiertes Senden funktioniert möglicherweise nicht in kopflosen (nur SSH) macOS-Umgebungen

## Fehlerbehebung

### "Permission denied" beim Lesen der Messages-Datenbank
- Stellen Sie sicher, dass dem PRX-Prozess oder dem übergeordneten Terminal vollständiger Festplattenzugriff gewährt wurde
- Unter macOS Ventura+ überprüfen Sie unter **Systemeinstellungen > Datenschutz & Sicherheit > Voller Festplattenzugriff**
- Starten Sie das Terminal nach Erteilung der Berechtigungen neu

### Nachrichten werden nicht erkannt
- Überprüfen Sie, ob die Messages-App mit Ihrer Apple-ID angemeldet ist
- Prüfen Sie, ob der Kontakt in `allowed_contacts` enthalten ist (Telefonnummer im E.164-Format oder E-Mail)
- Neue Nachrichten benötigen möglicherweise einen Polling-Zyklus zur Erkennung

### Antworten werden nicht gesendet
- Stellen Sie sicher, dass die Messages-App läuft (nicht nur angemeldet)
- AppleScript-Versand erfordert GUI-Zugriff; Nur-SSH-Sitzungen können fehlschlagen
- Prüfen Sie die macOS Console.app auf AppleScript-Fehler
