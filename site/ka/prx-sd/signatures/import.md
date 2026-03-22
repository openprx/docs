---
title: ჰეშ-იმპორტი
description: PRX-SD-ში მომხმარებლის ჰეშ-blocklist-ებისა და ClamAV სიგნატურ-მონაცემთა ბაზების იმპორტი.
---

# ჰეშ-იმპორტი

PRX-SD გაძლევთ საშუალებას, გამოვლენის გადაფარვის საკუთარი საფრთხის ინტელექტით ან ორგანიზაციული blocklist-ებით გასაფართოებლად მომხმარებლის ჰეშ-blocklist-ები და ClamAV სიგნატურ-მონაცემთა ბაზები შემოიტანოთ.

## მომხმარებლის ჰეშ-იმპორტი

### გამოყენება

```bash
sd import [OPTIONS] <FILE>
```

### პარამეტრები

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--format` | `-f` | ავტო-გამოვლენა | ჰეშ-ფორმატი: `sha256`, `sha1`, `md5`, `auto` |
| `--label` | `-l` | ფაილ-სახელი | იმპორტირებული ნაკრების ეტიკეტი |
| `--replace` | | `false` | იმავე ეტიკეტის მქონე არსებული ჩანაწერების ჩანაცვლება |
| `--dry-run` | | `false` | იმპორტის გარეშე ფაილის ვალიდაცია |
| `--quiet` | `-q` | `false` | პროგრესის გამოტანის ჩახშობა |

### მხარდაჭერილი ჰეშ-ფაილ-ფორმატები

PRX-SD რამდენიმე გავრცელებულ ფორმატს იღებს:

**მარტივი სია** -- სტრიქონზე ერთი ჰეში:

```
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

**ჰეში ეტიკეტით** -- ჰეში, მასდევი სივრცე და სურვილისამებრ აღწერა:

```
e3b0c44298fc1c149afbf4c8996fb924  empty_file
d7a8fbb307d7809469ca9abcb0082e4f  known_malware_sample
```

**CSV ფორმატი** -- header-ებიანი მძიმე-გამყოფი:

```csv
hash,family,source
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855,Emotet,internal
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592,TrickBot,partner
```

**კომენტარ-სტრიქონები** -- `#`-ით დაწყებული სტრიქონები იგნორირდება:

```
# Custom blocklist - updated 2026-03-21
# Source: internal threat hunting team
e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
d7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592
```

::: tip
ჰეშ-ფორმატი სიგრძის მიხედვით ავტომატურად გამოვლინდება: 32 სიმბოლო = MD5, 40 სიმბოლო = SHA-1, 64 სიმბოლო = SHA-256. გამოვლენის წარუმატებლობისას `--format`-ით გადასაკეთებლად გამოიყენეთ.
:::

### იმპორტის მაგალითები

```bash
# SHA-256 blocklist-ის იმპორტი
sd import threat_hashes.txt

# ექსპლიციტური ფორმატისა და ეტიკეტის იმპორტი
sd import --format md5 --label "partner-feed-2026Q1" partner_hashes.txt

# ფაილის dry run ვალიდაცია
sd import --dry-run suspicious_hashes.csv

# არსებული იმპორტ-ნაკრების ჩანაცვლება
sd import --replace --label "daily-feed" today_hashes.txt
```

### იმპორტის გამოტანა

```
Importing hashes from threat_hashes.txt...
  Format:    SHA-256 (auto-detected)
  Label:     threat_hashes
  Total:     1,247 lines
  Valid:     1,203 hashes
  Skipped:   44 (duplicates: 38, invalid: 6)
  Imported:  1,203 new entries
  Database:  ~/.prx-sd/signatures/hashes/custom.lmdb
```

## ClamAV მონაცემთა ბაზების იმპორტი

### გამოყენება

```bash
sd import-clamav [OPTIONS] <FILE>
```

