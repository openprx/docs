---
title: prx config
description: Просмотр и изменение конфигурации PRX из командной строки.
---

# prx config

Чтение, запись, валидация и преобразование файла конфигурации PRX без ручного редактирования TOML.

## Использование

```bash
prx config <SUBCOMMAND> [OPTIONS]
```

## Подкоманды

### `prx config get`

Чтение значения конфигурации по точечному пути ключа.

```bash
prx config get <KEY> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Путь к файлу конфигурации |
| `--json` | `-j` | `false` | Вывод значения в формате JSON |

```bash
# Получить провайдера по умолчанию
prx config get providers.default

# Получить порт шлюза
prx config get gateway.port

# Получить целый раздел в формате JSON
prx config get providers --json
```

### `prx config set`

Установка значения конфигурации.

```bash
prx config set <KEY> <VALUE> [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Путь к файлу конфигурации |

```bash
# Изменить провайдера по умолчанию
prx config set providers.default "anthropic"

# Изменить порт шлюза
prx config set gateway.port 8080

# Установить булево значение
prx config set evolution.l1.enabled true

# Установить вложенное значение
prx config set providers.anthropic.default_model "claude-sonnet-4-20250514"
```

### `prx config schema`

Вывод полной JSON-схемы конфигурации. Полезно для автодополнения и валидации в редакторе.

```bash
prx config schema [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--output` | `-o` | stdout | Записать схему в файл |
| `--format` | | `json` | Формат вывода: `json` или `yaml` |

```bash
# Вывод схемы в stdout
prx config schema

# Сохранить схему для интеграции с редактором
prx config schema --output ~/.config/prx/schema.json
```

### `prx config split`

Разбиение монолитного файла конфигурации на файлы по секциям. Создаётся каталог конфигурации с отдельными файлами для провайдеров, каналов, cron и т.д.

```bash
prx config split [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Исходный файл конфигурации |
| `--output-dir` | `-o` | `~/.config/prx/config.d/` | Каталог вывода |

```bash
prx config split

# Результат:
# ~/.config/prx/config.d/
#   providers.toml
#   channels.toml
#   cron.toml
#   memory.toml
#   evolution.toml
#   gateway.toml
#   security.toml
```

### `prx config merge`

Объединение разделённого каталога конфигурации обратно в единый файл.

```bash
prx config merge [OPTIONS]
```

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--input-dir` | `-i` | `~/.config/prx/config.d/` | Исходный каталог |
| `--output` | `-o` | `~/.config/prx/config.toml` | Файл вывода |
| `--force` | `-f` | `false` | Перезаписать существующий файл вывода |

```bash
prx config merge --output /etc/prx/config.toml --force
```

## Примеры

```bash
# Быстрый просмотр конфигурации
prx config get .  # вывод всей конфигурации

# Обновление ключа провайдера
prx config set providers.anthropic.api_key "sk-ant-..."

# Генерация схемы для VS Code
prx config schema --output ~/.config/prx/schema.json
# Затем в settings.json VS Code:
# "json.schemas": [{"fileMatch": ["**/prx/config.toml"], "url": "./schema.json"}]

# Резервное копирование и разбиение для контроля версий
cp ~/.config/prx/config.toml ~/.config/prx/config.toml.bak
prx config split
cd ~/.config/prx/config.d && git init && git add . && git commit -m "initial config"
```

## См. также

- [Обзор конфигурации](/ru/prx/config/) — формат и структура файла конфигурации
- [Полный справочник](/ru/prx/config/reference) — все параметры конфигурации
- [Горячая перезагрузка](/ru/prx/config/hot-reload) — перезагрузка конфигурации во время работы
- [Переменные окружения](/ru/prx/config/environment) — переопределение через переменные окружения
