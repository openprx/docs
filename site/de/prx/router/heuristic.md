---
title: Heuristischer Router
description: Regelbasiertes LLM-Routing in PRX mittels Abfragemerkmal-Bewertung und Fahigkeitsabgleich.
---

# Heuristischer Router

Der heuristische Router verwendet ein regelbasiertes Bewertungssystem, um das optimale Modell fur jede Abfrage auszuwahlen. Er analysiert Abfragemerkmale (Lange, Komplexitat, Werkzeuganforderungen) und gleicht sie mit Modellfahigkeitsprofilen ab.

## Funktionsweise

1. **Merkmalsextraktion** -- die Abfrage auf Lange, Schlusselwortmuster und Werkzeuganforderungen analysieren
2. **Fahigkeitsbewertung** -- die Eignung jedes Modells basierend auf extrahierten Merkmalen bewerten
3. **Kostengewichtung** -- Kostenpraferenzen anwenden, um gunstigere Modelle fur einfache Abfragen zu bevorzugen
4. **Auswahl** -- das hochstbewertete Modell wahlen, das die Mindestqualitatsschwellen erfullt

## Bewertungsfaktoren

| Faktor | Gewicht | Beschreibung |
|--------|---------|-------------|
| Fahigkeitsabgleich | 0,4 | Fahigkeit des Modells, den Abfragetyp zu verarbeiten |
| Elo-Bewertung | 0,2 | Historische Modellleistung |
| Kosteneffizienz | 0,2 | Tokens pro Dollar |
| Latenz | 0,1 | Durchschnittliche Antwortzeit |
| Kontextfenster | 0,1 | Passt zum Gesprachskontext |

## Konfiguration

```toml
[router]
strategy = "heuristic"

[router.heuristic]
complexity_threshold = 0.6
prefer_cheap_below = 0.4
elo_weight = 0.2
cost_weight = 0.2
```

## Verwandte Seiten

- [Router-Ubersicht](./)
- [KNN-Router](./knn)
- [Automix-Router](./automix)
