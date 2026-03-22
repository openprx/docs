---
title: Email Alert-ები
description: PRX-SD-ში საფრთხის გამოვლენებისა და სკანირების შედეგებისთვის email შეტყობინებების კონფიგურაცია.
---

# Email Alert-ები

PRX-SD-ს შეუძლია email შეტყობინებები გაგზავნოს საფრთხეების გამოვლენისას, სკანირებების დასრულებისას ან კრიტიკული მოვლენებისას. Email alert-ები webhook-ებს ავსებს გარემოებებში, სადაც email ძირითადი საკომუნიკაციო არხია, ან მე-ცვლაზე მყოფ პერსონალზე გასასვლელად.

## გამოყენება

```bash
sd email-alert <SUBCOMMAND> [OPTIONS]
```

### ქვე-ბრძანებები

| ქვე-ბრძანება | აღწერა |
|------------|-------------|
| `configure` | SMTP სერვერისა და მიმღების პარამეტრების დაყენება |
| `test` | კონფიგურაციის შესამოწმებელი ტესტ-email-ის გაგზავნა |
| `send` | Alert email-ის ხელით გაგზავნა |
| `status` | Email კონფიგურაციის მიმდინარე სტატუსის ჩვენება |

## Email-ის კონფიგურაცია

### ინტერაქტიული კონფიგურაცია

```bash
sd email-alert configure
```

ინტერაქტიული ოსტატი ამ მონაცემებს ითხოვს:

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

### ბრძანებ-ხაზის კონფიგურაცია

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

### კონფიგურაციის ფაილი

Email პარამეტრები `~/.prx-sd/config.toml`-ში ინახება:

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
Gmail-ისთვის ანგარიშის პაროლის ნაცვლად App Password-ის გამოყენება. App Password-ის გენერირებისთვის Google Account > Security > 2-Step Verification > App passwords-ზე გადასვლა.
:::

## Email-ის ტესტირება

კონფიგურაციის შესამოწმებლად ტესტ-email-ის გაგზავნა:

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

## ხელით Alert-ების გაგზავნა

Alert email-ის ხელით გაშვება (ინტეგრაციების ტესტირებისთვის ან დასკვნების გადაგზავნისთვის სასარგებლო):

```bash
# კონკრეტულ ფაილზე alert-ის გაგზავნა
sd email-alert send --file /tmp/suspicious_file --severity malicious \
  --message "Found during incident response investigation"

# სკანირების შეჯამების გაგზავნა
sd email-alert send --scan-report /tmp/scan-results.json
```

## Email-ის შინაარსი

### საფრთხის გამოვლენის Email

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

### სკანირების შეჯამების Email

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

## მხარდაჭერილი მოვლენები

| მოვლენა | ნაგულისხმევად ჩართული | აღწერა |
|-------|-----------------|-------------|
| `threat_detected` | კი | მავნე ან საეჭვო ფაილი ნაპოვნია |
| `ransomware_alert` | კი | გამოსასყიდ-ქცევა გამოვლინდა |
| `scan_completed` | არა | სკანის სამუშაო დასრულდა (მხოლოდ საფრთხეების პოვნისას) |
| `update_completed` | არა | სიგნატურ-განახლება დასრულდა |
| `update_failed` | კი | სიგნატურ-განახლება წარუმატებელი |
| `daemon_error` | კი | დემონი კრიტიკულ შეცდომას წააწყდა |

email-ების გამომწვევი მოვლენების კონფიგურაცია:

```toml
[email]
events = ["threat_detected", "ransomware_alert", "daemon_error"]
```

## Rate Limiting

დიდი განადგურებების დროს email-ის გადაფენვის თავიდან ასაცილებლად:

```toml
[email.rate_limit]
max_per_hour = 10            # Maximum emails per hour
digest_mode = true           # Batch multiple alerts into a single email
digest_interval_mins = 15    # Digest batch window
```

`digest_mode`-ის ჩართვისას digest-ის ინტერვალის ფარგლებში alert-ები ინდივიდუალური შეტყობინებების გაგზავნის ნაცვლად ერთ შეჯამებულ email-ში გაერთიანდება.

## სტატუსის შემოწმება

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

## შემდეგი ნაბიჯები

- [Webhook Alert-ები](./webhook) -- რეალურ დროში webhook შეტყობინებები
- [დაგეგმილი სკანირებები](./schedule) -- განმეორებადი სკანების ავტომატიზება
- [საფრთხეზე რეაგირება](/ka/prx-sd/remediation/) -- ავტომატური remediation პოლიტიკები
- [დემონი](/ka/prx-sd/realtime/daemon) -- alert-ებიანი ფონური დაცვა
