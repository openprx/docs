---
title: Метрики Prometheus
description: Эндпоинт метрик Prometheus и доступные метрики в PRX.
---

# Метрики Prometheus

PRX предоставляет Prometheus-совместимый эндпоинт метрик для интеграции с системами мониторинга -- Grafana, Datadog и AlertManager.

## Эндпоинт

При включении метрики доступны по адресу:

```
http://127.0.0.1:9090/metrics
```

## Доступные метрики

### Метрики агента

| Метрика | Тип | Описание |
|---------|-----|----------|
| `prx_sessions_total` | Counter | Всего созданных сессий |
| `prx_sessions_active` | Gauge | Текущие активные сессии |
| `prx_session_duration_seconds` | Histogram | Длительность сессий |
| `prx_turns_total` | Counter | Всего ходов разговора |
| `prx_tool_calls_total` | Counter | Всего вызовов инструментов (по имени инструмента) |

### Метрики LLM-провайдера

| Метрика | Тип | Описание |
|---------|-----|----------|
| `prx_llm_requests_total` | Counter | Всего запросов к LLM (по провайдеру, модели) |
| `prx_llm_request_duration_seconds` | Histogram | Задержка запросов к LLM |
| `prx_llm_tokens_total` | Counter | Всего токенов (входных/выходных, по модели) |
| `prx_llm_errors_total` | Counter | Ошибки LLM (по типу) |
| `prx_llm_cost_dollars` | Counter | Расчётная стоимость в USD |

### Системные метрики

| Метрика | Тип | Описание |
|---------|-----|----------|
| `prx_memory_usage_bytes` | Gauge | Использование памяти процессом |
| `prx_cpu_usage_ratio` | Gauge | Использование CPU процессом |

## Конфигурация

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## Связанные страницы

- [Обзор наблюдаемости](./)
- [Трассировка OpenTelemetry](./opentelemetry)
