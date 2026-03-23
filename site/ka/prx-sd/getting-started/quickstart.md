---
title: სწრაფი დაწყება
description: PRX-SD-ის გაშვება მავნე პროგრამების სასკანირებლად 5 წუთში. ინსტალაცია, სიგნატურების განახლება, ფაილების სკანირება, შედეგების განხილვა და რეალურ დროში მონიტორინგის ჩართვა.
---

# სწრაფი დაწყება

ეს სახელმძღვანელო გაძღვება ნულიდან პირველ მავნე პროგრამათა სკანირებამდე 5 წუთზე ნაკლებ დროში. ბოლოს PRX-SD დაინსტალირებული, სიგნატურები განახლებული და რეალურ დროში მონიტორინგი გაშვებული გეყოლებათ.

::: tip წინაპირობები
Linux ან macOS სისტემა `curl`-ის დაინსტალირებით გჭირდებათ. სხვა მეთოდებისა და პლატფორმის დეტალებისთვის იხილეთ [ინსტალაციის სახელმძღვანელო](./installation).
:::

## ნაბიჯი 1: PRX-SD-ის ინსტალაცია

ინსტალაციის სკრიპტით ყველაზე ახლო გამოშვების ჩამოტვირთვა და ინსტალაცია:

```bash
curl -fsSL https://raw.githubusercontent.com/openprx/prx-sd/main/install.sh | bash
```

ინსტალაციის გადამოწმება:

```bash
sd --version
```

უნდა ნახოთ ასეთი გამოტანა:

```
prx-sd 0.5.0
```

## ნაბიჯი 2: სიგნატურების მონაცემთა ბაზის განახლება

PRX-SD ჩაშენებული blocklist-ით მოყვება, მაგრამ სრული დაცვისთვის უახლესი საფრთხეთა ინტელექტის ჩამოტვირთვა გჭირდებათ. `update` ბრძანება ყველა კონფიგურირებული წყაროდან ჰეშ-სიგნატურებსა და YARA წესებს ჩამოტვირთავს:

```bash
sd update
```

მოსალოდნელი გამოტანა:

```
[INFO] Updating hash signatures...
[INFO]   MalwareBazaar: 12,847 hashes (last 48h)
[INFO]   URLhaus: 8,234 hashes
[INFO]   Feodo Tracker: 1,456 hashes
[INFO]   ThreatFox: 5,891 hashes
[INFO] Updating YARA rules...
[INFO]   Built-in rules: 64
[INFO]   Yara-Rules/rules: 12,400
[INFO]   Neo23x0/signature-base: 8,200
[INFO]   ReversingLabs: 9,500
[INFO]   ESET IOC: 3,800
[INFO]   InQuest: 4,836
[INFO] Signature database updated successfully.
[INFO] Total: 28,428 hashes, 38,800 YARA rules
```

::: tip სრული განახლება
VirusShare-ის სრული მონაცემთა ბაზის (20M+ MD5 ჰეში) ჩასართავად გაუშვით:
```bash
sd update --full
```
ეს მეტ დროს მოითხოვს, მაგრამ ჰეშ-ს მაქსიმალური გამოყენება უზრუნველყოფს.
:::

## ნაბიჯი 3: ფაილის ან დირექტორიის სკანირება

ერთი საეჭვო ფაილის სკანირება:

```bash
sd scan /path/to/suspicious_file
```

მთელი დირექტორიის რეკურსიული სკანირება:

```bash
sd scan /home --recursive
```

სუფთა დირექტორიის მაგალითთი გამოტანა:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 0
Status:  CLEAN

Duration: 2.3s
```

საფრთხეების პოვნის შემთხვევაში გამოტანა:

```
PRX-SD Scan Report
==================
Scanned: 1,847 files
Threats: 2

  [MALICIOUS] /home/user/downloads/invoice.exe
    Match: SHA-256 hash (MalwareBazaar)
    Family: Emotet
    Action: None (use --auto-quarantine to isolate)

  [SUSPICIOUS] /home/user/downloads/tool.bin
    Match: Heuristic analysis
    Score: 45/100
    Findings: High entropy (7.8), UPX packed
    Action: None

