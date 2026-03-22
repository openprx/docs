---
title: სიგნატურების განახლება
description: "საფრთხის ინტელექტის მონაცემთა ბაზების სიახლის შენარჩუნება sd update-ით, ინკრემენტული განახლებებითა და Ed25519 დადასტურებით."
---

# სიგნატურების განახლება

`sd update` ბრძანება ყველა კონფიგურირებული წყაროდან უახლეს საფრთხის სიგნატურებს ჩამოტვირთავს. რეგულარული განახლებები კრიტიკულია -- ახალი მავნე პროგრამის ნიმუშები ყოველ რამდენიმე წუთში ჩნდება, მოძველებული სიგნატურ-მონაცემთა ბაზა კი დაცვაში ხვრელებს ტოვებს.

## გამოყენება

```bash
sd update [OPTIONS]
```

## პარამეტრები

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--check-only` | | `false` | ჩამოტვირთვის გარეშე ხელმისაწვდომი განახლებების შემოწმება |
| `--force` | `-f` | `false` | ქეშის იგნორირებით ყველა სიგნატურის ხელახლა-ჩამოტვირთვის გაძალება |
| `--source` | `-s` | ყველა | კონკრეტული წყარო-კატეგორიის განახლება: `hashes`, `yara`, `ioc`, `clamav` |
| `--full` | | `false` | დიდი dataset-ების ჩათვლა (VirusShare 20M+ MD5 ჰეშები) |
| `--server-url` | | ოფიციალური | მომხმარებლის განახლების სერვერის URL |
| `--no-verify` | | `false` | Ed25519 სიგნატურ-დადასტურების გამოტოვება (არ არის რეკომენდებული) |
| `--timeout` | `-t` | `300` | ჩამოტვირთვის timeout წყაროზე წამებში |
| `--parallel` | `-p` | `4` | პარალელური ჩამოტვირთვების რაოდენობა |
| `--quiet` | `-q` | `false` | პროგრესის გამოტანის ჩახშობა |

## განახლებების მუშაობა

### განახლების ნაკადი

```
sd update
  1. Fetch metadata.json from update server
  2. Compare local versions with remote versions
  3. For each outdated source:
     a. Download incremental diff (or full file if no diff available)
     b. Verify Ed25519 signature
     c. Apply to local database
  4. Recompile YARA rules
  5. Update local metadata.json
```

### ინკრემენტული განახლებები

PRX-SD bandwidth-ის მინიმიზებისთვის ინკრემენტულ განახლებებს იყენებს:

| წყაროს ტიპი | განახლების მეთოდი | ტიპიური ზომა |
|-------------|--------------|-------------|
| ჰეშ-მონაცემთა ბაზები | Delta diff (დამატებები + ამოღებები) | 50-200 KB |
| YARA წესები | Git-სტილის patch-ები | 10-50 KB |
| IOC feed-ები | სრული ჩანაცვლება (მცირე ფაილები) | 1-5 MB |
| ClamAV | cdiff ინკრემენტული განახლებები | 100-500 KB |

ინკრემენტული განახლებების მიუწვდომლობისას (პირველი ინსტალაცია, კორუფცია, ან `--force`) სრული მონაცემთა ბაზები ჩამოიტვირთება.

### Ed25519 სიგნატურ-დადასტურება

ყოველი ჩამოტვირთული ფაილი გამოყენებამდე Ed25519 სიგნატურთან მოწმდება. ეს იცავს:

- **გაყალბება** -- შეცვლილი ფაილები უარყოფილია
- **კორუფცია** -- არასრული ჩამოტვირთვები გამოვლინდება
- **Replay შეტევები** -- ძველი სიგნატურები ვერ გაიმეორდება (timestamp-ის ვალიდაცია)

ხელმოწერის საჯარო გასაღები კომპილ-დროს `sd` binary-ში ჩაშენებულია.

::: warning
წარმოებაში `--no-verify` არასოდეს გამოიყენოთ. სიგნატურ-დადასტურება კომპრომეტირებული განახლების სერვერებით ან man-in-the-middle შეტევებით supply chain შეტევებისგან დასაცავად არსებობს.
:::

## განახლებების შემოწმება

ჩამოტვირთვის გარეშე ხელმისაწვდომი განახლებების სასანახავად:

```bash
sd update --check-only
```

```
Checking for updates...
  MalwareBazaar:    update available (v2026.0321.2, +847 hashes)
  URLhaus:          up to date (v2026.0321.1)
  Feodo Tracker:    update available (v2026.0321.3, +12 hashes)
  ThreatFox:        up to date (v2026.0321.1)
  YARA Community:   update available (v2026.0320.1, +3 rules)
  IOC Feeds:        update available (v2026.0321.1, +1,204 indicators)
  ClamAV:           not configured

