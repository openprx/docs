---
title: დაგეგმილი სკანირებები
description: "sd schedule-ით განმეორებადი სკანის სამუშაოების დაყენება ავტომატური საფრთხის გამოვლენისთვის რეგულარული ინტერვალებით."
---

# დაგეგმილი სკანირებები

`sd schedule` ბრძანება განსაზღვრულ ინტერვალებში გაშვებადი განმეორებადი სკანის სამუშაოებს მართავს. დაგეგმილი სკანირებები რეალურ დროში მონიტორინგს ავსებს მითითებული დირექტორიების პერიოდული სრული სკანირების გზით, მონიტორინგის არაქტიურობის პერიოდში შეუნიშნავი ან შემოტანილი საფრთხეების დასაჭერად.

## გამოყენება

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### ქვე-ბრძანებები

| ქვე-ბრძანება | აღწერა |
|------------|-------------|
| `add` | ახალი დაგეგმილი სკანის სამუშაოს შექმნა |
| `remove` | დაგეგმილი სკანის სამუშაოს ამოღება |
| `list` | ყველა დაგეგმილი სკანის სამუშაოს ჩამოთვლა |
| `status` | ბოლო და მომავალი გაშვების ჩათვლით დაგეგმილი სამუშაოების სტატუსის ჩვენება |
| `run` | დაგეგმილი სამუშაოს ხელით მყისიერი გაშვება |

## დაგეგმილი სკანის დამატება

```bash
sd schedule add <PATH> [OPTIONS]
```

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--frequency` | `-f` | `daily` | სკანის სიხშირე: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | ავტო-გენერირება | ამ სამუშაოს ადამიანისთვის-წასაკითხი სახელი |
| `--recursive` | `-r` | `true` | დირექტორიების რეკურსიული სკანირება |
| `--auto-quarantine` | `-q` | `false` | გამოვლენილი საფრთხეების კარანტინიზება |
| `--exclude` | `-e` | | გამოსართავი glob შაბლონები (განმეორებადი) |
| `--notify` | | `true` | გამოვლენისას alert-ების გაგზავნა |
| `--time` | `-t` | შემთხვევითი | სასურველი დაწყების დრო (HH:MM, 24-საათიანი ფორმატი) |
| `--day` | `-d` | `monday` | კვირის დღე ყოველკვირეული სკანებისთვის |

### სიხშირის პარამეტრები

| სიხშირე | ინტერვალი | გამოყენების შემთხვევა |
|-----------|----------|----------|
| `hourly` | ყოველ 60 წუთში | მაღალი-რისკის დირექტორიები (uploads, temp) |
| `4h` | ყოველ 4 საათში | გაზიარებული დირექტორიები, ვებ-root-ები |
| `12h` | ყოველ 12 საათში | მომხმარებლის სახლის დირექტორიები |
| `daily` | ყოველ 24 საათში | ზოგადი-დანიშნულების სრული სკანირებები |
| `weekly` | ყოველ 7 დღეში | დაბალ-რისკის არქივები, backup-ის შემოწმება |

### მაგალითები

```bash
# სახლის დირექტორიების ყოველდღიური სკანი
sd schedule add /home --frequency daily --name "home-daily"

# Upload დირექტორიის ყოველსაათური სკანი ავტო-კარანტინიზებით
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# დიდი მედია-ფაილების გამოსავლელი ყოველკვირეული სრული სკანი
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# Temp დირექტორიების 4-საათიანი სკანი
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# კონკრეტულ დროს ყოველდღიური სკანი
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# კვირას ყოველკვირეული სკანი
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## დაგეგმილი სკანების ჩამოთვლა

```bash
sd schedule list
```

```
Scheduled Scan Jobs (4)

Name              Path              Frequency  Auto-Q  Next Run
home-daily        /home             daily      no      2026-03-22 02:00
uploads-hourly    /var/www/uploads  hourly     yes     2026-03-21 11:00
tmp-4h            /tmp              4h         yes     2026-03-21 14:00
full-weekly       /                 weekly     no      2026-03-23 03:00 (Sun)
```

## სამუშაოს სტატუსის შემოწმება

```bash
sd schedule status
```

```
Scheduled Scan Status

Name              Last Run              Duration  Files    Threats  Status
home-daily        2026-03-21 02:00:12   8m 32s    45,231   0        clean
uploads-hourly    2026-03-21 10:00:05   45s       1,247    1        threats found
tmp-4h            2026-03-21 10:00:08   2m 12s    3,891    0        clean
full-weekly       2026-03-16 03:00:00   1h 22m    892,451  3        threats found
```

