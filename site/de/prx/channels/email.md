---
title: E-Mail
description: PRX über IMAP und SMTP mit E-Mail verbinden
---

# E-Mail

> PRX über IMAP zum Empfangen und SMTP zum Senden mit jedem E-Mail-Anbieter verbinden -- mit IDLE-Push-Unterstützung für Echtzeitlieferung.

## Voraussetzungen

- Ein E-Mail-Konto mit aktiviertem IMAP- und SMTP-Zugriff
- IMAP/SMTP-Server-Hostnamen und -Ports
- E-Mail-Zugangsdaten (Benutzername und Passwort oder anwendungsspezifisches Passwort)

## Schnelleinrichtung

### 1. IMAP-Zugriff aktivieren

Für die meisten E-Mail-Anbieter:
- **Gmail**: IMAP in Gmail-Einstellungen > Weiterleitung und POP/IMAP aktivieren, dann ein [App-Passwort](https://myaccount.google.com/apppasswords) generieren
- **Outlook**: IMAP ist standardmäßig aktiviert; verwenden Sie ein App-Passwort bei aktiver 2FA
- **Selbstgehostet**: Stellen Sie sicher, dass Ihr Mailserver IMAP aktiviert hat

### 2. Konfigurieren

```toml
[channels_config.email]
imap_host = "imap.gmail.com"
imap_port = 993
smtp_host = "smtp.gmail.com"
smtp_port = 465
username = "your-bot@gmail.com"
password = "your-app-password"
from_address = "your-bot@gmail.com"
allowed_senders = ["trusted-user@example.com"]
```

### 3. Überprüfen

```bash
prx channel doctor email
```

## Konfigurationsreferenz

| Feld | Typ | Standard | Beschreibung |
|------|-----|----------|-------------|
| `imap_host` | `String` | *erforderlich* | IMAP-Server-Hostname (z.B. `"imap.gmail.com"`) |
| `imap_port` | `u16` | `993` | IMAP-Server-Port (993 für TLS) |
| `imap_folder` | `String` | `"INBOX"` | IMAP-Ordner zum Polling auf neue Nachrichten |
| `smtp_host` | `String` | *erforderlich* | SMTP-Server-Hostname (z.B. `"smtp.gmail.com"`) |
| `smtp_port` | `u16` | `465` | SMTP-Server-Port (465 für implizites TLS, 587 für STARTTLS) |
| `smtp_tls` | `bool` | `true` | TLS für SMTP-Verbindungen verwenden |
| `username` | `String` | *erforderlich* | E-Mail-Benutzername für IMAP/SMTP-Authentifizierung |
| `password` | `String` | *erforderlich* | E-Mail-Passwort oder anwendungsspezifisches Passwort |
| `from_address` | `String` | *erforderlich* | Absenderadresse für ausgehende E-Mails |
| `idle_timeout_secs` | `u64` | `1740` | IDLE-Zeitlimit in Sekunden vor Wiederverbindung (Standard: 29 Minuten gemäß RFC 2177) |
| `allowed_senders` | `[String]` | `[]` | Erlaubte Absenderadressen oder Domänen. Leer = alle ablehnen. `"*"` = alle erlauben |
| `default_subject` | `String` | `"PRX Message"` | Standard-Betreffzeile für ausgehende E-Mails |

## Funktionen

- **IMAP IDLE** -- Echtzeit-Push-Benachrichtigungen für neue E-Mails (RFC 2177), keine Polling-Verzögerung
- **TLS-Verschlüsselung** -- Verbindungen zu IMAP- und SMTP-Servern sind per TLS verschlüsselt
- **MIME-Parsing** -- verarbeitet mehrteilige E-Mails, extrahiert Textinhalt und Anhänge
- **Domänenebene-Filterung** -- ganze Domänen erlauben (z.B. `"@company.com"`) in der Absender-Allowlist
- **Automatische Wiederverbindung** -- stellt IDLE-Verbindung nach dem 29-Minuten-Zeitlimit wieder her
- **Antwort-Threading** -- antwortet im ursprünglichen E-Mail-Thread mit korrekten `In-Reply-To`-Headern

## Einschränkungen

- Verarbeitet nur E-Mails im konfigurierten IMAP-Ordner (Standard: INBOX)
- HTML-E-Mails werden als Klartext verarbeitet (HTML-Tags werden entfernt)
- Große Anhänge werden je nach Speicherbeschränkungen möglicherweise nicht vollständig verarbeitet
- Einige E-Mail-Anbieter erfordern anwendungsspezifische Passwörter bei aktivierter 2FA
- IDLE-Unterstützung hängt vom IMAP-Server ab; die meisten modernen Server unterstützen sie

## Fehlerbehebung

### Verbindung zum IMAP-Server nicht möglich
- Überprüfen Sie, ob `imap_host` und `imap_port` für Ihren Anbieter korrekt sind
- Stellen Sie sicher, dass IMAP-Zugriff in Ihren E-Mail-Kontoeinstellungen aktiviert ist
- Bei Gmail generieren Sie ein App-Passwort (reguläre Passwörter werden bei 2FA blockiert)
- Prüfen Sie, ob TLS nicht durch eine Firewall blockiert wird

### E-Mails werden nicht erkannt
- Überprüfen Sie, ob `imap_folder` korrekt ist (Standard: `"INBOX"`)
- Prüfen Sie, ob die Absenderadresse oder Domäne in `allowed_senders` enthalten ist
- Einige Anbieter können eine Verzögerung haben, bevor E-Mails in IMAP erscheinen

### Antworten werden nicht gesendet
- Überprüfen Sie `smtp_host`, `smtp_port` und `smtp_tls`-Einstellungen passend zu Ihrem Anbieter
- Prüfen Sie SMTP-Authentifizierungsdaten (gleicher `username`/`password` wie IMAP, oder separate SMTP-Zugangsdaten)
- Prüfen Sie Server-Logs auf SMTP-Ablehnungsgründe (z.B. SPF/DKIM-Fehler)
