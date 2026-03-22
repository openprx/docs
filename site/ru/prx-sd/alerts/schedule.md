---
title: Запланированные сканирования
description: "Настройка регулярных заданий сканирования с помощью sd schedule для автоматического обнаружения угроз через заданные интервалы."
---

# Запланированные сканирования

Команда `sd schedule` управляет регулярными заданиями сканирования, выполняющимися с заданными интервалами. Запланированные сканирования дополняют мониторинг в реальном времени путём периодического полного сканирования указанных каталогов, обнаруживая угрозы, которые могли быть пропущены или появились пока мониторинг был неактивен.

## Использование

```bash
sd schedule <SUBCOMMAND> [OPTIONS]
```

### Подкоманды

| Подкоманда | Описание |
|-----------|----------|
| `add` | Создать новое задание запланированного сканирования |
| `remove` | Удалить задание запланированного сканирования |
| `list` | Список всех заданий запланированных сканирований |
| `status` | Показать статус заданий, включая время последнего и следующего запуска |
| `run` | Немедленно запустить запланированное задание вручную |

## Добавление запланированного сканирования

```bash
sd schedule add <PATH> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|-------------|----------|
| `--frequency` | `-f` | `daily` | Частота сканирования: `hourly`, `4h`, `12h`, `daily`, `weekly` |
| `--name` | `-n` | автогенерация | Читаемое название задания |
| `--recursive` | `-r` | `true` | Рекурсивное сканирование каталогов |
| `--auto-quarantine` | `-q` | `false` | Помещать обнаруженные угрозы в карантин |
| `--exclude` | `-e` | | Glob-паттерны для исключения (повторяемый) |
| `--notify` | | `true` | Отправлять оповещения при обнаружении |
| `--time` | `-t` | случайное | Предпочтительное время запуска (ЧЧ:ММ, 24-часовой формат) |
| `--day` | `-d` | `monday` | День недели для еженедельных сканирований |

### Параметры частоты

| Частота | Интервал | Случай использования |
|---------|---------|---------------------|
| `hourly` | Каждые 60 минут | Высокорисковые каталоги (загрузки, временные файлы) |
| `4h` | Каждые 4 часа | Общие каталоги, корневые папки веб-серверов |
| `12h` | Каждые 12 часов | Домашние каталоги пользователей |
| `daily` | Каждые 24 часа | Общее полное сканирование |
| `weekly` | Каждые 7 дней | Архивы с низким риском, проверка резервных копий |

### Примеры

```bash
# Ежедневное сканирование домашних каталогов
sd schedule add /home --frequency daily --name "home-daily"

# Ежечасное сканирование каталога загрузок с автокарантином
sd schedule add /var/www/uploads --frequency hourly --auto-quarantine \
  --name "uploads-hourly"

# Еженедельное полное сканирование с исключением больших медиафайлов
sd schedule add / --frequency weekly --name "full-weekly" \
  --exclude "*.iso" --exclude "*.vmdk" --exclude "/proc/*" --exclude "/sys/*"

# 4-часовое сканирование временных каталогов
sd schedule add /tmp --frequency 4h --auto-quarantine --name "tmp-4h"

# Ежедневное сканирование в определённое время
sd schedule add /home --frequency daily --time 02:00 --name "home-nightly"

# Еженедельное сканирование в воскресенье
sd schedule add /var/www --frequency weekly --day sunday --time 03:00 \
  --name "webroot-weekly"
```

## Список запланированных сканирований

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

## Проверка статуса задания

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

Подробный статус конкретного задания:

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

## Удаление запланированных сканирований

```bash
# Удалить по имени
sd schedule remove home-daily

# Удалить все запланированные сканирования
sd schedule remove --all
```

## Запуск сканирования вручную

Запустить запланированное задание немедленно, не ожидая следующего интервала:

```bash
sd schedule run home-daily
```

Это выполняет сканирование со всеми настроенными параметрами (карантин, исключения, уведомления) и обновляет временную метку последнего запуска задания.

## Как работает планирование

PRX-SD использует внутренний планировщик, а не системный cron. Планировщик работает как часть процесса демона:

```
sd daemon start
  └── Поток планировщика
        ├── Проверка интервалов заданий каждые 60 секунд
        ├── Запуск заданий сканирования по истечении интервала
        ├── Сериализация результатов в ~/.prx-sd/schedule/
        └── Отправка уведомлений по завершении
```

::: warning
Запланированные сканирования выполняются только когда демон активен. Если демон остановлен, пропущенные сканирования будут выполнены при следующем запуске демона. Используйте `sd daemon start` для обеспечения непрерывного планирования.
:::

## Файл конфигурации

Запланированные задания сохраняются в `~/.prx-sd/schedule.json` и также могут быть определены в `config.toml`:

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

## Отчёты о сканировании

Каждое запланированное сканирование генерирует отчёт, сохраняемый в `~/.prx-sd/reports/`:

```bash
# Просмотреть последний отчёт для задания
sd schedule report home-daily

# Экспортировать отчёт в формате JSON
sd schedule report home-daily --json > report.json

# Список всех отчётов
sd schedule report --list
```

::: tip
Объедините запланированные сканирования с email-оповещениями для получения автоматических отчётов. Настройте `scan_completed` в событиях email для получения сводки после каждого запланированного сканирования.
:::

## Следующие шаги

- [Вебхук-оповещения](./webhook) — получать уведомления когда запланированные сканирования находят угрозы
- [Email-оповещения](./email) — email-отчёты о запланированных сканированиях
- [Демон](/ru/prx-sd/realtime/daemon) — необходим для выполнения запланированных сканирований
- [Реагирование на угрозы](/ru/prx-sd/remediation/) — настройка действий при обнаружении угроз
