---
title: Référence des points de terminaison API
description: "Référence complète de tous les points de terminaison de l'API REST OpenPR incluant l'authentification, les projets, les problèmes, la gouvernance, l'IA et les opérations d'administration."
---

# Référence des points de terminaison API

Cette page fournit une référence complète de tous les points de terminaison de l'API REST OpenPR. Tous les points de terminaison nécessitent une authentification sauf indication contraire.

## Authentification

| Méthode | Point de terminaison | Description | Auth |
|---------|---------------------|-------------|------|
| POST | `/api/auth/register` | Créer un nouveau compte | Non |
| POST | `/api/auth/login` | Se connecter et recevoir les jetons | Non |
| POST | `/api/auth/refresh` | Rafraîchir le jeton d'accès | Non |
| GET | `/api/auth/me` | Obtenir les informations de l'utilisateur actuel | Oui |

## Espaces de travail

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/workspaces` | Lister les espaces de travail de l'utilisateur |
| POST | `/api/workspaces` | Créer un espace de travail |
| GET | `/api/workspaces/:id` | Obtenir les détails de l'espace de travail |
| PUT | `/api/workspaces/:id` | Mettre à jour l'espace de travail |
| DELETE | `/api/workspaces/:id` | Supprimer l'espace de travail (propriétaire uniquement) |

## Membres de l'espace de travail

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/workspaces/:id/members` | Lister les membres |
| POST | `/api/workspaces/:id/members` | Ajouter un membre |
| PUT | `/api/workspaces/:id/members/:user_id` | Mettre à jour le rôle du membre |
| DELETE | `/api/workspaces/:id/members/:user_id` | Retirer un membre |

## Jetons Bot

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/workspaces/:id/bots` | Lister les jetons bot |
| POST | `/api/workspaces/:id/bots` | Créer un jeton bot |
| DELETE | `/api/workspaces/:id/bots/:bot_id` | Supprimer un jeton bot |

## Projets

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/workspaces/:ws_id/projects` | Lister les projets |
| POST | `/api/workspaces/:ws_id/projects` | Créer un projet |
| GET | `/api/workspaces/:ws_id/projects/:id` | Obtenir le projet avec les comptages |
| PUT | `/api/workspaces/:ws_id/projects/:id` | Mettre à jour le projet |
| DELETE | `/api/workspaces/:ws_id/projects/:id` | Supprimer le projet |

## Problèmes (Éléments de travail)

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/projects/:id/issues` | Lister les problèmes (pagination, filtres) |
| POST | `/api/projects/:id/issues` | Créer un problème |
| GET | `/api/issues/:id` | Obtenir un problème par UUID |
| PATCH | `/api/issues/:id` | Mettre à jour les champs du problème |
| DELETE | `/api/issues/:id` | Supprimer un problème |

### Champs du problème (Créer/Mettre à jour)

```json
{
  "title": "string (requis à la création)",
  "description": "string (markdown)",
  "state": "backlog | todo | in_progress | done",
  "priority": "low | medium | high | urgent",
  "assignee_id": "uuid",
  "sprint_id": "uuid",
  "due_at": "datetime ISO 8601"
}
```

## Tableau

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/projects/:id/board` | Obtenir l'état du tableau kanban |

## Commentaires

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/issues/:id/comments` | Lister les commentaires sur un problème |
| POST | `/api/issues/:id/comments` | Créer un commentaire |
| DELETE | `/api/comments/:id` | Supprimer un commentaire |

## Étiquettes

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/labels` | Lister toutes les étiquettes de l'espace de travail |
| POST | `/api/labels` | Créer une étiquette |
| PUT | `/api/labels/:id` | Mettre à jour l'étiquette |
| DELETE | `/api/labels/:id` | Supprimer l'étiquette |
| POST | `/api/issues/:id/labels` | Ajouter une étiquette au problème |
| DELETE | `/api/issues/:id/labels/:label_id` | Retirer une étiquette du problème |

