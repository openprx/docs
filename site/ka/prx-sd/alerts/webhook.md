---
title: Webhook Alert-ები
description: "PRX-SD-ში საფრთხის გამოვლენებზე, კარანტინის მოვლენებსა და სკანირების შედეგებზე webhook შეტყობინებების კონფიგურაცია."
---

# Webhook Alert-ები

PRX-SD-ს შეუძლია რეალურ დროში შეტყობინებები webhook endpoint-ებზე გაგზავნოს საფრთხეების გამოვლენისას, ფაილების კარანტინიზებისას ან სკანირებების დასრულებისას. Webhook-ები Slack-თან, Discord-თან, Microsoft Teams-თან, PagerDuty-სთან ან ნებისმიერ მომხმარებლის HTTP endpoint-თან ინტეგრირდება.

## გამოყენება

```bash
sd webhook <SUBCOMMAND> [OPTIONS]
```

### ქვე-ბრძანებები

| ქვე-ბრძანება | აღწერა |
|------------|-------------|
| `add` | ახალი webhook endpoint-ის რეგისტრაცია |
| `remove` | რეგისტრირებული webhook-ის ამოღება |
| `list` | ყველა რეგისტრირებული webhook-ის ჩამოთვლა |
| `test` | webhook-ზე ტესტ-შეტყობინების გაგზავნა |

## Webhook-ების დამატება

```bash
sd webhook add [OPTIONS] <URL>
```

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--format` | `-f` | `generic` | Payload ფორმატი: `slack`, `discord`, `teams`, `generic` |
| `--name` | `-n` | ავტო | ამ webhook-ის ადამიანისთვის-წასაკითხი სახელი |
| `--events` | `-e` | ყველა | შეტყობინების გამომწვევი მოვლენების მძიმე-გამყოფი სია |
| `--secret` | `-s` | | Payload-ის დადასტურებისთვის HMAC-SHA256 ხელმოწერის საიდუმლო |
| `--min-severity` | | `suspicious` | გამოსააქტიურებელი მინიმალური სიმძიმე: `suspicious`, `malicious` |

### მხარდაჭერილი მოვლენები

| მოვლენა | აღწერა |
|-------|-------------|
| `threat_detected` | მავნე ან საეჭვო ფაილი ნაპოვნია |
| `file_quarantined` | ფაილი კარანტინში გადავიდა |
| `scan_completed` | სკანის სამუშაო დასრულდა |
| `update_completed` | სიგნატურ-განახლება დასრულდა |
| `ransomware_alert` | გამოსასყიდ-ქცევა გამოვლინდა |
| `daemon_status` | დემონი დაიწყო, გაჩერდა ან შეცდომა წააწყდა |

### მაგალითები

```bash
# Slack webhook-ის დამატება
sd webhook add --format slack --name "security-alerts" \
  "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"

# Discord webhook-ის დამატება
sd webhook add --format discord --name "av-alerts" \
  "https://discord.com/api/webhooks/1234567890/abcdefg"

# HMAC ხელმოწერიანი generic webhook-ის დამატება
sd webhook add --format generic --secret "my-signing-secret" \
  --name "siem-ingest" "https://siem.example.com/api/v1/alerts"

# მხოლოდ-მავნე alert-ებისთვის webhook-ის დამატება
sd webhook add --format slack --min-severity malicious \
  --events threat_detected,ransomware_alert \
  "https://hooks.slack.com/services/T00000/B00000/CRITICAL"
```

## Webhook-ების ჩამოთვლა

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

## Webhook-ების ამოღება

```bash
# სახელის მიხედვით ამოღება
sd webhook remove security-alerts

# URL-ის მიხედვით ამოღება
sd webhook remove "https://hooks.slack.com/services/T00000/B00000/XXXXXXXX"
```

## Webhook-ების ტესტირება

კავშირის შესამოწმებელი ტესტ-შეტყობინების გაგზავნა:

```bash
# კონკრეტული webhook-ის ტესტი
sd webhook test security-alerts

# ყველა webhook-ის ტესტი
sd webhook test --all
```

ტესტი საფრთხის გამოვლენის ნიმუშ-payload-ს გაგზავნის, ფორმატირებისა და გადაცემის შესამოწმებლად.

## Payload ფორმატები

### Generic ფორმატი

ნაგულისხმევი `generic` ფორმატი JSON payload-ს HTTP POST-ით გაგზავნის:

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

Generic payload-ებთან ჩართული header-ები:

```
Content-Type: application/json
User-Agent: PRX-SD/1.0
X-PRX-SD-Event: threat_detected
X-PRX-SD-Signature: sha256=<HMAC signature>  (if secret configured)
```

### Slack ფორმატი

Slack webhook-ები ფერ-კოდირებული სიმძიმის ფორმატირებულ შეტყობინებას იღებს:

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

### Discord ფორმატი

Discord webhook-ები embeds ფორმატს იყენებს:

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

## კონფიგურაციის ფაილი

Webhook-ები `~/.prx-sd/config.toml`-შიც შეიძლება კონფიგურირდეს:

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
Webhook საიდუმლოები კონფიგ-ფაილში დაშიფრულად ინახება. კონფიგ-ფაილის პირდაპირ რედაქტირების ნაცვლად მათი უსაფრთხოდ დასაყენებლად `sd webhook add --secret`-ის გამოყენება.
:::

## Retry ქცევა

წარუმატებელი webhook გადაცემები exponential backoff-ით ხელახლა ცდება:

| მცდელობა | შეყოვნება |
|---------|-------|
| 1-ლი retry | 5 წამი |
| 2-ე retry | 30 წამი |
| 3-ე retry | 5 წუთი |
| 4-ე retry | 30 წუთი |
| (გათავება) | მოვლენა მიუწოდებლად ჟურნალდება |

## შემდეგი ნაბიჯები

- [Email Alert-ები](./email) -- email შეტყობინებების კონფიგურაცია
- [დაგეგმილი სკანირებები](./schedule) -- განმეორებადი სკანების დაყენება
- [საფრთხეზე რეაგირება](/ka/prx-sd/remediation/) -- ავტომატური remediation-ის კონფიგურაცია
- [დემონი](/ka/prx-sd/realtime/daemon) -- alert-ებიანი ფონური მონიტორინგი