3 sources have updates available.
Run 'sd update' to download.
```

## მომხმარებლის განახლების სერვერი

Air-gapped გარემოებისთვის ან კერძო სარკის გამომყენებელი ორგანიზაციებისთვის:

```bash
sd update --server-url https://signatures.internal.corp/prx-sd
```

`config.toml`-ში სერვერის მუდმივად დაყენება:

```toml
[update]
server_url = "https://signatures.internal.corp/prx-sd"
interval_hours = 6
auto_update = true
```

::: tip
ლოკალური სიგნატურ-სარკის დასაყენებლად `prx-sd-mirror` ინსტრუმენტის გამოყენება. დეტალებისთვის იხილეთ [self-hosting გზამკვლევი](https://github.com/OpenPRX/prx-sd-signatures).
:::

## Shell სკრიპტის ალტერნატივა

სისტემებისთვის, სადაც `sd` დაყენებული არ არის, bundled shell სკრიპტის გამოყენება:

```bash
# სტანდარტული განახლება (ჰეშები + YARA)
./tools/update-signatures.sh

# სრული განახლება VirusShare-ის ჩათვლით
./tools/update-signatures.sh --full

# მხოლოდ ჰეშების განახლება
./tools/update-signatures.sh --source hashes

# მხოლოდ YARA წესების განახლება
./tools/update-signatures.sh --source yara
```

## მაგალითები

```bash
# სტანდარტული განახლება
sd update

# ყველაფრის სრული ხელახლა-ჩამოტვირთვის გაძალება
sd update --force

# მხოლოდ YARA წესების განახლება
sd update --source yara

# VirusShare-ის ჩათვლით სრული განახლება (დიდი ჩამოტვირთვა)
sd update --full

# Cron job-ებისთვის მდუმარე რეჟიმი
sd update --quiet

# ხელმისაწვდომის პირველი შემოწმება
sd update --check-only

# მომხმარებლის სერვერის გაზრდილი პარალელიზმით გამოყენება
sd update --server-url https://mirror.example.com --parallel 8
```

## განახლებების ავტომატიზება

### sd daemon-ით

დემონი განახლებებს ავტომატურად მართავს. ინტერვალის კონფიგურაცია:

```bash
sd daemon start --update-hours 4
```

### cron-ით

```bash
# ყოველ 6 საათში სიგნატურების განახლება
0 */6 * * * /usr/local/bin/sd update --quiet 2>&1 | logger -t prx-sd
```

### systemd timer-ით

```ini
# /etc/systemd/system/prx-sd-update.timer
[Unit]
Description=PRX-SD Signature Update Timer

[Timer]
OnCalendar=*-*-* 00/6:00:00
RandomizedDelaySec=900
Persistent=true

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl enable --now prx-sd-update.timer
```

## შემდეგი ნაბიჯები

- [სიგნატურების წყაროები](./sources) -- ყოველი საფრთხის ინტელექტის წყაროს დეტალები
- [ჰეშ-იმპორტი](./import) -- მომხმარებლის ჰეშ-blocklist-ების დამატება
- [დემონი](../realtime/daemon) -- ავტომატური ფონური განახლებები
- [საფრთხის ინტელექტის მიმოხილვა](./index) -- მონაცემთა ბაზის არქიტექტურის მიმოხილვა
