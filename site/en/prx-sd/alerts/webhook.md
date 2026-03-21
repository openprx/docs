---
title: Webhook Alerts
description: Configure webhook notifications for threat detections, quarantine events, and scan results in PRX-SD.
---

# Webhook Alerts

PRX-SD can send real-time notifications to webhook endpoints when threats are detected, files are quarantined, or scans complete. Webhooks integrate with Slack, Discord, Microsoft Teams, PagerDuty, or any custom HTTP endpoint.

## Usage

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### Subcommands

| Subcommand | Description |
|------------|-------------|
| `add` | Register a new webhook endpoint |
| `remove` | Remove a registered webhook |
| `list` | List all registered webhooks |
| `test` | Send a test notification to a webhook |

## Adding Webhooks

```bash
sd webhook add [OPTIONS] <URL>
```

| Flag | Short | Default | Description |
|------|-------|---------|-------------|
| `--format` | `-f` | `generic` | Payload format: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | auto | Human-readable name for this webhook |
| `--events` | `-e` | all | Comma-separated events to notify on |
| `--secret` | `-s` | | HMAC-SHA256 signing secret for payload verification |
| `--min-severity` | | `suspicious` | Minimum severity to trigger: `suspicious`, `malicious` |

### Supported Events

| Event | Description |
|-------|-------------|
| `threat_detected` | A malicious or suspicious file was found |
| `file_quarantined` | A file was moved to quarantine |
| `scan_completed` | A scan job finished |
| `update_completed` | Signature update completed |
| `ransomware_alert` | Ransomware behavior detected |
| `daemon_status` | Daemon started, stopped, or encountered an error |

### Examples

```bash
# Add a Slack webhook
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Add a Discord webhook
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# Add a generic webhook with HMAC signing
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# Add a webhook for malicious-only alerts
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Listing Webhooks

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

## Removing Webhooks

```bash
# Remove by name
sd webhook remove security-alerts

# Remove by URL
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Testing Webhooks

Send a test notification to verify connectivity:

```bash
# Test a specific webhook
sd webhook test security-alerts

# Test all webhooks
sd webhook test --all
```

The test sends a sample threat detection payload so you can verify formatting and delivery.

## Payload Formats

### Generic Format

The default `generic` format sends a JSON payload via HTTP POST:

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

Headers included with generic payloads:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### Slack Format

Slack webhooks receive a formatted message with color-coded severity:

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

### Discord Format

Discord webhooks use the embeds format:

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

## Configuration File

Webhooks can also be configured in `~/.prx-sd/config.toml`:

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
Webhook secrets are stored encrypted in the config file. Use `sd webhook add --secret` to set them securely rather than editing the config file directly.
:::

## Retry Behavior

Failed webhook deliveries are retried with exponential backoff:

| Attempt | Delay |
|---------|-------|
| 1st retry | 5 seconds |
| 2nd retry | 30 seconds |
| 3rd retry | 5 minutes |
| 4th retry | 30 minutes |
| (give up) | Event logged as undeliverable |

## Next Steps

- [Email Alerts](./email) -- email notification configuration
- [Scheduled Scans](./schedule) -- set up recurring scan jobs
- [Threat Response](/en/prx-sd/remediation/) -- configure automated remediation
- [Daemon](/en/prx-sd/realtime/daemon) -- background monitoring with alerts
