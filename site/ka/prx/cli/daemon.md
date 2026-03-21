---
title: prx daemon
description: სრული PRX გაშვების გარემოს გაშვება, მათ შორის გეითვეი, არხები, cron დამგეგმავი და თვითევოლუციის ძრავა.
---

# prx daemon

გაუშვით სრული PRX გაშვების გარემო. დემონის პროცესი მართავს ყველა გრძელვადიან ქვესისტემას: HTTP/WebSocket გეითვეის, შეტყობინებების არხების კავშირებს, cron დამგეგმავს და თვითევოლუციის ძრავას.

## გამოყენება

```bash
prx daemon [OPTIONS]
```

## ვარიანტები

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--config` | `-c` | `~/.config/prx/config.toml` | კონფიგურაციის ფაილის გზა |
| `--port` | `-p` | `3120` | გეითვეის მოსმენის პორტი |
| `--host` | `-H` | `127.0.0.1` | გეითვეის მიბმის მისამართი |
| `--log-level` | `-l` | `info` | ლოგის სიტყვიერება: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | თვითევოლუციის ძრავის გამორთვა |
| `--no-cron` | | `false` | cron დამგეგმავის გამორთვა |
| `--no-gateway` | | `false` | HTTP/WS გეითვეის გამორთვა |
| `--pid-file` | | | PID-ის ჩაწერა მითითებულ ფაილში |

## რას იწყებს დემონი

გაშვებისას `prx daemon` ინიციალიზებს შემდეგ ქვესისტემებს თანმიმდევრობით:

1. **კონფიგურაციის ჩამტვირთავი** -- კითხულობს და ამოწმებს კონფიგურაციის ფაილს
2. **მეხსიერების ბექენდი** -- უკავშირდება დაკონფიგურირებულ მეხსიერების საცავს (markdown, SQLite ან PostgreSQL)
3. **გეითვეი სერვერი** -- იწყებს HTTP/WebSocket სერვერს დაკონფიგურირებულ ჰოსტსა და პორტზე
4. **არხების მენეჯერი** -- უკავშირდება ყველა ჩართულ შეტყობინებების არხს (Telegram, Discord, Slack და ა.შ.)
5. **Cron დამგეგმავი** -- ჩატვირთავს და აქტიურებს დაგეგმილ ამოცანებს
6. **თვითევოლუციის ძრავა** -- იწყებს L1/L2/L3 ევოლუციის პაიპლაინს (თუ ჩართულია)

## მაგალითები

```bash
# ნაგულისხმევი პარამეტრებით გაშვება
prx daemon

# ყველა ინტერფეისზე მიბმა 8080 პორტზე
prx daemon --host 0.0.0.0 --port 8080

# debug ლოგირებით გაშვება
prx daemon --log-level debug

# ევოლუციის გარეშე გაშვება (სასარგებლოა დებაგინგისთვის)
prx daemon --no-evolution

# მორგებული კონფიგურაციის ფაილის გამოყენება
prx daemon --config /etc/prx/production.toml
```

## სიგნალები

დემონი რეაგირებს Unix სიგნალებზე გაშვების დროის კონტროლისთვის:

| სიგნალი | ქცევა |
|---------|-------|
| `SIGHUP` | კონფიგურაციის ფაილის გადატვირთვა გადატვირთვის გარეშე. არხები და cron ამოცანები შეთანხმდება ახალ კონფიგურაციასთან. |
| `SIGTERM` | გრაციოზული გამორთვა. ასრულებს მიმდინარე მოთხოვნებს, სუფთად გათიშავს არხებს და ჩაწერს დარჩენილ მეხსიერების ჩანაწერებს. |
| `SIGINT` | იგივეა, რაც `SIGTERM` (Ctrl+C). |

```bash
# კონფიგურაციის გადატვირთვა გადატვირთვის გარეშე
kill -HUP $(cat /var/run/prx.pid)

# გრაციოზული გამორთვა
kill -TERM $(cat /var/run/prx.pid)
```

## systemd სერვისის სახით გაშვება

წარმოებაში დემონის გაშვების რეკომენდებული გზაა systemd-ის მეშვეობით. გამოიყენეთ [`prx service install`](./service) ერთეულის ფაილის ავტომატურად გენერირებისა და ინსტალაციისთვის, ან შექმენით ხელით:

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx

# გამკაცრება
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# სერვისის ინსტალაცია და გაშვება
prx service install
prx service start

# ან ხელით
sudo systemctl enable --now prx
```

## ლოგირება

დემონი ნაგულისხმევად ლოგებს stderr-ში წერს. systemd გარემოში ლოგები ჟურნალის მიერ არის აღრიცხული:

```bash
# დემონის ლოგების მიდევნება
journalctl -u prx -f

# ბოლო საათის ლოგების ჩვენება
journalctl -u prx --since "1 hour ago"
```

დააყენეთ სტრუქტურირებული JSON ლოგირება კონფიგურაციის ფაილში `log_format = "json"`-ის დამატებით ლოგების აგრეგატორებთან ინტეგრაციისთვის.

## ჯანმრთელობის შემოწმება

დემონის მუშაობის დროს გამოიყენეთ [`prx doctor`](./doctor) ან გამოიკითხეთ გეითვეის ჯანმრთელობის ენდფოინთი:

```bash
# CLI დიაგნოსტიკა
prx doctor

# HTTP ჯანმრთელობის ენდფოინთი
curl http://127.0.0.1:3120/health
```

## დაკავშირებული

- [prx gateway](./gateway) -- ცალკეული გეითვეი არხებისა და cron-ის გარეშე
- [prx service](./service) -- systemd/OpenRC სერვისის მართვა
- [prx doctor](./doctor) -- დემონის დიაგნოსტიკა
- [კონფიგურაციის მიმოხილვა](/ka/prx/config/) -- კონფიგურაციის ფაილის მითითება
- [თვითევოლუციის მიმოხილვა](/ka/prx/self-evolution/) -- ევოლუციის ძრავის დეტალები
