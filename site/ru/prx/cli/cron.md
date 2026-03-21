---
title: prx cron
description: Управление запланированными задачами cron, выполняемыми демоном PRX.
---

# prx cron

Управление запланированными задачами, выполняемыми планировщиком cron PRX. Задачи cron могут запускать LLM-промпты, команды оболочки или вызовы инструментов по заданному расписанию.

## Использование

```bash
prx cron <SUBCOMMAND> [OPTIONS]
```

## Подкоманды

### `prx cron list`

Вывод списка всех настроенных задач cron и их статуса.

```bash
prx cron list [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--json` | `-j` | `false` | Вывод в формате JSON |
| `--verbose` | `-v` | `false` | Показать полные детали задачи, включая выражение расписания |

**Пример вывода:**

```
 ID   Name               Schedule       Status    Last Run           Next Run
 1    daily-summary      0 9 * * *      active    2026-03-20 09:00   2026-03-21 09:00
 2    backup-memory      0 */6 * * *    active    2026-03-21 06:00   2026-03-21 12:00
 3    weekly-report      0 10 * * 1     paused    2026-03-17 10:00   --
```

### `prx cron add`

Добавление новой задачи cron.

```bash
prx cron add [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--name` | `-n` | обязательный | Имя задачи |
| `--schedule` | `-s` | обязательный | Выражение cron (5 или 6 полей) |
| `--prompt` | `-p` | | LLM-промпт для выполнения |
| `--command` | `-c` | | Команда оболочки для выполнения |
| `--channel` | | | Канал для отправки результата |
| `--provider` | `-P` | из конфигурации | LLM-провайдер для задач с промптами |
| `--model` | `-m` | по умолчанию для провайдера | Модель для задач с промптами |
| `--enabled` | | `true` | Немедленно включить задачу |

Необходимо указать либо `--prompt`, либо `--command`.

```bash
# Запланировать ежедневную сводку
prx cron add \
  --name "daily-summary" \
  --schedule "0 9 * * *" \
  --prompt "Summarize the most important news today" \
  --channel telegram-main

# Запланировать команду резервного копирования
prx cron add \
  --name "backup-memory" \
  --schedule "0 */6 * * *" \
  --command "prx memory export --format json > /backup/memory-$(date +%Y%m%d%H%M).json"

# Еженедельный отчёт каждый понедельник в 10:00
prx cron add \
  --name "weekly-report" \
  --schedule "0 10 * * 1" \
  --prompt "Generate a weekly activity report from memory" \
  --channel slack-team
```

### `prx cron remove`

Удаление задачи cron по ID или имени.

```bash
prx cron remove <ID|NAME> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--force` | `-f` | `false` | Пропустить запрос подтверждения |

```bash
prx cron remove daily-summary
prx cron remove 1 --force
```

### `prx cron pause`

Приостановка задачи cron. Задача остаётся настроенной, но не выполняется до возобновления.

```bash
prx cron pause <ID|NAME>
```

```bash
prx cron pause weekly-report
```

### `prx cron resume`

Возобновление приостановленной задачи cron.

```bash
prx cron resume <ID|NAME>
```

```bash
prx cron resume weekly-report
```

## Формат выражений cron

PRX использует стандартные 5-полевые выражения cron:

```
 ┌───────── минута (0-59)
 │ ┌───────── час (0-23)
 │ │ ┌───────── день месяца (1-31)
 │ │ │ ┌───────── месяц (1-12)
 │ │ │ │ ┌───────── день недели (0-7, 0 и 7 = воскресенье)
 │ │ │ │ │
 * * * * *
```

Распространённые примеры:

| Выражение | Описание |
|-----------|----------|
| `0 9 * * *` | Каждый день в 9:00 |
| `*/15 * * * *` | Каждые 15 минут |
| `0 */6 * * *` | Каждые 6 часов |
| `0 10 * * 1` | Каждый понедельник в 10:00 |
| `0 0 1 * *` | Первый день каждого месяца в полночь |

## См. также

- [Обзор планирования](/ru/prx/cron/) — архитектура cron и heartbeat
- [Задачи cron](/ru/prx/cron/tasks) — типы задач и детали выполнения
- [prx daemon](./daemon) — демон, запускающий планировщик cron
