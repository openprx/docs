---
title: prx service
description: Установка и управление PRX как системным сервисом (systemd или OpenRC).
---

# prx service

Установка, запуск, остановка и проверка статуса PRX как системного сервиса. Поддерживаются systemd (большинство дистрибутивов Linux) и OpenRC (Alpine, Gentoo).

## Использование

```bash
prx service <SUBCOMMAND> [OPTIONS]
```

## Подкоманды

### `prx service install`

Генерация и установка юнит-файла сервиса для текущей init-системы.

```bash
prx service install [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Путь к файлу конфигурации для сервиса |
| `--user` | `-u` | текущий пользователь | Пользователь для запуска сервиса |
| `--group` | `-g` | текущая группа | Группа для запуска сервиса |
| `--bin-path` | | автоопределение | Путь к бинарнику `prx` |
| `--enable` | | `false` | Включить автозапуск сервиса при загрузке |
| `--user-service` | | `false` | Установить как пользовательский systemd-сервис (без sudo) |

```bash
# Установка как системный сервис (требуется sudo)
sudo prx service install --user prx --group prx --enable

# Установка как пользовательский сервис (без sudo)
prx service install --user-service --enable

# Установка с пользовательским путём конфигурации
sudo prx service install --config /etc/prx/config.toml --user prx
```

Команда установки:

1. Определяет init-систему (systemd или OpenRC)
2. Генерирует соответствующий файл сервиса
3. Устанавливает его в нужное расположение (`/etc/systemd/system/prx.service` или `/etc/init.d/prx`)
4. При необходимости включает автозапуск при загрузке

### `prx service start`

Запуск сервиса PRX.

```bash
prx service start
```

```bash
# Системный сервис
sudo prx service start

# Пользовательский сервис
prx service start
```

### `prx service stop`

Корректная остановка сервиса PRX.

```bash
prx service stop
```

```bash
sudo prx service stop
```

### `prx service status`

Отображение текущего статуса сервиса.

```bash
prx service status [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--json` | `-j` | `false` | Вывод в формате JSON |

**Пример вывода:**

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

## Генерируемые юнит-файлы

### systemd

Генерируемый юнит-файл systemd включает директивы усиления безопасности для промышленной эксплуатации:

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

## Пользовательский сервис

Для однопользовательских развёртываний установите как пользовательский systemd-сервис. Для этого не требуются привилегии root:

```bash
prx service install --user-service --enable

# Управление через systemctl --user
systemctl --user status prx
systemctl --user restart prx
journalctl --user -u prx -f
```

## См. также

- [prx daemon](./daemon) — конфигурация и сигналы демона
- [prx doctor](./doctor) — проверка состояния сервиса
- [Обзор конфигурации](/ru/prx/config/) — справочник файла конфигурации