Duration: 3.1s
```

## ნაბიჯი 4: შედეგების განხილვა და ქმედებების განხორციელება

ავტომატიზაციისთვის ან ჟურნალის ჩაწერისთვის შესაფერი დეტალური JSON ანგარიში:

```bash
sd scan /home --recursive --json
```

```json
{
  "scan_id": "a1b2c3d4",
  "timestamp": "2026-03-21T10:00:00Z",
  "files_scanned": 1847,
  "threats": [
    {
      "path": "/home/user/downloads/invoice.exe",
      "verdict": "malicious",
      "detection_layer": "hash",
      "source": "MalwareBazaar",
      "family": "Emotet",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb924..."
    }
  ],
  "duration_ms": 3100
}
```

სკანირების დროს გამოვლენილი საფრთხეების ავტომატური კარანტინიზაციისთვის:

```bash
sd scan /home --recursive --auto-quarantine
```

კარანტინიზებული ფაილები უსაფრთხო, დაშიფრულ დირექტორიაში გადადის. მათი ჩამოთვლა და აღდგენა შეგიძლიათ:

```bash
# კარანტინიზებული ფაილების ჩამოთვლა
sd quarantine list

# ფაილის კარანტინის ID-ით აღდგენა
sd quarantine restore QR-20260321-001
```

::: warning კარანტინი
კარანტინიზებული ფაილები დაშიფრულია და შემთხვევით ვერ შესრულდება. `sd quarantine restore` გამოიყენეთ მხოლოდ მაშინ, თუ დარწმუნებული ხართ, რომ ფაილი false positive-ია.
:::

## ნაბიჯი 5: რეალურ დროში მონიტორინგის ჩართვა

დირექტორიებში ახალი ან შეცვლილი ფაილების სათვალთვალოდ რეალურ დროში მონიტორის გაშვება:

```bash
sd monitor /home /tmp /var/www
```

მონიტორი წინა პლანში მუშაობს და ფაილებს მათი შექმნის ან ცვლილების მომენტში ასკანირებს:

```
[INFO] Monitoring 3 directories...
[INFO] Press Ctrl+C to stop.
[2026-03-21 10:05:32] SCAN /home/user/downloads/update.bin → CLEAN
[2026-03-21 10:07:15] SCAN /tmp/payload.sh → [MALICIOUS] YARA: linux_backdoor_reverse_shell
```

ფონური სერვისის სახით მონიტორის გასაშვებად:

```bash
# systemd სერვისის ინსტალაცია და გაშვება
sd service install
sd service start

# სერვისის სტატუსის შემოწმება
sd service status
```

## რა გაქვთ ახლა

ამ ნაბიჯების შესრულების შემდეგ თქვენი სისტემა შეიცავს:

| კომპონენტი | სტატუსი |
|-----------|--------|
| `sd` ბინარი | PATH-ში ინსტალირებული |
| ჰეშ-მონაცემთა ბაზა | 28,000+ SHA-256/MD5 ჰეში LMDB-ში |
| YARA წესები | 38,800+ წესი 8 წყაროდან |
| რეალურ დროში მონიტორი | მითითებულ დირექტორიებს ადევნებს თვალს |

## შემდეგი ნაბიჯები

- [ფაილებისა და დირექტორიების სკანირება](../scanning/file-scan) -- შეისწავლეთ `sd scan`-ის ყველა პარამეტრი, ნაკადების, გამონაკლისების და ზომის ლიმიტების ჩათვლით
- [მეხსიერების სკანირება](../scanning/memory-scan) -- გაშვებული პროცესების მეხსიერებაში in-memory საფრთხეების სკანირება
- [Rootkit-ის გამოვლენა](../scanning/rootkit) -- ბირთვული და user-space rootkit-ების შემოწმება
- [გამოვლენის ძრავა](../detection/) -- მრავალ შრეიანი კონვეიერის მუშაობის გაგება
- [YARA წესები](../detection/yara-rules) -- წესების წყაროებისა და მომხმარებლის წესების შესახებ
