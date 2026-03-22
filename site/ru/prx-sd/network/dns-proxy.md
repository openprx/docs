---
title: DNS-прокси
description: "Запуск локального DNS-прокси, объединяющего фильтрацию adblock, IOC-фиды доменов и пользовательские списки блокировок в единый резолвер с полным журналированием запросов."
---

# DNS-прокси

Команда `sd dns-proxy` запускает локальный DNS-прокси сервер, который перехватывает DNS-запросы и фильтрует их через три движка перед перенаправлением к вышестоящему резолверу:

1. **Движок adblock** — блокирует рекламу, трекеры и вредоносные домены из списков фильтров
2. **IOC-фид доменов** — блокирует домены из индикаторов компрометации разведки угроз
3. **Пользовательский список блокировок DNS** — блокирует домены из пользовательских списков

Запросы, совпадающие с любым фильтром, получают в ответ `0.0.0.0` (NXDOMAIN). Все остальные запросы перенаправляются на настроенный вышестоящий DNS-сервер. Каждый запрос и его статус разрешения записывается в файл JSONL.

## Быстрый старт

```bash
# Запустить DNS-прокси с настройками по умолчанию (прослушивание 127.0.0.1:53, upstream 8.8.8.8:53)
sudo sd dns-proxy
```

::: tip
По умолчанию прокси прослушивает порт 53, что требует прав root. Для тестирования без привилегий используйте высокий порт, например `--listen 127.0.0.1:5353`.
:::

## Параметры команды

```bash
sd dns-proxy [OPTIONS]
```

| Параметр | По умолчанию | Описание |
|---------|-------------|----------|
| `--listen` | `127.0.0.1:53` | Адрес и порт для прослушивания |
| `--upstream` | `8.8.8.8:53` | Вышестоящий DNS-сервер для перенаправления незаблокированных запросов |
| `--log-path` | `/tmp/prx-sd-dns.log` | Путь к файлу журнала запросов JSONL |

## Примеры использования

### Базовое использование

Запустить прокси на адресе по умолчанию с Google DNS в качестве upstream:

```bash
sudo sd dns-proxy
```

Вывод:

```
>>> Starting DNS proxy (listen=127.0.0.1:53, upstream=8.8.8.8:53, log=/tmp/prx-sd-dns.log)
>>> Filter engines: adblock + dns_blocklist + ioc_domains
>>> Press Ctrl+C to stop.
```

### Пользовательский адрес прослушивания и upstream

Использовать Cloudflare DNS в качестве upstream и прослушивать пользовательский порт:

```bash
sudo sd dns-proxy --listen 127.0.0.1:5353 --upstream 1.1.1.1:53
```

### Пользовательский путь к журналу

Записывать журналы запросов в конкретное расположение:

```bash
sudo sd dns-proxy --log-path /var/log/prx-sd/dns-queries.jsonl
```

### Совместное использование с Adblock

DNS-прокси автоматически загружает списки фильтров adblock из `~/.prx-sd/adblock/`. Для максимального охвата:

```bash
# Шаг 1: Включить и синхронизировать списки adblock
sudo sd adblock enable
sd adblock sync

# Шаг 2: Запустить DNS-прокси (он автоматически подхватывает правила adblock)
sudo sd dns-proxy
```

Прокси читает те же кешированные списки фильтров, что использует `sd adblock`. Любые списки, добавленные через `sd adblock add`, автоматически становятся доступны прокси после его перезапуска.

## Настройка системы для использования прокси

### Linux (systemd-resolved)

Отредактируйте `/etc/systemd/resolved.conf`:

```ini
[Resolve]
DNS=127.0.0.1
```

Затем перезапустите:

```bash
sudo systemctl restart systemd-resolved
```

### Linux (resolv.conf)

```bash
echo "nameserver 127.0.0.1" | sudo tee /etc/resolv.conf
```

### macOS

```bash
sudo networksetup -setdnsservers Wi-Fi 127.0.0.1
```

Для отмены изменений:

```bash
sudo networksetup -setdnsservers Wi-Fi empty
```

::: warning
Перенаправление всего DNS-трафика на локальный прокси означает, что если прокси остановлен, DNS-разрешение не будет работать пока вы не восстановите исходные настройки или не перезапустите прокси.
:::

## Формат журнала

DNS-прокси записывает JSONL (один JSON-объект на строку) в настроенный путь журнала. Каждая запись содержит:

```json
{
  "timestamp": "2026-03-20T14:30:00.123Z",
  "query": "ads.example.com",
  "type": "A",
  "action": "blocked",
  "filter": "adblock",
  "upstream_ms": null
}
```

```json
{
  "timestamp": "2026-03-20T14:30:00.456Z",
  "query": "docs.example.com",
  "type": "A",
  "action": "forwarded",
  "filter": null,
  "upstream_ms": 12
}
```

| Поле | Описание |
|------|----------|
| `timestamp` | Временная метка запроса в формате ISO 8601 |
| `query` | Запрошенное имя домена |
| `type` | Тип DNS-записи (A, AAAA, CNAME и т.д.) |
| `action` | `blocked` (заблокировано) или `forwarded` (перенаправлено) |
| `filter` | Какой фильтр сработал: `adblock`, `ioc`, `blocklist` или `null` |
| `upstream_ms` | Время прохождения до вышестоящего DNS (null если заблокировано) |

## Архитектура

```
Client DNS Query (port 53)
        |
        v
  +------------------+
  |  sd dns-proxy     |
  |                  |
  |  1. Adblock      |---> blocked? --> respond 0.0.0.0
  |  2. IOC domains  |---> blocked? --> respond 0.0.0.0
  |  3. DNS blocklist |---> blocked? --> respond 0.0.0.0
  |                  |
  |  Not blocked:    |
  |  Forward to      |---> upstream DNS (e.g. 8.8.8.8)
  |  upstream         |<--- response
  |                  |
  |  Log to JSONL    |
  +------------------+
        |
        v
  Client receives response
```

## Запуск как сервис

Для запуска DNS-прокси как постоянного сервиса systemd:

```bash
# Создать файл юнита systemd
sudo tee /etc/systemd/system/prx-sd-dns.service << 'EOF'
[Unit]
Description=PRX-SD DNS Proxy
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sd dns-proxy --listen 127.0.0.1:53 --upstream 8.8.8.8:53 --log-path /var/log/prx-sd/dns-queries.jsonl
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Включить и запустить
sudo systemctl daemon-reload
sudo systemctl enable --now prx-sd-dns
```

::: tip
Для полностью управляемой фоновой работы рассмотрите использование `sd daemon`, который объединяет мониторинг файловой системы в реальном времени, автоматическое обновление сигнатур и может быть расширен для включения функциональности DNS-прокси.
:::

## Следующие шаги

- Настройте [списки фильтров Adblock](./adblock) для комплексной блокировки доменов
- Настройте [мониторинг в реальном времени](../realtime/) для защиты файловой системы наряду с DNS-фильтрацией
- Просмотрите [справочник конфигурации](../configuration/reference) для настроек, связанных с прокси
