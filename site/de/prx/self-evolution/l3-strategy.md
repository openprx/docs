---
title: "L3: Strategie-Evolution"
description: Schicht-3-Selbstevolution in PRX fur Werkzeug-Richtlinien, Routing-Optimierung und Governance-Tuning.
---

# L3: Strategie-Evolution

Schicht 3 ist die auswirkungsreichste und seltenste Evolutions-Schicht. Sie modifiziert das strategische Verhalten des Agenten -- Werkzeug-Zugriffsrichtlinien, LLM-Routing-Regeln und Governance-Parameter. Aufgrund ihrer breiten Auswirkung erfordern L3-Anderungen immer eine explizite Genehmigung.

## Ubersicht

L3-Evolution befasst sich mit:

- **Werkzeug-Richtlinien-Tuning** -- anpassen, welche Werkzeuge verfugbar sind und welche Berechtigungsstufen sie haben
- **Routing-Optimierung** -- Modellauswahl-Heuristiken basierend auf Leistungsdaten verfeinern
- **Governance-Parameter** -- Sicherheitsschwellenwerte, Ratenlimits und Genehmigungs-Workflows tunen
- **Kostenoptimierung** -- Qualitat gegen Ressourcenverbrauch abwagen

## Funktionsweise

1. L3 sammelt aggregierte Leistungsdaten uber Wochen/Monate
2. Es identifiziert Muster (z.B. ein gunstigeres Modell bearbeitet 80% der Anfragen angemessen)
3. Es schlagt strategische Anderungen mit erwarteter Auswirkungsanalyse vor
4. Anderungen werden zur menschlichen Genehmigung eingereiht
5. Genehmigte Anderungen werden mit automatischer Rollback-Fahigkeit angewendet

## Konfiguration

```toml
[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
rollback_window_hours = 168  # 7 Tage
max_policy_changes_per_cycle = 3
```

## Verwandte Seiten

- [Selbstevolutions-Ubersicht](./)
- [L2: Prompt-Optimierung](./l2-prompt)
- [Evolutions-Pipeline](./pipeline)
- [Sicherheit & Rollback](./safety)