კონკრეტული სამუშაოს დეტალური სტატუსი:

```bash
sd schedule status home-daily
```

```
Job: home-daily
  Path:           /home
  Frequency:      daily (every 24h)
  Preferred Time: 02:00
  Auto-Quarantine: no
  Recursive:      yes
  Excludes:       (none)

  Last Run:       2026-03-21 02:00:12 UTC
  Duration:       8 minutes 32 seconds
  Files Scanned:  45,231
  Threats Found:  0
  Result:         Clean

  Next Run:       2026-03-22 02:00 UTC
  Total Runs:     47
  Total Threats:  3 (across all runs)
```

## დაგეგმილი სკანების ამოღება

```bash
# სახელის მიხედვით ამოღება
sd schedule remove home-daily

# ყველა დაგეგმილი სკანის ამოღება
sd schedule remove --all
```

## სკანის ხელით გაშვება

დაგეგმილი სამუშაოს შემდეგ ინტერვალის მოლოდინის გარეშე მყისიერად გაშვება:

```bash
sd schedule run home-daily
```

ეს სკანს ყველა კონფიგურირებული პარამეტრით (კარანტინი, გამორიცხვები, შეტყობინებები) ახდენს და სამუშაოს ბოლო-გაშვების timestamp-ს ახლავს.

## დაგეგმვის მუშაობა

PRX-SD სისტემ-cron-ის ნაცვლად შიდა დამგეგმავს იყენებს. დამგეგმავი დემონ-პროცესის ნაწილად მუშაობს:

```
sd daemon start
  └── Scheduler thread
        ├── Check job intervals every 60 seconds
        ├── Launch scan jobs when interval elapsed
        ├── Serialize results to ~/.prx-sd/schedule/
        └── Send notifications on completion
```

::: warning
დაგეგმილი სკანირებები მხოლოდ დემონის აქტიურობისას სრულდება. დემონის გაჩერებისას გამოტოვებული სკანირებები დემონის შემდეგი გაშვებისას სრულდება. მუდმივი დაგეგმვისთვის `sd daemon start`-ის გამოყენება.
:::

## კონფიგურაციის ფაილი

დაგეგმილი სამუშაოები `~/.prx-sd/schedule.json`-ში ინახება და `config.toml`-შიც შეიძლება განისაზღვროს:

```toml
[[schedule]]
name = "home-daily"
path = "/home"
frequency = "daily"
time = "02:00"
recursive = true
auto_quarantine = false
notify = true

[[schedule]]
name = "uploads-hourly"
path = "/var/www/uploads"
frequency = "hourly"
recursive = true
auto_quarantine = true
notify = true
exclude = ["*.tmp", "*.log"]

[[schedule]]
name = "full-weekly"
path = "/"
frequency = "weekly"
day = "sunday"
time = "03:00"
recursive = true
auto_quarantine = false
notify = true
exclude = ["*.iso", "*.vmdk", "/proc/*", "/sys/*", "/dev/*"]
```

## სკანირების ანგარიშები

ყოველი დაგეგმილი სკანირება `~/.prx-sd/reports/`-ში შენახულ ანგარიშს წარმოქმნის:

```bash
# სამუშაოს ბოლო ანგარიშის ნახვა
sd schedule report home-daily

# ანგარიშის JSON-ად ექსპორტი
sd schedule report home-daily --json > report.json

# ყველა ანგარიშის ჩამოთვლა
sd schedule report --list
```

::: tip
ავტომატური ანგარიშებისთვის დაგეგმილი სკანირებების email alert-ებთან კომბინირება. ყოველი დაგეგმილი სკანის შემდეგ შეჯამების მისაღებად `scan_completed` email მოვლენებში კონფიგურაცია.
:::

## შემდეგი ნაბიჯები

- [Webhook Alert-ები](./webhook) -- დაგეგმილი სკანების საფრთხეების პოვნისას შეტყობინება
- [Email Alert-ები](./email) -- დაგეგმილი სკანების email ანგარიშები
- [დემონი](/ka/prx-sd/realtime/daemon) -- დაგეგმილი სკანის შესასრულებლად საჭირო
- [საფრთხეზე რეაგირება](/ka/prx-sd/remediation/) -- საფრთხეების პოვნისას მოქმედების კონფიგურაცია
