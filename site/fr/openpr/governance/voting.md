---
title: Vote & Décisions
description: "Le système de vote d'OpenPR prend en charge le vote pondéré, le quorum configurable, les seuils d'approbation et les enregistrements de décisions immuables."
---

# Vote & Décisions

Le système de vote dans OpenPR détermine le résultat des propositions de gouvernance. Il prend en charge le vote pondéré, les exigences de quorum configurables et les seuils d'approbation. Chaque vote et décision est enregistré avec une piste d'audit immuable.

## Processus de vote

1. Une proposition entre dans l'état **Vote**.
2. Les membres éligibles de l'espace de travail expriment leurs votes (approuver, rejeter ou s'abstenir).
3. Quand la période de vote se termine ou que le quorum est atteint, les votes sont comptés.
4. Le résultat est déterminé par le seuil d'approbation configuré.
5. Un **enregistrement de décision** est créé avec le résultat.

## Configuration du vote

Les paramètres de gouvernance sont configurés par espace de travail :

| Paramètre | Description | Exemple |
|-----------|-------------|---------|
| Quorum | Pourcentage minimum de votants éligibles qui doivent participer | 50% |
| Seuil d'approbation | Pourcentage de votes oui requis pour approbation | 66% |
| Période de vote | Durée pendant laquelle la fenêtre de vote reste ouverte | 7 jours |
| Vote pondéré | Si les scores de confiance affectent le poids du vote | Activé/Désactivé |

Configurez ces paramètres dans **Paramètres de l'espace de travail** > **Gouvernance** > **Configuration**, ou via l'API :

```bash
curl -X PUT http://localhost:8080/api/governance/config \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "quorum_percentage": 50,
    "approval_threshold": 66,
    "voting_period_days": 7,
    "weighted_voting": true
  }'
```

## Vote pondéré

Quand le vote pondéré est activé, le vote de chaque membre est multiplié par son score de confiance. Les membres avec des scores de confiance plus élevés ont plus d'influence sur le résultat. Voir [Scores de confiance](./trust-scores) pour les détails.

## Enregistrements de décisions

Chaque vote complété crée un **enregistrement de décision** -- une entrée de journal immuable contenant :

- La proposition sur laquelle le vote a eu lieu
- Les décomptes de votes (approuver, rejeter, s'abstenir)
- Le résultat final (approuvé ou rejeté)
- L'horodatage et les votants participants
- Le domaine de décision (si catégorisé)

Les enregistrements de décisions ne peuvent pas être modifiés ou supprimés. Ils servent d'historique faisant autorité des décisions de l'équipe.

### Consulter les décisions

```bash
# Lister les décisions
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions

# Obtenir une décision spécifique
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/decisions/<decision_id>
```

## Mécanisme de veto

Les vetoers désignés (configurés par espace de travail) peuvent opposer leur veto à des propositions approuvées :

1. **Veto** -- Un vetoer bloque une proposition approuvée avec une raison déclarée.
2. **Escalade** -- Le proposant peut escalader le veto à un vote plus large.
3. **Appel** -- N'importe quel membre peut déposer un appel contre un veto.

Le pouvoir de veto est conçu comme un mécanisme de sécurité pour les décisions à fort impact. Configurez les vetoers dans **Paramètres de l'espace de travail** > **Gouvernance** > **Vetoers**.

## Journaux d'audit

Toutes les actions de gouvernance sont enregistrées dans le journal d'audit :

- Création, soumission et archivage de propositions
- Votes exprimés (qui, quand, quoi)
- Enregistrements de décisions
- Événements de veto et escalades
- Changements de configuration

```bash
# Consulter les journaux d'audit de gouvernance
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/governance/audit-logs
```

## Domaines de décision

Les décisions peuvent être catégorisées en domaines (ex. "Architecture", "Processus", "Outillage") pour une meilleure organisation et filtrage. Les domaines sont configurés par espace de travail.

## Étapes suivantes

- [Scores de confiance](./trust-scores) -- Comment les scores de confiance influencent le poids des votes
- [Propositions](./proposals) -- Créer des propositions qui vont au vote
- [Vue d'ensemble de la gouvernance](./index) -- Référence complète du module de gouvernance
