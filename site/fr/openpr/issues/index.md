---
title: Problèmes & Suivi
description: "Les problèmes OpenPR sont l'unité de travail principale. Suivez les tâches, bugs et fonctionnalités avec des états, priorités, responsables, étiquettes et commentaires."
---

# Problèmes & Suivi

Les problèmes (également appelés éléments de travail) sont l'unité de travail principale dans OpenPR. Ils représentent des tâches, bugs, fonctionnalités ou tout travail traçable dans un projet.

## Champs d'un problème

| Champ | Type | Requis | Description |
|-------|------|--------|-------------|
| Titre | string | Oui | Courte description du travail |
| Description | markdown | Non | Description détaillée avec mise en forme |
| État | enum | Oui | État du workflow (voir [Workflow](./workflow)) |
| Priorité | enum | Non | `low`, `medium`, `high`, `urgent` |
| Responsable | utilisateur | Non | Membre de l'équipe responsable du problème |
| Étiquettes | liste | Non | Tags de catégorisation (voir [Étiquettes](./labels)) |
| Sprint | sprint | Non | Cycle de sprint auquel le problème appartient |
| Date d'échéance | datetime | Non | Date de complétion cible |
| Pièces jointes | fichiers | Non | Fichiers joints (images, docs, journaux) |

## Identifiants de problèmes

Chaque problème a un identifiant lisible composé de la clé du projet et d'un numéro séquentiel :

```
API-1, API-2, API-3, ...
FRONT-1, FRONT-2, ...
```

Vous pouvez rechercher n'importe quel problème par son identifiant dans tous les projets de l'espace de travail.

## Créer des problèmes

### Via l'interface web

1. Naviguez vers votre projet.
2. Cliquez sur **Nouveau problème**.
3. Remplissez le titre, la description et les champs optionnels.
4. Cliquez sur **Créer**.

### Via l'API REST

```bash
curl -X POST http://localhost:8080/api/projects/<project_id>/issues \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "Implémenter la page de paramètres utilisateur",
    "description": "Ajouter une page de paramètres où les utilisateurs peuvent mettre à jour leur profil.",
    "state": "todo",
    "priority": "medium",
    "assignee_id": "<user_uuid>"
  }'
```

### Via MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "work_items.create",
    "arguments": {
      "project_id": "<project_uuid>",
      "title": "Implémenter la page de paramètres utilisateur",
      "state": "todo",
      "priority": "medium"
    }
  }
}
```

## Commentaires

Les problèmes prennent en charge les commentaires en fil avec mise en forme markdown et pièces jointes :

```bash
# Ajouter un commentaire
curl -X POST http://localhost:8080/api/issues/<issue_id>/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"content": "Corrigé dans le commit abc123. Prêt pour la révision."}'
```

Les commentaires sont également disponibles via les outils MCP : `comments.create`, `comments.list`, `comments.delete`.

## Fil d'activité

Chaque modification d'un problème est enregistrée dans le fil d'activité :

- Changements d'état
- Changements de responsable
- Ajouts/suppressions d'étiquettes
- Commentaires
- Mises à jour de priorité

Le fil d'activité fournit une piste d'audit complète pour chaque problème.

## Pièces jointes

Les problèmes et commentaires prennent en charge les pièces jointes incluant des images, documents, journaux et archives. Téléchargement via l'API :

```bash
curl -X POST http://localhost:8080/api/v1/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@screenshot.png"
```

Ou via MCP :

```json
{
  "method": "tools/call",
  "params": {
    "name": "files.upload",
    "arguments": {
      "filename": "screenshot.png",
      "content_base64": "<contenu_encodé_base64>"
    }
  }
}
```

Types de fichiers pris en charge : images (PNG, JPG, GIF, WebP), documents (PDF, TXT), données (JSON, CSV, XML), archives (ZIP, GZ) et journaux.

## Recherche

OpenPR fournit une recherche plein texte sur tous les problèmes, commentaires et propositions via PostgreSQL FTS :

```bash
# Recherche via l'API
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8080/api/search?q=authentication+bug"

# Recherche via MCP
# work_items.search : recherche dans un projet
# search.all : recherche globale dans tous les projets
```

## Outils MCP

| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `work_items.list` | `project_id` | Lister les problèmes dans un projet |
| `work_items.get` | `work_item_id` | Obtenir un problème par UUID |
| `work_items.get_by_identifier` | `identifier` | Obtenir par ID humain (ex. `API-42`) |
| `work_items.create` | `project_id`, `title` | Créer un problème |
| `work_items.update` | `work_item_id` | Mettre à jour n'importe quel champ |
| `work_items.delete` | `work_item_id` | Supprimer un problème |
| `work_items.search` | `query` | Recherche plein texte |
| `comments.create` | `work_item_id`, `content` | Ajouter un commentaire |
| `comments.list` | `work_item_id` | Lister les commentaires |
| `comments.delete` | `comment_id` | Supprimer un commentaire |
| `files.upload` | `filename`, `content_base64` | Télécharger un fichier |

## Étapes suivantes

- [États du workflow](./workflow) -- Comprendre le cycle de vie des problèmes
- [Planification de sprints](./sprints) -- Organiser les problèmes en cycles de sprints
- [Étiquettes](./labels) -- Catégoriser les problèmes avec des étiquettes
