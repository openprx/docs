---
title: Matrix
description: PRX mit Matrix verbinden -- mit Ende-zu-Ende-Verschlüsselungsunterstützung
---

# Matrix

> PRX über die Client-Server-API mit optionaler Ende-zu-Ende-Verschlüsselung (E2EE) und raumbasiertem Messaging mit dem Matrix-Netzwerk verbinden.

## Voraussetzungen

- Ein Matrix-Homeserver (z.B. [matrix.org](https://matrix.org) oder selbstgehosteter Synapse/Dendrite)
- Ein Bot-Konto auf dem Homeserver mit einem Zugriffstoken
- Die Raum-ID, in der der Bot lauschen soll
- PRX mit dem `channel-matrix`-Feature-Flag kompiliert

## Schnelleinrichtung

### 1. Bot-Konto erstellen

Erstellen Sie ein Konto auf Ihrem Matrix-Homeserver für den Bot. Sie können Element oder die Befehlszeile verwenden:

```bash
# Mit curl gegen die Homeserver-API
curl -X POST "https://matrix.org/_matrix/client/v3/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "prx-bot", "password": "secure-password", "auth": {"type": "m.login.dummy"}}'
```

### 2. Zugriffstoken abrufen

```bash
curl -X POST "https://matrix.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  -d '{"type": "m.login.password", "user": "prx-bot", "password": "secure-password"}'
```

### 3. Bot in einen Raum einladen

Laden Sie das Bot-Konto über Ihren Matrix-Client in den Raum ein, in dem es arbeiten soll. Notieren Sie die Raum-ID (Format: `!abc123:matrix.org`).

### 4. Konfigurieren

```toml
[channels_config.matrix]
homeserver = "https://matrix.org"
access_token = "syt_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
room_id = "!abc123def456:matrix.org"
allowed_users = ["@alice:matrix.org", "@bob:matrix.org"]
```

### 5. Überprüfen

```bash
prx channel doctor matrix
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `homeserver` | `String` | *erforderlich* | Matrix-Homeserver-URL (z.B. `"https://matrix.org"`) |
| `access_token` | `String` | *erforderlich* | Matrix-Zugriffstoken für das Bot-Konto |
| `user_id` | `String` | `null` | Matrix-Benutzer-ID (z.B. `"@bot:matrix.org"`). Wird für Sitzungswiederherstellung verwendet |
| `device_id` | `String` | `null` | Matrix-Geräte-ID. Wird für E2EE-Sitzungskontinuität verwendet |
| `room_id` | `String` | *erforderlich* | Raum-ID zum Lauschen (z.B. `"!abc123:matrix.org"`) |
| `allowed_users` | `[String]` | `[]` | Erlaubte Matrix-Benutzer-IDs. Leer = alle ablehnen. `"*"` = alle erlauben |

## Funktionen

- **Ende-zu-Ende-Verschlüsselung** -- unterstützt verschlüsselte Räume mit matrix-sdk und Vodozemac
- **Raumbasiertes Messaging** -- lauscht und antwortet in einem bestimmten Matrix-Raum
- **Nachrichtenreaktionen** -- reagiert auf Nachrichten zur Empfangs- und Abschlussbestätigung
- **Lesebestätigungen** -- sendet Lesebestätigungen für verarbeitete Nachrichten
- **Sitzungspersistenz** -- speichert Kryptositzungen lokal für E2EE-Kontinuität über Neustarts
- **Homeserver-unabhängig** -- funktioniert mit jedem Matrix-Homeserver (Synapse, Dendrite, Conduit usw.)

## Einschränkungen

- Lauscht derzeit in einem einzelnen Raum (über `room_id` gesetzt)
- Erfordert das `channel-matrix`-Feature-Flag zur Kompilierzeit
- E2EE-Schlüsselbackup und Cross-Signing-Verifizierung werden noch nicht unterstützt
- Große Räume mit hohem Nachrichtenaufkommen können den Ressourcenverbrauch erhöhen
- Der Bot muss in den Raum eingeladen werden, bevor er lauschen kann

## Fehlerbehebung

### Bot antwortet nicht in verschlüsselten Räumen
- Stellen Sie sicher, dass `user_id` und `device_id` für korrektes E2EE-Sitzungsmanagement gesetzt sind
- Löschen Sie den lokalen Kryptospeicher und starten Sie neu, um Verschlüsselungssitzungen neu aufzubauen
- Überprüfen Sie, ob das Bot-Konto von Raummitgliedern verifiziert/vertraut wurde

### "Room not found"-Fehler
- Bestätigen Sie das Raum-ID-Format (`!`-Präfix, `:homeserver`-Suffix)
- Stellen Sie sicher, dass der Bot eingeladen wurde und dem Raum beigetreten ist
- Raum-Aliase (z.B. `#room:matrix.org`) werden nicht unterstützt; verwenden Sie die Raum-ID

### Zugriffstoken abgelehnt
- Zugriffstoken können ablaufen; generieren Sie ein neues über die Login-API
- Stellen Sie sicher, dass das Token zum richtigen Homeserver gehört
