---
title: Gestion des sprints
description: "Planifier et suivre le travail dans des itérations à durée fixe avec les sprints OpenPR. Créer des sprints, assigner des problèmes et surveiller la progression."
---

# Gestion des sprints

Les sprints sont des itérations à durée fixe pour organiser et suivre le travail. Chaque sprint appartient à un projet et a une date de début, une date de fin et un ensemble de problèmes assignés.

## Créer un sprint

### Via l'interface web

1. Naviguez vers votre projet.
2. Allez dans la section **Sprints**.
3. Cliquez sur **Nouveau sprint**.
4. Entrez le nom du sprint, la date de début et la date de fin.

### Via l'API

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/sprints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Sprint 1",
    "start_date": "2026-03-24",
    "end_date": "2026-04-07"
  }'
```

### Via MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "sprints.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "name": "Sprint 1",
      "start_date": "2026-03-24",
      "end_date": "2026-04-07"
    }
  }
}
```

## Champs d'un sprint

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| Nom | string | Oui | Nom du sprint (ex. "Sprint 1", "Semaine 3 T1") |
| Date de début | date | Non | Date de début du sprint |
| Date de fin | date | Non | Date de fin du sprint |
| Statut | enum | Auto | Actif, terminé ou planifié |

## Assigner des problèmes aux sprints

Assignez des problèmes à un sprint en mettant à jour le `sprint_id` du problème :

```bash
curl -X PATCH http://localhost:8080/api/issues/<issue_id> \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"sprint_id": "<sprint_uuid>"}'
```

Ou via l'interface web, faites glisser les problèmes dans la section sprint ou utilisez le panneau de détail du problème.

## Flux de planification de sprint

Un flux typique de planification de sprint :

1. **Créer le sprint** avec les dates de début et de fin.
2. **Examiner le backlog** -- identifier les problèmes à inclure.
3. **Déplacer les problèmes** du Backlog/À faire vers le sprint.
4. **Définir les priorités** et les responsables pour les problèmes du sprint.
5. **Démarrer le sprint** -- l'équipe commence le travail.
6. **Suivre la progression** sur le tableau et la vue du sprint.
7. **Terminer le sprint** -- examiner les éléments terminés/restants.

## Outils MCP

| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `sprints.list` | `project_id` | Lister les sprints dans un projet |
| `sprints.create` | `project_id`, `name` | Créer un sprint avec des dates optionnelles |
| `sprints.update` | `sprint_id` | Mettre à jour le nom, les dates ou le statut |
| `sprints.delete` | `sprint_id` | Supprimer un sprint |

## Étapes suivantes

- [États du workflow](./workflow) -- Comprendre les transitions d'état des problèmes
- [Étiquettes](./labels) -- Catégoriser les problèmes du sprint
- [Vue d'ensemble des problèmes](./index) -- Référence complète des champs de problème
