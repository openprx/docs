---
title: "L2: Prompt-Evolution"
description: Schicht-2-Selbstevolution in PRX fur System-Prompt-Optimierung und A/B-Tests.
---

# L2: Prompt-Evolution

Schicht 2 operiert mit mittlerer Frequenz, um die System-Prompts des Agenten zu verfeinern. Sie analysiert Gesprachsqualitats-Metriken und schlagt Prompt-Modifikationen vor, die uber ein A/B-Framework getestet werden, bevor sie dauerhaft ubernommen werden.

## Ubersicht

L2-Evolution befasst sich mit:

- **System-Prompt-Verfeinerung** -- Klarheit der Anweisungen und Aufgabenabdeckung verbessern
- **Persona-Tuning** -- Ton, Ausfuhrlichkeit und Kommunikationsstil anpassen
- **Werkzeug-Nutzungsanweisungen** -- optimieren, wie Werkzeuge dem LLM beschrieben werden
- **A/B-Tests** -- Prompt-Anderungen statistisch validieren, bevor sie ausgerollt werden

## A/B-Test-Framework

Wenn eine Prompt-Modifikation vorgeschlagen wird, fuhrt L2 sowohl den ursprunglichen als auch den modifizierten Prompt parallel fur einen konfigurierbaren Evaluierungszeitraum aus:

1. **Traffic aufteilen** -- zwischen Original- und Kandidaten-Prompt abwechseln
2. **Metriken erfassen** -- Aufgabenabschluss, Benutzerzufriedenheit, Werkzeug-Nutzungseffizienz verfolgen
3. **Statistischer Test** -- Signifikanztest durchfuhren, um den Gewinner zu ermitteln
4. **Ubernehmen oder Zuruckrollen** -- den Gewinner ubernehmen oder das Original beibehalten

## Konfiguration

```toml
[self_evolution.l2]
enabled = false
schedule = "weekly"
min_samples = 50
confidence_level = 0.95
max_concurrent_experiments = 2
```

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [L1: Gedachtnis-Evolution](./l1-memory)
- [L3: Strategie-Tuning](./l3-strategy)
- [Sicherheit & Rollback](./safety)
