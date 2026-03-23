---
title: Reference de configuration CTE
description: Reference complete de configuration du Moteur d'Arbre Causal de PRX.
---

# Reference de configuration CTE

Le Moteur d'Arbre Causal est configure via la section `[causal_tree]` de votre fichier de configuration PRX.

> **Le CTE est desactive par defaut.** Tous les parametres ci-dessous ne prennent effet que lorsque `causal_tree.enabled = true`.

## Exemple complet

```toml
[causal_tree]
enabled = true

w_confidence = 0.50
w_cost = 0.25
w_latency = 0.25

write_decision_log = true
write_metrics = true

[causal_tree.policy]
max_branches = 3
commit_threshold = 0.62
extra_token_ratio_limit = 0.35
extra_latency_budget_ms = 300
rehearsal_timeout_ms = 5000
default_side_effect_mode = "read_only"
circuit_breaker_threshold = 5
circuit_breaker_cooldown_secs = 60
```

## Reference des parametres

### Parametres de niveau superieur

| Parametre | Type | Par defaut | Description |
|-----------|------|-----------|------------|
| `enabled` | bool | `false` | Interrupteur principal. Si `false`, le CTE est completement contourne. |
| `w_confidence` | f32 | `0.50` | Poids de notation pour la dimension confiance. |
| `w_cost` | f32 | `0.25` | Poids de notation pour la penalite de cout. |
| `w_latency` | f32 | `0.25` | Poids de notation pour la penalite de latence. |
| `write_decision_log` | bool | `true` | Si active, emet un log structure pour chaque decision CTE. |
| `write_metrics` | bool | `true` | Si active, collecte les metriques de performance CTE. |

### Parametres de politique (`[causal_tree.policy]`)

| Parametre | Type | Par defaut | Description |
|-----------|------|-----------|------------|
| `max_branches` | usize | `3` | Nombre maximal de branches candidates par requete. |
| `commit_threshold` | f32 | `0.62` | Score composite minimum pour valider une branche. |
| `extra_token_ratio_limit` | f32 | `0.35` | Ratio maximal de tokens supplementaires CTE par rapport a la requete de base. |
| `extra_latency_budget_ms` | u64 | `300` | Latence supplementaire maximale du pipeline CTE (millisecondes). |
| `rehearsal_timeout_ms` | u64 | `5000` | Delai d'attente par repetition individuelle (millisecondes). |
| `default_side_effect_mode` | string | `"read_only"` | Mode d'effets secondaires. `"read_only"` / `"dry_run"` / `"live"`. |
| `circuit_breaker_threshold` | u32 | `5` | Echecs consecutifs pour declencher le disjoncteur. |
| `circuit_breaker_cooldown_secs` | u64 | `60` | Periode de refroidissement du disjoncteur (secondes). |

## Configuration minimale

```toml
[causal_tree]
enabled = true
```

## Pages associees

- [Apercu du Moteur d'Arbre Causal](./)
- [Reference complete de configuration](/fr/prx/config/reference)
