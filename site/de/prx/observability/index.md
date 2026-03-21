---
title: Observability
description: Ubersicht uber die PRX-Observability-Funktionen einschliesslich Metriken, Tracing und Logging.
---

# Observability

PRX bietet umfassende Observability durch Metriken, verteiltes Tracing und strukturiertes Logging. Diese Funktionen ermoglichen Uberwachung, Debugging und Leistungsoptimierung von Agentenoperationen.

## Ubersicht

| Funktion | Backend | Zweck |
|----------|---------|-------|
| [Prometheus-Metriken](./prometheus) | Prometheus | Quantitative Uberwachung (Anforderungsraten, Latenzen, Fehler) |
| [OpenTelemetry](./opentelemetry) | OTLP-kompatibel | Verteiltes Tracing und Span-Level-Analyse |
| Strukturiertes Logging | stdout/Datei | Detaillierte Betriebsprotokolle |

## Schnellstart

Observability in `config.toml` aktivieren:

```toml
[observability]
log_level = "info"
log_format = "json"  # "json" | "pretty"

[observability.metrics]
enabled = true
bind = "127.0.0.1:9090"

[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"
```

## Wichtige Metriken

PRX stellt Metriken bereit fur:

- **Agentenleistung** -- Sitzungsdauer, Runden pro Sitzung, Werkzeugaufrufe
- **LLM-Anbieter** -- Anfragelatenz, Token-Verbrauch, Fehlerraten, Kosten
- **Gedachtnis** -- Abruflatenz, Speichergrosse, Komprimierungshaufigkeit
- **System** -- CPU-Nutzung, Speicherverbrauch, aktive Verbindungen

## Verwandte Seiten

- [Prometheus-Metriken](./prometheus)
- [OpenTelemetry-Tracing](./opentelemetry)
- [Heartbeat](/de/prx/cron/heartbeat)
