---
title: KNN-Router
description: Semantische Ahnlichkeitsbasierte LLM-Routing mittels K-Nearest-Neighbors auf historischen Abfrage-Embeddings.
---

# KNN-Router

Der KNN-Router (K-Nearest Neighbors) verwendet semantische Ahnlichkeit, um eingehende Abfragen mit einer Datenbank historischer Abfragen mit bekannten optimalen Modellzuweisungen abzugleichen. Dies ermoglicht gelerntes Routing, das sich im Laufe der Zeit verbessert.

## Funktionsweise

1. **Abfrage einbetten** -- die eingehende Abfrage in ein Vektor-Embedding umwandeln
2. **KNN-Suche** -- die K ahnlichsten vergangenen Abfragen im Embedding-Speicher finden
3. **Abstimmung** -- die Modellzuweisungen der K Nachbarn aggregieren
4. **Auswahl** -- das Modell mit den meisten Stimmen wahlen (gewichtet nach Ahnlichkeit)

## Trainingsdaten

Der KNN-Router baut seinen Datensatz auf aus:

- Agentensitzungsprotokolle mit Qualitatsbewertungen
- A/B-Testergebnisse aus der Prompt-Evolution
- Manuelles Feedback und Korrekturen

## Konfiguration

```toml
[router]
strategy = "knn"

[router.knn]
k = 5
embedding_provider = "ollama"
embedding_model = "nomic-embed-text"
min_similarity = 0.6
min_dataset_size = 100
fallback_strategy = "heuristic"
```

## Kaltstart

Wenn nicht genugend Trainingsdaten verfugbar sind (unter `min_dataset_size`), fallt der KNN-Router auf die heuristische Strategie zuruck.

## Verwandte Seiten

- [Router-Ubersicht](./)
- [Heuristischer Router](./heuristic)
- [Automix-Router](./automix)
- [Embeddings-Gedachtnis](/de/prx/memory/embeddings)
