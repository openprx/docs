---
title: Selbstevolutions-System
description: Ubersicht uber das PRX 3-Schichten-Selbstevolutions-System fur autonome Agentenverbesserung.
---

# Selbstevolutions-System

PRX enthalt ein 3-Schichten-Selbstevolutions-System, das es Agenten ermoglicht, ihr Verhalten im Laufe der Zeit autonom zu verbessern. Das System analysiert kontinuierlich die Agentenleistung und wendet abgestufte Verbesserungen an -- von Gedachtnis-Optimierung uber Prompt-Tuning bis hin zu strategischen Richtlinienanderungen.

## Ubersicht

Die Selbstevolution ist in drei Schichten organisiert, die jeweils auf einer anderen Abstraktionsebene operieren:

| Schicht | Bereich | Haufigkeit | Risiko |
|---------|---------|------------|--------|
| [L1: Gedachtnis](./l1-memory) | Gedachtnis-Komprimierung, Themen-Clustering | Jede Sitzung | Niedrig |
| [L2: Prompt](./l2-prompt) | System-Prompt-Optimierung, A/B-Tests | Taglich/wochentlich | Mittel |
| [L3: Strategie](./l3-strategy) | Werkzeug-Richtlinien, Routing-Regeln, Governance | Wochentlich/monatlich | Hoch |

## Architektur

```
┌───────────────────────────────────────┐
│         Self-Evolution Engine          │
│                                        │
│  L3: Strategie   ← Niedrige Frequenz  │
│    ├── Werkzeug-Richtlinien-Tuning    │
│    ├── Routing-Optimierung            │
│    └── Governance-Anpassungen         │
│                                        │
│  L2: Prompt      ← Mittlere Frequenz  │
│    ├── System-Prompt-Verfeinerung     │
│    └── A/B-Test-Framework             │
│                                        │
│  L1: Gedachtnis  ← Hohe Frequenz      │
│    ├── Gedachtnis-Komprimierung       │
│    └── Themen-Clustering              │
└───────────────────────────────────────┘
```

## Sicherheit zuerst

Jeder Evolutionsvorschlag durchlauft eine Sicherheitspipeline vor der Ausfuhrung. Siehe [Sicherheit](./safety) fur Details zu Rollback-Schutz und Integritatsprufungen.

## Konfiguration

```toml
[self_evolution]
enabled = false  # nur bei expliziter Aktivierung
auto_apply = false  # standardmassig manuelle Genehmigung erfordern

[self_evolution.l1]
enabled = true
schedule = "after_session"

[self_evolution.l2]
enabled = false
schedule = "weekly"

[self_evolution.l3]
enabled = false
schedule = "monthly"
require_approval = true
```

## Verwandte Seiten

- [L1: Gedachtnis-Komprimierung](./l1-memory)
- [L2: Prompt-Optimierung](./l2-prompt)
- [L3: Strategie-Tuning](./l3-strategy)
- [Evolutions-Pipeline](./pipeline)
- [Sicherheit & Rollback](./safety)
