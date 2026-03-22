---
title: Stockage SQLite
description: "Configurer et régler le backend de stockage SQLite pour PRX-Memory avec des colonnes vectorielles et des requêtes indexées."
---

# Stockage SQLite

Le backend SQLite fournit un moteur de stockage robuste et basé sur fichier avec des transactions ACID, des requêtes indexées et un support de colonnes vectorielles intégré pour une recherche par similarité efficace. C'est le backend recommandé pour les déploiements en production avec jusqu'à 100 000 mémoires.

## Configuration

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Le fichier de base de données est créé automatiquement à la première exécution. Toutes les tables, index et colonnes vectorielles sont initialisés par PRX-Memory.

## Aperçu du schéma

Le backend SQLite stocke les mémoires dans un schéma structuré :

| Colonne | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Identifiant unique de la mémoire |
| `text` | TEXT | Contenu de la mémoire |
| `scope` | TEXT | Portée de la mémoire (global, projet, etc.) |
| `tags` | TEXT | Tableau JSON d'étiquettes |
| `importance` | REAL | Score d'importance (0.0--1.0) |
| `created_at` | TEXT | Horodatage ISO 8601 |
| `updated_at` | TEXT | Horodatage ISO 8601 |
| `embedding` | BLOB | Embedding vectoriel (si activé) |
| `metadata` | TEXT | Métadonnées JSON supplémentaires |

## Stockage vectoriel

Quand l'embedding est activé, les données vectorielles sont stockées comme colonnes BLOB dans la même table que l'entrée de mémoire. Cette co-localisation simplifie les requêtes et évite la surcharge des jointures.

La recherche par similarité vectorielle utilise le calcul de similarité cosinus par force brute sur les vecteurs stockés. Pour les ensembles de données de moins de 100 000 entrées, cela fournit des temps de requête inférieurs à la seconde (p95 sous 123ms selon les benchmarks).

## Maintenance

### Compactage

Au fil du temps, les suppressions et mises à jour peuvent laisser de l'espace fragmenté. Utilisez `memory_compact` pour récupérer l'espace :

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_compact",
    "arguments": {}
  }
}
```

### Sauvegarde

Le fichier de base de données SQLite peut être sauvegardé en copiant simplement le fichier lorsque le serveur est arrêté :

```bash
cp ./data/memory.db ./data/memory.db.backup
```

::: warning
Ne copiez pas le fichier de base de données pendant que le serveur est en cours d'exécution. SQLite utilise la journalisation write-ahead (WAL) et une copie de fichier pendant les écritures peut produire une sauvegarde corrompue. Arrêtez d'abord le serveur ou utilisez l'outil `memory_export` pour un export sécurisé.
:::

### Migration depuis JSON

Pour migrer du backend JSON vers SQLite :

1. Exportez vos mémoires avec `memory_export`.
2. Changez la configuration du backend vers SQLite.
3. Importez les données exportées avec `memory_import`.

Ou utilisez l'outil `memory_migrate` pour une migration directe.

## Étapes suivantes

- [Recherche vectorielle](./vector-search) -- Fonctionnement interne de la recherche par similarité
- [Aperçu du stockage](./index) -- Comparer tous les backends
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement
