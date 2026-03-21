---
title: Systeme d'auto-evolution
description: Apercu du systeme d'auto-evolution a 3 couches de PRX pour l'amelioration autonome des agents.
---

# Systeme d'auto-evolution

PRX inclut un systeme d'auto-evolution a 3 couches qui permet aux agents d'ameliorer leur comportement de maniere autonome au fil du temps. Le systeme analyse en continu les performances de l'agent et applique des ameliorations graduees -- de l'optimisation de la memoire au reglage des prompts en passant par les changements de politique strategique.

## Apercu

L'auto-evolution est organisee en trois couches, chacune operant a un niveau d'abstraction different :

| Couche | Portee | Frequence | Risque |
|--------|--------|-----------|--------|
| [L1 : Memoire](./l1-memory) | Compactage de memoire, regroupement par sujet | Chaque session | Faible |
| [L2 : Prompt](./l2-prompt) | Optimisation du prompt systeme, tests A/B | Quotidien/hebdomadaire | Moyen |
| [L3 : Strategie](./l3-strategy) | Politiques d'outils, regles de routage, gouvernance | Hebdomadaire/mensuel | Eleve |

## Architecture

```
┌───────────────────────────────────────┐
│      Moteur d'auto-evolution          │
│                                        │
│  L3 : Strategie  ← Frequence basse    │
│    ├── Reglage des politiques d'outils │
│    ├── Optimisation du routage         │
│    └── Ajustements de gouvernance      │
│                                        │
│  L2 : Prompt     ← Frequence moyenne   │
│    ├── Affinement du prompt systeme    │
│    └── Framework de tests A/B          │
│                                        │
│  L1 : Memoire    ← Frequence elevee    │
│    ├── Compactage de memoire           │
│    └── Regroupement par sujet          │
└───────────────────────────────────────┘
```

## La securite d'abord

Chaque proposition d'evolution passe par un pipeline de securite avant execution. Consultez [Securite](./safety) pour les details sur la protection par rollback et les verifications de coherence.

## Configuration

```toml
[self_evolution]
enabled = false  # opt-in only
auto_apply = false  # require manual approval by default

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

## Pages associees

- [L1 : Compactage de memoire](./l1-memory)
- [L2 : Optimisation des prompts](./l2-prompt)
- [L3 : Reglage strategique](./l3-strategy)
- [Pipeline d'evolution](./pipeline)
- [Securite et rollback](./safety)
