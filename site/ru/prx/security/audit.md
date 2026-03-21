---
title: Аудиторское журналирование
description: Система аудиторского журналирования безопасности для отслеживания всех операций, связанных с безопасностью, в PRX.
---

# Аудиторское журналирование

PRX включает встроенную систему аудиторского журналирования, фиксирующую все операции, связанные с безопасностью. `AuditLogger` отслеживает кто что делал, когда и удалось ли это -- обеспечивая защищённый от подделки след для соответствия требованиям, реагирования на инциденты и криминалистического анализа.

## Обзор

Система аудита фиксирует структурированные события для каждого действия, связанного с безопасностью:

- Попытки аутентификации (успешные и неудачные)
- Решения авторизации (разрешение и отказ)
- Изменения конфигурации
- Выполнения инструментов и события песочницы
- Доступ к памяти и модификация
- Подключения и отключения каналов
- Предложения и применения эволюции
- События жизненного цикла плагинов

Каждое событие аудита включает временную метку, идентичность актора, описание действия, целевой ресурс и результат.

## Структура события аудита

Каждое событие аудита -- структурированная запись со следующими полями:

| Поле | Тип | Описание |
|------|-----|----------|
| `timestamp` | `DateTime<Utc>` | Время события (UTC, наносекундная точность) |
| `event_id` | `String` | Уникальный идентификатор события (UUIDv7, упорядоченный по времени) |
| `actor` | `Actor` | Кто выполнил действие (пользователь, агент, система или плагин) |
| `action` | `String` | Что было сделано (напр., `auth.login`, `tool.execute`, `config.update`) |
| `target` | `String` | Ресурс, над которым выполнено действие (напр., ID сессии, ключ конфигурации, путь к файлу) |
| `outcome` | `Outcome` | Результат: `success`, `failure` или `denied` |
| `metadata` | `Map<String, Value>` | Дополнительный контекст (IP-адрес, причина отказа и т.д.) |
| `session_id` | `Option<String>` | Связанная сессия агента, если есть |
| `severity` | `Severity` | Серьёзность события: `info`, `warning`, `critical` |

### Типы акторов

| Тип актора | Описание | Пример |
|-----------|----------|--------|
| `user` | Человек-пользователь, идентифицированный через канал или API-аутентификацию | `user:telegram:123456789` |
| `agent` | Сам агент PRX | `agent:default` |
| `system` | Внутренние системные процессы (cron, эволюция) | `system:evolution` |
| `plugin` | WASM-плагин | `plugin:my-plugin:v1.2.0` |

### Категории действий

Действия следуют точечно-разделённой конвенции пространств имён:

| Категория | Действия | Серьёзность |
|-----------|----------|------------|
| `auth.*` | `auth.login`, `auth.logout`, `auth.token_refresh`, `auth.pairing` | info / warning |
| `authz.*` | `authz.allow`, `authz.deny`, `authz.policy_check` | info / warning |
| `config.*` | `config.update`, `config.reload`, `config.hot_reload` | warning |
| `tool.*` | `tool.execute`, `tool.sandbox_escape_attempt`, `tool.timeout` | info / critical |
| `memory.*` | `memory.store`, `memory.recall`, `memory.delete`, `memory.compact` | info |
| `channel.*` | `channel.connect`, `channel.disconnect`, `channel.error` | info / warning |
| `evolution.*` | `evolution.propose`, `evolution.apply`, `evolution.rollback` | warning / critical |
| `plugin.*` | `plugin.load`, `plugin.unload`, `plugin.error`, `plugin.permission_denied` | info / warning |
| `session.*` | `session.create`, `session.terminate`, `session.timeout` | info |

## Конфигурация

```toml
[security.audit]
enabled = true
min_severity = "info"           # минимальная серьёзность для журналирования: "info", "warning", "critical"

[security.audit.file]
enabled = true
path = "~/.local/share/openprx/audit.log"
format = "jsonl"                # "jsonl" или "csv"
max_size_mb = 100               # ротация при превышении этого размера
max_files = 10                  # хранить до 10 ротированных файлов
compress_rotated = true         # gzip-сжатие ротированных файлов

[security.audit.database]
enabled = false
backend = "sqlite"              # "sqlite" или "postgres"
path = "~/.local/share/openprx/audit.db"
retention_days = 90             # автоудаление событий старше 90 дней
```

## Справочник конфигурации

| Поле | Тип | По умолчанию | Описание |
|------|-----|--------------|----------|
| `enabled` | `bool` | `true` | Включить или отключить аудиторское журналирование глобально |
| `min_severity` | `String` | `"info"` | Минимальный уровень серьёзности для записи |
| `file.enabled` | `bool` | `true` | Записывать события аудита в файл журнала |
| `file.path` | `String` | `"~/.local/share/openprx/audit.log"` | Путь к файлу журнала аудита |
| `file.format` | `String` | `"jsonl"` | Формат журнала: `"jsonl"` (один JSON-объект на строку) или `"csv"` |
| `file.max_size_mb` | `u64` | `100` | Максимальный размер файла перед ротацией (МБ) |
| `file.max_files` | `u32` | `10` | Количество сохраняемых ротированных файлов |
| `file.compress_rotated` | `bool` | `true` | Сжимать ротированные файлы с помощью gzip |
| `database.enabled` | `bool` | `false` | Записывать события аудита в базу данных |
| `database.backend` | `String` | `"sqlite"` | Бэкенд базы данных: `"sqlite"` или `"postgres"` |
| `database.path` | `String` | `""` | Путь к базе данных (SQLite) или URL подключения (PostgreSQL) |
| `database.retention_days` | `u64` | `90` | Автоудаление событий старше N дней. 0 = хранить вечно |

