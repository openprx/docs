---
title: CLI ბრძანებების ცნობარი
description: "ყველა 27 sd CLI ქვე-ბრძანების სრული ცნობარი, კატეგორიების მიხედვით დაყოფილი, გლობალური პარამეტრებით და სწრაფი გამოყენების მაგალითებით."
---

# CLI ბრძანებების ცნობარი

`sd` ბრძანებათა სტრიქონის ინტერფეისი 27 ქვე-ბრძანებას 10 კატეგორიად სთავაზობს. ეს გვერდი სწრაფი ცნობარის ინდექსის სახით მუშაობს. თითოეული ბრძანება მის დეტალურ დოკუმენტაციის გვერდზე მიგვიყვანს, სადაც ხელმისაწვდომია.

## გლობალური პარამეტრები

ეს ნიშნები ნებისმიერ ქვე-ბრძანებას გადაეცემა:

| ნიშანი | ნაგულისხმევი | აღწერა |
|------|---------|-------------|
| `--log-level <LEVEL>` | `warn` | ჟურნალის დეტალობა: `trace`, `debug`, `info`, `warn`, `error` |
| `--data-dir <PATH>` | `~/.prx-sd` | სიგნატურების, კარანტინის, კონფიგურაციისა და დანამატების ძირეული მონაცემთა დირექტორია |
| `--help` | -- | ნებისმიერი ბრძანების ან ქვე-ბრძანების დახმარების ჩვენება |
| `--version` | -- | ძრავის ვერსიის ჩვენება |

```bash
# Debug ჟურნალის ჩართვა
sd --log-level debug scan /tmp

# მომხმარებლის მონაცემთა დირექტორიის გამოყენება
sd --data-dir /opt/prx-sd scan /home
```

## სკანირება

მოთხოვნით ფაილებისა და სისტემის სკანირების ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd scan <PATH>` | ფაილის ან დირექტორიის საფრთხეებზე სკანირება |
| `sd scan-memory` | გაშვებული პროცესის მეხსიერების სკანირება (მხოლოდ Linux, root საჭიროა) |
| `sd scan-usb [DEVICE]` | USB/მოხსნადი მოწყობილობების სკანირება |
| `sd check-rootkit` | Rootkit-ის ნიშნების შემოწმება (მხოლოდ Linux) |

```bash
# დირექტორიის რეკურსიული სკანირება ავტო-კარანტინიზაციით
sd scan /home --auto-quarantine

# JSON გამოტანით სკანირება ავტომატიზაციისთვის
sd scan /tmp --json

# 4 ნაკადით და HTML ანგარიშით სკანირება
sd scan /var --threads 4 --report /tmp/report.html

# შაბლონების გამორიცხვა
sd scan /home --exclude "*.log" --exclude "/home/user/.cache"

# სკანირება და ავტო-რემედიაცია (პროცესის შეჩერება, კარანტინიზება, persistence-ის გაწმენდა)
sd scan /tmp --remediate

# პროცესის მეხსიერების სკანირება
sudo sd scan-memory
sudo sd scan-memory --pid 1234

# USB მოწყობილობების სკანირება
sd scan-usb
sd scan-usb /dev/sdb1 --auto-quarantine

# Rootkit-ების შემოწმება
sudo sd check-rootkit
sudo sd check-rootkit --json
```

## რეალურ დროში მონიტორინგი

ფაილური სისტემის უწყვეტი მონიტორინგისა და ფონური დემონის ოპერაციის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd monitor <PATHS...>` | ფაილური სისტემის რეალურ დროში მონიტორინგის გაშვება |
| `sd daemon [PATHS...]` | ფონური დემონის სახით მონიტორინგით და ავტო-განახლებებით გაშვება |

```bash
# /home და /tmp ცვლილებებისთვის მონიტორი
sd monitor /home /tmp

# ბლოკ-რეჟიმით მონიტორი (fanotify, root საჭიროა)
sudo sd monitor /home --block

# ნაგულისხმევი გზებით (/home, /tmp) დემონის გაშვება
sd daemon

# მომხმარებლის განახლების ინტერვალით (ყოველ 2 საათში) დემონი
sd daemon /home /tmp /var --update-hours 2
```

## კარანტინის მართვა

AES-256-GCM დაშიფრული კარანტინის ვოლტის მართვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd quarantine list` | ყველა კარანტინიზებული ფაილის ჩამოთვლა |
| `sd quarantine restore <ID>` | კარანტინიზებული ფაილის საწყის ადგილზე აღდგენა |
| `sd quarantine delete <ID>` | კარანტინიზებული ფაილის სამუდამოდ წაშლა |
| `sd quarantine delete-all` | ყველა კარანტინიზებული ფაილის სამუდამოდ წაშლა |
| `sd quarantine stats` | კარანტინის ვოლტის სტატისტიკის ჩვენება |

```bash
# კარანტინიზებული ფაილების ჩამოთვლა
sd quarantine list

