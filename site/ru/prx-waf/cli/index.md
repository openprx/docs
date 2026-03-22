---
title: Справочник команд CLI
description: "Полный справочник всех команд и подкоманд CLI PRX-WAF. Управление сервером, операции с правилами, интеграция CrowdSec и обнаружение ботов."
---

# Справочник команд CLI

Интерфейс командной строки `prx-waf` предоставляет команды для управления сервером, операций с правилами, интеграции CrowdSec и обнаружения ботов.

## Глобальные параметры

| Флаг | По умолчанию | Описание |
|------|-------------|----------|
| `-c, --config <FILE>` | `configs/default.toml` | Путь к файлу конфигурации TOML |

```bash
prx-waf -c /etc/prx-waf/config.toml <COMMAND>
```

## Команды сервера

| Команда | Описание |
|---------|----------|
| `prx-waf run` | Запустить reverse proxy + API управления (блокируется навсегда) |
| `prx-waf migrate` | Выполнить только миграции базы данных |
| `prx-waf seed-admin` | Создать пользователя admin по умолчанию (admin/admin) |

```bash
# Запустить сервер
prx-waf -c configs/default.toml run

# Запустить миграции перед первым запуском
prx-waf -c configs/default.toml migrate

# Создать пользователя admin
prx-waf -c configs/default.toml seed-admin
```

::: tip
Для первоначальной настройки запустите `migrate` и `seed-admin` перед `run`. Последующие запуски требуют только `run` — миграции проверяются автоматически.
:::

## Управление правилами

Команды для управления правилами обнаружения. Все команды правил работают с настроенным каталогом правил.

| Команда | Описание |
|---------|----------|
| `prx-waf rules list` | Список всех загруженных правил |
| `prx-waf rules list --category <CAT>` | Фильтрация правил по категории |
| `prx-waf rules list --source <SRC>` | Фильтрация правил по источнику |
| `prx-waf rules info <RULE-ID>` | Подробная информация о правиле |
| `prx-waf rules enable <RULE-ID>` | Включить отключённое правило |
| `prx-waf rules disable <RULE-ID>` | Отключить правило |
| `prx-waf rules reload` | Горячая перезагрузка всех правил с диска |
| `prx-waf rules validate <PATH>` | Проверить файл правил на корректность |
| `prx-waf rules import <PATH\|URL>` | Импортировать правила из файла или URL |
| `prx-waf rules export [--format yaml]` | Экспортировать текущий набор правил |
| `prx-waf rules update` | Получить последние правила из удалённых источников |
| `prx-waf rules search <QUERY>` | Поиск правил по имени или описанию |
| `prx-waf rules stats` | Отобразить статистику правил |

### Примеры

```bash
# Список всех правил SQL-инъекций
prx-waf rules list --category sqli

# Список правил OWASP CRS
prx-waf rules list --source owasp

# Подробная информация о конкретном правиле
prx-waf rules info CRS-942100

# Отключить правило, вызывающее ложные срабатывания
prx-waf rules disable CRS-942100

# Горячая перезагрузка после редактирования правил
prx-waf rules reload

# Проверить пользовательские правила перед развёртыванием
prx-waf rules validate rules/custom/myapp.yaml

# Импортировать правила из URL
prx-waf rules import https://example.com/rules/custom.yaml

# Экспортировать все правила в формате YAML
prx-waf rules export --format yaml > all-rules.yaml

# Просмотреть статистику
prx-waf rules stats
```

## Управление источниками правил

Команды для управления удалёнными источниками правил.

| Команда | Описание |
|---------|----------|
| `prx-waf sources list` | Список настроенных источников правил |
| `prx-waf sources add <NAME> <URL>` | Добавить удалённый источник правил |
| `prx-waf sources remove <NAME>` | Удалить источник правил |
| `prx-waf sources update [NAME]` | Получить последнее из конкретного источника (или всех) |
| `prx-waf sources sync` | Синхронизировать все удалённые источники |

### Примеры

```bash
# Список всех источников
prx-waf sources list

# Добавить пользовательский источник
prx-waf sources add my-rules https://example.com/rules/latest.yaml

# Синхронизировать все источники
prx-waf sources sync

# Обновить конкретный источник
prx-waf sources update owasp-crs
```

## Интеграция CrowdSec

Команды для управления интеграцией разведки угроз CrowdSec.

| Команда | Описание |
|---------|----------|
| `prx-waf crowdsec status` | Показать статус интеграции CrowdSec |
| `prx-waf crowdsec decisions` | Список активных решений от LAPI |
| `prx-waf crowdsec test` | Проверить подключение к LAPI |
| `prx-waf crowdsec setup` | Интерактивный мастер настройки CrowdSec |

### Примеры

```bash
# Проверить статус интеграции
prx-waf crowdsec status

# Список активных решений block/captcha
prx-waf crowdsec decisions

# Проверить подключение к CrowdSec LAPI
prx-waf crowdsec test

# Запустить мастер настройки
prx-waf crowdsec setup
```

## Обнаружение ботов

Команды для управления правилами обнаружения ботов.

| Команда | Описание |
|---------|----------|
| `prx-waf bot list` | Список известных сигнатур ботов |
| `prx-waf bot add <PATTERN> [--action ACTION]` | Добавить паттерн обнаружения ботов |
| `prx-waf bot remove <PATTERN>` | Удалить паттерн обнаружения ботов |
| `prx-waf bot test <USER-AGENT>` | Проверить user-agent по правилам ботов |

### Примеры

```bash
# Список всех сигнатур ботов
prx-waf bot list

# Добавить новый паттерн бота
prx-waf bot add "(?i)my-bad-bot" --action block

# Добавить паттерн бота только для журналирования
prx-waf bot add "(?i)suspicious-crawler" --action log

# Проверить строку user-agent
prx-waf bot test "Mozilla/5.0 (compatible; Googlebot/2.1)"

# Удалить паттерн бота
prx-waf bot remove "(?i)my-bad-bot"
```

## Шаблоны использования

### Первоначальная настройка

```bash
# 1. Запустить миграции
prx-waf -c configs/default.toml migrate

# 2. Создать пользователя admin
prx-waf -c configs/default.toml seed-admin

# 3. Запустить сервер
prx-waf -c configs/default.toml run
```

### Рабочий процесс обслуживания правил

```bash
# 1. Проверить наличие обновлений правил
prx-waf rules update

# 2. Проверить после обновления
prx-waf rules validate rules/

# 3. Просмотреть изменения
prx-waf rules stats

# 4. Горячая перезагрузка
prx-waf rules reload
```

### Настройка интеграции CrowdSec

```bash
# 1. Запустить мастер настройки
prx-waf crowdsec setup

# 2. Проверить подключение
prx-waf crowdsec test

# 3. Убедиться, что решения поступают
prx-waf crowdsec decisions
```

## Следующие шаги

- [Быстрый старт](../getting-started/quickstart) — начало работы с PRX-WAF
- [Движок правил](../rules/) — понимание конвейера обнаружения
- [Справочник конфигурации](../configuration/reference) — все ключи конфигурации
