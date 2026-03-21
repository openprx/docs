---
title: Automix-Router
description: Kostenoptimierendes LLM-Routing, das mit gunstigen Modellen startet und bei niedriger Konfidenz eskaliert.
---

# Automix-Router

Der Automix-Router optimiert auf Kosten, indem er jede Abfrage mit einem gunstigen Modell startet und nur dann zu einem Premium-Modell eskaliert, wenn der Konfidenz-Score der initialen Antwort unter einem Schwellenwert liegt.

## Funktionsweise

1. **Initiale Abfrage** -- die Abfrage an das gunstige Modell senden
2. **Konfidenzprufung** -- den Konfidenz-Score der Antwort bewerten
3. **Bei Bedarf eskalieren** -- wenn die Konfidenz unter dem Schwellenwert liegt, mit dem Premium-Modell erneut abfragen
4. **Ruckgabe** -- die erste konfidente Antwort zuruckgeben

## Konfidenzbewertung

Die Konfidenz wird bewertet basierend auf:

- Selbst berichtete Konfidenz in der Antwort
- Vorhandensein von vorsichtiger Sprache ("Ich bin nicht sicher", "konnte sein")
- Token-Level-Entropie der Antwort
- Erfolgsrate von Werkzeugaufrufen

## Konfiguration

```toml
[router]
strategy = "automix"

[router.automix]
enabled = true
confidence_threshold = 0.7
cheap_model = "anthropic/claude-haiku"
premium_model = "anthropic/claude-opus-4-6"
max_escalations = 1
```

## Kosteneinsparungen

Bei typischer Nutzung leitet Automix 60-80% der Abfragen an das gunstige Modell weiter, was erhebliche Kosteneinsparungen erzielt und gleichzeitig die Qualitat fur komplexe Abfragen beibehalt.

## Verwandte Seiten

- [Router-Ubersicht](./)
- [Heuristischer Router](./heuristic)
- [KNN-Router](./knn)
