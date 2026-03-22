---
title: Backends de stockage
description: "Présentation des backends de stockage PRX-Memory, incluant le stockage basé sur fichier JSON, SQLite avec extensions vectorielles et LanceDB optionnel."
---

# Backends de stockage

PRX-Memory prend en charge plusieurs backends de stockage pour persister les mémoires et leurs embeddings vectoriels. Le crate `prx-memory-storage` fournit une interface unifiée que tous les backends implémentent.

## Backends disponibles

| Backend | Valeur de config | Support vectoriel | Persistance | Idéal pour |
|---------|-------------|----------------|-------------|----------|
| JSON | `json` | Intégré dans les entrées | Basé sur fichier | Développement, petits ensembles de données |
| SQLite | `sqlite` | Colonnes vectorielles intégrées | Basé sur fichier | Production, ensembles de données moyens |
| LanceDB | `lancedb` | Index vectoriel natif | Basé sur répertoire | Grands ensembles de données, recherche ANN rapide |

::: tip Backend par défaut
Le backend par défaut est JSON (`PRX_MEMORY_BACKEND=json`), qui ne nécessite aucune configuration supplémentaire. Pour les déploiements en production, SQLite est recommandé.
:::

## Backend JSON

Le backend le plus simple stocke toutes les mémoires dans un seul fichier JSON. Il est idéal pour le développement, les tests et les petits ensembles de mémoire (moins de 10 000 entrées).

```bash
PRX_MEMORY_BACKEND=json
PRX_MEMORY_DB=./data/memory-db.json
```

**Avantages :**
- Zéro configuration -- spécifiez simplement un chemin de fichier.
- Lisible par l'homme -- inspectez et modifiez avec n'importe quel éditeur de texte.
- Portable -- copiez le fichier pour déplacer toute votre base de mémoire.

**Limitations :**
- Le fichier entier est chargé en mémoire au démarrage.
- Les opérations d'écriture réécrivent le fichier complet.
- Pas de recherche vectorielle indexée -- scan par force brute pour la similarité.

## Backend SQLite

SQLite fournit des transactions ACID, des requêtes indexées et un support de colonnes vectorielles intégré pour une recherche par similarité efficace.

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Voir [Stockage SQLite](./sqlite) pour la configuration détaillée.

## Backend LanceDB (optionnel)

LanceDB fournit une recherche vectorielle native par plus proche voisin approximatif (ANN) avec stockage en colonnes. Activez-le avec le flag de fonctionnalité `lancedb-backend` :

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

```bash
PRX_MEMORY_BACKEND=lancedb
PRX_MEMORY_DB=./data/lancedb
```

::: warning Flag de fonctionnalité requis
Le support LanceDB n'est pas inclus dans la compilation par défaut. Vous devez activer le flag de fonctionnalité `lancedb-backend` au moment de la compilation.
:::

## Choisir un backend

| Scénario | Backend recommandé |
|----------|-------------------|
| Développement local | JSON |
| Production avec <100k entrées | SQLite |
| Production avec >100k entrées | LanceDB |
| Besoin d'un stockage lisible par l'homme | JSON |
| Besoin de transactions ACID | SQLite |
| Besoin d'une recherche vectorielle ANN rapide | LanceDB |

## Opérations de stockage

PRX-Memory fournit des outils pour la maintenance du stockage :

| Outil | Description |
|------|-------------|
| `memory_export` | Exporter toutes les mémoires dans un format portable |
| `memory_import` | Importer des mémoires depuis un export |
| `memory_migrate` | Migrer entre les backends de stockage |
| `memory_compact` | Optimiser le stockage et récupérer l'espace |
| `memory_reembed` | Ré-embéder toutes les mémoires avec un nouveau modèle |

## Étapes suivantes

- [Stockage SQLite](./sqlite) -- Configuration et réglage de SQLite
- [Recherche vectorielle](./vector-search) -- Fonctionnement de la recherche par similarité vectorielle
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement
