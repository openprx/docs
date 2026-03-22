---
title: Конфигурация Reverse Proxy
description: "Настройка PRX-WAF как reverse proxy. Маршрутизация хостов, апстрим-бэкенды, балансировка нагрузки, заголовки запросов/ответов и проверки здоровья."
---

# Конфигурация Reverse Proxy

PRX-WAF действует как reverse proxy, перенаправляя запросы клиентов на апстрим-бэкенд серверы после прохождения через конвейер обнаружения WAF. На этой странице описана маршрутизация хостов, балансировка нагрузки и конфигурация прокси.

## Конфигурация хостов

Каждый защищённый домен требует записи хоста, которая сопоставляет входящие запросы с апстрим-бэкендом. Хосты можно настроить тремя способами:

### Через TOML-файл конфигурации

```toml
[[hosts]]
host        = "example.com"
port        = 80
remote_host = "10.0.0.1"
remote_port = 8080
ssl         = false
guard_status = true
```

### Через Admin UI

1. Перейдите в **Hosts** в боковой панели
2. Нажмите **Add Host**
3. Заполните данные хоста
4. Нажмите **Save**

### Через REST API

```bash
curl -X POST http://localhost:9527/api/hosts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "example.com",
    "port": 80,
    "remote_host": "10.0.0.1",
    "remote_port": 8080,
    "ssl": false,
    "guard_status": true
  }'
```

## Поля хоста

| Поле | Тип | Обязательный | Описание |
|------|-----|-------------|----------|
| `host` | `string` | Да | Доменное имя для сопоставления (например, `example.com`) |
| `port` | `integer` | Да | Порт прослушивания (обычно `80` или `443`) |
| `remote_host` | `string` | Да | IP или hostname апстрим-бэкенда |
| `remote_port` | `integer` | Да | Порт апстрим-бэкенда |
| `ssl` | `boolean` | Нет | Использует ли апстрим HTTPS (по умолчанию: `false`) |
| `guard_status` | `boolean` | Нет | Включить защиту WAF для этого хоста (по умолчанию: `true`) |

## Балансировка нагрузки

PRX-WAF использует взвешенную балансировку нагрузки round-robin по апстрим-бэкендам. Когда для хоста настроено несколько бэкендов, трафик распределяется пропорционально их весам.

::: info
Несколько апстрим-бэкендов для хоста можно настроить через Admin UI или API. TOML-файл конфигурации поддерживает записи хостов с одним бэкендом.
:::

## Заголовки запросов

PRX-WAF автоматически добавляет стандартные заголовки прокси к проксируемым запросам:

| Заголовок | Значение |
|---------|--------|
| `X-Real-IP` | Оригинальный IP-адрес клиента |
| `X-Forwarded-For` | IP клиента (добавляется к существующей цепочке) |
| `X-Forwarded-Proto` | `http` или `https` |
| `X-Forwarded-Host` | Исходное значение заголовка Host |

## Ограничение размера тела запроса

Максимальный размер тела запроса управляется конфигурацией безопасности:

```toml
[security]
max_request_body_bytes = 10485760  # 10 МБ
```

Запросы, превышающие этот лимит, отклоняются с ответом 413 Payload Too Large до достижения конвейера WAF.

## Управление хостами

### Список всех хостов

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:9527/api/hosts
```

### Обновить хост

```bash
curl -X PUT http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"guard_status": false}'
```

### Удалить хост

```bash
curl -X DELETE http://localhost:9527/api/hosts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Правила на основе IP

PRX-WAF поддерживает правила разрешения и блокировки на основе IP, которые оцениваются в Фазах 1-4 конвейера обнаружения:

```bash
# Добавить правило белого списка IP
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "10.0.0.0/8", "action": "allow"}'

# Добавить правило чёрного списка IP
curl -X POST http://localhost:9527/api/rules/ip \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ip": "203.0.113.50", "action": "block"}'
```

## Следующие шаги

- [SSL/TLS](./ssl-tls) — включить HTTPS с Let's Encrypt
- [Обзор шлюза](./index) — кеширование ответов и обратные туннели
- [Справочник конфигурации](../configuration/reference) — все ключи конфигурации прокси