# ფაილის აღდგენა (ID-ის პირველი 8 სიმბოლო)
sd quarantine restore a1b2c3d4

# ალტერნატიულ გზაზე აღდგენა
sd quarantine restore a1b2c3d4 --to /tmp/recovered/

# კონკრეტული ჩანაწერის წაშლა
sd quarantine delete a1b2c3d4

# ყველა ჩანაწერის წაშლა (დადასტურების მოთხოვნით)
sd quarantine delete-all

# ყველა ჩანაწერის წაშლა დადასტურების გარეშე
sd quarantine delete-all --yes

# კარანტინის სტატისტიკის ნახვა
sd quarantine stats
```

## სიგნატურების მართვა

საფრთხეთა სიგნატურების განახლებისა და იმპორტის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd update` | სიგნატურების მონაცემთა ბაზის განახლებების შემოწმება და გამოყენება |
| `sd import <FILE>` | blocklist ფაილიდან ჰეშ-სიგნატურების იმპორტი |
| `sd import-clamav <FILES...>` | ClamAV სიგნატურების ფაილების იმპორტი (.cvd, .hdb, .hsb) |
| `sd info` | ძრავის ვერსიის, სიგნატურების სტატუსისა და სისტემის ინფო ჩვენება |

```bash
# სიგნატურების განახლება
sd update

# ჩამოტვირთვის გარეშე განახლებების შემოწმება
sd update --check-only

# ხელახლა ჩამოტვირთვის აიძულება
sd update --force

# მომხმარებლის ჰეშ-ფაილის იმპორტი
sd import /path/to/hashes.txt

# ClamAV სიგნატურების იმპორტი
sd import-clamav main.cvd daily.cvd

# ძრავის ინფოს ჩვენება
sd info
```

## კონფიგურაცია

ძრავის კონფიგურაციისა და remediaton პოლიტიკის მართვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd config show` | მიმდინარე კონფიგურაციის ჩვენება |
| `sd config set <KEY> <VALUE>` | კონფიგურაციის მნიშვნელობის დაყენება |
| `sd config reset` | კონფიგურაციის ნაგულისხმევ მნიშვნელობებზე დაბრუნება |
| `sd policy show` | remediation პოლიტიკის ჩვენება |
| `sd policy set <KEY> <VALUE>` | remediation პოლიტიკის მნიშვნელობის დაყენება |
| `sd policy reset` | remediation პოლიტიკის ნაგულისხმევ მნიშვნელობებზე დაბრუნება |

```bash
# კონფიგის ჩვენება
sd config show

# სკანირების ნაკადების დაყენება
sd config set scan.threads 8

# ნაგულისხმევ მნიშვნელობებზე დაბრუნება
sd config reset

# remediation პოლიტიკის ჩვენება
sd policy show
```

დეტალებისთვის იხილეთ [კონფიგურაციის მიმოხილვა](../configuration/) და [კონფიგურაციის ცნობარი](../configuration/reference).

## დაგეგმილი სკანირება

სისტემის ტაიმერებით ან cron-ით განმეორებადი სკანირების მართვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd schedule add <PATH>` | განმეორებადი დაგეგმილი სკანირების რეგისტრაცია |
| `sd schedule remove` | დაგეგმილი სკანირების ამოღება |
| `sd schedule status` | მიმდინარე განრიგის სტატუსის ჩვენება |

```bash
# /home-ის კვირეული სკანირების დაგეგმვა
sd schedule add /home --frequency weekly

# ყოველდღიური სკანირების დაგეგმვა
sd schedule add /var --frequency daily

# ხელმისაწვდომი სიხშირეები: hourly, 4h, 12h, daily, weekly
sd schedule add /tmp --frequency 4h

# განრიგის ამოღება
sd schedule remove

# განრიგის სტატუსის შემოწმება
sd schedule status
```

## გაფრთხილებები და Webhook-ები

Webhook-ებისა და ელფოსტის საშუალებით გაფრთხილებების კონფიგურაციის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd webhook list` | კონფიგურირებული webhook endpoint-ების ჩამოთვლა |
| `sd webhook add <NAME> <URL>` | Webhook endpoint-ის დამატება |
| `sd webhook remove <NAME>` | Webhook endpoint-ის ამოღება |
| `sd webhook test` | ყველა webhook-ზე სატესტო გაფრთხილების გაგზავნა |
| `sd email-alert configure` | SMTP ელფოსტის გაფრთხილებების კონფიგურაცია |
| `sd email-alert test` | სატესტო გაფრთხილების ელფოსტის გაგზავნა |
| `sd email-alert send <NAME> <LEVEL> <PATH>` | მომხმარებლის გაფრთხილების ელფოსტის გაგზავნა |

```bash
# Slack webhook-ის დამატება
sd webhook add my-slack https://hooks.slack.com/services/... --format slack

