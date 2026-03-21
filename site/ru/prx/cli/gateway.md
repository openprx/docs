---
title: prx gateway
description: Запуск автономного HTTP/WebSocket шлюзового сервера без каналов и cron.
---

# prx gateway

Запуск HTTP/WebSocket шлюзового сервера как автономного процесса. В отличие от [`prx daemon`](./daemon), эта команда запускает только шлюз — без каналов, планировщика cron и движка эволюции.

Это полезно для развёртываний, где вы хотите предоставить API PRX без полного демона, или когда каналы и планирование запускаются как отдельные процессы.

## Использование

```bash
prx gateway [OPTIONS]
```

## Параметры

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Путь к файлу конфигурации |
| `--port` | `-p` | `3120` | Порт прослушивания |
| `--host` | `-H` | `127.0.0.1` | Адрес привязки |
| `--log-level` | `-l` | `info` | Уровень детализации логов: `trace`, `debug`, `info`, `warn`, `error` |
| `--cors-origin` | | `*` | Разрешённые CORS-источники (через запятую) |
| `--tls-cert` | | | Путь к файлу TLS-сертификата |
| `--tls-key` | | | Путь к файлу закрытого TLS-ключа |

## Эндпоинты

Шлюз предоставляет следующие группы эндпоинтов:

| Путь | Метод | Описание |
|------|-------|----------|
| `/health` | GET | Проверка состояния (возвращает `200 OK`) |
| `/api/v1/chat` | POST | Отправка сообщения чата |
| `/api/v1/chat/stream` | POST | Отправка сообщения чата (потоковый SSE) |
| `/api/v1/sessions` | GET, POST | Управление сессиями |
| `/api/v1/sessions/:id` | GET, DELETE | Операции с одной сессией |
| `/api/v1/tools` | GET | Список доступных инструментов |
| `/api/v1/memory` | GET, POST | Операции с памятью |
| `/ws` | WS | WebSocket-эндпоинт для связи в реальном времени |
| `/webhooks/:channel` | POST | Приёмник входящих вебхуков для каналов |

Подробная документация по API — в разделах [HTTP API шлюза](/ru/prx/gateway/http-api) и [WebSocket шлюза](/ru/prx/gateway/websocket).

## Примеры

```bash
# Запуск на порту по умолчанию
prx gateway

# Привязка ко всем интерфейсам на порту 8080
prx gateway --host 0.0.0.0 --port 8080

# С TLS
prx gateway --tls-cert /etc/prx/cert.pem --tls-key /etc/prx/key.pem

# Ограничение CORS
prx gateway --cors-origin "https://app.example.com,https://admin.example.com"

# Отладочное логирование
prx gateway --log-level debug
```

## За обратным прокси

В промышленной эксплуатации размещайте шлюз за обратным прокси (Nginx, Caddy и т.д.) для терминации TLS и балансировки нагрузки:

```
# Пример Caddy
api.example.com {
    reverse_proxy localhost:3120
}
```

```nginx
# Пример Nginx
server {
    listen 443 ssl;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3120;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## Сигналы

| Сигнал | Поведение |
|--------|-----------|
| `SIGHUP` | Перезагрузка конфигурации |
| `SIGTERM` | Корректное завершение (дожидается завершения текущих запросов) |

## См. также

- [prx daemon](./daemon) — полная среда выполнения (шлюз + каналы + cron + эволюция)
- [Обзор шлюза](/ru/prx/gateway/) — архитектура шлюза
- [HTTP API шлюза](/ru/prx/gateway/http-api) — справочник REST API
- [WebSocket шлюза](/ru/prx/gateway/websocket) — протокол WebSocket
