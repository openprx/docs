---
title: Демон-процесс
description: Запуск PRX-SD как фонового демона с автоматическим обновлением сигнатур и постоянным мониторингом файлов.
---

# Демон-процесс

Команда `sd daemon` запускает PRX-SD как длительный фоновый процесс, объединяющий мониторинг файловой системы в реальном времени с автоматическим обновлением сигнатур. Это рекомендуемый способ запуска PRX-SD на серверах и рабочих станциях, которым нужна непрерывная защита.

## Использование

```bash
sd daemon [SUBCOMMAND] [OPTIONS]
```

### Подкоманды

| Подкоманда | Описание |
|-----------|---------|
| `start` | Запустить демон (по умолчанию, если подкоманда не указана) |
| `stop` | Остановить запущенный демон |
| `restart` | Остановить и перезапустить демон |
| `status` | Показать статус демона и статистику |

## Параметры (start)

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|-------------|----------|
| `--watch` | `-w` | `/home,/tmp` | Пути для мониторинга через запятую |
| `--update-hours` | `-u` | `6` | Интервал автоматического обновления сигнатур в часах |
| `--no-update` | | `false` | Отключить автоматическое обновление сигнатур |
| `--block` | `-b` | `false` | Включить режим блокировки (Linux fanotify) |
| `--auto-quarantine` | `-q` | `false` | Автоматически помещать угрозы в карантин |
| `--pid-file` | | `~/.prx-sd/sd.pid` | Расположение файла PID |
| `--log-file` | | `~/.prx-sd/daemon.log` | Расположение файла журнала |
| `--log-level` | `-l` | `info` | Подробность журнала: `trace`, `debug`, `info`, `warn`, `error` |
| `--config` | `-c` | `~/.prx-sd/config.toml` | Путь к файлу конфигурации |

## Что управляет демон

При запуске `sd daemon` запускает две подсистемы:

1. **Монитор файлов** — отслеживает настроенные пути на события файловой системы и сканирует новые или изменённые файлы. Эквивалентно запуску `sd monitor` с теми же путями.
2. **Планировщик обновлений** — периодически проверяет и скачивает новые сигнатуры угроз (базы хешей, правила YARA, IOC-фиды). Эквивалентно запуску `sd update` с настроенным интервалом.

## Пути мониторинга по умолчанию

Когда `--watch` не указан, демон отслеживает:

| Платформа | Пути по умолчанию |
|-----------|-----------------|
| Linux | `/home`, `/tmp` |
| macOS | `/Users`, `/tmp`, `/private/tmp` |
| Windows | `C:\Users`, `C:\Windows\Temp` |

Переопределите эти значения по умолчанию в файле конфигурации или через `--watch`:

```bash
sd daemon start --watch /home,/tmp,/var/www,/opt
```

## Проверка статуса

Используйте `sd daemon status` (или сокращение `sd status`) для просмотра состояния демона:

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

## Интеграция с systemd (Linux)

Создание сервиса systemd для автоматического запуска:

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

# Укрепление безопасности
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
Демон требует root для использования режима блокировки fanotify. Для немониторинга без блокировки можно запустить его от непривилегированного пользователя с правом чтения отслеживаемых путей.
:::

## Интеграция с launchd (macOS)

Создайте plist-файл демона запуска по адресу `/Library/LaunchDaemons/com.openprx.sd.plist`:

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

## Сигналы

| Сигнал | Поведение |
|--------|----------|
| `SIGHUP` | Перезагрузить конфигурацию и перезапустить наблюдение без полного перезапуска |
| `SIGTERM` | Плавное завершение — закончить текущее сканирование, сбросить журналы |
| `SIGINT` | То же, что `SIGTERM` |
| `SIGUSR1` | Запустить немедленное обновление сигнатур |

```bash
# Принудительное немедленное обновление
kill -USR1 $(cat ~/.prx-sd/sd.pid)
```

## Примеры

```bash
# Запустить демон с настройками по умолчанию
sd daemon start

# Запустить с пользовательскими путями и 4-часовым циклом обновления
sd daemon start --watch /home,/tmp,/var/www --update-hours 4

# Запустить с режимом блокировки и автокарантином
sudo sd daemon start --block --auto-quarantine

# Проверить статус демона
sd status

# Перезапустить демон
sd daemon restart

# Остановить демон
sd daemon stop
```

::: warning
Остановка демона отключает всю защиту в реальном времени. События файловой системы, произошедшие пока демон остановлен, не будут ретроспективно просканированы.
:::

## Следующие шаги

- [Мониторинг файлов](./monitor) — детальная настройка мониторинга
- [Защита от программ-вымогателей](./ransomware) — поведенческое обнаружение программ-вымогателей
- [Обновление сигнатур](/ru/prx-sd/signatures/update) — ручное обновление сигнатур
- [Вебхук-оповещения](/ru/prx-sd/alerts/webhook) — получение уведомлений при обнаружении угроз
