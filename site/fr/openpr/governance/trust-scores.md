---
title: Scores de confiance
description: "Le système de scores de confiance d'OpenPR suit la réputation par utilisateur basée sur la participation, la qualité des décisions et les retours de l'équipe. Les scores de confiance influencent le poids du vote."
---

# Scores de confiance

Les scores de confiance sont une métrique de réputation par utilisateur dans OpenPR qui suit la qualité de la participation et l'historique de la prise de décision. Quand le vote pondéré est activé, les scores de confiance influencent directement le pouvoir de vote.

## Fonctionnement des scores de confiance

Chaque membre de l'espace de travail a un score de confiance qui reflète sa participation à la gouvernance :

| Facteur | Impact | Description |
|---------|--------|-------------|
| Qualité des propositions | Positif | Les propositions approuvées augmentent le score |
| Participation au vote | Positif | Le vote régulier augmente le score |
| Décisions alignées | Positif | Voter avec la majorité finale |
| Propositions rejetées | Négatif | Les propositions rejetées diminuent le score |
| Décisions vetées | Négatif | Avoir des propositions vetées |
| Appels | Variable | Les appels réussis restaurent le score |

## Plage des scores

Les scores de confiance sont normalisés sur une plage numérique. Des scores plus élevés indiquent une participation à la gouvernance plus fiable :

| Plage | Niveau | Poids du vote |
|-------|--------|---------------|
| 80-100 | Haute confiance | Poids x1.5 |
| 50-79 | Normal | Poids x1.0 |
| 20-49 | Faible confiance | Poids x0.75 |
| 0-19 | Minimal | Poids x0.5 |

::: tip Vote pondéré
La pondération des scores de confiance ne s'applique que quand le **vote pondéré** est activé dans la configuration de gouvernance de l'espace de travail. Sinon, tous les votes ont le même poids.
:::

## Consulter les scores de confiance

### Via l'interface web

Naviguez vers **Paramètres de l'espace de travail** > **Gouvernance** > **Scores de confiance** pour voir tous les scores des membres et leur historique.

### Via l'API

```bash
# Obtenir les scores de confiance pour l'espace de travail
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores

# Obtenir l'historique du score de confiance d'un utilisateur spécifique
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/trust-scores/<user_id>/history
```

## Historique des scores de confiance

Chaque modification d'un score de confiance est enregistrée dans la table `trust_score_logs` avec :

- L'utilisateur affecté
- Les valeurs précédente et nouvelle du score
- La raison du changement
- L'horodatage
- La proposition ou décision associée (le cas échéant)

Cet historique fournit une transparence sur l'évolution des scores dans le temps.

## Appels

Si un membre estime que son score de confiance a été injustement affecté, il peut déposer un appel :

1. Naviguez vers son historique de score de confiance.
2. Cliquez sur **Appel** sur un changement de score spécifique.
3. Fournissez une raison pour l'appel.
4. Les administrateurs de l'espace de travail examinent et décident de l'appel.

Les appels réussis restaurent le changement de score. Les enregistrements d'appels sont préservés dans le journal d'audit.

```bash
# Déposer un appel
curl -X POST http://localhost:8080/api/trust-scores/<user_id>/appeals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"reason": "Le score a diminué en raison d une proposition de test qui n était pas destinée à la production."}'
```

## Évaluations d'impact

Les scores de confiance sont l'une des entrées dans les **évaluations d'impact** -- des évaluations de la façon dont une proposition ou une décision affecte le projet. Les évaluations d'impact incluent :

- Métriques quantitatives (effort estimé, niveau de risque, portée)
- Évaluations qualitatives des participants à la révision
- Données historiques de décisions similaires

## Étapes suivantes

- [Vote & Décisions](./voting) -- Comment les scores de confiance influencent les résultats des votes
- [Propositions](./proposals) -- Créer des propositions qui affectent les scores de confiance
- [Vue d'ensemble de la gouvernance](./index) -- Référence complète du module de gouvernance
