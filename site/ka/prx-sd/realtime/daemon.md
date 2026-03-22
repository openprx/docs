---
title: დემონ-პროცესი
description: PRX-SD-ის ფონური დემონად გაშვება სიგნატურების ავტომატური განახლებებითა და მუდმივი ფაილ-მონიტორინგით.
---

# დემონ-პროცესი

`sd daemon` ბრძანება PRX-SD-ს გრძელვადიანი ფონური პროცესად იწყებს, რომელიც რეალურ დროში ფაილ-მონიტორინგს სიგნატურების ავტომატურ განახლებებთან აერთიანებს. ეს PRX-SD-ის სერვერებსა და სამუშაო სადგურებზე გაშვების რეკომენდებული გზაა, რომლებსაც მუდმივი დაცვა სჭირდება.

## გამოყენება

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### ქვე-ბრძანებები

| ქვე-ბრძანება | აღწერა |
|------------|-------------|
| `start` | დემონის გაშვება (ნაგულისხმევი, ქვე-ბრძანების გარეშე) |
| `stop` | გაშვებული დემონის გაჩერება |
| `restart` | დემონის გაჩერება და გადაშვება |
| `status` | დემონის სტატუსის და სტატისტიკის ჩვენება |

## პარამეტრები (start)

| ნიშანი | მოკლე | ნაგულისხმევი | აღწერა |
|------|-------|---------|-------------|
| `--watch` | `-w` | `/home,/tmp` | მისათვალთვალებელი გზების მძიმე-გამყოფი სია |
| `--update-hours` | `-u` | `6` | სიგნატურების ავტომატური განახლების ინტერვალი საათებში |
| `--no-update` | | `false` | სიგნატურების ავტომატური განახლებების გამორთვა |
| `--block` | `-b` | `false` | blocking რეჟიმის ჩართვა (Linux fanotify) |
| `--auto-quarantine` | `-q` | `false` | საფრთხეების ავტომატური კარანტინიზება |
| `--pid-file` | | `~/.prx-sd/sd.pid` | PID ფაილის ადგილმდებარეობა |
| `--log-file` | | `~/.prx-sd/daemon.log` | ჟურნალის ფაილის ადგილმდებარეობა |
| `--log-level` | `-l` | `info` | ჟურნალის მოცულობა: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | კონფიგურაციის ფაილის გზა |

## დემონის მიერ მართული სისტემები

გაშვებისას `sd daemon` ორ ქვე-სისტემას იწყებს:

1. **ფაილ-მონიტორი** -- კონფიგურირებულ გზებს ფაილ-სისტემის მოვლენებზე აკვირდება და ახლებ ან შეცვლილ ფაილებს სკანირებს. `sd monitor`-ის იმავე გზებით გაშვების ეკვივალენტი.
2. **განახლების დამგეგმავი** -- პერიოდულად ახალ საფრთხის სიგნატურებს (ჰეშ-მონაცემთა ბაზები, YARA წესები, IOC feed-ები) ამოწმებს და ჩამოტვირთავს. კონფიგურირებული ინტერვალით `sd update`-ის გაშვების ეკვივალენტი.

## ნაგულისხმევი მონიტორინგის გზები

`--watch`-ის მითითების გარეშე დემონი ამ გზებს ადევნებს:

| პლატფორმა | ნაგულისხმევი გზები |
|----------|--------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

ამ ნაგულისხმევის გადაკეთება კონფიგის ფაილში ან `--watch`-ით:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## სტატუსის შემოწმება

დემონის მდგომარეობის სანახავად `sd daemon status`-ის (ან შემოკლებული `sd status`-ის) გამოყენება:

```bash
sd status
```

```
PRX-SD Daemon Status
  State:          running (PID 48231)
  Uptime:         3 days, 14 hours, 22 minutes
  Watched paths:  /home, /tmp
  Files scanned:  12,847
  Threats found:  3 (2 quarantined, 1 reported)
  Last update:    2026-03-21 08:00:12 UTC (signatures v2026.0321.1)
  Next update:    2026-03-21 14:00:12 UTC
  Memory usage:   42 MB
```

## systemd ინტეგრაცია (Linux)

ავტომატური გაშვებისთვის systemd სერვისის შექმნა:

```ini
[Unit]
Description=PRX-SD Antivirus Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=forking
ExecStart=/usr/local/bin/sd daemon start
ExecStop=/usr/local/bin/sd daemon stop
ExecReload=/bin/kill -HUP $MAINPID
PIDFile=/var/lib/prx-sd/sd.pid
Restart=on-failure
RestartSec=10
User=root

# Security hardening
NoNewPrivileges=yes
ProtectSystem=strict
ReadWritePaths=/var/lib/prx-sd /home /tmp

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now prx-sd
sudo systemctl status prx-sd
sudo journalctl -u prx-sd -f
```

::: tip
fanotify blocking რეჟიმისთვის დემონს root სჭირდება. არა-blocking მონიტორინგისთვის მის გაშვება შეიძლება მიმდევნებელ გზებზე წვდომის მქონე არა-პრივილეგირებულ მომხმარებლად.
:::

## launchd ინტეგრაცია (macOS)

launch daemon plist-ის შექმნა `/Library/LaunchDaemons/com.openprx.sd.plist`-ზე:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openprx.sd</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sd</string>
        <string>daemon</string>
        <string>start</string>
        <string>--watch</string>
        <string>/Users,/tmp</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/var/log/prx-sd.log</string>
    <key>StandardErrorPath</key>
    <string>/var/log/prx-sd.log</string>
</dict>
</plist>
```

```bash
sudo launchctl load /Library/LaunchDaemons/com.openprx.sd.plist
sudo launchctl list | grep openprx
```

## სიგნალები

| სიგნალი | ქცევა |
|--------|----------|
| `SIGHUP` | სრული გადაშვების გარეშე კონფიგურაციის გადატვირთვა და watches-ის გადაშვება |
| `SIGTERM` | გრაციოზული shutdown -- მიმდინარე სკანის დასრულება, ჟურნალების flush |
| `SIGINT` | `SIGTERM`-ის ანალოგი |
| `SIGUSR1` | მყისიერი სიგნატურების განახლების გაშვება |

```bash
# მყისიერი განახლების გაძალება
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## მაგალითები

```bash
# ნაგულისხმევი პარამეტრებით დემონის გაშვება
sd daemon start

# მომხმარებლის watch გზებითა და 4-საათიანი განახლების ციკლით გაშვება
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# blocking რეჟიმითა და ავტო-კარანტინიზებით გაშვება
sudo sd daemon start --block --auto-quarantine

# დემონის სტატუსის შემოწმება
sd status

# დემონის გადაშვება
sd daemon restart

# დემონის გაჩერება
sd daemon stop
```

::: warning
დემონის გაჩერება ყველა რეალურ დროში დაცვას გამორთავს. დემონის გაჩერებისას ფაილ-სისტემის მოვლენები რეტროაქტიულად არ სკანირდება.
:::

## შემდეგი ნაბიჯები

- [ფაილ-მონიტორინგი](./monitor) -- მონიტორინგის დეტალური კონფიგურაცია
- [გამოსასყიდი პროგრამის დაცვა](./ransomware) -- ქცევითი გამოსასყიდ-გამოვლენა
- [სიგნატურების განახლება](/ka/prx-sd/signatures/update) -- ხელით სიგნატურების განახლება
- [Webhook Alert-ები](/ka/prx-sd/alerts/webhook) -- საფრთხეების პოვნისას შეტყობინება
