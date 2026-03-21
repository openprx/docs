---
title: prx channel
description: Управление подключениями каналов обмена сообщениями — список, добавление, удаление, запуск и диагностика каналов.
---

# prx channel

Управление каналами обмена сообщениями, к которым подключается PRX. Каналы — это мосты между мессенджер-платформами (Telegram, Discord, Slack и т.д.) и средой выполнения агента PRX.

## Использование

```bash
prx channel <SUBCOMMAND> [OPTIONS]
```

## Подкоманды

### `prx channel list`

Вывод списка всех настроенных каналов и их текущего статуса.

```bash
prx channel list [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--json` | `-j` | `false` | Вывод в формате JSON |
| `--verbose` | `-v` | `false` | Показать подробную информацию о подключении |

**Пример вывода:**

```
 Name         Type       Status      Uptime
 telegram-main  telegram   connected   3d 14h
 discord-dev    discord    connected   3d 14h
 slack-team     slack      error       --
 cli            cli        stopped     --
```

### `prx channel add`

Добавление новой конфигурации канала интерактивно или с помощью флагов.

```bash
prx channel add [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--type` | `-t` | | Тип канала (например, `telegram`, `discord`, `slack`) |
| `--name` | `-n` | автогенерация | Отображаемое имя канала |
| `--token` | | | Токен бота или API-ключ |
| `--enabled` | | `true` | Немедленно включить канал |
| `--interactive` | `-i` | `true` | Использовать интерактивный мастер |

```bash
# Интерактивный режим (пошаговые подсказки)
prx channel add

# Неинтерактивный с флагами
prx channel add --type telegram --name my-bot --token "123456:ABC-DEF"
```

### `prx channel remove`

Удаление конфигурации канала.

```bash
prx channel remove <NAME> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--force` | `-f` | `false` | Пропустить запрос подтверждения |

```bash
prx channel remove slack-team
prx channel remove slack-team --force
```

### `prx channel start`

Запуск (или перезапуск) конкретного канала без перезапуска демона.

```bash
prx channel start <NAME>
```

```bash
# Перезапуск канала, в котором произошла ошибка
prx channel start slack-team
```

Эта команда отправляет управляющее сообщение работающему демону. Для работы команды демон должен быть запущен.

### `prx channel doctor`

Запуск диагностики подключений каналов. Проверяются валидность токена, сетевое подключение, URL вебхуков и разрешения.

```bash
prx channel doctor [NAME]
```

Если `NAME` не указано, проверяются все каналы.

```bash
# Проверка всех каналов
prx channel doctor

# Проверка конкретного канала
prx channel doctor telegram-main
```

**Пример вывода:**

```
 telegram-main
   Token valid ...................... OK
   API reachable ................... OK
   Webhook URL configured ......... OK
   Bot permissions ................. OK (read, send, edit, delete)

 slack-team
   Token valid ...................... OK
   API reachable ................... FAIL (timeout after 5s)
   Suggestion: Check network connectivity or Slack API status
```

## Примеры

```bash
# Полный рабочий процесс: добавление, проверка, запуск
prx channel add --type discord --name dev-server --token "MTIz..."
prx channel doctor dev-server
prx channel start dev-server

# Список каналов в формате JSON для скриптов
prx channel list --json | jq '.[] | select(.status == "error")'
```

## См. также

- [Обзор каналов](/ru/prx/channels/) — подробная документация по каналам
- [prx daemon](./daemon) — демон, управляющий подключениями каналов
- [prx doctor](./doctor) — полная системная диагностика, включая каналы
