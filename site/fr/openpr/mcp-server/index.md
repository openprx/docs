---
title: Serveur MCP
description: "OpenPR inclut un serveur MCP intégré avec 34 outils sur les transports HTTP, stdio et SSE. Intégrez des assistants IA comme Claude, Codex et Cursor avec votre gestion de projet."
---

# Serveur MCP

OpenPR inclut un **serveur MCP (Model Context Protocol)** intégré qui expose 34 outils permettant aux assistants IA de gérer les projets, problèmes, sprints, étiquettes, commentaires, propositions et fichiers. Le serveur prend en charge trois protocoles de transport simultanément.

## Protocoles de transport

| Protocole | Cas d'utilisation | Point de terminaison |
|-----------|------------------|---------------------|
| **HTTP** | Intégrations web, plugins OpenClaw | `POST /mcp/rpc` |
| **stdio** | Claude Desktop, Codex, CLI local | stdin/stdout JSON-RPC |
| **SSE** | Clients streaming, interfaces en temps réel | `GET /sse` + `POST /messages` |

::: tip Multi-protocole
En mode HTTP, les trois protocoles sont disponibles sur un seul port : `/mcp/rpc` (HTTP), `/sse` + `/messages` (SSE), et `/health` (vérification de santé).
:::

## Configuration

### Variables d'environnement

| Variable | Requis | Description | Exemple |
|----------|--------|-------------|---------|
| `OPENPR_API_URL` | Oui | URL de base du serveur API | `http://localhost:3000` |
| `OPENPR_BOT_TOKEN` | Oui | Jeton bot avec préfixe `opr_` | `opr_abc123...` |
| `OPENPR_WORKSPACE_ID` | Oui | UUID de l'espace de travail par défaut | `e5166fd1-...` |

### Claude Desktop / Cursor / Codex (stdio)

Ajoutez à la configuration de votre client MCP :

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

### Mode HTTP

```bash
# Démarrer le serveur MCP
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090

# Vérifier
curl -X POST http://localhost:8090/mcp/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Mode SSE

```bash
# 1. Se connecter au flux SSE (retourne le point de terminaison de session)
curl -N -H "Accept: text/event-stream" http://localhost:8090/sse
# -> event: endpoint
# -> data: /messages?session_id=<uuid>

# 2. Envoyer une requête POST au point de terminaison retourné
curl -X POST "http://localhost:8090/messages?session_id=<uuid>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"projects.list","arguments":{}}}'
# -> La réponse arrive via le flux SSE comme event: message
```

### Docker Compose

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  environment:
    - OPENPR_API_URL=http://api:8080
    - OPENPR_BOT_TOKEN=opr_your_token
    - OPENPR_WORKSPACE_ID=your-workspace-uuid
  ports:
    - "8090:8090"
  command: ["./mcp-server", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
```

## Référence des outils (34 outils)

### Projets (5)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `projects.list` | -- | Lister tous les projets dans l'espace de travail |
| `projects.get` | `project_id` | Obtenir les détails du projet avec les comptages de problèmes |
| `projects.create` | `key`, `name` | Créer un projet |
| `projects.update` | `project_id` | Mettre à jour le nom/la description |
| `projects.delete` | `project_id` | Supprimer un projet |

### Éléments de travail / Problèmes (11)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `work_items.list` | `project_id` | Lister les problèmes dans un projet |
| `work_items.get` | `work_item_id` | Obtenir un problème par UUID |
| `work_items.get_by_identifier` | `identifier` | Obtenir par ID humain (ex. `API-42`) |
| `work_items.create` | `project_id`, `title` | Créer un problème avec état, priorité, description, assignee_id, due_at, pièces jointes optionnels |
| `work_items.update` | `work_item_id` | Mettre à jour n'importe quel champ |
| `work_items.delete` | `work_item_id` | Supprimer un problème |
| `work_items.search` | `query` | Recherche plein texte dans tous les projets |
| `work_items.add_label` | `work_item_id`, `label_id` | Ajouter une étiquette |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Ajouter plusieurs étiquettes |
| `work_items.remove_label` | `work_item_id`, `label_id` | Retirer une étiquette |
| `work_items.list_labels` | `work_item_id` | Lister les étiquettes d'un problème |

### Commentaires (3)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `comments.create` | `work_item_id`, `content` | Créer un commentaire avec pièces jointes optionnelles |
| `comments.list` | `work_item_id` | Lister les commentaires d'un problème |
| `comments.delete` | `comment_id` | Supprimer un commentaire |

### Fichiers (1)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `files.upload` | `filename`, `content_base64` | Télécharger un fichier (base64), retourne l'URL et le nom de fichier |

### Étiquettes (5)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `labels.list` | -- | Lister toutes les étiquettes de l'espace de travail |
| `labels.list_by_project` | `project_id` | Lister les étiquettes d'un projet |
| `labels.create` | `name`, `color` | Créer une étiquette (couleur : hex, ex. `#2563eb`) |
| `labels.update` | `label_id` | Mettre à jour le nom/la couleur/la description |
| `labels.delete` | `label_id` | Supprimer une étiquette |

### Sprints (4)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `sprints.list` | `project_id` | Lister les sprints dans un projet |
| `sprints.create` | `project_id`, `name` | Créer un sprint avec start_date, end_date optionnels |
| `sprints.update` | `sprint_id` | Mettre à jour le nom/les dates/le statut |
| `sprints.delete` | `sprint_id` | Supprimer un sprint |

### Propositions (3)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `proposals.list` | `project_id` | Lister les propositions avec filtre de statut optionnel |
| `proposals.get` | `proposal_id` | Obtenir les détails d'une proposition |
| `proposals.create` | `project_id`, `title`, `description` | Créer une proposition de gouvernance |

### Membres & Recherche (2)

| Outil | Paramètres requis | Description |
|-------|------------------|-------------|
| `members.list` | -- | Lister les membres de l'espace de travail et leurs rôles |
| `search.all` | `query` | Recherche globale dans les projets, problèmes, commentaires |

## Format de réponse

Toutes les réponses des outils MCP suivent cette structure :

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
  "message": "description de l'erreur"
}
```

## Authentification par jeton bot

Le serveur MCP s'authentifie via les **jetons bot** (préfixe `opr_`). Créez des jetons bot dans **Paramètres de l'espace de travail** > **Jetons Bot**.

Chaque jeton bot :
- A un nom d'affichage (affiché dans les fils d'activité)
- Est limité à un espace de travail
- Crée une entité utilisateur `bot_mcp` pour l'intégrité de la piste d'audit
- Prend en charge toutes les opérations de lecture/écriture disponibles pour les membres de l'espace de travail

## Intégration des agents

Pour les agents de codage, OpenPR fournit :

- **AGENTS.md** (`apps/mcp-server/AGENTS.md`) -- Patterns de workflow et exemples d'outils pour les agents.
- **Package Skill** (`skills/openpr-mcp/SKILL.md`) -- Skill gouverné avec modèles de workflow et scripts.

Workflow d'agent recommandé :
1. Charger `AGENTS.md` pour la sémantique des outils.
2. Utiliser `tools/list` pour énumérer les outils disponibles au moment de l'exécution.
3. Suivre les patterns de workflow : recherche -> créer -> étiqueter -> commenter.

## Étapes suivantes

- [Vue d'ensemble de l'API](../api/) -- Référence de l'API REST
- [Membres & Permissions](../workspace/members) -- Gestion des jetons bot
- [Configuration](../configuration/) -- Toutes les variables d'environnement
