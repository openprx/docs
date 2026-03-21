---
title: Systeme de memoire
description: Apercu du systeme de memoire de PRX avec 5 backends de stockage pour le contexte persistant de l'agent.
---

# Systeme de memoire

PRX fournit un systeme de memoire flexible qui permet aux agents de persister et de rappeler le contexte a travers les conversations. Le systeme de memoire prend en charge 5 backends de stockage, chacun optimise pour differents scenarios de deploiement.

## Apercu

Le systeme de memoire remplit trois fonctions principales :

- **Rappel** -- recuperer les interactions passees pertinentes et les faits avant chaque appel LLM
- **Stockage** -- persister les informations importantes extraites des conversations
- **Compactage** -- resumer et comprimer les anciens souvenirs pour tenir dans les limites de contexte

## Backends de stockage

| Backend | Persistance | Recherche | Ideal pour |
|---------|------------|-----------|------------|
| [Markdown](./markdown) | Fichiers | Grep texte integral | CLI mono-utilisateur, memoire sous controle de version |
| [SQLite](./sqlite) | Base locale | FTS5 texte integral | Deploiements locaux, petites equipes |
| [PostgreSQL](./postgres) | Base distante | pg_trgm + FTS | Deploiements serveur multi-utilisateurs |
| [Embeddings](./embeddings) | Stockage vectoriel | Similarite semantique | Recuperation de type RAG, grandes bases de connaissances |
| En memoire | Aucune (session uniquement) | Recherche lineaire | Sessions ephemeres, tests |

## Configuration

Selectionnez et configurez le backend de memoire dans `config.toml` :

```toml
[memory]
backend = "sqlite"  # "markdown" | "sqlite" | "postgres" | "embeddings" | "memory"
max_recall_items = 20
recall_relevance_threshold = 0.3

[memory.sqlite]
path = "~/.local/share/openprx/memory.db"

[memory.postgres]
url = "postgresql://user:pass@localhost/prx"

[memory.embeddings]
provider = "ollama"
model = "nomic-embed-text"
dimension = 768
```

## Cycle de vie de la memoire

1. **Extraction** -- apres chaque tour de conversation, le systeme extrait les faits cles
2. **Deduplication** -- les nouveaux faits sont compares aux memoires existantes
3. **Stockage** -- les faits uniques sont persistes dans le backend configure
4. **Rappel** -- avant chaque appel LLM, les memoires pertinentes sont recuperees
5. **Hygiene** -- une maintenance periodique compacte et elague les entrees obsoletes

## Pages associees

- [Backend Markdown](./markdown)
- [Backend SQLite](./sqlite)
- [Backend PostgreSQL](./postgres)
- [Backend Embeddings](./embeddings)
- [Hygiene de la memoire](./hygiene)
