---
title: Prometheus მეტრიკები
description: Prometheus მეტრიკების ენდფოინთი და ხელმისაწვდომი მეტრიკები PRX-ში.
---

# Prometheus მეტრიკები

PRX აქვეყნებს Prometheus-თან თავსებად მეტრიკების ენდფოინთს მონიტორინგის სისტემებთან, როგორიცაა Grafana, Datadog და AlertManager, ინტეგრაციისთვის.

## ენდფოინთი

ჩართვისას, მეტრიკები ხელმისაწვდომია:

```
http://127.0.0.1:9090/metrics
```

## ხელმისაწვდომი მეტრიკები

### აგენტის მეტრიკები

| მეტრიკა | ტიპი | აღწერა |
|---------|------|--------|
| `prx_sessions_total` | Counter | შექმნილი სესიების ჯამი |
| `prx_sessions_active` | Gauge | ამჟამად აქტიური სესიები |
| `prx_session_duration_seconds` | Histogram | სესიის ხანგრძლივობა |
| `prx_turns_total` | Counter | საუბრის ნაბიჯების ჯამი |
| `prx_tool_calls_total` | Counter | ინსტრუმენტის გამოძახებების ჯამი (ინსტრუმენტის სახელით) |

### LLM პროვაიდერის მეტრიკები

| მეტრიკა | ტიპი | აღწერა |
|---------|------|--------|
| `prx_llm_requests_total` | Counter | LLM მოთხოვნების ჯამი (პროვაიდერის, მოდელის მიხედვით) |
| `prx_llm_request_duration_seconds` | Histogram | LLM მოთხოვნის შეყოვნება |
| `prx_llm_tokens_total` | Counter | ტოკენების ჯამი (შეყვანა/გამოტანა, მოდელის მიხედვით) |
| `prx_llm_errors_total` | Counter | LLM შეცდომები (ტიპის მიხედვით) |
| `prx_llm_cost_dollars` | Counter | სავარაუდო ხარჯი USD-ში |

### სისტემის მეტრიკები

| მეტრიკა | ტიპი | აღწერა |
|---------|------|--------|
| `prx_memory_usage_bytes` | Gauge | პროცესის მეხსიერების მოხმარება |
| `prx_cpu_usage_ratio` | Gauge | პროცესის CPU-ს მოხმარება |

## კონფიგურაცია

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## დაკავშირებული გვერდები

- [დაკვირვებადობის მიმოხილვა](./)
- [OpenTelemetry კვალი](./opentelemetry)
