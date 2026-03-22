---
title: E-Mail-Alarme
description: E-Mail-Benachrichtigungen für Bedrohungserkennungen und Scan-Ergebnisse in PRX-SD konfigurieren.
---

# E-Mail-Alarme

PRX-SD kann E-Mail-Benachrichtigungen senden, wenn Bedrohungen erkannt werden, Scans abgeschlossen werden oder kritische Ereignisse auftreten. E-Mail-Alarme ergänzen Webhooks für Umgebungen, in denen E-Mail der primäre Kommunikationskanal ist oder um Bereitschaftspersonal zu erreichen.

## Verwendung

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### Unterbefehle

| Unterbefehl | Beschreibung |
|-------------|-------------|
| `configure` | SMTP-Server und Empfängereinstellungen einrichten |
| `test` | Test-E-Mail zur Verifizierung der Konfiguration senden |
| `send` | Alarm-E-Mail manuell senden |
| `status` | Aktuellen E-Mail-Konfigurationsstatus anzeigen |

## E-Mail konfigurieren

### Interaktive Einrichtung

```bash
sd email-alert configure
```

Der interaktive Assistent fragt nach:

```
SMTP Server: smtp.gmail.com
SMTP Port [587]: 587
Use TLS [yes]: yes
Username: alerts@example.com
Password: ********
From Address [alerts@example.com]: prx-sd@example.com
From Name [PRX-SD]: PRX-SD Scanner
Recipients (comma-separated): security@example.com, oncall@example.com
Min Severity [suspicious]: malicious
```

### Kommandozeilen-Konfiguration

```bash
sd email-alert configure \
  --smtp-server smtp.gmail.com \
  --smtp-port 587 \
  --tls true \
  --username alerts@example.com \
  --password "app-password-here" \
  --from "prx-sd@example.com" \
  --from-name "PRX-SD Scanner" \
  --to "security@example.com,oncall@example.com" \
  --min-severity malicious
```

### Konfigurationsdatei

E-Mail-Einstellungen werden in `~/.prx-sd/config.toml` gespeichert:

```toml
[email]
enabled = true
min_severity = "malicious"    # suspicious | malicious
events = ["threat_detected", "ransomware_alert", "scan_completed"]

[email.smtp]
server = "smtp.gmail.com"
port = 587
tls = true
username = "alerts@example.com"
# Password stored encrypted - use 'sd email-alert configure' to set

[email.message]
from_address = "prx-sd@example.com"
from_name = "PRX-SD Scanner"
recipients = ["security@example.com", "oncall@example.com"]
subject_prefix = "[PRX-SD]"
```

::: tip
Für Gmail ein App-Passwort anstelle des Kontokennworts verwenden. Zu Google-Konto > Sicherheit > 2-Schritt-Verifizierung > App-Passwörter navigieren, um eines zu generieren.
:::

## E-Mail testen

Test-E-Mail zur Verifizierung der Konfiguration senden:

```bash
sd email-alert test
```

```
Sending test email to security@example.com, oncall@example.com...
  SMTP connection:  OK (smtp.gmail.com:587, TLS)
  Authentication:   OK
  Delivery:         OK (Message-ID: <prx-sd-test-a1b2c3@example.com>)

Test email sent successfully.
```

## Manuelle Alarme senden

Alarm-E-Mail manuell auslösen (nützlich zum Testen von Integrationen oder Weiterleiten von Erkenntnissen):

```bash
# Alarm über eine bestimmte Datei senden
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# Scan-Zusammenfassung senden
sd email-alert send --scan-report /tmp/scan-results.json
```

## E-Mail-Inhalt

### Bedrohungserkennungs-E-Mail

```
Subject: [PRX-SD] MALICIOUS: Win_Trojan_AgentTesla detected on web-server-01

PRX-SD Threat Detection Alert
==============================

Host:       web-server-01
Timestamp:  2026-03-21 10:15:32 UTC
Severity:   MALICIOUS

File:       /tmp/payload.exe
SHA-256:    e3b0c44298fc1c149afbf4c8996fb924...
Size:       240 KB
Type:       PE32 executable (GUI) Intel 80386, for MS Windows

Detection:  Win_Trojan_AgentTesla
Engine:     YARA (neo23x0/signature-base)

Action Taken: Quarantined (ID: a1b2c3d4)

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

### Scan-Zusammenfassungs-E-Mail

```
Subject: [PRX-SD] Scan Complete: 3 threats found in /home

PRX-SD Scan Report
===================

Host:           web-server-01
Scan Path:      /home
Started:        2026-03-21 10:00:00 UTC
Completed:      2026-03-21 10:12:45 UTC
Duration:       12 minutes 45 seconds

Files Scanned:  45,231
Threats Found:  3

Detections:
  1. /home/user/downloads/crack.exe
     Severity: MALICIOUS | Detection: Win_Trojan_Agent
     Action: Quarantined

  2. /home/user/.cache/tmp/loader.sh
     Severity: MALICIOUS | Detection: Linux_Backdoor_Generic
     Action: Quarantined

  3. /home/user/scripts/util.py
     Severity: SUSPICIOUS | Detection: Heuristic_HighEntropy
     Action: Reported

---
PRX-SD Antivirus Engine | https://openprx.dev/prx-sd
```

## Unterstützte Ereignisse

| Ereignis | Standardmäßig eingeschlossen | Beschreibung |
|----------|------------------------------|-------------|
| `threat_detected` | Ja | Bösartige oder verdächtige Datei gefunden |
| `ransomware_alert` | Ja | Ransomware-Verhalten erkannt |
| `scan_completed` | Nein | Scan-Job abgeschlossen (nur wenn Bedrohungen gefunden) |
| `update_completed` | Nein | Signatur-Update abgeschlossen |
| `update_failed` | Ja | Signatur-Update fehlgeschlagen |
| `daemon_error` | Ja | Daemon auf kritischen Fehler gestoßen |

Konfigurieren, welche Ereignisse E-Mails auslösen:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## Ratenbegrenzung

Um E-Mail-Flut bei großen Ausbrüchen zu verhindern:

```toml
[email.rate_limit]
max_per_hour = 10            # Maximale E-Mails pro Stunde
digest_mode = true           # Mehrere Alarme in einer einzigen E-Mail bündeln
digest_interval_mins = 15    # Digest-Batch-Fenster
```

Wenn `digest_mode` aktiviert ist, werden Alarme innerhalb des Digest-Fensters zu einer einzigen Zusammenfassungs-E-Mail kombiniert, anstatt einzelne Benachrichtigungen zu senden.

## Status prüfen

```bash
sd email-alert status
```

```
Email Alert Status
  Enabled:      true
  SMTP Server:  smtp.gmail.com:587 (TLS)
  From:         prx-sd@example.com
  Recipients:   security@example.com, oncall@example.com
  Min Severity: malicious
  Events:       threat_detected, ransomware_alert, daemon_error
  Last Sent:    2026-03-21 10:15:32 UTC
  Emails Today: 2
```

## Nächste Schritte

- [Webhook-Alarme](./webhook) -- Echtzeit-Webhook-Benachrichtigungen
- [Geplante Scans](./schedule) -- wiederkehrende Scans automatisieren
- [Bedrohungsreaktion](/de/prx-sd/remediation/) -- automatische Bereinigungsrichtlinien
- [Daemon](/de/prx-sd/realtime/daemon) -- Hintergrundschutz mit Alarmen
