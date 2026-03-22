---
title: Membres & Permissions
description: "Gérer les membres, rôles et jetons bot de l'espace de travail dans OpenPR. Contrôle d'accès basé sur les rôles avec niveaux propriétaire, admin et membre."
---

# Membres & Permissions

OpenPR utilise le contrôle d'accès basé sur les rôles (RBAC) limité aux espaces de travail. Chaque membre de l'espace de travail a un rôle qui détermine ses permissions.

## Rôles

| Rôle | Description | Permissions |
|------|-------------|-------------|
| **Propriétaire** | Créateur de l'espace de travail ou propriétaire promu | Accès complet : supprimer l'espace de travail, gérer tous les paramètres, promouvoir/rétrograder les membres |
| **Admin** | Administrateur de l'espace de travail | Gérer les projets, membres (sauf les propriétaires), paramètres, configuration de gouvernance |
| **Membre** | Membre d'équipe régulier | Créer et gérer les problèmes, commentaires, étiquettes ; participer à la gouvernance |

## Inviter des membres

Naviguez vers **Paramètres de l'espace de travail** > **Membres** > **Inviter** :

1. Entrez l'adresse e-mail de l'utilisateur.
2. Sélectionnez un rôle (Propriétaire, Admin ou Membre).
3. Cliquez sur **Inviter**.

L'utilisateur invité doit avoir un compte OpenPR. S'il n'en a pas, il doit d'abord s'enregistrer.

## Gestion des membres

Depuis la liste des membres, vous pouvez :

- **Changer le rôle** -- Promouvoir ou rétrograder des membres (les admins ne peuvent pas changer les rôles des propriétaires).
- **Retirer** -- Retirer un membre de l'espace de travail.

## Types d'utilisateurs

OpenPR prend en charge deux types d'entités :

| Type | Description | Créé par |
|------|-------------|----------|
| `human` | Utilisateurs humains réguliers | Enregistrement d'utilisateur |
| `bot` | Comptes Bot/IA | Création de jeton bot |

Les utilisateurs bot sont créés automatiquement quand un jeton bot est généré. Ils apparaissent dans les fils d'activité et les journaux d'audit avec leur nom d'affichage.

## Jetons Bot

Les jetons bot permettent aux assistants IA et aux outils externes de s'authentifier avec le serveur MCP et l'API. Chaque jeton :

- A un préfixe `opr_`.
- Est limité à un espace de travail.
- Crée une entité utilisateur `bot_mcp` correspondante.
- Prend en charge toutes les opérations de lecture/écriture disponibles pour les membres de l'espace de travail.

### Créer un jeton bot

Naviguez vers **Paramètres de l'espace de travail** > **Jetons Bot** > **Créer** :

1. Entrez un nom d'affichage (ex. "Claude Assistant").
2. Cliquez sur **Créer**.
3. Copiez le jeton immédiatement -- il ne sera plus affiché.

### Utiliser les jetons bot

Les jetons bot sont utilisés dans la configuration du serveur MCP :

```bash
# Variable d'environnement
OPENPR_BOT_TOKEN=opr_your_token_here
```

Ou dans les requêtes API :

```bash
curl -H "Authorization: Bearer opr_your_token_here" \
  http://localhost:8080/api/workspaces/<workspace_id>/projects
```

## Référence API

```bash
# Lister les membres de l'espace de travail
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/members

# Lister les jetons bot
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/workspaces/<workspace_id>/bots
```

## Outils MCP

| Outil | Description |
|-------|-------------|
| `members.list` | Lister tous les membres de l'espace de travail et leurs rôles |

## Étapes suivantes

- [Gestion des espaces de travail](./index) -- Configuration de l'espace de travail
- [Serveur MCP](../mcp-server/) -- Configurer les assistants IA avec les jetons bot
