---
title: Справочник конфигурации CTE
description: Полный справочник конфигурации движка каузального дерева PRX.
---

# Справочник конфигурации CTE

Движок каузального дерева настраивается через секцию `[causal_tree]` в файле конфигурации PRX.

> **CTE отключен по умолчанию.** Все параметры ниже действуют только при `causal_tree.enabled = true`.

## Полный пример

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## Справочник параметров

### Параметры верхнего уровня

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|---------|
| `enabled` | bool | `false` | Главный переключатель. При `false` CTE полностью обходится. |
| `w_confidence` | f32 | `0.50` | Вес оценки для измерения уверенности. |
| `w_cost` | f32 | `0.25` | Вес оценки для штрафа стоимости. |
| `w_latency` | f32 | `0.25` | Вес оценки для штрафа задержки. |
| `write_decision_log` | bool | `true` | При включении выводит структурированный лог для каждого решения CTE. |
| `write_metrics` | bool | `true` | При включении собирает метрики производительности CTE. |

### Параметры политики (`[causal_tree.policy]`)

| Параметр | Тип | По умолчанию | Описание |
|----------|-----|-------------|---------|
| `max_branches` | usize | `3` | Максимальное количество ветвей-кандидатов на запрос. |
| `commit_threshold` | f32 | `0.62` | Минимальная композитная оценка для фиксации ветви. |
| `extra_token_ratio_limit` | f32 | `0.35` | Максимальное соотношение дополнительных токенов CTE к базовому запросу. |
| `extra_latency_budget_ms` | u64 | `300` | Максимальная дополнительная задержка конвейера CTE (миллисекунды). |
| `rehearsal_timeout_ms` | u64 | `5000` | Тайм-аут одной репетиции (миллисекунды). |
| `default_side_effect_mode` | string | `"read_only"` | Режим побочных эффектов. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | Последовательных сбоев до срабатывания прерывателя. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | Период охлаждения прерывателя цепи (секунды). |

## Минимальная конфигурация

```toml
[causal_tree]
enabled = true
```

## Связанные страницы

- [Обзор движка каузального дерева](./)
- [Полный справочник конфигурации](/ru/prx/config/reference)
