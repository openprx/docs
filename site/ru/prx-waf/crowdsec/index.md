---
title: Интеграция CrowdSec
description: "Интеграция PRX-WAF с CrowdSec для совместной разведки угроз. Режим Bouncer с кешем решений в памяти, режим AppSec для анализа HTTP в реальном времени и log pusher для обмена данными с сообществом."
---

# Интеграция CrowdSec

PRX-WAF интегрируется с [CrowdSec](https://www.crowdsec.net/) для включения совместной, управляемой сообществом разведки угроз непосредственно в конвейер обнаружения WAF. Вместо того чтобы полагаться исключительно на локальные правила и эвристику, PRX-WAF может использовать сеть CrowdSec — где тысячи машин обмениваются сигналами атак в реальном времени — для блокировки известных вредоносных IP, обнаружения атак на прикладном уровне и возврата событий WAF сообществу.

Интеграция работает в **трёх режимах**, которые можно использовать независимо или совместно:

| Режим | Назначение | Задержка | Фаза конвейера |
|------|-----------|---------|----------------|
| **Bouncer** | Блокировать IP с кешированными решениями LAPI | Микросекунды (в памяти) | Фаза 16a |
| **AppSec** | Анализировать полные HTTP-запросы через CrowdSec AppSec | Миллисекунды (HTTP-вызов) | Фаза 16b |
| **Log Pusher** | Отправлять события WAF обратно в LAPI | Асинхронно (пакетами) | Фоновый режим |

## Как это работает

### Режим Bouncer

Режим Bouncer поддерживает **кеш решений в памяти**, синхронизированный с CrowdSec Local API (LAPI). Когда запрос поступает в Фазу 16a конвейера обнаружения, PRX-WAF выполняет поиск O(1) в кеше:

```
Request IP ──> DashMap (exact IP match) ──> Hit? ──> Apply decision (ban/captcha/throttle)
                     │
                     └──> Miss ──> RwLock<Vec> (CIDR range scan) ──> Hit? ──> Apply decision
                                          │
                                          └──> Miss ──> Allow (proceed to next phase)
```

Кеш обновляется с настраиваемым интервалом (по умолчанию: каждые 10 секунд) путём опроса эндпоинта LAPI `/v1/decisions`. Такой дизайн гарантирует, что поиск IP никогда не блокируется на сетевом вводе-выводе — синхронизация происходит в фоновой задаче.

**Структуры данных:**

- **DashMap** для точных IP-адресов — конкурентный hashmap без блокировок, поиск O(1)
- **RwLock\<Vec\>** для диапазонов CIDR — сканируется последовательно при промахе кеша, обычно небольшой набор

**Фильтрация сценариев** позволяет включать или исключать решения на основе имён сценариев:

```toml
# Действовать только на сценарии SSH brute-force и HTTP-сканирования
scenarios_containing = ["ssh-bf", "http-scan"]

# Игнорировать решения из этих сценариев
scenarios_not_containing = ["manual"]
```

### Режим AppSec

Режим AppSec отправляет полные данные HTTP-запроса в компонент CrowdSec AppSec для анализа в реальном времени. В отличие от режима Bouncer, который проверяет только IP, AppSec инспектирует заголовки запроса, тело, URI и метод для обнаружения атак на прикладном уровне, таких как SQL-инъекции, XSS и обход пути.

```
Request ──> Phase 16b ──> POST http://appsec:7422/
                           Body: { method, uri, headers, body }
                           ──> CrowdSec AppSec engine
                           ──> Response: allow / block (with details)
```

Проверки AppSec **асинхронны** — PRX-WAF отправляет запрос с настраиваемым таймаутом (по умолчанию: 500 мс). Если эндпоинт AppSec недоступен или превышает таймаут, `fallback_action` определяет, разрешить, заблокировать или зарегистрировать запрос.

### Log Pusher

Log pusher отправляет события безопасности WAF обратно в CrowdSec LAPI, внося вклад в сеть разведки угроз сообщества. События пакетируются и сбрасываются периодически для минимизации нагрузки на LAPI.

**Параметры пакетирования:**

| Параметр | Значение | Описание |
|---------|--------|----------|
| Размер пакета | 50 событий | Сбрасывать при достижении 50 событий |
| Интервал сброса | 30 секунд | Сбрасывать, даже если буфер не заполнен |
| Аутентификация | Machine JWT | Использует `pusher_login` / `pusher_password` для аутентификации машины |
| Завершение | Финальный сброс | Все буферизованные события сбрасываются перед завершением процесса |

Pusher аутентифицируется в LAPI с использованием учётных данных машины (отдельно от API-ключа bouncer) и отправляет события на эндпоинт `/v1/alerts`.

## Конфигурация

Добавьте раздел `[crowdsec]` в ваш TOML-файл конфигурации:

```toml
[crowdsec]
# Главный переключатель
enabled = true

# Режим интеграции: "bouncer", "appsec" или "both"
mode = "both"

# --- Настройки Bouncer ---
lapi_url = "http://127.0.0.1:8080"
api_key = "your-bouncer-api-key"
update_frequency_secs = 10
cache_ttl_secs = 0           # 0 = использовать продолжительность от LAPI
fallback_action = "allow"    # "allow" | "block" | "log"

# Фильтрация сценариев (необязательно)
scenarios_containing = []
scenarios_not_containing = []

# --- Настройки AppSec ---
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500

# --- Настройки Log Pusher ---
pusher_login = "machine-id"
pusher_password = "machine-password"
```

### Справочник конфигурации

| Ключ | Тип | По умолчанию | Описание |
|------|-----|-------------|----------|
| `enabled` | `boolean` | `false` | Включить интеграцию CrowdSec |
| `mode` | `string` | `"bouncer"` | Режим интеграции: `"bouncer"`, `"appsec"` или `"both"` |
| `lapi_url` | `string` | `"http://127.0.0.1:8080"` | Базовый URL CrowdSec LAPI |
| `api_key` | `string` | `""` | API-ключ Bouncer (получить через `cscli bouncers add`) |
| `update_frequency_secs` | `integer` | `10` | Как часто обновлять кеш решений от LAPI (секунды) |
| `cache_ttl_secs` | `integer` | `0` | Переопределить TTL решения. `0` означает использовать продолжительность от LAPI. |
| `fallback_action` | `string` | `"allow"` | Действие при недоступности LAPI или AppSec: `"allow"`, `"block"` или `"log"` |
| `scenarios_containing` | `string[]` | `[]` | Кешировать только решения, имя сценария которых содержит одну из этих подстрок. Пустой означает все. |
| `scenarios_not_containing` | `string[]` | `[]` | Исключать решения, имя сценария которых содержит одну из этих подстрок. |
| `appsec_endpoint` | `string` | — | URL эндпоинта CrowdSec AppSec |
| `appsec_key` | `string` | — | API-ключ AppSec |
| `appsec_timeout_ms` | `integer` | `500` | Таймаут HTTP-запроса AppSec (миллисекунды) |
| `pusher_login` | `string` | — | Логин машины для аутентификации в LAPI (log pusher) |
| `pusher_password` | `string` | — | Пароль машины для аутентификации в LAPI (log pusher) |

## Руководство по настройке

### Предварительные требования

1. Запущенный экземпляр CrowdSec с доступным LAPI с вашего хоста PRX-WAF
2. API-ключ bouncer (для режима Bouncer)
3. Компонент CrowdSec AppSec (для режима AppSec, необязательно)
4. Учётные данные машины (для Log Pusher, необязательно)

### Шаг 1: Установка CrowdSec

Если CrowdSec ещё не установлен:

```bash
# Debian / Ubuntu
curl -s https://install.crowdsec.net | sudo sh
sudo apt install crowdsec

# Проверить, что LAPI запущен
sudo cscli metrics
```

### Шаг 2: Регистрация Bouncer

```bash
# Создать API-ключ bouncer для PRX-WAF
sudo cscli bouncers add prx-waf-bouncer

# Вывод:
# API key for 'prx-waf-bouncer':
#   abc123def456...
#
# Скопируйте этот ключ — он отображается только один раз.
```

### Шаг 3: Настройка PRX-WAF

```toml
[crowdsec]
enabled = true
mode = "bouncer"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
```

### Шаг 4: Проверка связности

```bash
# Через CLI
prx-waf crowdsec test

# Или через API
curl http://localhost:9527/api/crowdsec/test -X POST \
  -H "Authorization: Bearer <token>"
```

### Шаг 5 (необязательно): Включение AppSec

Если у вас запущен компонент CrowdSec AppSec:

```toml
[crowdsec]
enabled = true
mode = "both"
lapi_url = "http://127.0.0.1:8080"
api_key = "abc123def456..."
appsec_endpoint = "http://127.0.0.1:7422"
appsec_key = "your-appsec-key"
appsec_timeout_ms = 500
```

### Шаг 6 (необязательно): Включение Log Pusher

Для передачи событий WAF обратно в CrowdSec:

```bash
# Зарегистрировать машину в CrowdSec LAPI
sudo cscli machines add prx-waf-pusher --password "your-secure-password"
```

```toml
[crowdsec]
pusher_login = "prx-waf-pusher"
pusher_password = "your-secure-password"
```

### Интерактивная настройка

Для управляемой настройки используйте мастер CLI:

```bash
prx-waf crowdsec setup
```

Мастер проведёт через настройку URL LAPI, ввод API-ключа, выбор режима и тестирование связности.

## Интеграция в конвейер

Проверки CrowdSec выполняются в **Фазе 16** из 16-фазного конвейера обнаружения WAF — последней фазе перед проксированием на апстрим-бэкенд. Такое позиционирование преднамеренно:

1. **Более дешёвые проверки первыми.** Белый/чёрный список IP (Фазы 1-4), ограничение скорости (Фаза 5) и сопоставление паттернов (Фазы 8-13) выполняются перед CrowdSec, фильтруя очевидные атаки без внешних запросов.
2. **Bouncer перед AppSec.** Фаза 16a (Bouncer) выполняется синхронно с задержкой в микросекунды. Только если IP не найден в кеше решений, выполняется Фаза 16b (AppSec), которая включает HTTP round-trip.
3. **Неблокирующая архитектура.** Кеш решений обновляется в фоновой задаче. Вызовы AppSec используют async HTTP с таймаутом. Ни один режим не блокирует основной пул потоков прокси.

```
Phase 1-15 (local checks)
    │
    └──> Phase 16a: Bouncer (DashMap/CIDR lookup, ~1-5 us)
              │
              ├── Decision found ──> Block/Captcha/Throttle
              │
              └── No decision ──> Phase 16b: AppSec (HTTP POST, ~1-50 ms)
                                       │
                                       ├── Block ──> 403 Forbidden
                                       │
                                       └── Allow ──> Proxy to upstream
```

## REST API

Все эндпоинты CrowdSec API требуют аутентификации (JWT Bearer token от Admin API).

### Статус

```http
GET /api/crowdsec/status
```

Возвращает текущий статус интеграции, включая состояние соединения, статистику кеша и сводку конфигурации.

**Ответ:**

```json
{
  "enabled": true,
  "mode": "both",
  "lapi_connected": true,
  "appsec_connected": true,
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "last_refresh": "2026-03-21T10:15:30Z",
    "refresh_interval_secs": 10
  },
  "pusher": {
    "authenticated": true,
    "events_sent": 4521,
    "buffer_size": 12
  }
}
```

### Список решений

```http
GET /api/crowdsec/decisions
```

Возвращает все кешированные решения с их типом, областью, значением и сроком действия.

**Ответ:**

```json
{
  "decisions": [
    {
      "id": 12345,
      "type": "ban",
      "scope": "ip",
      "value": "192.168.1.100",
      "scenario": "crowdsecurity/http-bf-wordpress_bf",
      "duration": "4h",
      "expires_at": "2026-03-21T14:00:00Z"
    },
    {
      "id": 12346,
      "type": "ban",
      "scope": "range",
      "value": "10.0.0.0/24",
      "scenario": "crowdsecurity/ssh-bf",
      "duration": "24h",
      "expires_at": "2026-03-22T10:00:00Z"
    }
  ],
  "total": 1336
}
```

### Удалить решение

```http
DELETE /api/crowdsec/decisions/:id
```

Удаляет решение как из локального кеша, так и из LAPI. Полезно для разблокировки ложных срабатываний.

**Пример:**

```bash
curl -X DELETE http://localhost:9527/api/crowdsec/decisions/12345 \
  -H "Authorization: Bearer <token>"
```

### Проверка связности

```http
POST /api/crowdsec/test
```

Проверяет связность с LAPI (и эндпоинтом AppSec при наличии настройки). Возвращает статус соединения и задержку.

**Ответ:**

```json
{
  "lapi": {
    "reachable": true,
    "latency_ms": 3,
    "version": "1.6.4"
  },
  "appsec": {
    "reachable": true,
    "latency_ms": 12
  }
}
```

### Статистика кеша

```http
GET /api/crowdsec/stats
```

Возвращает детальную статистику кеша, включая показатели попаданий/промахов и разбивку по типам решений.

**Ответ:**

```json
{
  "cache": {
    "exact_ips": 1247,
    "cidr_ranges": 89,
    "total_lookups": 582910,
    "cache_hits": 3891,
    "cache_misses": 579019,
    "hit_rate_percent": 0.67
  },
  "decisions_by_type": {
    "ban": 1102,
    "captcha": 145,
    "throttle": 89
  },
  "decisions_by_scenario": {
    "crowdsecurity/http-bf-wordpress_bf": 423,
    "crowdsecurity/ssh-bf": 312,
    "crowdsecurity/http-bad-user-agent": 198
  }
}
```

## Команды CLI

### Статус

```bash
prx-waf crowdsec status
```

### Список решений

```bash
prx-waf crowdsec decisions
```

### Проверка связности

```bash
prx-waf crowdsec test
```

### Мастер настройки

```bash
prx-waf crowdsec setup
```

## Устранение неполадок

### Отказ соединения LAPI

```
CrowdSec LAPI unreachable: connection refused at http://127.0.0.1:8080
```

**Причина:** CrowdSec LAPI не запущен или прослушивает другой адрес.

**Решение:**
```bash
# Проверить статус CrowdSec
sudo systemctl status crowdsec

# Проверить, что LAPI прослушивает
sudo ss -tlnp | grep 8080
```

### Недействительный API-ключ

```bash
# Создать новый ключ bouncer
sudo cscli bouncers add prx-waf-bouncer
```

### Таймаут AppSec

Увеличьте `appsec_timeout_ms` или рассмотрите использование только `mode = "bouncer"`.

## Следующие шаги

- [Справочник конфигурации](../configuration/reference) — полный справочник TOML-конфигурации
- [Справочник CLI](../cli/) — все команды CLI, включая подкоманды CrowdSec
- [Движок правил](../rules/) — как CrowdSec вписывается в конвейер обнаружения
- [Admin UI](../admin-ui/) — управление CrowdSec из дашборда
