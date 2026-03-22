---
title: Authentification
description: "OpenPR utilise des jetons JWT pour l'authentification des utilisateurs et des jetons bot pour l'accès IA/MCP. Apprenez l'enregistrement, la connexion, le rafraîchissement des jetons et les jetons bot."
---

# Authentification

OpenPR utilise les **JWT (JSON Web Tokens)** pour l'authentification des utilisateurs et les **jetons bot** pour l'accès des assistants IA et du serveur MCP.

## Authentification utilisateur (JWT)

### S'enregistrer

Créer un nouveau compte :

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePassword123"
  }'
```

Réponse :

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "user"
    },
    "access_token": "eyJ...",
    "refresh_token": "eyJ..."
  }
}
```

::: tip Premier utilisateur
Le premier utilisateur enregistré reçoit automatiquement le rôle `admin`. Tous les utilisateurs suivants sont `user` par défaut.
:::

### Connexion

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123"
  }'
```

La réponse inclut `access_token`, `refresh_token` et les informations utilisateur avec `role`.

### Utiliser le jeton d'accès

Incluez le jeton d'accès dans l'en-tête `Authorization` pour toutes les requêtes authentifiées :

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/workspaces
```

### Rafraîchissement de jeton

Quand le jeton d'accès expire, utilisez le jeton de rafraîchissement pour obtenir une nouvelle paire :

```bash
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refresh_token": "eyJ..."}'
```

### Obtenir l'utilisateur actuel

```bash
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/auth/me
```

Retourne le profil de l'utilisateur actuel incluant `role` (admin/user).

## Configuration des jetons

Les durées de vie des jetons JWT sont configurées via des variables d'environnement :

| Variable | Défaut | Description |
|----------|--------|-------------|
| `JWT_SECRET` | `change-me-in-production` | Clé secrète pour signer les jetons |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 jours) | Durée de vie du jeton d'accès |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 jours) | Durée de vie du jeton de rafraîchissement |

::: danger Sécurité en production
Définissez toujours `JWT_SECRET` avec une valeur forte et aléatoire en production. La valeur par défaut est non sécurisée.
:::

## Authentification par jeton bot

Les jetons bot fournissent l'authentification pour les assistants IA et les outils automatisés. Ils sont limités à l'espace de travail et utilisent le préfixe `opr_`.

### Créer des jetons bot

Les jetons bot sont gérés via l'interface de paramètres de l'espace de travail ou l'API :

```bash
curl -X POST http://localhost:8080/api/workspaces/<workspace_id>/bots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"name": "Claude Assistant"}'
```

### Utiliser les jetons bot

Les jetons bot sont utilisés de la même façon que les jetons JWT :

```bash
curl -H "Authorization: Bearer opr_abc123..." \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

### Propriétés des jetons bot

| Propriété | Description |
|-----------|-------------|
| Préfixe | `opr_` |
| Portée | Un espace de travail |
| Type d'entité | Crée une entité utilisateur `bot_mcp` |
| Permissions | Identiques au membre de l'espace de travail |
| Piste d'audit | Toutes les actions journalisées sous l'utilisateur bot |

## Résumé des points de terminaison d'authentification

| Point de terminaison | Méthode | Description |
|---------------------|---------|-------------|
| `/api/auth/register` | POST | Créer un compte |
| `/api/auth/login` | POST | Connexion et obtention des jetons |
| `/api/auth/refresh` | POST | Rafraîchir la paire de jetons |
| `/api/auth/me` | GET | Obtenir les informations de l'utilisateur actuel |

## Étapes suivantes

- [Référence des points de terminaison](./endpoints) -- Documentation API complète
- [Serveur MCP](../mcp-server/) -- Utilisation des jetons bot avec MCP
- [Membres & Permissions](../workspace/members) -- Accès basé sur les rôles
