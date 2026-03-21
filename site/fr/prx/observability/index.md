---
title: Observabilite
description: Apercu des fonctionnalites d'observabilite de PRX incluant les metriques, le tracing et la journalisation.
---

# Observabilite

PRX fournit une observabilite complete a travers les metriques, le tracing distribue et la journalisation structuree. Ces fonctionnalites permettent la surveillance, le debogage et l'optimisation des performances des operations de l'agent.

## Apercu

| Fonctionnalite | Backend | Objectif |
|----------------|---------|----------|
| [Metriques Prometheus](./prometheus) | Prometheus | Surveillance quantitative (debits de requetes, latences, erreurs) |
| [OpenTelemetry](./opentelemetry) | Compatible OTLP | Tracing distribue et analyse au niveau des spans |
| Journalisation structuree | stdout/fichier | Journaux operationnels detailles |

## Demarrage rapide

Activez l'observabilite dans `config.toml` :

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

## Metriques cles

PRX expose des metriques pour :

- **Performance de l'agent** -- duree de session, tours par session, appels d'outils
- **Fournisseur LLM** -- latence des requetes, utilisation des tokens, taux d'erreurs, cout
- **Memoire** -- latence de rappel, taille du stockage, frequence de compactage
- **Systeme** -- utilisation CPU, consommation memoire, connexions actives

## Pages associees

- [Metriques Prometheus](./prometheus)
- [Tracing OpenTelemetry](./opentelemetry)
- [Heartbeat](/fr/prx/cron/heartbeat)
