---
title: Установка
description: Установка OpenPR-Webhook из исходного кода с помощью Rust toolchain.
---

# Установка

## Предварительные требования

- Rust toolchain (edition 2021 или новее)
- Запущенный экземпляр OpenPR, который может отправлять webhook-события

## Сборка из исходного кода

Клонируйте репозиторий и соберите в режиме release:

```bash
git clone https://github.com/openprx/openpr-webhook.git
cd openpr-webhook
cargo build --release
```

Бинарный файл создаётся по адресу `target/release/openpr-webhook`.

## Зависимости

OpenPR-Webhook построен на следующих основных библиотеках:

| Крейт | Назначение |
|-------|-----------|
| `axum` 0.8 | HTTP-фреймворк сервера |
| `tokio` 1 | Асинхронная среда выполнения |
| `reqwest` 0.12 | HTTP-клиент для пересылки webhook и обратных вызовов |
| `hmac` + `sha2` | HMAC-SHA256 верификация подписи |
| `toml` 0.8 | Парсинг конфигурации |
| `tokio-tungstenite` 0.28 | WebSocket-клиент для режима туннеля |
| `tracing` | Структурированное логирование |

## Файл конфигурации

Создайте файл `config.toml`. Сервис загружает этот файл при запуске. Полную схему см. в [Справочнике конфигурации](../configuration/index.md).

Минимальный пример:

```toml
[server]
listen = "0.0.0.0:9000"

[security]
webhook_secrets = ["your-hmac-secret"]

[[agents]]
id = "notify"
name = "Notification Bot"
agent_type = "webhook"

[agents.webhook]
url = "https://hooks.slack.com/services/..."
```

## Запуск

```bash
# По умолчанию: загружает config.toml из текущей директории
./target/release/openpr-webhook

# Указать пользовательский путь к конфигурации
./target/release/openpr-webhook /etc/openpr-webhook/config.toml
```

## Логирование

Логирование управляется переменной окружения `RUST_LOG`. Уровень по умолчанию: `openpr_webhook=info`.

```bash
# Debug-логирование
RUST_LOG=openpr_webhook=debug ./target/release/openpr-webhook

# Trace-логирование (очень подробное)
RUST_LOG=openpr_webhook=trace ./target/release/openpr-webhook
```

## Проверка работоспособности

Сервис предоставляет эндпоинт `GET /health`, возвращающий `ok` при работающем сервере:

```bash
curl http://localhost:9000/health
# ok
```

## Systemd-сервис (опционально)

Для продакшен-развёртываний на Linux:

```ini
[Unit]
Description=OpenPR Webhook Dispatcher
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/openpr-webhook /etc/openpr-webhook/config.toml
Restart=always
RestartSec=5
Environment=RUST_LOG=openpr_webhook=info

[Install]
WantedBy=multi-user.target
```

## Следующие шаги

- [Быстрый старт](quickstart.md) — настройте первый агент и протестируйте его от начала до конца
- [Справочник конфигурации](../configuration/index.md) — полная документация по схеме TOML
