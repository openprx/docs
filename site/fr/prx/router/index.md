---
title: Routeur LLM
description: Apercu du routeur LLM intelligent de PRX pour la selection de modeles, l'optimisation des couts et l'equilibrage de la qualite.
---

# Routeur LLM

Le routeur PRX est un systeme intelligent de selection de modeles qui choisit automatiquement le meilleur fournisseur et modele LLM pour chaque requete. Il equilibre qualite, cout et latence en utilisant plusieurs strategies de routage.

## Apercu

Au lieu d'utiliser toujours un seul modele, le routeur selectionne dynamiquement parmi les modeles configures en fonction de :

- La complexite et le type de la requete
- Les scores de capacite et classements Elo des modeles
- Les contraintes de cout
- Les exigences de latence
- Les donnees de performance historiques

## Strategies de routage

| Strategie | Description | Ideal pour |
|-----------|-------------|------------|
| [Heuristique](./heuristic) | Scoring base sur des regles utilisant les caracteristiques de la requete | Configurations simples, comportement previsible |
| [KNN](./knn) | Similarite semantique avec les requetes passees reussies | Routage appris, haute precision |
| [Automix](./automix) | Commencer economique, escalader en cas de faible confiance | Optimisation des couts |

## Configuration

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

## Pages associees

- [Routeur heuristique](./heuristic)
- [Routeur KNN](./knn)
- [Routeur Automix](./automix)
- [Fournisseurs LLM](/fr/prx/providers/)
