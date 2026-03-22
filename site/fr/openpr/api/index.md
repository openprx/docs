---
title: Vue d'ensemble de l'API REST
description: "OpenPR expose une API REST complète pour gérer les espaces de travail, projets, problèmes, gouvernance et plus encore. Construite avec Rust et Axum."
---

# Vue d'ensemble de l'API REST

OpenPR fournit une API RESTful construite avec **Rust** et **Axum** pour l'accès programmatique à toutes les fonctionnalités de la plateforme. L'API prend en charge les formats de requête/réponse JSON et l'authentification basée sur JWT.

## URL de base

```
http://localhost:8080/api
```

Dans les déploiements de production derrière un proxy inverse (Caddy/Nginx), l'API est généralement proxifiée via l'URL du frontend.

## Format de réponse

Toutes les réponses de l'API suivent une structure JSON cohérente :

### Succès

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

### Erreur

```json
{
  "code": 400,
  "message": "Description détaillée de l'erreur"
}
```

Codes d'erreur courants :

| Code | Signification |
|------|--------------|
| 400 | Requête invalide (erreur de validation) |
| 401 | Non autorisé (jeton manquant ou invalide) |
| 403 | Interdit (permissions insuffisantes) |
| 404 | Non trouvé |
| 500 | Erreur interne du serveur |

## Catégories de l'API

| Catégorie | Chemin de base | Description |
|-----------|---------------|-------------|
| [Authentification](./authentication) | `/api/auth/*` | Enregistrement, connexion, rafraîchissement de jeton |
| Projets | `/api/workspaces/*/projects/*` | CRUD, membres, paramètres |
| Problèmes | `/api/projects/*/issues/*` | CRUD, assigner, étiqueter, commenter |
| Tableau | `/api/projects/*/board` | État du tableau kanban |
| Sprints | `/api/projects/*/sprints/*` | CRUD et planification de sprints |
| Étiquettes | `/api/labels/*` | CRUD des étiquettes |
| Recherche | `/api/search` | Recherche plein texte |
| Propositions | `/api/proposals/*` | Créer, voter, soumettre, archiver |
| Gouvernance | `/api/governance/*` | Configuration, journaux d'audit |
| Décisions | `/api/decisions/*` | Enregistrements de décisions |
| Scores de confiance | `/api/trust-scores/*` | Scores, historique, appels |
| Veto | `/api/veto/*` | Veto, escalade |
| Agents IA | `/api/projects/*/ai-agents/*` | Gestion des agents |
| Tâches IA | `/api/projects/*/ai-tasks/*` | Attribution de tâches |
| Jetons Bot | `/api/workspaces/*/bots` | CRUD des jetons bot |
| Téléchargement de fichiers | `/api/v1/upload` | Téléchargement de fichiers multipart |
| Webhooks | `/api/workspaces/*/webhooks/*` | CRUD des webhooks |
| Admin | `/api/admin/*` | Gestion système |

Voir la [Référence des points de terminaison](./endpoints) pour la référence complète de l'API.

## Type de contenu

Toutes les requêtes POST/PUT/PATCH doivent utiliser `Content-Type: application/json`, sauf les téléchargements de fichiers qui utilisent `multipart/form-data`.

## Pagination

Les points de terminaison de liste prennent en charge la pagination :

```bash
curl "http://localhost:8080/api/projects/<id>/issues?page=1&per_page=20" \
  -H "Authorization: Bearer <token>"
```

## Recherche plein texte

Le point de terminaison de recherche utilise la recherche plein texte PostgreSQL sur les problèmes, commentaires et propositions :

```bash
curl "http://localhost:8080/api/search?q=authentication+bug" \
  -H "Authorization: Bearer <token>"
```

## Vérification de santé

Le serveur API expose un point de terminaison de santé qui ne nécessite pas d'authentification :

```bash
curl http://localhost:8080/health
```

## Étapes suivantes

- [Authentification](./authentication) -- Authentification JWT et jetons bot
- [Référence des points de terminaison](./endpoints) -- Documentation complète des points de terminaison
- [Serveur MCP](../mcp-server/) -- Interface conviviale pour l'IA avec 34 outils
