---
title: Référence de configuration
description: "Référence complète de toutes les variables d'environnement PRX-Memory couvrant le transport, le stockage, l'embedding, le reranking, la gouvernance et l'observabilité."
---

# Référence de configuration

PRX-Memory est configuré entièrement via des variables d'environnement. Cette page documente chaque variable regroupée par catégorie.

## Transport

| Variable | Valeurs | Défaut | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORYD_TRANSPORT` | `stdio`, `http` | `stdio` | Mode de transport du serveur |
| `PRX_MEMORY_HTTP_ADDR` | `host:port` | `127.0.0.1:8787` | Adresse d'écoute du serveur HTTP |

## Stockage

| Variable | Valeurs | Défaut | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORY_BACKEND` | `json`, `sqlite`, `lancedb` | `json` | Backend de stockage |
| `PRX_MEMORY_DB` | chemin de fichier/répertoire | -- | Chemin du fichier ou répertoire de la base de données |

## Embedding

| Variable | Valeurs | Défaut | Description |
|----------|--------|---------|-------------|
| `PRX_EMBED_PROVIDER` | `openai-compatible`, `jina`, `gemini` | -- | Fournisseur d'embedding |
| `PRX_EMBED_API_KEY` | chaîne de clé API | -- | Clé API du fournisseur d'embedding |
| `PRX_EMBED_MODEL` | nom du modèle | spécifique au fournisseur | Nom du modèle d'embedding |
| `PRX_EMBED_BASE_URL` | URL | spécifique au fournisseur | URL du point de terminaison API personnalisé |

### Clés de fallback du fournisseur

Si `PRX_EMBED_API_KEY` n'est pas défini, le système vérifie ces clés spécifiques au fournisseur :

| Fournisseur | Clé de fallback |
|----------|-------------|
| `jina` | `JINA_API_KEY` |
| `gemini` | `GEMINI_API_KEY` |

## Reranking

| Variable | Valeurs | Défaut | Description |
|----------|--------|---------|-------------|
| `PRX_RERANK_PROVIDER` | `jina`, `cohere`, `pinecone`, `pinecone-compatible`, `none` | `none` | Fournisseur de reranking |
| `PRX_RERANK_API_KEY` | chaîne de clé API | -- | Clé API du fournisseur de reranking |
| `PRX_RERANK_MODEL` | nom du modèle | spécifique au fournisseur | Nom du modèle de reranking |
| `PRX_RERANK_ENDPOINT` | URL | spécifique au fournisseur | Point de terminaison de reranking personnalisé |
| `PRX_RERANK_API_VERSION` | chaîne de version | -- | Version de l'API (uniquement pinecone-compatible) |

### Clés de fallback du fournisseur

Si `PRX_RERANK_API_KEY` n'est pas défini, le système vérifie ces clés spécifiques au fournisseur :

| Fournisseur | Clé de fallback |
|----------|-------------|
| `jina` | `JINA_API_KEY` |
| `cohere` | `COHERE_API_KEY` |
| `pinecone` | `PINECONE_API_KEY` |

## Standardisation

| Variable | Valeurs | Défaut | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORY_STANDARD_PROFILE` | `zero-config`, `governed` | `zero-config` | Profil de standardisation |
| `PRX_MEMORY_DEFAULT_PROJECT_TAG` | chaîne d'étiquette | `prx-memory` | Étiquette de projet par défaut |
| `PRX_MEMORY_DEFAULT_TOOL_TAG` | chaîne d'étiquette | `mcp` | Étiquette d'outil par défaut |
| `PRX_MEMORY_DEFAULT_DOMAIN_TAG` | chaîne d'étiquette | `general` | Étiquette de domaine par défaut |

## Sessions en streaming

| Variable | Valeurs | Défaut | Description |
|----------|--------|---------|-------------|
| `PRX_MEMORY_STREAM_SESSION_TTL_MS` | millisecondes | `300000` | Durée de vie de la session en streaming |

## Observabilité

### Contrôles de cardinalité

| Variable | Défaut | Description |
|----------|---------|-------------|
| `PRX_METRICS_MAX_RECALL_SCOPE_LABELS` | `32` | Nombre max d'étiquettes de portée distinctes dans les métriques |
| `PRX_METRICS_MAX_RECALL_CATEGORY_LABELS` | `32` | Nombre max d'étiquettes de catégorie distinctes dans les métriques |
| `PRX_METRICS_MAX_RERANK_PROVIDER_LABELS` | `16` | Nombre max d'étiquettes de fournisseur de reranking distinctes |

### Seuils d'alerte

| Variable | Défaut | Description |
|----------|---------|-------------|
| `PRX_ALERT_TOOL_ERROR_RATIO_WARN` | `0.05` | Seuil d'avertissement du ratio d'erreur d'outil |
| `PRX_ALERT_TOOL_ERROR_RATIO_CRIT` | `0.20` | Seuil critique du ratio d'erreur d'outil |
| `PRX_ALERT_REMOTE_WARNING_RATIO_WARN` | `0.25` | Seuil d'avertissement du ratio d'avertissement distant |
| `PRX_ALERT_REMOTE_WARNING_RATIO_CRIT` | `0.60` | Seuil critique du ratio d'avertissement distant |

## Exemple : Configuration minimale

```bash
PRX_MEMORYD_TRANSPORT=stdio
PRX_MEMORY_DB=./data/memory-db.json
```

## Exemple : Configuration complète de production

```bash
# Transport
PRX_MEMORYD_TRANSPORT=http
PRX_MEMORY_HTTP_ADDR=127.0.0.1:8787

# Stockage
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db

# Embedding
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_jina_key
PRX_EMBED_MODEL=jina-embeddings-v3

# Reranking
PRX_RERANK_PROVIDER=cohere
PRX_RERANK_API_KEY=your_cohere_key
PRX_RERANK_MODEL=rerank-v3.5

# Gouvernance
PRX_MEMORY_STANDARD_PROFILE=governed
PRX_MEMORY_DEFAULT_PROJECT_TAG=my-project
PRX_MEMORY_DEFAULT_TOOL_TAG=mcp
PRX_MEMORY_DEFAULT_DOMAIN_TAG=backend

# Sessions
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000

# Observabilité
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.03
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.15
```

## Étapes suivantes

- [Installation](../getting-started/installation) -- Compiler et installer PRX-Memory
- [Intégration MCP](../mcp/) -- Configurer votre client MCP
- [Dépannage](../troubleshooting/) -- Problèmes de configuration courants
