---
title: Moteur d'Arbre Causal
description: Apercu du Moteur d'Arbre Causal (CTE) de PRX — prediction speculative multi-branche avec repetition, notation et disjoncteur automatique.
---

# Moteur d'Arbre Causal

Le Moteur d'Arbre Causal (Causal Tree Engine, CTE) est un systeme d'execution speculative qui evalue plusieurs strategies de reponse en parallele avant de valider la meilleure. Il s'integre dans le pipeline de l'agent PRX entre la classification d'intention et l'invocation du LLM.

> **Desactive par defaut.** Le CTE est optionnel. Configurez `causal_tree.enabled = true` dans votre fichier de configuration pour l'activer.

## Flux de travail

```text
instantane → expansion → repetition → notation → selection → retour
```

1. **Instantane** — Capture l'etat causal actuel (contexte de session, budget, contraintes)
2. **Expansion** — Genere des branches candidates (reponse directe, utilisation d'outils, delegation a un sous-agent)
3. **Repetition** — Execute des "essais a blanc" legers des branches prometteuses en mode lecture seule
4. **Notation** — Classe les branches par un composite pondere de confiance, cout et latence
5. **Selection** — Valide la branche la mieux notee si elle atteint le seuil ; sinon, repli
6. **Retour** — Enregistre la decision pour l'observabilite et l'apprentissage futur

## Quand activer le CTE

| Scenario | Recommandation |
|----------|---------------|
| Q&R simple, chat decontracte | Garder le CTE **desactive** |
| Flux de travail multi-etapes avec outils | Activer le CTE |
| Taches d'agent autonome (Xin / auto-evolution) | Activer le CTE |
| Deploiements sensibles aux couts | Activer le CTE avec `extra_token_ratio_limit` strict |

## Demarrage rapide

Ajoutez a votre fichier de configuration PRX (`~/.openprx/config.toml`) :

```toml
[causal_tree]
enabled = true
```

Tous les autres parametres ont des valeurs par defaut raisonnables. Consultez la [Reference de configuration](./configuration) pour la liste complete.

## Disjoncteur

- Apres `circuit_breaker_threshold` echecs consecutifs (par defaut : 5), le CTE se declenche et toutes les requetes le contournent
- Apres `circuit_breaker_cooldown_secs` (par defaut : 60s), le disjoncteur autorise une nouvelle tentative
- Une seule execution reussie reinitialise le compteur d'echecs

## Metriques

| Metrique | Description |
|----------|------------|
| `hit_at_1_ratio` | Fraction des executions ou la premiere branche etait correcte |
| `hit_at_3_ratio` | Fraction ou la branche correcte etait dans le top-3 |
| `wasted_speculation_ratio` | Repetitions effectuees mais non utilisees |
| `commit_success_rate` | Pourcentage de validations reussies |
| `avg_extra_latency_ms` | Latence supplementaire moyenne par execution |
| `circuit_breaker_trips` | Nombre de declenchements du disjoncteur |

## Pages associees

- [Reference de configuration](./configuration)
- [Runtime de l'agent](/fr/prx/agent/runtime)
- [Routeur LLM](/fr/prx/router/)
- [Observabilite](/fr/prx/observability/)
