---
title: Étiquettes
description: "Organiser et catégoriser les problèmes avec des étiquettes colorées dans OpenPR. Les étiquettes peuvent être à l'échelle de l'espace de travail ou limitées au projet."
---

# Étiquettes

Les étiquettes fournissent un moyen flexible de catégoriser et filtrer les problèmes. Chaque étiquette a un nom, une couleur et une description optionnelle.

## Créer des étiquettes

### Via l'interface web

1. Naviguez vers les paramètres de votre projet ou espace de travail.
2. Allez dans **Étiquettes**.
3. Cliquez sur **Nouvelle étiquette**.
4. Entrez un nom (ex. "bug", "feature", "documentation").
5. Choisissez une couleur (format hex, ex. `#ef4444` pour le rouge).
6. Cliquez sur **Créer**.

### Via l'API

```bash
curl -X POST http://localhost:8080/api/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "bug",
    "color": "#ef4444",
    "description": "Quelque chose ne fonctionne pas"
  }'
```

### Via MCP

```json
{
  "method": "tools/call",
  "params": {
    "name": "labels.create",
    "arguments": {
      "name": "bug",
      "color": "#ef4444"
    }
  }
}
```

## Schémas d'étiquettes courants

Voici quelques organisations d'étiquettes populaires :

### Par type

| Étiquette | Couleur | Description |
|-----------|---------|-------------|
| `bug` | `#ef4444` (rouge) | Quelque chose est cassé |
| `feature` | `#3b82f6` (bleu) | Demande de nouvelle fonctionnalité |
| `enhancement` | `#8b5cf6` (violet) | Amélioration d'une fonctionnalité existante |
| `documentation` | `#06b6d4` (cyan) | Mises à jour de documentation |
| `refactor` | `#f59e0b` (ambre) | Refactorisation du code |

### Par priorité

| Étiquette | Couleur | Description |
|-----------|---------|-------------|
| `P0-critical` | `#dc2626` (rouge) | Production en panne |
| `P1-high` | `#ea580c` (orange) | Fonctionnalité majeure défaillante |
| `P2-medium` | `#eab308` (jaune) | Problème non critique |
| `P3-low` | `#22c55e` (vert) | Agréable à avoir |

## Ajouter des étiquettes aux problèmes

### Via l'interface web

Ouvrez un problème et cliquez sur le champ **Étiquettes** pour ajouter ou supprimer des étiquettes.

### Via l'API

```bash
# Ajouter une étiquette à un problème
curl -X POST http://localhost:8080/api/issues/<issue_id>/labels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"label_id": "<label_uuid>"}'
```

### Via MCP

| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `work_items.add_label` | `work_item_id`, `label_id` | Ajouter une étiquette |
| `work_items.add_labels` | `work_item_id`, `label_ids` | Ajouter plusieurs étiquettes |
| `work_items.remove_label` | `work_item_id`, `label_id` | Supprimer une étiquette |
| `work_items.list_labels` | `work_item_id` | Lister les étiquettes d'un problème |

## Outils MCP de gestion des étiquettes

| Outil | Paramètres | Description |
|-------|-----------|-------------|
| `labels.list` | -- | Lister toutes les étiquettes de l'espace de travail |
| `labels.list_by_project` | `project_id` | Lister les étiquettes d'un projet |
| `labels.create` | `name`, `color` | Créer une étiquette |
| `labels.update` | `label_id` | Mettre à jour le nom, la couleur ou la description |
| `labels.delete` | `label_id` | Supprimer une étiquette |

## Étapes suivantes

- [Vue d'ensemble des problèmes](./index) -- Référence complète des champs de problème
- [États du workflow](./workflow) -- Gestion du cycle de vie des problèmes
- [Planification de sprints](./sprints) -- Organiser les problèmes étiquetés en sprints