# Discord webhook-ის დამატება
sd webhook add my-discord https://discord.com/api/webhooks/... --format discord

# ზოგადი webhook-ის დამატება
sd webhook add my-webhook https://example.com/webhook

# ყველა webhook-ის ჩამოთვლა
sd webhook list

# ყველა webhook-ის ტესტი
sd webhook test

# ელფოსტის გაფრთხილებების კონფიგურაცია
sd email-alert configure

# ელფოსტის გაფრთხილებების ტესტი
sd email-alert test
```

## ქსელის დაცვა

DNS დონის რეკლამებისა და მავნე დომენების დაბლოკვის ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd adblock enable` | hosts ფაილის საშუალებით adblock დაცვის ჩართვა |
| `sd adblock disable` | adblock დაცვის გამორთვა |
| `sd adblock sync` | ყველა ფილტრის სიის ხელახლა ჩამოტვირთვა |
| `sd adblock stats` | adblock ძრავის სტატისტიკის ჩვენება |
| `sd adblock check <URL>` | URL/დომენის ბლოკირების შემოწმება |
| `sd adblock log` | ბოლო დაბლოკილი ჩანაწერების ჩვენება |
| `sd adblock add <NAME> <URL>` | მომხმარებლის ფილტრის სიის დამატება |
| `sd adblock remove <NAME>` | ფილტრის სიის ამოღება |
| `sd dns-proxy` | ფილტრაციით ლოკალური DNS proxy-ს გაშვება |

```bash
# adblock-ის ჩართვა
sudo sd adblock enable

# DNS proxy-ს გაშვება
sudo sd dns-proxy --listen 127.0.0.1:53 --upstream 1.1.1.1:53
```

დეტალებისთვის იხილეთ [Adblock](../network/adblock) და [DNS Proxy](../network/dns-proxy).

## ანგარიშგება

| ბრძანება | აღწერა |
|---------|-------------|
| `sd report <OUTPUT>` | JSON სკანირების შედეგებიდან HTML ანგარიშის გენერაცია |

```bash
# JSON გამოტანით სკანირება, შემდეგ HTML ანგარიშის გენერაცია
sd scan /home --json > results.json
sd report report.html --input results.json

# ან პირდაპირ --report ნიშნის გამოყენება
sd scan /home --report /tmp/scan-report.html
```

## სისტემა

ძრავის ტექნიკური მომსახურების, ინტეგრაციისა და თვით-განახლების ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd status` | დემონის სტატუსის ჩვენება (გაშვებული/შეჩერებული, PID, დაბლოკილი საფრთხეები) |
| `sd install-integration` | ფაილ-მენეჯერის მარჯვენა ღილაკის სკანირების ინტეგრაციის ინსტალაცია |
| `sd self-update` | ძრავის ბინარის განახლებების შემოწმება და გამოყენება |

```bash
# დემონის სტატუსის შემოწმება
sd status

# სამაგიდო ინტეგრაციის ინსტალაცია
sd install-integration

# ძრავის განახლებების შემოწმება
sd self-update --check-only

# ძრავის განახლების გამოყენება
sd self-update
```

## საზოგადოება

საზოგადოებრივი საფრთხეთა ინტელექტის გაზიარების ბრძანებები.

| ბრძანება | აღწერა |
|---------|-------------|
| `sd community status` | საზოგადოების გაზიარების კონფიგურაციის ჩვენება |
| `sd community enroll` | ამ მანქანის საზოგადოების API-ზე რეგისტრაცია |
| `sd community disable` | საზოგადოების გაზიარების გამორთვა |

```bash
# რეგისტრაციის სტატუსის შემოწმება
sd community status

# საზოგადოების გაზიარებაზე რეგისტრაცია
sd community enroll

# გაზიარების გამორთვა (credentials ინახება)
sd community disable
```

## შემდეგი ნაბიჯები

- დაწყება [სწრაფი დაწყების სახელმძღვანელოდან](../getting-started/quickstart), 5 წუთში სკანირებისთვის
- [კონფიგურაციის](../configuration/) შესწავლა ძრავის ქცევის კონფიგურირებისთვის
- [რეალურ დროში მონიტორინგის](../realtime/) დაყენება უწყვეტი დაცვისთვის
- [გამოვლენის ძრავის](../detection/) კონვეიერის შესახებ გაგება
