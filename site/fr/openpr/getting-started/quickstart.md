---
title: Démarrage rapide
description: "Démarrer OpenPR et créer votre premier espace de travail, projet et problèmes en 5 minutes."
---

# Démarrage rapide

Ce guide vous accompagne dans la configuration d'OpenPR et la création de votre premier espace de travail, projet et problèmes. Il suppose que vous avez déjà effectué l'[installation](./installation).

## Étape 1 : Démarrer OpenPR

Si ce n'est pas déjà fait, démarrez les services :

```bash
cd openpr
docker-compose up -d
```

Attendez que tous les services soient sains :

```bash
docker-compose ps
```

## Étape 2 : Enregistrer votre compte administrateur

Ouvrez http://localhost:3000 dans votre navigateur. Cliquez sur **S'inscrire** et créez votre compte.

::: tip Le premier utilisateur est administrateur
Le premier utilisateur enregistré reçoit automatiquement le rôle **administrateur**. Cet utilisateur peut gérer tous les espaces de travail, projets et paramètres système.
:::

## Étape 3 : Créer un espace de travail

Après connexion, créez votre premier espace de travail :

1. Cliquez sur **Créer un espace de travail** sur le tableau de bord.
2. Entrez un nom (ex. "Mon équipe") et un slug (ex. "mon-equipe").
3. Cliquez sur **Créer**.

Un espace de travail est le conteneur de niveau supérieur pour tous vos projets et membres.

## Étape 4 : Créer un projet

Dans votre espace de travail :

1. Cliquez sur **Nouveau projet**.
2. Entrez un nom (ex. "API Backend") et une clé de projet (ex. "API"). La clé est utilisée comme préfixe pour les identifiants de problèmes (ex. API-1, API-2).
3. Cliquez sur **Créer**.

## Étape 5 : Créer des problèmes

Naviguez vers votre projet et créez des problèmes :

1. Cliquez sur **Nouveau problème**.
2. Entrez un titre et une description.
3. Définissez l'état (backlog, todo, in_progress ou done).
4. Optionnellement, définissez la priorité (low, medium, high, urgent), le responsable et les étiquettes.
5. Cliquez sur **Créer**.

Les problèmes peuvent également être créés via l'API ou le serveur MCP :

```bash
# Créer un problème via l'API REST
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your_token>" \
  -d '{
    "title": "Configurer le pipeline CI",
    "state": "todo",
    "priority": "high"
  }'
```

## Étape 6 : Configurer le tableau kanban

Naviguez vers la vue **Tableau** dans votre projet. Les problèmes sont organisés en colonnes par état :

| Colonne | État | Description |
|---------|------|-------------|
| Backlog | `backlog` | Idées et travaux futurs |
| À faire | `todo` | Planifié pour le cycle actuel |
| En cours | `in_progress` | Activement en cours de traitement |
| Terminé | `done` | Travail complété |

Faites glisser les problèmes entre les colonnes pour mettre à jour leur état.

## Étape 7 : Inviter des membres de l'équipe

Allez dans **Paramètres de l'espace de travail** > **Membres** :

1. Cliquez sur **Inviter un membre**.
2. Entrez l'adresse e-mail.
3. Sélectionnez un rôle : **Propriétaire**, **Admin** ou **Membre**.

| Rôle | Permissions |
|------|------------|
| Propriétaire | Accès complet, peut supprimer l'espace de travail |
| Admin | Gérer les projets, membres, paramètres |
| Membre | Créer et gérer les problèmes, commentaires |

## Étape 8 : Connecter les assistants IA (Optionnel)

Configurez le serveur MCP pour permettre aux assistants IA de gérer vos projets :

1. Allez dans **Paramètres de l'espace de travail** > **Jetons Bot**.
2. Créez un nouveau jeton bot. Il aura le préfixe `opr_`.
3. Configurez votre assistant IA avec le jeton.

Exemple de configuration Claude Desktop :

```json
{
  "mcpServers": {
    "openpr": {
      "command": "/path/to/mcp-server",
      "args": ["--transport", "stdio"],
      "env": {
        "OPENPR_API_URL": "http://localhost:3000",
        "OPENPR_BOT_TOKEN": "opr_your_token_here",
        "OPENPR_WORKSPACE_ID": "your-workspace-uuid"
      }
    }
  }
}
```

L'assistant IA peut maintenant lister les projets, créer des problèmes, gérer les sprints et plus encore via 34 outils MCP.

## Et ensuite ?

- [Gestion des espaces de travail](../workspace/) -- En savoir plus sur l'organisation des espaces de travail et les rôles des membres
- [Problèmes & Workflow](../issues/) -- Approfondissement du suivi des problèmes et de la gestion des états
- [Planification de sprints](../issues/sprints) -- Configurer les cycles de sprints
- [Centre de gouvernance](../governance/) -- Activer les propositions, le vote et les scores de confiance
- [Référence API](../api/) -- Intégrer avec des outils externes
- [Serveur MCP](../mcp-server/) -- Référence complète des outils MCP pour les assistants IA
