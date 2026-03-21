---
title: prx service
description: PRX-ის ინსტალაცია და მართვა სისტემურ სერვისის სახით (systemd ან OpenRC).
---

# prx service

დააინსტალირეთ, გაუშვით, შეაჩერეთ და შეამოწმეთ PRX-ის სტატუსი სისტემურ სერვისის სახით. მხარს უჭერს როგორც systemd-ს (Linux-ის უმეტესი დისტრიბუციები), ისე OpenRC-ს (Alpine, Gentoo).

## გამოყენება

```bash
prx service <SUBCOMMAND> [OPTIONS]
```

## ქვებრძანებები

### `prx service install`

სერვისის ერთეულის ფაილის გენერირება და ინსტალაცია მიმდინარე init სისტემისთვის.

```bash
prx service install [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--config` | `-c` | `~/.config/prx/config.toml` | კონფიგურაციის ფაილის გზა სერვისისთვის |
| `--user` | `-u` | მიმდინარე მომხმარებელი | მომხმარებელი, რომლის სახელითაც გაეშვება სერვისი |
| `--group` | `-g` | მიმდინარე ჯგუფი | ჯგუფი, რომლის სახელითაც გაეშვება სერვისი |
| `--bin-path` | | ავტომატურად აღმოჩენილი | `prx` ბინარის გზა |
| `--enable` | | `false` | სერვისის ჩართვა ჩატვირთვისას ავტომატურად დასაწყებად |
| `--user-service` | | `false` | ინსტალაცია მომხმარებლის დონის systemd სერვისის სახით (sudo არ არის საჭირო) |

```bash
# ინსტალაცია სისტემურ სერვისად (მოითხოვს sudo-ს)
sudo prx service install --user prx --group prx --enable

# ინსტალაცია მომხმარებლის სერვისად (sudo არ არის საჭირო)
prx service install --user-service --enable

# ინსტალაცია მორგებული კონფიგურაციის გზით
sudo prx service install --config /etc/prx/config.toml --user prx
```

ინსტალაციის ბრძანება:

1. აღმოაჩენს init სისტემას (systemd ან OpenRC)
2. გენერირებს შესაბამის სერვისის ფაილს
3. აინსტალირებს სწორ მდებარეობაში (`/etc/systemd/system/prx.service` ან `/etc/init.d/prx`)
4. არჩევითად ჩართავს სერვისს ჩატვირთვისას

### `prx service start`

PRX სერვისის გაშვება.

```bash
prx service start
```

```bash
# სისტემური სერვისი
sudo prx service start

# მომხმარებლის სერვისი
prx service start
```

### `prx service stop`

PRX სერვისის გრაციოზული შეჩერება.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

მიმდინარე სერვისის სტატუსის ჩვენება.

```bash
prx service status [OPTIONS]
```

| ფლაგი | მოკლე | ნაგულისხმევი | აღწერა |
|-------|-------|-------------|--------|
| `--json` | `-j` | `false` | გამოტანა JSON ფორმატში |

**გამოსავლის მაგალითი:**

```
 PRX Service Status
 ──────────────────
 State:      running
 PID:        12345
 Uptime:     3d 14h 22m
 Memory:     42 MB
 Init:       systemd
 Unit:       prx.service
 Enabled:    yes (start on boot)
 Config:     /etc/prx/config.toml
 Log:        journalctl -u prx
```

## გენერირებული ერთეულის ფაილები

### systemd

გენერირებული systemd ერთეულის ფაილი მოიცავს წარმოებისთვის გამკაცრების დირექტივებს:

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
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

### OpenRC

```bash
#!/sbin/openrc-run

name="PRX AI Agent Daemon"
command="/usr/local/bin/prx"
command_args="daemon --config /etc/prx/config.toml"
command_user="prx:prx"
pidfile="/run/prx.pid"
start_stop_daemon_args="--background --make-pidfile"

depend() {
    need net
    after firewall
}
```

## მომხმარებლის დონის სერვისი

ერთ მომხმარებლიან განთავსებებისთვის დააინსტალირეთ systemd-ის მომხმარებლის სერვისის სახით. ეს არ მოითხოვს root პრივილეგიებს:

```bash
prx service install --user-service --enable

# მართვა systemctl --user-ით
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## დაკავშირებული

- [prx daemon](./daemon) -- დემონის კონფიგურაცია და სიგნალები
- [prx doctor](./doctor) -- სერვისის ჯანმრთელობის შემოწმება
- [კონფიგურაციის მიმოხილვა](/ka/prx/config/) -- კონფიგურაციის ფაილის მითითება
