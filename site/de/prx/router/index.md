---
title: LLM-Router
description: Ubersicht uber den intelligenten LLM-Router von PRX fur Modellauswahl, Kostenoptimierung und Qualitatsbalancierung.
---

# LLM-Router

Der PRX-Router ist ein intelligentes Modellauswahlsystem, das automatisch den besten LLM-Anbieter und das beste Modell fur jede Anfrage wahlt. Er balanciert Qualitat, Kosten und Latenz durch mehrere Routing-Strategien.

## Ubersicht

Anstatt immer ein einzelnes Modell zu verwenden, wahlt der Router dynamisch aus konfigurierten Modellen basierend auf:

- Abfragekomplexitat und -typ
- Modellfahigkeits-Scores und Elo-Bewertungen
- Kostenbeschrankungen
- Latenzanforderungen
- Historische Leistungsdaten

## Routing-Strategien

| Strategie | Beschreibung | Geeignet fur |
|-----------|-------------|-------------|
| [Heuristisch](./heuristic) | Regelbasierte Bewertung anhand von Abfragemerkmalen | Einfache Setups, vorhersagbares Verhalten |
| [KNN](./knn) | Semantische Ahnlichkeit zu vergangenen erfolgreichen Abfragen | Gelerntes Routing, hohe Genauigkeit |
| [Automix](./automix) | Gunstig starten, bei niedriger Konfidenz eskalieren | Kostenoptimierung |

## Konfiguration

```toml
[router]
enabled = true
strategy = "heuristic"  # "heuristic" | "knn" | "automix"
default_model = "anthropic/claude-sonnet-4-6"

[router.models]
cheap = "anthropic/claude-haiku"
standard = "anthropic/claude-sonnet-4-6"
premium = "anthropic/claude-opus-4-6"
```

## Verwandte Seiten

- [Heuristischer Router](./heuristic)
- [KNN-Router](./knn)
- [Automix-Router](./automix)
- [LLM-Anbieter](/de/prx/providers/)
