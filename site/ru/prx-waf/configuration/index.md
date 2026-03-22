---
title: Обзор конфигурации
description: "Как работает конфигурация PRX-WAF. Структура TOML-файла конфигурации, переопределения через переменные окружения и связь между файловой и хранящейся в базе данных конфигурацией."
---

# Конфигурация

PRX-WAF настраивается через TOML-файл, передаваемый с помощью флага `-c` / `--config`. Путь по умолчанию: `configs/default.toml`.

```bash
prx-waf -c /etc/prx-waf/config.toml run
```

## Источники конфигурации

PRX-WAF использует два уровня конфигурации:

| Источник | Область | Описание |
|---------|---------|----------|
| TOML-файл | Запуск сервера | Порты прокси, URL базы данных, кеш, HTTP/3, безопасность, кластер |
| База данных | Время выполнения | Хосты, правила, сертификаты, плагины, туннели, уведомления |

TOML-файл содержит настройки, необходимые при запуске (порты, подключение к базе данных, конфигурация кластера). Настройки времени выполнения, такие как хосты и правила, хранятся в PostgreSQL и управляются через Admin UI или REST API.

## Структура файла конфигурации

Конфигурационный TOML-файл имеет следующие разделы:

```toml
[proxy]          # Адреса прослушивания reverse proxy
[api]            # Адрес прослушивания Admin API
[storage]        # Подключение PostgreSQL
[cache]          # Настройки кеша ответов
[http3]          # Настройки HTTP/3 QUIC
[security]       # Безопасность Admin API (белый список IP, ограничение запросов, CORS)
[rules]          # Настройки движка правил (каталог, горячая перезагрузка, источники)
[crowdsec]       # Интеграция CrowdSec
[cluster]        # Кластерный режим (необязательно)
```

### Минимальная конфигурация

Минимальная конфигурация для разработки:

```toml
[proxy]
listen_addr = "0.0.0.0:80"

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url = "postgresql://prx_waf:prx_waf@127.0.0.1:5432/prx_waf"
```

### Конфигурация для продакшена

Конфигурация для продакшена со всеми функциями безопасности:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"
worker_threads  = 4

[api]
listen_addr = "127.0.0.1:9527"

[storage]
database_url    = "postgresql://prx_waf:STRONG_PASSWORD@db.internal:5432/prx_waf"
max_connections = 20

[cache]
enabled          = true
max_size_mb      = 512
default_ttl_secs = 120
max_ttl_secs     = 3600

[security]
admin_ip_allowlist     = ["10.0.0.0/8"]
max_request_body_bytes = 10485760
api_rate_limit_rps     = 100
cors_origins           = ["https://admin.example.com"]

[rules]
dir                    = "rules/"
hot_reload             = true
reload_debounce_ms     = 500
enable_builtin_owasp   = true
enable_builtin_bot     = true
enable_builtin_scanner = true
```

## Конфигурация хостов

Хосты могут быть определены в TOML-файле для статических развёртываний:

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "127.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

::: tip
Для динамических сред управляйте хостами через Admin UI или REST API вместо TOML-файла. Хосты, хранящиеся в базе данных, имеют приоритет над хостами, определёнными в TOML.
:::

## Миграции базы данных

PRX-WAF включает 8 файлов миграций, создающих требуемую схему базы данных:

```bash
# Запустить миграции
prx-waf -c configs/default.toml migrate

# Создать пользователя admin по умолчанию
prx-waf -c configs/default.toml seed-admin
```

Миграции идемпотентны и безопасны для многократного запуска.

## Docker-окружение

В Docker-развёртываниях значения конфигурации обычно задаются в `docker-compose.yml`:

```yaml
services:
  prx-waf:
    environment:
      - DATABASE_URL=postgresql://prx_waf:prx_waf@postgres:5432/prx_waf
    volumes:
      - ./configs/default.toml:/app/configs/default.toml
```

## Следующие шаги

- [Справочник конфигурации](./reference) — каждый ключ TOML с документацией и значениями по умолчанию
- [Установка](../getting-started/installation) — первоначальная настройка и миграции базы данных
- [Кластерный режим](../cluster/) — конфигурация для кластера
