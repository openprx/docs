---
title: კარანტინის მართვა
description: "კარანტინიზებული საფრთხეების მართვა AES-256-GCM დაშიფრული ვოლტით, ფაილების აღდგენა და კარანტინის სტატისტიკის გადახედვა."
---

# კარანტინის მართვა

PRX-SD-ის საფრთხის გამოვლენისას ფაილი დაშიფრულ კარანტინის ვოლტში შეიძლება იზოლირდეს. კარანტინიზებული ფაილები AES-256-GCM-ით დაშიფრულია, გადარქმეულია და უსაფრთხო დირექტორიაში გადასულია, სადაც მათი შემთხვევით შესრულება შეუძლებელია. სასამართლო ანალიზისთვის ყველა ორიგინალი მეტამონაცემი ინახება.

## კარანტინის მუშაობის პრინციპი

```
Threat detected
  1. Generate random AES-256-GCM key
  2. Encrypt file contents
  3. Store encrypted blob in vault.bin
  4. Save metadata (original path, hash, detection info) as JSON
  5. Delete original file from disk
  6. Log quarantine event
```

კარანტინის ვოლტი `~/.prx-sd/quarantine/`-ში ინახება:

```
~/.prx-sd/quarantine/
  vault.bin                    # Encrypted file store (append-only)
  index.json                   # Quarantine index with metadata
  entries/
    a1b2c3d4.json             # Per-entry metadata
    e5f6g7h8.json
```

ყოველი კარანტინის ჩანაწერი შეიცავს:

```json
{
  "id": "a1b2c3d4",
  "original_path": "/tmp/payload.exe",
  "sha256": "e3b0c44298fc1c149afbf4c8996fb924...",
  "file_size": 245760,
  "detection": {
    "engine": "yara",
    "rule": "Win_Trojan_AgentTesla",
    "severity": "malicious"
  },
  "quarantined_at": "2026-03-21T10:15:32Z",
  "vault_offset": 1048576,
  "vault_length": 245792
}
```

::: tip
კარანტინის ვოლტი authenticated დაშიფვრას (AES-256-GCM) იყენებს. ეს კარანტინიზებული მავნე პროგრამის შემთხვევით შესრულებასა და მტკიცებულებებში გაყალბებას ხელს უშლის.
:::

## კარანტინიზებული ფაილების ჩამოთვლა

```bash
sd quarantine list [OPTIONS]
```

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--json` | | `false` | JSON სახით გამოტანა |
| `--sort` | `-s` | `date` | დალაგება: `date`, `name`, `size`, `severity` |
| `--filter` | `-f` | | სიმძიმის მიხედვით ფილტრი: `malicious`, `suspicious` |
| `--limit` | `-n` | ყველა | ჩვენებადი მაქსიმალური ჩანაწერები |

### მაგალითი

```bash
sd quarantine list
```

```
Quarantine Vault (4 entries, 1.2 MB)

ID        Date                 Size     Severity   Detection              Original Path
a1b2c3d4  2026-03-21 10:15:32  240 KB   malicious  Win_Trojan_AgentTesla  /tmp/payload.exe
e5f6g7h8  2026-03-20 14:22:01  512 KB   malicious  Ransom_LockBit3       /home/user/doc.pdf.lockbit
c9d0e1f2  2026-03-19 09:45:18  32 KB    suspicious  Suspicious_Script     /var/www/upload/shell.php
b3a4c5d6  2026-03-18 16:30:55  384 KB   malicious  SHA256_Match          /tmp/dropper.bin
```

## ფაილების აღდგენა

კარანტინიზებული ფაილის ორიგინალ ადგილმდებარეობაში ან მითითებულ გზაზე აღდგენა:

```bash
sd quarantine restore <ID> [OPTIONS]
```

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--to` | `-t` | ორიგინალი გზა | სხვა ადგილმდებარეობაში აღდგენა |
| `--force` | `-f` | `false` | გამოყენება, თუ destination არსებობს |

