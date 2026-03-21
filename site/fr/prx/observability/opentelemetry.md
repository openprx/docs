---
title: OpenTelemetry
description: Tracing distribue avec OpenTelemetry dans PRX pour l'analyse au niveau des spans.
---

# OpenTelemetry

PRX prend en charge OpenTelemetry (OTLP) pour le tracing distribue. Les traces fournissent une visibilite au niveau des spans sur les operations de l'agent, incluant les appels LLM, les executions d'outils et les operations de memoire.

## Apercu

Chaque operation de l'agent cree une trace avec des spans imbriques :

```
Session
  └── Turn
       ├── Memory Recall (span)
       ├── LLM Request (span)
       │    ├── Token Streaming
       │    └── Response Parsing
       └── Tool Execution (span)
            ├── Policy Check
            └── Sandbox Run
```

## Configuration

```toml
[observability.tracing]
enabled = false
endpoint = "http://localhost:4317"  # OTLP gRPC endpoint
protocol = "grpc"  # "grpc" | "http"
service_name = "prx"
sample_rate = 1.0  # 0.0 to 1.0
```

## Backends pris en charge

PRX peut exporter des traces vers tout backend compatible OTLP :

- Jaeger
- Grafana Tempo
- Honeycomb
- Datadog
- AWS X-Ray (via le collecteur OTLP)

## Attributs des spans

Attributs courants attaches aux spans :

| Attribut | Description |
|----------|-------------|
| `prx.session_id` | Identifiant de session de l'agent |
| `prx.provider` | Nom du fournisseur LLM |
| `prx.model` | Identifiant du modele |
| `prx.tool` | Nom de l'outil (pour les spans d'outils) |
| `prx.tokens.input` | Nombre de tokens en entree |
| `prx.tokens.output` | Nombre de tokens en sortie |

## Pages associees

- [Apercu de l'observabilite](./)
- [Metriques Prometheus](./prometheus)
