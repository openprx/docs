---
title: Справочник CLI
description: Полный справочник интерфейса командной строки prx.
---

# Справочник CLI

Бинарник `prx` является единой точкой входа для всех операций PRX — интерактивный чат, управление демоном, администрирование каналов и системная диагностика.

## Глобальные флаги

Эти флаги принимаются любой подкомандой.

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Путь к файлу конфигурации |
| `--log-level` | `-l` | `info` | Уровень детализации логов: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-color` | | `false` | Отключить цветной вывод |
| `--quiet` | `-q` | `false` | Подавить несущественный вывод |
| `--help` | `-h` | | Показать справку |
| `--version` | `-V` | | Показать версию |

## Команды

| Команда | Описание |
|---------|----------|
| [`prx agent`](./agent) | Однократное взаимодействие с LLM (удобно для конвейеров) |
| [`prx chat`](./chat) | Интерактивный терминальный чат с потоковым выводом и историей |
| [`prx daemon`](./daemon) | Запуск полной среды выполнения PRX (шлюз + каналы + cron + эволюция) |
| [`prx gateway`](./gateway) | Автономный HTTP/WebSocket шлюзовой сервер |
| [`prx onboard`](./onboard) | Интерактивный мастер настройки |
| [`prx channel`](./channel) | Управление каналами (list, add, remove, start, doctor) |
| [`prx cron`](./cron) | Управление задачами cron (list, add, remove, pause, resume) |
| [`prx evolution`](./evolution) | Операции самоэволюции (status, history, config, trigger) |
| [`prx auth`](./auth) | Управление профилями OAuth (login, refresh, logout) |
| [`prx config`](./config) | Операции с конфигурацией (schema, split, merge, get, set) |
| [`prx doctor`](./doctor) | Системная диагностика (состояние демона, статус каналов, доступность моделей) |
| [`prx service`](./service) | Управление сервисом systemd/OpenRC (install, start, stop, status) |
| [`prx skills`](./skills) | Управление навыками (list, install, remove) |
| `prx status` | Панель состояния системы |
| `prx models refresh` | Обновление каталогов моделей провайдеров |
| `prx providers` | Список всех поддерживаемых LLM-провайдеров |
| `prx completions` | Генерация автодополнений оболочки (bash, zsh, fish) |

## Быстрые примеры

```bash
# Первоначальная настройка
prx onboard

# Запуск интерактивного чата
prx chat

# Однократный запрос (удобно для скриптов)
echo "Summarize this file" | prx agent -f report.pdf

# Запуск демона со всеми сервисами
prx daemon

# Проверка состояния системы
prx doctor
```

## Автодополнения оболочки

Сгенерируйте автодополнения для вашей оболочки и добавьте их в ваш профиль:

```bash
# Bash
prx completions bash > ~/.local/share/bash-completion/completions/prx

# Zsh
prx completions zsh > ~/.zfunc/_prx

# Fish
prx completions fish > ~/.config/fish/completions/prx.fish
```

## Переменные окружения

PRX учитывает следующие переменные окружения (они переопределяют значения из файла конфигурации):

| Переменная | Описание |
|------------|----------|
| `PRX_CONFIG` | Путь к файлу конфигурации (аналогично `--config`) |
| `PRX_LOG` | Уровень логирования (аналогично `--log-level`) |
| `PRX_DATA_DIR` | Каталог данных (по умолчанию: `~/.local/share/prx`) |
| `ANTHROPIC_API_KEY` | API-ключ провайдера Anthropic |
| `OPENAI_API_KEY` | API-ключ провайдера OpenAI |
| `GOOGLE_API_KEY` | API-ключ провайдера Google Gemini |

## См. также

- [Обзор конфигурации](/ru/prx/config/) — формат и параметры файла конфигурации
- [Начало работы](/ru/prx/getting-started/installation) — инструкции по установке
- [Устранение неполадок](/ru/prx/troubleshooting/) — типичные ошибки и решения
