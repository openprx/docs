---
title: Démarrage rapide
description: "Mettre PRX-Memory en route en 5 minutes avec le transport stdio ou HTTP, stocker votre première mémoire et la rappeler avec la recherche sémantique."
---

# Démarrage rapide

Ce guide vous accompagne dans la compilation de PRX-Memory, l'exécution du démon et la réalisation de vos premières opérations de stockage et de rappel.

## 1. Compiler le démon

```bash
git clone https://github.com/openprx/prx-memory.git
cd prx-memory
cargo build -p prx-memory-mcp --bin prx-memoryd
```

## 2. Démarrer le serveur

### Option A : Transport stdio

Pour une intégration directe avec un client MCP :

```bash
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

### Option B : Transport HTTP

Pour un accès réseau avec vérifications de santé et métriques :

```bash
PRX_MEMORYD_TRANSPORT=http \
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787 \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

Vérifiez que le serveur est en cours d'exécution :

```bash
curl -sS http://127.0.0.1:8787/health
```

## 3. Configurer votre client MCP

Ajoutez PRX-Memory à la configuration de votre client MCP. Par exemple, dans Claude Code ou Codex :

```json
{
  "mcpServers": {
    "prx_memory": {
      "command": "/path/to/prx-memory/target/release/prx-memoryd",
      "env": {
        "PRX_MEMORYD_TRANSPORT": "stdio",
        "PRX_MEMORY_BACKEND": "json",
        "PRX_MEMORY_DB": "/path/to/prx-memory/data/memory-db.json"
      }
    }
  }
}
```

::: tip
Remplacez `/path/to/prx-memory` par le chemin réel où vous avez cloné le dépôt.
:::

## 4. Stocker une mémoire

Envoyez un appel d'outil `memory_store` via votre client MCP ou directement via JSON-RPC :

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "memory_store",
    "arguments": {
      "text": "Always use parameterized queries for SQL to prevent injection attacks",
      "scope": "global",
      "tags": ["security", "sql", "best-practice"]
    }
  }
}
```

## 5. Rappeler des mémoires

Récupérez les mémoires pertinentes avec `memory_recall` :

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "memory_recall",
    "arguments": {
      "query": "SQL security best practices",
      "scope": "global",
      "limit": 5
    }
  }
}
```

Le système retourne les mémoires classées par pertinence en combinant la correspondance lexicale, le scoring d'importance et la récence.

## 6. Activer la recherche sémantique (optionnel)

Pour le rappel sémantique basé sur les vecteurs, configurez un fournisseur d'embedding :

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_jina_api_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

Avec les embeddings activés, les requêtes de rappel utilisent la similarité vectorielle en plus de la correspondance lexicale, améliorant significativement la qualité de récupération pour les requêtes en langage naturel.

## 7. Activer le reranking (optionnel)

Ajoutez un rerankeur pour améliorer davantage la précision de récupération :

```bash
PRX_EMBED_PROVIDER=jina \
PRX_EMBED_API_KEY=your_embed_key \
PRX_EMBED_MODEL=jina-embeddings-v3 \
PRX_RERANK_PROVIDER=cohere \
PRX_RERANK_API_KEY=your_cohere_key \
PRX_RERANK_MODEL=rerank-v3.5 \
PRX_MEMORYD_TRANSPORT=stdio \
PRX_MEMORY_DB=./data/memory-db.json \
./target/debug/prx-memoryd
```

## Outils MCP disponibles

| Outil | Description |
|------|-------------|
| `memory_store` | Stocker une nouvelle entrée de mémoire |
| `memory_recall` | Rappeler des mémoires par requête |
| `memory_update` | Mettre à jour une entrée de mémoire existante |
| `memory_forget` | Supprimer une entrée de mémoire |
| `memory_export` | Exporter toutes les mémoires |
| `memory_import` | Importer des mémoires depuis un export |
| `memory_migrate` | Migrer le format de stockage |
| `memory_reembed` | Ré-embéder les mémoires avec un nouveau modèle |
| `memory_compact` | Compacter et optimiser le stockage |
| `memory_evolve` | Faire évoluer la mémoire avec validation par validation croisée |
| `memory_skill_manifest` | Découvrir les compétences disponibles |

## Étapes suivantes

- [Moteur d'embedding](../embedding/) -- Explorer les fournisseurs d'embedding et le traitement par lots
- [Reranking](../reranking/) -- Configurer le reranking en deuxième étape
- [Backends de stockage](../storage/) -- Choisir entre le stockage JSON et SQLite
- [Référence de configuration](../configuration/) -- Toutes les variables d'environnement
