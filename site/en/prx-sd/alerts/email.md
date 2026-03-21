---
title: Email Alerts
description: Configure email notifications for threat detections and scan results in PRX-SD.
---

# Email Alerts

PRX-SD can send email notifications when threats are detected, scans complete, or critical events occur. Email alerts complement webhooks for environments where email is the primary communication channel or for reaching on-call personnel.

## Usage

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `configure` | Set up SMTP server and recipient settings |
| `test` | Send a test email to verify configuration |
| `send` | Manually send an alert email |
| `status` | Show current email configuration status |

## Configuring Email

### Interactive Setup

```bash
sd email-alert configure
```

The interactive wizard prompts for:

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

### Command-Line Configuration

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

### Configuration File

Email settings are stored in `~/.prx-sd/config.toml`:

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
For Gmail, use an App Password instead of your account password. Go to Google Account > Security > 2-Step Verification > App passwords to generate one.
:::

## Testing Email

Send a test email to verify your configuration:

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

## Sending Manual Alerts

Trigger an alert email manually (useful for testing integrations or forwarding findings):

```bash
# Send alert about a specific file
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# Send a scan summary
sd email-alert send --scan-report /tmp/scan-results.json
```

## Email Content

### Threat Detection Email

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

### Scan Summary Email

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

## Supported Events

| Event | Default Included | Description |
|-------|-----------------|-------------|
| `threat_detected` | Yes | Malicious or suspicious file found |
| `ransomware_alert` | Yes | Ransomware behavior detected |
| `scan_completed` | No | Scan job finished (only if threats found) |
| `update_completed` | No | Signature update completed |
| `update_failed` | Yes | Signature update failed |
| `daemon_error` | Yes | Daemon encountered a critical error |

Configure which events trigger emails:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## Rate Limiting

To prevent email flooding during large outbreaks:

```toml
[email.rate_limit]
max_per_hour = 10            # Maximum emails per hour
digest_mode = true           # Batch multiple alerts into a single email
digest_interval_mins = 15    # Digest batch window
```

When `digest_mode` is enabled, alerts within the digest window are combined into a single summary email instead of sending individual notifications.

## Checking Status

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

## Next Steps

- [Webhook Alerts](./webhook) -- real-time webhook notifications
- [Scheduled Scans](./schedule) -- automate recurring scans
- [Threat Response](/en/prx-sd/remediation/) -- automated remediation policies
- [Daemon](/en/prx-sd/realtime/daemon) -- background protection with alerts
