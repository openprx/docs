---
title: prx daemon
description: Запуск полной среды выполнения PRX, включая шлюз, каналы, планировщик cron и движок самоэволюции.
---

# prx daemon

Запуск полной среды выполнения PRX. Процесс демона управляет всеми долгоживущими подсистемами: HTTP/WebSocket шлюзом, подключениями каналов обмена сообщениями, планировщиком cron и движком самоэволюции.

## Использование

```bash
prx daemon [OPTIONS]
```

## Параметры

| Флаг | Сокр. | По умолчанию | Описание |
|------|-------|--------------|----------|
| `--config` | `-c` | `~/.config/prx/config.toml` | Путь к файлу конфигурации |
| `--port` | `-p` | `3120` | Порт прослушивания шлюза |
| `--host` | `-H` | `127.0.0.1` | Адрес привязки шлюза |
| `--log-level` | `-l` | `info` | Уровень детализации логов: `trace`, `debug`, `info`, `warn`, `error` |
| `--no-evolution` | | `false` | Отключить движок самоэволюции |
| `--no-cron` | | `false` | Отключить планировщик cron |
| `--no-gateway` | | `false` | Отключить HTTP/WS шлюз |
| `--pid-file` | | | Записать PID в указанный файл |

## Что запускает демон

При запуске `prx daemon` инициализирует следующие подсистемы в указанном порядке:

1. **Загрузчик конфигурации** — чтение и валидация файла конфигурации
2. **Бэкенд памяти** — подключение к настроенному хранилищу памяти (markdown, SQLite или PostgreSQL)
3. **Шлюзовой сервер** — запуск HTTP/WebSocket сервера на настроенных хосте и порту
4. **Менеджер каналов** — подключение ко всем включённым каналам обмена сообщениями (Telegram, Discord, Slack и т.д.)
5. **Планировщик cron** — загрузка и активация запланированных задач
6. **Движок самоэволюции** — запуск конвейера эволюции L1/L2/L3 (если включён)

## Примеры

```bash
# Запуск с настройками по умолчанию
prx daemon

# Привязка ко всем интерфейсам на порту 8080
prx daemon --host 0.0.0.0 --port 8080

# Запуск с отладочным логированием
prx daemon --log-level debug

# Запуск без эволюции (полезно для отладки)
prx daemon --no-evolution

# Использование пользовательского файла конфигурации
prx daemon --config /etc/prx/production.toml
```

## Сигналы

Демон реагирует на Unix-сигналы для управления во время работы:

| Сигнал | Поведение |
|--------|-----------|
| `SIGHUP` | Перезагрузка файла конфигурации без перезапуска. Каналы и задачи cron согласуются с новой конфигурацией. |
| `SIGTERM` | Корректное завершение. Завершает текущие запросы, аккуратно отключает каналы и сбрасывает отложенные записи в память. |
| `SIGINT` | Аналогично `SIGTERM` (Ctrl+C). |

```bash
# Перезагрузка конфигурации без перезапуска
kill -HUP $(cat /var/run/prx.pid)

# Корректное завершение
kill -TERM $(cat /var/run/prx.pid)
```

## Запуск как сервис systemd

Рекомендуемый способ запуска демона в промышленной эксплуатации — через systemd. Используйте [`prx service install`](./service) для автоматической генерации и установки юнит-файла или создайте его вручную:

```ini
[Unit]
Description=PRX AI Agent Daemon
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/prx daemon --config /etc/prx/config.toml
ExecReload=/bin/kill -HUP $MAINPID
Restart=on-failure
RestartSec=5
User=prx
Group=prx
RuntimeDirectory=prx
StateDirectory=prx

# Усиление безопасности
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
ReadWritePaths=/var/lib/prx /var/log/prx

[Install]
WantedBy=multi-user.target
```

```bash
# Установка и запуск сервиса
prx service install
prx service start

# Или вручную
sudo systemctl enable --now prx
```

## Логирование

По умолчанию демон выводит логи в stderr. В окружении systemd логи перехватываются журналом:

```bash
# Отслеживание логов демона
journalctl -u prx -f

# Показать логи за последний час
journalctl -u prx --since "1 hour ago"
```

Для интеграции с агрегаторами логов добавьте `log_format = "json"` в файл конфигурации для включения структурированного JSON-логирования.

## Проверка состояния

Пока демон работает, используйте [`prx doctor`](./doctor) или отправьте запрос к эндпоинту проверки состояния шлюза:

```bash
# Диагностика через CLI
prx doctor

# HTTP эндпоинт проверки состояния
curl http://127.0.0.1:3120/health
```

## См. также

- [prx gateway](./gateway) — автономный шлюз без каналов и cron
- [prx service](./service) — управление сервисом systemd/OpenRC
- [prx doctor](./doctor) — диагностика демона
- [Обзор конфигурации](/ru/prx/config/) — справочник файла конфигурации
- [Обзор самоэволюции](/ru/prx/self-evolution/) — подробности о движке эволюции