::: warning
კარანტინიზებული ფაილის აღდგენა ცნობილ-მავნე ან საეჭვო ფაილს disk-ზე უბრუნებს. ფაილები მხოლოდ false positive-ების დადასტურებისას ან იზოლირებულ გარემოში ანალიზისთვის აღადგინეთ.
:::

### მაგალითები

```bash
# ორიგინალ ადგილმდებარეობაში აღდგენა
sd quarantine restore a1b2c3d4

# ანალიზისთვის კონკრეტულ დირექტორიაში აღდგენა
sd quarantine restore a1b2c3d4 --to /tmp/analysis/

# Destination-ში ფაილის არსებობის შემთხვევაში გადაწერა
sd quarantine restore a1b2c3d4 --to /tmp/analysis/ --force
```

## კარანტინიზებული ფაილების წაშლა

კარანტინის ჩანაწერების სამუდამო წაშლა:

```bash
# ერთი ჩანაწერის წაშლა
sd quarantine delete <ID>

# ყველა ჩანაწერის წაშლა
sd quarantine delete-all

# 30 დღეზე ძველი ჩანაწერების წაშლა
sd quarantine delete --older-than 30d

# კონკრეტული სიმძიმის ყველა ჩანაწერის წაშლა
sd quarantine delete --filter malicious
```

წაშლისას დაშიფრული მონაცემები ვოლტიდან ამოღებამდე ნოლებით გადაიწერება.

::: warning
წაშლა სამუდამოა. წაშლის შემდეგ დაშიფრული ფაილ-მონაცემები და მეტამონაცემები აღდგენადი არ არის. წაშლამდე ჩანაწერების არქივირებისთვის ექსპორტი გაიაზრეთ.
:::

## კარანტინის სტატისტიკა

კარანტინის ვოლტის შეჯამებული სტატისტიკის ნახვა:

```bash
sd quarantine stats
```

```
Quarantine Statistics
  Total entries:       47
  Total size:          28.4 MB (encrypted)
  Oldest entry:        2026-02-15
  Newest entry:        2026-03-21

  By severity:
    Malicious:         31 (65.9%)
    Suspicious:        16 (34.1%)

  By detection engine:
    YARA rules:        22 (46.8%)
    Hash match:        15 (31.9%)
    Heuristic:          7 (14.9%)
    Ransomware:         3 (6.4%)

  Top detections:
    Win_Trojan_Agent    8 entries
    Ransom_LockBit3     5 entries
    SHA256_Match        5 entries
    Suspicious_Script   4 entries
```

## ავტომატური კარანტინიზება

სკანირებისა ან მონიტორინგის დროს ავტომატური კარანტინიზების ჩართვა:

```bash
# ავტო-კარანტინიზებით სკანირება
sd scan /tmp --auto-quarantine

# ავტო-კარანტინიზებით მონიტორინგი
sd monitor --auto-quarantine /home /tmp

# ავტო-კარანტინიზებით დემონი
sd daemon start --auto-quarantine
```

ან ნაგულისხმევ პოლიტიკად დაყენება:

```toml
[policy]
on_malicious = "quarantine"
on_suspicious = "report"
```

## კარანტინის მონაცემების ექსპორტი

კარანტინის მეტამონაცემების ანგარიშგებისთვის ან SIEM ინტეგრაციისთვის ექსპორტი:

```bash
# ყველა მეტამონაცემის JSON-ად ექსპორტი
sd quarantine list --json > quarantine_report.json

# სტატისტიკის JSON-ად ექსპორტი
sd quarantine stats --json > quarantine_stats.json
```

## შემდეგი ნაბიჯები

- [საფრთხეზე რეაგირება](/ka/prx-sd/remediation/) -- კარანტინის გარდა პასუხის პოლიტიკის კონფიგურაცია
- [ფაილ-მონიტორინგი](/ka/prx-sd/realtime/monitor) -- ავტო-კარანტინიზებით რეალურ დროში დაცვა
- [Webhook Alert-ები](/ka/prx-sd/alerts/webhook) -- ფაილების კარანტინიზებისას შეტყობინება
- [საფრთხის ინტელექტი](/ka/prx-sd/signatures/) -- სიგნატურების მონაცემთა ბაზის მიმოხილვა
