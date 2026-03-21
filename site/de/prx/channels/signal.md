---
title: Signal
description: PRX über signal-cli mit Signal verbinden
---

# Signal

> PRX über die JSON-RPC- und SSE-API des signal-cli-Daemons für verschlüsseltes Messaging in DMs und Gruppen mit Signal verbinden.

## Voraussetzungen

- Eine bei Signal registrierte Telefonnummer
- [signal-cli](https://github.com/AsamK/signal-cli) installiert und registriert
- signal-cli im Daemon-Modus mit aktivierter HTTP-API laufend

## Schnelleinrichtung

### 1. signal-cli installieren und registrieren

```bash
# signal-cli installieren (siehe https://github.com/AsamK/signal-cli für die neueste Version)
# Telefonnummer registrieren
signal-cli -u +1234567890 register
signal-cli -u +1234567890 verify <verification-code>
```

### 2. signal-cli-Daemon starten

```bash
signal-cli -u +1234567890 daemon --http localhost:8686
```

### 3. Konfigurieren

```toml
[channels_config.signal]
http_url = "http://127.0.0.1:8686"
account = "+1234567890"
allowed_from = ["+1987654321", "*"]
```

### 4. Überprüfen

```bash
prx channel doctor signal
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `http_url` | `String` | *erforderlich* | Basis-URL für den signal-cli-HTTP-Daemon (z.B. `"http://127.0.0.1:8686"`) |
| `account` | `String` | *erforderlich* | E.164-Telefonnummer des signal-cli-Kontos (z.B. `"+1234567890"`) |
| `group_id` | `String` | `null` | Nachrichten nach Gruppe filtern. `null` = alle akzeptieren (DMs und Gruppen). `"dm"` = nur DMs akzeptieren. Bestimmte Gruppen-ID = nur diese Gruppe |
| `allowed_from` | `[String]` | `[]` | Erlaubte Absender-Telefonnummern im E.164-Format. `"*"` = alle erlauben |
| `ignore_attachments` | `bool` | `false` | Nachrichten überspringen, die nur Anhänge sind (kein Textinhalt) |
| `ignore_stories` | `bool` | `false` | Eingehende Story-Nachrichten überspringen |

## Funktionen

- **Ende-zu-Ende-Verschlüsselung** -- alle Nachrichten werden über das Signal-Protokoll verschlüsselt
- **DM- und Gruppenunterstützung** -- verarbeitet sowohl Direktnachrichten als auch Gruppenkonversationen
- **SSE-Ereignisstrom** -- lauscht über Server-Sent Events unter `/api/v1/events` für Echtzeitlieferung
- **JSON-RPC-Versand** -- sendet Antworten über JSON-RPC unter `/api/v1/rpc`
- **Flexible Gruppenfilterung** -- alle Nachrichten akzeptieren, nur DMs oder eine bestimmte Gruppe
- **Anhangverarbeitung** -- optional Nachrichten, die nur Anhänge sind, verarbeiten oder überspringen

## Einschränkungen

- Erfordert, dass signal-cli als separater Daemon-Prozess läuft
- signal-cli muss mit einer gültigen Telefonnummer registriert und verifiziert sein
- Eine signal-cli-Instanz unterstützt eine Telefonnummer
- Das Senden von Gruppennachrichten erfordert, dass das signal-cli-Konto Mitglied der Gruppe ist
- signal-cli ist eine Java-Anwendung mit eigenen Ressourcenanforderungen

## Fehlerbehebung

### Verbindung zu signal-cli nicht möglich
- Überprüfen Sie, ob der signal-cli-Daemon läuft: `curl http://127.0.0.1:8686/api/v1/about`
- Prüfen Sie, ob `http_url` mit der Bindungsadresse und dem Port des Daemons übereinstimmt
- Stellen Sie sicher, dass keine Firewall-Regeln die Verbindung blockieren

### Gruppennachrichten werden ignoriert
- Prüfen Sie den `group_id`-Filter -- wenn auf `"dm"` gesetzt, werden Gruppennachrichten ausgeschlossen
- Wenn auf eine bestimmte Gruppen-ID gesetzt, werden nur Nachrichten dieser Gruppe akzeptiert
- Setzen Sie `group_id` auf `null` (oder lassen Sie es weg), um alle Nachrichten zu akzeptieren

### Nur-Anhang-Nachrichten werden übersprungen
- Dies ist das erwartete Verhalten bei `ignore_attachments = true`
- Setzen Sie `ignore_attachments = false`, um Nur-Anhang-Nachrichten zu verarbeiten