## Бэкенды хранения

### Файл (JSONL)

Бэкенд по умолчанию записывает один JSON-объект на строку в файл журнала. Этот формат совместим со стандартными инструментами анализа журналов (jq, grep, Elasticsearch ingest).

Пример записи журнала:

```json
{
  "timestamp": "2026-03-21T10:15:30.123456789Z",
  "event_id": "019520a8-1234-7000-8000-000000000001",
  "actor": {"type": "user", "id": "user:telegram:123456789"},
  "action": "tool.execute",
  "target": "shell:ls -la /tmp",
  "outcome": "success",
  "metadata": {"sandbox": "bubblewrap", "duration_ms": 45},
  "session_id": "sess_abc123",
  "severity": "info"
}
```

### База данных (SQLite / PostgreSQL)

Бэкенд базы данных хранит события в структурированной таблице с индексами по `timestamp`, `actor`, `action` и `severity` для эффективных запросов.

## Запросы к аудиторским следам

### Запросы CLI

```bash
# Просмотр последних событий аудита
prx audit log --tail 50

# Фильтрация по категории действия
prx audit log --action "auth.*" --last 24h

# Фильтрация по серьёзности
prx audit log --severity critical --last 7d

# Фильтрация по актору
prx audit log --actor "user:telegram:123456789"

# Экспорт в JSON
prx audit log --last 30d --format json > audit_export.json
```

### Запросы к базе данных

При использовании бэкенда базы данных можно запрашивать напрямую SQL:

```sql
-- Неудачные попытки аутентификации за последние 24 часа
SELECT * FROM audit_events
WHERE action LIKE 'auth.%'
  AND outcome = 'failure'
  AND timestamp > datetime('now', '-24 hours')
ORDER BY timestamp DESC;

-- Выполнение инструментов конкретным пользователем
SELECT action, target, outcome, timestamp
FROM audit_events
WHERE actor_id = 'user:telegram:123456789'
  AND action LIKE 'tool.%'
ORDER BY timestamp DESC
LIMIT 100;

-- Сводка критических событий
SELECT action, COUNT(*) as count
FROM audit_events
WHERE severity = 'critical'
  AND timestamp > datetime('now', '-7 days')
GROUP BY action
ORDER BY count DESC;
```

## Соответствие требованиям

Система аудиторского журналирования разработана для поддержки требований соответствия:

- **Неизменяемость** -- файлы журналов только для добавления; целостность ротированных файлов проверяется контрольными суммами
- **Полнота** -- все операции, связанные с безопасностью, журналируются по умолчанию на уровне `info`
- **Хранение** -- настраиваемые сроки хранения с автоматической ротацией и удалением
- **Неотказуемость** -- каждое событие включает идентичность актора и временную метку
- **Доступность** -- двойной вывод (файл + база данных) гарантирует сохранность событий при сбое одного бэкенда

### Рекомендуемые настройки для соответствия

```toml
[security.audit]
enabled = true
min_severity = "info"

[security.audit.file]
enabled = true
format = "jsonl"
max_size_mb = 500
max_files = 50
compress_rotated = true

[security.audit.database]
enabled = true
backend = "postgres"
path = "postgresql://audit_user:password@localhost/prx_audit"
retention_days = 365
```

## Производительность

Аудиторский журнал спроектирован для минимальных накладных расходов:

- События записываются асинхронно через ограниченный канал (ёмкость по умолчанию: 10 000 событий)
- Файловые записи буферизуются и сбрасываются периодически (каждую 1 секунду или каждые 100 событий)
- Записи в базу данных пакетируются (размер пакета по умолчанию: 50 событий)
- При заполнении канала событий события отбрасываются с предупреждающим счётчиком (никогда не блокирует основной цикл агента)

## Ограничения

- Файловый бэкенд не обеспечивает встроенное обнаружение подделки (для развёртываний с высокими требованиями безопасности рассмотрите внешний мониторинг целостности)
- События аудита от кода плагинов журналируются хостом; плагины не могут обойти систему аудита
- Формат CSV не поддерживает вложенные поля метаданных (используйте JSONL для полной точности)
- Очистка хранения базы данных выполняется раз в час; события могут сохраняться немного дольше настроенного срока хранения

## Связанные страницы

- [Обзор безопасности](./)
- [Движок политик](./policy-engine) -- решения авторизации, генерирующие события аудита
- [Песочница](./sandbox) -- изоляция выполнения инструментов
- [Модель угроз](./threat-model) -- архитектура безопасности и границы доверия
