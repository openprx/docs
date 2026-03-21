---
title: Prometheus-Metriken
description: Prometheus-Metriken-Endpunkt und verfugbare Metriken in PRX.
---

# Prometheus-Metriken

PRX stellt einen Prometheus-kompatiblen Metriken-Endpunkt fur die Integration mit Uberwachungssystemen wie Grafana, Datadog und AlertManager bereit.

## Endpunkt

Wenn aktiviert, sind Metriken verfugbar unter:

```
http://127.0.0.1:9090/metrics
```

## Verfugbare Metriken

### Agenten-Metriken

| Metrik | Typ | Beschreibung |
|--------|-----|-------------|
| `prx_sessions_total` | Counter | Insgesamt erstellte Sitzungen |
| `prx_sessions_active` | Gauge | Aktuell aktive Sitzungen |
| `prx_session_duration_seconds` | Histogram | Sitzungsdauer |
| `prx_turns_total` | Counter | Gesprachsrunden insgesamt |
| `prx_tool_calls_total` | Counter | Werkzeugaufrufe insgesamt (nach Werkzeugname) |

### LLM-Anbieter-Metriken

| Metrik | Typ | Beschreibung |
|--------|-----|-------------|
| `prx_llm_requests_total` | Counter | LLM-Anfragen insgesamt (nach Anbieter, Modell) |
| `prx_llm_request_duration_seconds` | Histogram | LLM-Anfragelatenz |
| `prx_llm_tokens_total` | Counter | Tokens insgesamt (Eingabe/Ausgabe, nach Modell) |
| `prx_llm_errors_total` | Counter | LLM-Fehler (nach Typ) |
| `prx_llm_cost_dollars` | Counter | Geschatzte Kosten in USD |

### System-Metriken

| Metrik | Typ | Beschreibung |
|--------|-----|-------------|
| `prx_memory_usage_bytes` | Gauge | Prozess-Speicherverbrauch |
| `prx_cpu_usage_ratio` | Gauge | Prozess-CPU-Nutzung |

## Konfiguration

```toml
[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"
path = "/metrics"
```

## Verwandte Seiten

- [Observability-Ubersicht](./)
- [OpenTelemetry-Tracing](./opentelemetry)
