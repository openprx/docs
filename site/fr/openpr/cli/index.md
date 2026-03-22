---
title: Référence CLI
---

# Référence CLI

OpenPR inclut une interface en ligne de commande intégrée dans le binaire `openpr-mcp`. En plus de faire tourner le serveur MCP, il fournit des commandes pour gérer les projets, éléments de travail, commentaires, étiquettes, sprints et plus directement depuis le terminal.

## Installation

Le CLI est disponible comme partie du crate `mcp-server`. Après compilation, le binaire s'appelle `openpr-mcp`.

```bash
cargo build --release -p mcp-server
```

## Flags globaux

Ces flags s'appliquent à toutes les commandes :

| Flag | Description | Défaut |
|------|-------------|--------|
| `--api-url <URL>` | Point de terminaison du serveur API | `http://localhost:8080` |
| `--bot-token <TOKEN>` | Jeton d'authentification (préfixe `opr_`) | -- |
| `--workspace-id <UUID>` | Contexte d'espace de travail pour les opérations | -- |
| `--format json\|table` | Format de sortie | `table` |

Vous pouvez également les définir via des variables d'environnement :

```bash
export OPENPR_API_URL=http://localhost:8080
export OPENPR_BOT_TOKEN=opr_your_token_here
export OPENPR_WORKSPACE_ID=your-workspace-uuid
```

## Commandes

### serve -- Démarrer le serveur MCP

Exécuter le serveur MCP pour l'intégration des outils IA.

```bash
# Transport HTTP (par défaut)
openpr-mcp serve --transport http --port 8090

# Transport stdio (pour intégration directe)
openpr-mcp serve --transport stdio
```

### projects -- Gestion des projets

```bash
# Lister tous les projets dans l'espace de travail
openpr-mcp projects list --format table

# Obtenir les détails d'un projet spécifique
openpr-mcp projects get <project_id>

# Créer un nouveau projet
openpr-mcp projects create --name "Mon Projet" --key "MP"
```

### work-items -- Gestion des éléments de travail

```bash
# Lister les éléments de travail avec filtres
openpr-mcp work-items list --project-id <id> --state todo
openpr-mcp work-items list --project-id <id> --state in_progress --assignee-id <user_id>

# Obtenir un élément de travail spécifique
openpr-mcp work-items get <id>

# Créer un élément de travail
openpr-mcp work-items create --project-id <id> --title "Corriger bug" --state todo
openpr-mcp work-items create --project-id <id> --title "Nouvelle fonctionnalité" --state backlog --priority high

# Mettre à jour un élément de travail
openpr-mcp work-items update <id> --state in_progress --assignee-id <user_id>
openpr-mcp work-items update <id> --state done --priority low

# Rechercher des éléments de travail par texte
openpr-mcp work-items search --query "authentication"
```

### comments -- Gestion des commentaires

```bash
# Lister les commentaires sur un élément de travail
openpr-mcp comments list --work-item-id <id>

# Ajouter un commentaire
openpr-mcp comments create --work-item-id <id> --content "Corrigé dans le commit abc123"
```

### labels -- Gestion des étiquettes

```bash
# Lister les étiquettes au niveau de l'espace de travail
openpr-mcp labels list --workspace

# Lister les étiquettes au niveau du projet
openpr-mcp labels list --project-id <id>
```

### sprints -- Gestion des sprints

```bash
# Lister les sprints d'un projet
openpr-mcp sprints list --project-id <id>
```

### search -- Recherche globale

```bash
# Rechercher dans toutes les entités
openpr-mcp search --query "bug"
```

### files -- Pièces jointes

```bash
# Télécharger un fichier vers un élément de travail
openpr-mcp files upload --work-item-id <id> --path ./screenshot.png
```

## Exemples d'utilisation

### Flux de travail typique

```bash
# Configurer les identifiants
export OPENPR_API_URL=https://openpr.example.com
export OPENPR_BOT_TOKEN=opr_abc123
export OPENPR_WORKSPACE_ID=550e8400-e29b-41d4-a716-446655440000

# Lister les projets
openpr-mcp projects list

# Voir les éléments à faire pour un projet
openpr-mcp work-items list --project-id <id> --state todo --format table

# Prendre en charge un élément de travail
openpr-mcp work-items update <item_id> --state in_progress --assignee-id <your_user_id>

# Ajouter un commentaire quand c'est terminé
openpr-mcp comments create --work-item-id <item_id> --content "Terminé. Voir PR #42."

# Marquer comme terminé
openpr-mcp work-items update <item_id> --state done
```

### Sortie JSON pour les scripts

Utilisez `--format json` pour obtenir une sortie lisible par machine adaptée pour être canalisée vers `jq` ou d'autres outils :

```bash
# Obtenir tous les éléments en cours en JSON
openpr-mcp work-items list --project-id <id> --state in_progress --format json

# Compter les éléments par état
openpr-mcp work-items list --project-id <id> --format json | jq '.[] | .state' | sort | uniq -c
```

## Voir aussi

- [Serveur MCP](../mcp-server/) -- Intégration des outils MCP pour les agents IA
- [Référence API](../api/) -- Documentation complète de l'API REST
- [États du workflow](../issues/workflow) -- Gestion des états et workflows personnalisés
