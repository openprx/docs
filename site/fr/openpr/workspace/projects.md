---
title: Gestion des projets
description: "Les projets organisent les problèmes, sprints et étiquettes dans un espace de travail. Apprenez à créer et gérer des projets dans OpenPR."
---

# Gestion des projets

Un **projet** existe dans un espace de travail et sert de conteneur pour les problèmes, sprints, étiquettes et propositions de gouvernance. Chaque projet a une **clé** unique (ex. `API`, `FRONT`, `OPS`) qui préfixe les identifiants de problèmes.

## Créer un projet

Naviguez vers votre espace de travail et cliquez sur **Nouveau projet** :

| Champ | Requis | Description | Exemple |
|-------|--------|-------------|---------|
| Nom | Oui | Nom d'affichage | "API Backend" |
| Clé | Oui | Préfixe de 2-5 caractères pour les problèmes | "API" |
| Description | Non | Résumé du projet | "API REST et logique métier" |

La clé doit être unique dans l'espace de travail et détermine les identifiants de problèmes : `API-1`, `API-2`, etc.

## Tableau de bord du projet

Chaque projet fournit :

- **Tableau** -- Vue kanban avec colonnes glisser-déposer (Backlog, À faire, En cours, Terminé).
- **Problèmes** -- Vue liste avec filtrage, tri et recherche plein texte.
- **Sprints** -- Planification de sprints et gestion des cycles. Voir [Sprints](../issues/sprints).
- **Étiquettes** -- Étiquettes limitées au projet pour la catégorisation. Voir [Étiquettes](../issues/labels).
- **Paramètres** -- Nom du projet, clé, description et paramètres des membres.

## Comptage des problèmes

La vue d'ensemble du projet affiche les comptages de problèmes par état :

| État | Description |
|------|-------------|
| Backlog | Idées et travaux futurs |
| À faire | Planifié pour le cycle actuel |
| En cours | Activement en cours de traitement |
| Terminé | Travail complété |

## Référence API

```bash
# Lister les projets dans un espace de travail
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects

# Créer un projet
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"name": "API Backend", "key": "API"}'

# Obtenir un projet avec les comptages de problèmes
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects/<project_id>
```

## Outils MCP

| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `projects.list` | -- | Lister tous les projets dans l'espace de travail |
| `projects.get` | `project_id` | Obtenir les détails du projet avec les comptages de problèmes |
| `projects.create` | `key`, `name` | Créer un nouveau projet |
| `projects.update` | `project_id` | Mettre à jour le nom ou la description |
| `projects.delete` | `project_id` | Supprimer un projet |

## Étapes suivantes

- [Problèmes](../issues/) -- Créer et gérer des problèmes dans les projets
- [Membres](./members) -- Gérer l'accès aux projets via les rôles de l'espace de travail
