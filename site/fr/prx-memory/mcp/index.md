---
title: Intégration MCP
description: "Intégration du protocole MCP de PRX-Memory, outils pris en charge, ressources, modèles et modes de transport."
---

# Intégration MCP

PRX-Memory est construit comme un serveur MCP (Model Context Protocol) natif. Il expose les opérations de mémoire comme outils MCP, les compétences de gouvernance comme ressources MCP, et des modèles de payload pour des interactions de mémoire standardisées.

## Modes de transport

### stdio

Le transport stdio communique via l'entrée/sortie standard, le rendant idéal pour une intégration directe avec des clients MCP comme Claude Code, Codex et OpenClaw.

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

### HTTP

Le transport HTTP fournit un serveur accessible réseau avec des points de terminaison opérationnels supplémentaires.

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
prx-memoryd
```

Points de terminaison uniquement HTTP :

| Point de terminaison | Description |
|----------|-------------|
| `GET /health` | Vérification de santé |
| `GET /metrics` | Métriques Prometheus |
| `GET /metrics/summary` | Résumé des métriques JSON |
| `POST /mcp/session/renew` | Renouveler la session en streaming |

## Configuration du client MCP

Ajoutez PRX-Memory au fichier de configuration de votre client MCP :

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Utilisez des chemins absolus pour `command` et `PRX_MEMORY_DB` pour éviter les problèmes de résolution de chemin.
:::

## Outils MCP

PRX-Memory expose les outils suivants via l'interface MCP `tools/call` :

### Opérations de mémoire centrales

| Outil | Description |
|------|-------------|
| `memory_store` | Stocker une nouvelle entrée de mémoire avec texte, portée, étiquettes et métadonnées |
| `memory_recall` | Rappeler des mémoires correspondant à une requête en utilisant la recherche lexicale, vectorielle et rerankée |
| `memory_update` | Mettre à jour une entrée de mémoire existante |
| `memory_forget` | Supprimer une entrée de mémoire par ID |

### Opérations en masse

| Outil | Description |
|------|-------------|
| `memory_export` | Exporter toutes les mémoires dans un format JSON portable |
| `memory_import` | Importer des mémoires depuis un export |
| `memory_migrate` | Migrer entre les backends de stockage |
| `memory_reembed` | Ré-embéder toutes les mémoires avec le modèle d'embedding actuel |
| `memory_compact` | Compacter et optimiser le stockage |

### Évolution

| Outil | Description |
|------|-------------|
| `memory_evolve` | Faire évoluer la mémoire en utilisant l'acceptation entraînement/validation avec filtrage par contraintes |

### Découverte de compétences

| Outil | Description |
|------|-------------|
| `memory_skill_manifest` | Retourner le manifeste de compétences pour les compétences de gouvernance |

## Ressources MCP

PRX-Memory expose les packages de compétences de gouvernance comme ressources MCP :

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/list", "params": {}}
```

Lire une ressource spécifique :

```json
{"jsonrpc": "2.0", "id": 2, "method": "resources/read", "params": {"uri": "prx://skills/governance"}}
```

## Modèles de ressources

Les modèles de payload aident les clients à construire des opérations de mémoire standardisées :

```json
{"jsonrpc": "2.0", "id": 1, "method": "resources/templates/list", "params": {}}
```

Utiliser un modèle pour générer un payload de stockage :

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "resources/read",
  "params": {
    "uri": "prx://templates/memory-store?text=Pitfall:+always+handle+errors&scope=global"
  }
}
```

## Sessions en streaming

Le transport HTTP prend en charge les Server-Sent Events (SSE) pour les réponses en streaming. Les sessions ont un TTL configurable :

```bash
PRX_MEMORY_STREAM_SESSION_TTL_MS=300000  # 5 minutes
```

Renouveler une session avant son expiration :

```bash
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"
```

## Profils de standardisation

PRX-Memory prend en charge deux profils de standardisation qui contrôlent comment les entrées de mémoire sont étiquetées et validées :

| Profil | Description |
|---------|-------------|
| `zero-config` | Contraintes minimales, accepte toutes les étiquettes et portées (défaut) |
| `governed` | Normalisation stricte des étiquettes, limites de ratio et contraintes de qualité |

```bash
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend
```

## Étapes suivantes

- [Démarrage rapide](../getting-started/quickstart) -- Premières opérations de stockage et de rappel
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement
- [Dépannage](../troubleshooting/) -- Problèmes MCP courants
