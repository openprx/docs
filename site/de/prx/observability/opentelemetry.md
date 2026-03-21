---
title: OpenTelemetry
description: Verteiltes Tracing mit OpenTelemetry in PRX fur Span-Level-Analyse.
---

# OpenTelemetry

PRX unterstutzt OpenTelemetry (OTLP) fur verteiltes Tracing. Traces bieten Span-Level-Einblick in Agentenoperationen, einschliesslich LLM-Aufrufe, Werkzeugausfuhrungen und Gedachtnisoperationen.

## Ubersicht

Jede Agentenoperation erstellt einen Trace mit verschachtelten Spans:

```
Session
  └── Turn
       ├── Memory Recall (Span)
       ├── LLM Request (Span)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (Span)
            ├── Policy Check
            └── Sandbox Run
```

## Konfiguration

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP-gRPC-Endpunkt
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0,0 bis 1,0
```

## Unterstutzte Backends

PRX kann Traces an jedes OTLP-kompatible Backend exportieren:

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (uber OTLP-Collector)

## Span-Attribute

Gangige Attribute, die an Spans angehangt werden:

| Attribut | Beschreibung |
|----------|-------------|
| `prx.session_id` | Agentensitzungs-Identifikator |
| `prx.provider` | LLM-Anbietername |
| `prx.model` | Modell-Identifikator |
| `prx.tool` | Werkzeugname (fur Werkzeug-Spans) |
| `prx.tokens.input` | Eingabe-Token-Anzahl |
| `prx.tokens.output` | Ausgabe-Token-Anzahl |

## Verwandte Seiten

- [Observability-Ubersicht](./)
- [Prometheus-Metriken](./prometheus)