## Sprints

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/projects/:id/sprints` | Lister les sprints |
| POST | `/api/projects/:id/sprints` | Créer un sprint |
| PUT | `/api/sprints/:id` | Mettre à jour le sprint |
| DELETE | `/api/sprints/:id` | Supprimer le sprint |

## Propositions

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/proposals` | Lister les propositions |
| POST | `/api/proposals` | Créer une proposition |
| GET | `/api/proposals/:id` | Obtenir les détails d'une proposition |
| POST | `/api/proposals/:id/vote` | Exprimer un vote |
| POST | `/api/proposals/:id/submit` | Soumettre pour vote |
| POST | `/api/proposals/:id/archive` | Archiver la proposition |

## Gouvernance

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/governance/config` | Obtenir la configuration de gouvernance |
| PUT | `/api/governance/config` | Mettre à jour la configuration de gouvernance |
| GET | `/api/governance/audit-logs` | Lister les journaux d'audit de gouvernance |

## Décisions

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/decisions` | Lister les décisions |
| GET | `/api/decisions/:id` | Obtenir les détails d'une décision |

## Scores de confiance

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/trust-scores` | Lister les scores de confiance |
| GET | `/api/trust-scores/:user_id` | Obtenir le score de confiance d'un utilisateur |
| GET | `/api/trust-scores/:user_id/history` | Obtenir l'historique du score |
| POST | `/api/trust-scores/:user_id/appeals` | Déposer un appel |

## Veto

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/veto` | Lister les événements de veto |
| POST | `/api/veto` | Créer un veto |
| POST | `/api/veto/:id/escalate` | Escalader un veto |

## Agents IA

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/projects/:id/ai-agents` | Lister les agents IA |
| POST | `/api/projects/:id/ai-agents` | Enregistrer un agent IA |
| GET | `/api/projects/:id/ai-agents/:agent_id` | Obtenir les détails de l'agent |
| PUT | `/api/projects/:id/ai-agents/:agent_id` | Mettre à jour l'agent |
| DELETE | `/api/projects/:id/ai-agents/:agent_id` | Supprimer l'agent |

## Tâches IA

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/projects/:id/ai-tasks` | Lister les tâches IA |
| POST | `/api/projects/:id/ai-tasks` | Créer une tâche IA |
| PUT | `/api/projects/:id/ai-tasks/:task_id` | Mettre à jour le statut de la tâche |
| POST | `/api/projects/:id/ai-tasks/:task_id/callback` | Rappel de tâche |

## Téléchargement de fichiers

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| POST | `/api/v1/upload` | Télécharger un fichier (multipart/form-data) |

Types pris en charge : images (PNG, JPG, GIF, WebP), documents (PDF, TXT), données (JSON, CSV, XML), archives (ZIP, GZ), journaux.

## Webhooks

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/workspaces/:id/webhooks` | Lister les webhooks |
| POST | `/api/workspaces/:id/webhooks` | Créer un webhook |
| PUT | `/api/workspaces/:id/webhooks/:wh_id` | Mettre à jour le webhook |
| DELETE | `/api/workspaces/:id/webhooks/:wh_id` | Supprimer le webhook |
| GET | `/api/workspaces/:id/webhooks/:wh_id/deliveries` | Journal de livraison |

## Recherche

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/search?q=<query>` | Recherche plein texte sur toutes les entités |

## Admin

| Méthode | Point de terminaison | Description |
|---------|---------------------|-------------|
| GET | `/api/admin/users` | Lister tous les utilisateurs (admin uniquement) |
| PUT | `/api/admin/users/:id` | Mettre à jour l'utilisateur (admin uniquement) |

## Santé

| Méthode | Point de terminaison | Description | Auth |
|---------|---------------------|-------------|------|
| GET | `/health` | Vérification de santé | Non |

## Étapes suivantes

- [Authentification](./authentication) -- Gestion des jetons et jetons bot
- [Vue d'ensemble de l'API](./index) -- Format de réponse et conventions
- [Serveur MCP](../mcp-server/) -- Interface conviviale pour l'IA
