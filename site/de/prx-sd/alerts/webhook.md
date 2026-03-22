---
title: Webhook-Alarme
description: "Webhook-Benachrichtigungen für Bedrohungserkennungen, Quarantäne-Ereignisse und Scan-Ergebnisse in PRX-SD konfigurieren."
---

# Webhook-Alarme

PRX-SD kann Echtzeit-Benachrichtigungen an Webhook-Endpunkte senden, wenn Bedrohungen erkannt werden, Dateien in Quarantäne kommen oder Scans abgeschlossen werden. Webhooks integrieren sich mit Slack, Discord, Microsoft Teams, PagerDuty oder jedem benutzerdefinierten HTTP-Endpunkt.

## Verwendung

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### Unterbefehle

| Unterbefehl | Beschreibung |
|-------------|-------------|
| `add` | Neuen Webhook-Endpunkt registrieren |
| `remove` | Registrierten Webhook entfernen |
| `list` | Alle registrierten Webhooks auflisten |
| `test` | Testbenachrichtigung an einen Webhook senden |

## Webhooks hinzufügen

```bash
sd webhook add [OPTIONS] <URL>
```

| Flag | Kurz | Standard | Beschreibung |
|------|------|----------|-------------|
| `--format` | `-f` | `generic` | Payload-Format: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | auto | Lesbarer Name für diesen Webhook |
| `--events` | `-e` | alle | Kommagetrennte Ereignisse, bei denen benachrichtigt werden soll |
| `--secret` | `-s` | | HMAC-SHA256-Signing-Secret für Payload-Verifizierung |
| `--min-severity` | | `suspicious` | Minimaler Schweregrad zur Auslösung: `suspicious`, `malicious` |

### Unterstützte Ereignisse

| Ereignis | Beschreibung |
|----------|-------------|
| `threat_detected` | Eine bösartige oder verdächtige Datei wurde gefunden |
| `file_quarantined` | Eine Datei wurde in Quarantäne verschoben |
| `scan_completed` | Ein Scan-Job wurde abgeschlossen |
| `update_completed` | Signatur-Update abgeschlossen |
| `ransomware_alert` | Ransomware-Verhalten erkannt |
| `daemon_status` | Daemon gestartet, gestoppt oder auf Fehler gestoßen |

### Beispiele

```bash
# Slack-Webhook hinzufügen
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Discord-Webhook hinzufügen
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# Generischen Webhook mit HMAC-Signierung hinzufügen
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# Webhook nur für bösartige Alarme hinzufügen
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Webhooks auflisten

```bash
sd webhook list
```

```
Registered Webhooks (3)

Name              Format    Events              Min Severity  URL
security-alerts   slack     all                 suspicious    https://hooks.slack.com/...XXXX
av-alerts         discord   all                 suspicious    https://discord.com/...defg
siem-ingest       generic   all                 suspicious    https://siem.example.com/...
```

## Webhooks entfernen

```bash
# Nach Name entfernen
sd webhook remove security-alerts

# Nach URL entfernen
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Webhooks testen

Testbenachrichtigung zur Verbindungsüberprüfung senden:

```bash
# Bestimmten Webhook testen
sd webhook test security-alerts

# Alle Webhooks testen
sd webhook test --all
```

Der Test sendet einen Beispiel-Bedrohungserkennungs-Payload, damit Formatierung und Zustellung überprüft werden können.

## Payload-Formate

### Generisches Format

Das Standard-`generic`-Format sendet einen JSON-Payload über HTTP POST:

```json
{
  "event": "threat_detected",
  "timestamp": "2026-03-21T10:15:32Z",
  "hostname": "web-server-01",
  "threat": {
    "file": "/tmp/payload.exe",
    "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
    "size": 245760,
    "severity": "malicious",
    "detection": {
      "engine": "yara",
      "rule": "Win_Trojan_AgentTesla",
      "source": "neo23x0/signature-base"
    }
  },
  "action_taken": "quarantined",
  "quarantine_id": "a1b2c3d4"
}
```

Mit generischen Payloads enthaltene Header:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### Slack-Format

Slack-Webhooks erhalten eine formatierte Nachricht mit farbkodiertem Schweregrad:

```json
{
  "attachments": [{
    "color": "#ff0000",
    "title": "Threat Detected: Win_Trojan_AgentTesla",
    "fields": [
      {"title": "File", "value": "/tmp/payload.exe", "short": false},
      {"title": "Severity", "value": "MALICIOUS", "short": true},
      {"title": "Action", "value": "Quarantined", "short": true},
      {"title": "Host", "value": "web-server-01", "short": true},
      {"title": "SHA-256", "value": "`e3b0c44298fc...`", "short": false}
    ],
    "ts": 1742554532
  }]
}
```

### Discord-Format

Discord-Webhooks verwenden das Embeds-Format:

```json
{
  "embeds": [{
    "title": "Threat Detected",
    "description": "**Win_Trojan_AgentTesla** found in `/tmp/payload.exe`",
    "color": 16711680,
    "fields": [
      {"name": "Severity", "value": "MALICIOUS", "inline": true},
      {"name": "Action", "value": "Quarantined", "inline": true},
      {"name": "Host", "value": "web-server-01", "inline": true}
    ],
    "timestamp": "2026-03-21T10:15:32Z"
  }]
}
```

## Konfigurationsdatei

Webhooks können auch in `~/.prx-sd/config.toml` konfiguriert werden:

```toml
[[webhook]]
name = "security-alerts"
url = "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
format = "slack"
events = ["threat_detected", "ransomware_alert", "file_quarantined"]
min_severity = "suspicious"

[[webhook]]
name = "siem-ingest"
url = "https://siem.example.com/api/v1/alerts"
format = "generic"
secret = "my-hmac-secret"
events = ["threat_detected"]
min_severity = "malicious"
```

::: tip
Webhook-Secrets werden verschlüsselt in der Konfigurationsdatei gespeichert. `sd webhook add --secret` verwenden, um sie sicher festzulegen, anstatt die Konfigurationsdatei direkt zu bearbeiten.
:::

## Wiederholungsverhalten

Fehlgeschlagene Webhook-Zustellungen werden mit exponentieller Verzögerung wiederholt:

| Versuch | Verzögerung |
|---------|-------------|
| 1. Wiederholung | 5 Sekunden |
| 2. Wiederholung | 30 Sekunden |
| 3. Wiederholung | 5 Minuten |
| 4. Wiederholung | 30 Minuten |
| (aufgeben) | Ereignis als nicht zustellbar protokolliert |

## Nächste Schritte

- [E-Mail-Alarme](./email) -- E-Mail-Benachrichtigungskonfiguration
- [Geplante Scans](./schedule) -- wiederkehrende Scan-Jobs einrichten
- [Bedrohungsreaktion](/de/prx-sd/remediation/) -- automatische Bereinigungsrichtlinien konfigurieren
- [Daemon](/de/prx-sd/realtime/daemon) -- Hintergrundüberwachung mit Alarmen
