---
title: Развёртывание кластера
description: "Пошаговое руководство по развёртыванию многоузлового кластера PRX-WAF. Генерация сертификатов, конфигурация узлов, Docker Compose и верификация."
---

# Развёртывание кластера

В этом руководстве описано развёртывание кластера PRX-WAF из трёх узлов: одного главного и двух рабочих.

## Предварительные требования

- Три сервера (или Docker-хоста) с сетевой связностью по UDP-порту `16851`
- PostgreSQL 16+, доступный со всех узлов (общий или реплицированный)
- Бинарный файл PRX-WAF, установленный на каждом узле (или доступные Docker-образы)

## Шаг 1: Генерация сертификатов кластера

Сгенерируйте CA и сертификаты узлов с помощью контейнера cert-init или вручную через OpenSSL.

**Использование Docker Compose (рекомендуется):**

Репозиторий включает файл `docker-compose.cluster.yml`, который обрабатывает генерацию сертификатов:

```bash
# Сгенерировать сертификаты
docker compose -f docker-compose.cluster.yml run --rm cert-init
```

Это создаёт сертификаты в общем томе:

```
cluster_certs/
├── cluster-ca.pem      # CA-сертификат
├── cluster-ca.key      # Приватный ключ CA (только для главного узла)
├── node-a.pem          # Сертификат главного узла
├── node-a.key          # Приватный ключ главного узла
├── node-b.pem          # Сертификат рабочего узла B
├── node-b.key          # Приватный ключ рабочего узла B
├── node-c.pem          # Сертификат рабочего узла C
└── node-c.key          # Приватный ключ рабочего узла C
```

**Использование auto_generate:**

Alternatively, set `auto_generate = true` on the main node. Worker nodes will receive certificates during the join process:

```toml
[cluster.crypto]
auto_generate = true
```

## Шаг 2: Настройка главного узла

Создайте `configs/cluster-node-a.toml`:

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-a"
role        = "main"
listen_addr = "0.0.0.0:16851"
seeds       = []                # Главный узел не имеет seed-узлов

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
ca_key    = "/certs/cluster-ca.key"   # Главный узел хранит ключ CA
node_cert = "/certs/node-a.pem"
node_key  = "/certs/node-a.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5
stats_interval_secs        = 10
events_queue_size          = 10000

[cluster.election]
timeout_min_ms        = 150
timeout_max_ms        = 300
heartbeat_interval_ms = 50

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## Шаг 3: Настройка рабочих узлов

Создайте `configs/cluster-node-b.toml` (аналогично для node-c):

```toml
[proxy]
listen_addr     = "0.0.0.0:80"
listen_addr_tls = "0.0.0.0:443"

[api]
listen_addr = "0.0.0.0:9527"

[storage]
database_url    = "postgresql://prx_waf:prx_waf@postgres:5432/prx_waf"
max_connections = 20

[cluster]
enabled     = true
node_id     = "node-b"
role        = "worker"
listen_addr = "0.0.0.0:16851"
seeds       = ["node-a:16851"]    # Указывает на главный узел

[cluster.crypto]
ca_cert   = "/certs/cluster-ca.pem"
node_cert = "/certs/node-b.pem"
node_key  = "/certs/node-b.key"
auto_generate = false

[cluster.sync]
rules_interval_secs        = 10
config_interval_secs       = 30
events_batch_size          = 100
events_flush_interval_secs = 5

[cluster.health]
check_interval_secs   = 5
max_missed_heartbeats = 3
```

## Шаг 4: Запуск кластера

**С Docker Compose:**

```bash
docker compose -f docker-compose.cluster.yml up -d
```

**Вручную:**

Запускайте узлы по порядку: сначала база данных, затем главный, затем рабочие:

```bash
# На каждом узле
prx-waf -c /etc/prx-waf/config.toml run
```

## Шаг 5: Верификация кластера

Проверьте статус кластера с любого узла:

```bash
# Через Admin UI — перейдите в дашборд Cluster

# Через API
curl -H "Authorization: Bearer $TOKEN" http://node-a:9527/api/cluster/status
```

Ожидаемый ответ:

```json
{
  "cluster_enabled": true,
  "node_id": "node-a",
  "role": "main",
  "peers": [
    {"node_id": "node-b", "role": "worker", "status": "healthy"},
    {"node_id": "node-c", "role": "worker", "status": "healthy"}
  ],
  "sync": {
    "last_rule_sync": "2026-03-21T10:00:00Z",
    "last_config_sync": "2026-03-21T10:00:00Z"
  }
}
```

## Интеграция с балансировщиком нагрузки

Разместите внешний балансировщик нагрузки (например, HAProxy, Nginx или облачный LB) перед кластером для распределения клиентского трафика по всем узлам:

```
                    ┌──── node-a (main)   :80/:443
Client → LB ───────┼──── node-b (worker) :80/:443
                    └──── node-c (worker) :80/:443
```

Каждый узел независимо обрабатывает трафик через конвейер WAF. Главный узел также является обрабатывающим трафик узлом — он не ограничен только координационными обязанностями.

::: tip
Используйте эндпоинт `/health` для проверки здоровья балансировщиком нагрузки:
```
GET http://node-a/health → 200 OK
```
:::

## Масштабирование кластера

Чтобы добавить новый рабочий узел:

1. Сгенерируйте сертификат для нового узла (или используйте `auto_generate`)
2. Настройте новый узел с `seeds = ["node-a:16851"]`
3. Запустите узел — он автоматически присоединится к кластеру и синхронизируется

Для удаления узла просто остановите его. Монитор здоровья кластера обнаружит отключение и исключит его из синхронизации.

## Следующие шаги

- [Обзор кластерного режима](./index) — архитектура и детали синхронизации
- [Справочник конфигурации](../configuration/reference) — все ключи конфигурации кластера
- [Устранение неполадок](../troubleshooting/) — распространённые проблемы развёртывания кластера
