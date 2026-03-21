---
title: IRC
description: PRX über TLS mit IRC verbinden
---

# IRC

> PRX über TLS mit Internet Relay Chat (IRC)-Servern verbinden -- mit Unterstützung für Kanäle, DMs und mehrere Authentifizierungsmethoden.

## Voraussetzungen

- Ein IRC-Server zum Verbinden (z.B. Libera.Chat, OFTC oder ein privater Server)
- Ein Spitzname für den Bot
- TLS-aktivierter IRC-Server (Port 6697 ist der Standard)

## Schnelleinrichtung

### 1. Server wählen und Spitznamen registrieren (optional)

Für öffentliche Netzwerke wie Libera.Chat möchten Sie möglicherweise den Spitznamen Ihres Bots bei NickServ registrieren:

```
/msg NickServ REGISTER <password> <email>
```

### 2. Konfigurieren

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel"]
allowed_users = ["mynick", "*"]
```

Mit NickServ-Authentifizierung:

```toml
[channels_config.irc]
server = "irc.libera.chat"
port = 6697
nickname = "prx-bot"
channels = ["#my-channel", "#another-channel"]
allowed_users = ["*"]
nickserv_password = "your-nickserv-password"
```

### 3. Überprüfen

```bash
prx channel doctor irc
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `server` | `String` | *erforderlich* | IRC-Server-Hostname (z.B. `"irc.libera.chat"`) |
| `port` | `u16` | `6697` | IRC-Server-Port (6697 für TLS) |
| `nickname` | `String` | *erforderlich* | Bot-Spitzname im IRC-Netzwerk |
| `username` | `String` | *Spitzname* | IRC-Benutzername (Standard ist der Spitzname, wenn nicht gesetzt) |
| `channels` | `[String]` | `[]` | IRC-Kanäle, denen beim Verbinden beigetreten wird (z.B. `["#channel1", "#channel2"]`) |
| `allowed_users` | `[String]` | `[]` | Erlaubte Spitznamen (Groß-/Kleinschreibung wird ignoriert). Leer = alle ablehnen. `"*"` = alle erlauben |
| `server_password` | `String` | `null` | Server-Passwort (für Bouncer wie ZNC) |
| `nickserv_password` | `String` | `null` | NickServ IDENTIFY-Passwort für Spitznamen-Authentifizierung |
| `sasl_password` | `String` | `null` | SASL PLAIN-Passwort für IRCv3-Authentifizierung |
| `verify_tls` | `bool` | `true` | TLS-Zertifikat des Servers überprüfen |

## Funktionen

- **TLS-Verschlüsselung** -- alle Verbindungen verwenden TLS für Sicherheit
- **Mehrere Authentifizierungsmethoden** -- unterstützt Server-Passwort, NickServ IDENTIFY und SASL PLAIN (IRCv3)
- **Multi-Kanal-Unterstützung** -- gleichzeitiges Beitreten und Antworten in mehreren Kanälen
- **Kanal- und DM-Unterstützung** -- verarbeitet sowohl Kanal-PRIVMSG als auch Direktnachrichten
- **Klartextausgabe** -- Antworten werden automatisch für IRC angepasst (kein Markdown, keine Code-Blöcke)
- **Intelligente Nachrichtenaufteilung** -- lange Nachrichten werden unter Berücksichtigung der IRC-Zeilenlängenbegrenzungen aufgeteilt
- **Verbindungs-Keepalive** -- antwortet auf Server-PING-Nachrichten und erkennt tote Verbindungen (5-Minuten-Lesezeitlimit)
- **Monotone Nachrichten-IDs** -- stellt eindeutige Nachrichtenreihenfolge unter Burst-Verkehr sicher

## Einschränkungen

- IRC ist nur Klartext; Markdown, HTML und Rich-Formatierung werden nicht unterstützt
- Nachrichten unterliegen IRC-Zeilenlängenbegrenzungen (typischerweise 512 Bytes einschließlich Protokoll-Overhead)
- Keine integrierte Medien- oder Dateifreigabefähigkeit
- Verbindung kann abbrechen, wenn der Server keine Antwort auf PING innerhalb des Zeitlimits erhält
- Einige IRC-Netzwerke haben Anti-Flood-Maßnahmen, die den Bot ratenbegrenzen können
- Spitznamenwechsel und Wiederverbindung nach Netzwerk-Splits werden behandelt, können aber kurze Unterbrechungen verursachen

## Fehlerbehebung

### Verbindung zum IRC-Server nicht möglich
- Überprüfen Sie, ob `server`-Hostname und `port` korrekt sind
- Stellen Sie sicher, dass Port 6697 (TLS) nicht durch eine Firewall blockiert wird
- Bei Verwendung eines selbstsignierten Zertifikats setzen Sie `verify_tls = false`

### Bot tritt Kanälen bei, antwortet aber nicht
- Prüfen Sie, ob der Spitzname des Absenders in `allowed_users` enthalten ist (Groß-/Kleinschreibung wird ignoriert)
- Setzen Sie `allowed_users = ["*"]`, um alle Benutzer zum Testen zu erlauben
- Überprüfen Sie, ob der Bot die Berechtigung hat, im Kanal zu sprechen (nicht stummgeschaltet oder gebannt)

### NickServ-Authentifizierung schlägt fehl
- Stellen Sie sicher, dass `nickserv_password` korrekt ist
- Der Bot-Spitzname muss bei NickServ registriert sein, bevor er sich identifizieren kann
- Einige Netzwerke erfordern SASL-Authentifizierung statt NickServ; verwenden Sie in dem Fall `sasl_password`