### პარამეტრები

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--type` | `-t` | ავტო-გამოვლენა | მონაცემთა ბაზის ტიპი: `cvd`, `cld`, `hdb`, `hsb`, `auto` |
| `--quiet` | `-q` | `false` | პროგრესის გამოტანის ჩახშობა |

### მხარდაჭერილი ClamAV ფორმატები

| ფორმატი | გაფართოება | აღწერა |
|--------|-----------|-------------|
| **CVD** | `.cvd` | ClamAV Virus Database (შეკუმშული, ხელმოწერილი) |
| **CLD** | `.cld` | ClamAV Local Database (ინკრემენტული განახლებები) |
| **HDB** | `.hdb` | MD5 ჰეშ-მონაცემთა ბაზა (plain text) |
| **HSB** | `.hsb` | SHA-256 ჰეშ-მონაცემთა ბაზა (plain text) |
| **NDB** | `.ndb` | გაფართოებული სიგნატურ-ფორმატი (body-ზე დაფუძნებული) |

::: warning
CVD/CLD ფაილები ძალიან დიდი შეიძლება იყოს. მარტო `main.cvd` ფაილი 6 მილიონზე მეტ სიგნატურას შეიცავს და იმპორტის შემდეგ დაახლოებით 300 MB disk-ის სივრცეს საჭიროებს.
:::

### ClamAV იმპორტის მაგალითები

```bash
# ClamAV-ის ძირითადი მონაცემთა ბაზის იმპორტი
sd import-clamav /var/lib/clamav/main.cvd

# ყოველდღიური განახლების მონაცემთა ბაზის იმპორტი
sd import-clamav /var/lib/clamav/daily.cvd

# Plain-text ჰეშ-მონაცემთა ბაზის იმპორტი
sd import-clamav custom_sigs.hdb

# SHA-256 ჰეშ-მონაცემთა ბაზის იმპორტი
sd import-clamav my_hashes.hsb
```

### ClamAV ინტეგრაციის დაყენება

PRX-SD-თან ClamAV სიგნატურების გამოყენებისთვის:

1. freshclam-ის (ClamAV updater) ინსტალაცია:

```bash
# Debian/Ubuntu
sudo apt install clamav

# macOS
brew install clamav

# Fedora/RHEL
sudo dnf install clamav-update
```

2. მონაცემთა ბაზების ჩამოტვირთვა:

```bash
sudo freshclam
```

3. PRX-SD-ში იმპორტი:

```bash
sd import-clamav /var/lib/clamav/main.cvd
sd import-clamav /var/lib/clamav/daily.cvd
```

4. კონფიგში ClamAV-ის ჩართვა:

```toml
[signatures.sources]
clamav = true
```

## იმპორტირებული ჰეშ-ნაკრებების მართვა

იმპორტირებული ჰეშ-ნაკრებების ნახვა:

```bash
sd info --imports
```

```
Custom Hash Imports:
  threat_hashes       1,203 SHA-256  imported 2026-03-21
  partner-feed-2026Q1   847 MD5      imported 2026-03-15
  daily-feed          2,401 SHA-256  imported 2026-03-21

ClamAV Imports:
  main.cvd            6,234,109 sigs  imported 2026-03-20
  daily.cvd           1,847,322 sigs  imported 2026-03-21
```

იმპორტ-ნაკრების ამოღება:

```bash
sd import --remove --label "partner-feed-2026Q1"
```

## შემდეგი ნაბიჯები

- [მომხმარებლის YARA წესები](./custom-rules) -- შაბლონ-ზე დაფუძნებული გამოვლენის წესების დაწერა
- [სიგნატურების წყაროები](./sources) -- ყველა ხელმისაწვდომი საფრთხის ინტელექტის წყარო
- [სიგნატურების განახლება](./update) -- მონაცემთა ბაზების სიახლის შენარჩუნება
- [საფრთხის ინტელექტის მიმოხილვა](./index) -- მონაცემთა ბაზის არქიტექტურა
