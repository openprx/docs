---
title: Dépannage
description: "Problèmes courants de PRX-Memory et solutions pour la configuration, l'embedding, le reranking, le stockage et l'intégration MCP."
---

# Dépannage

Cette page couvre les problèmes courants rencontrés lors de l'exécution de PRX-Memory, ainsi que leurs causes et solutions.

## Problèmes de configuration

### "PRX_EMBED_API_KEY is not configured"

**Cause :** Un rappel sémantique distant a été demandé mais aucune clé API d'embedding n'est définie.

**Solution :** Définissez le fournisseur d'embedding et la clé API :

```bash
PRX_EMBED_PROVIDER=jina
PRX_EMBED_API_KEY=your_api_key
```

Ou utilisez une clé de fallback spécifique au fournisseur :

```bash
JINA_API_KEY=your_api_key
```

::: tip
Si vous n'avez pas besoin de la recherche sémantique, PRX-Memory fonctionne sans configuration d'embedding en utilisant uniquement la correspondance lexicale.
:::

### "Unsupported rerank provider"

**Cause :** La variable `PRX_RERANK_PROVIDER` contient une valeur non reconnue.

**Solution :** Utilisez l'une des valeurs prises en charge :

```bash
PRX_RERANK_PROVIDER=jina        # ou cohere, pinecone, pinecone-compatible, none
```

### "Unsupported embed provider"

**Cause :** La variable `PRX_EMBED_PROVIDER` contient une valeur non reconnue.

**Solution :** Utilisez l'une des valeurs prises en charge :

```bash
PRX_EMBED_PROVIDER=openai-compatible  # ou jina, gemini
```

## Problèmes de session

### "session_expired"

**Cause :** Une session en streaming HTTP a dépassé son TTL sans être renouvelée.

**Solution :** Renouvelez la session avant son expiration ou augmentez le TTL :

```bash
# Renouveler la session
curl -X POST "http://127.0.0.1:8787/mcp/session/renew?session=SESSION_ID"

# Ou augmenter le TTL (défaut : 300000ms = 5 minutes)
PRX_MEMORY_STREAM_SESSION_TTL_MS=600000
```

## Problèmes de stockage

### Fichier de base de données introuvable

**Cause :** Le chemin spécifié dans `PRX_MEMORY_DB` n'existe pas ou n'est pas accessible en écriture.

**Solution :** Assurez-vous que le répertoire existe et que le chemin est correct :

```bash
mkdir -p ./data
PRX_MEMORY_DB=./data/memory-db.json
```

::: tip
Utilisez des chemins absolus pour éviter les problèmes liés aux changements de répertoire de travail.
:::

### Grande base de données JSON lente au chargement

**Cause :** Le backend JSON charge tout le fichier en mémoire au démarrage. Pour les bases de données avec plus de 10 000 entrées, cela peut être lent.

**Solution :** Migrez vers le backend SQLite :

```bash
PRX_MEMORY_BACKEND=sqlite
PRX_MEMORY_DB=./data/memory.db
```

Utilisez l'outil `memory_migrate` pour transférer les données existantes.

## Problèmes d'observabilité

### Alerte de dépassement de cardinalité des métriques

**Cause :** Trop de valeurs d'étiquettes distinctes dans les dimensions de portée de rappel, de catégorie ou de fournisseur de reranking.

**Solution :** Augmentez les limites de cardinalité ou normalisez vos entrées :

```bash
PRX_METRICS_MAX_RECALL_SCOPE_LABELS=64
PRX_METRICS_MAX_RECALL_CATEGORY_LABELS=64
PRX_METRICS_MAX_RERANK_PROVIDER_LABELS=32
```

Lorsque les limites sont dépassées, les nouvelles valeurs d'étiquettes sont silencieusement abandonnées et comptées dans `prx_memory_metrics_label_overflow_total`.

### Seuils d'alerte trop sensibles

**Cause :** Les seuils d'alerte par défaut peuvent déclencher des faux positifs lors du déploiement initial.

**Solution :** Ajustez les seuils en fonction de vos taux d'erreur attendus :

```bash
PRX_ALERT_TOOL_ERROR_RATIO_WARN=0.10
PRX_ALERT_TOOL_ERROR_RATIO_CRIT=0.30
```

## Problèmes de compilation

### Fonctionnalité LanceDB non disponible

**Cause :** Le flag de fonctionnalité `lancedb-backend` n'a pas été activé au moment de la compilation.

**Solution :** Recompilez avec le flag de fonctionnalité :

```bash
cargo build --release -p prx-memory-mcp --bin prx-memoryd --features lancedb-backend
```

### Erreurs de compilation sur Linux

**Cause :** Dépendances système manquantes pour la compilation de code natif.

**Solution :** Installez les dépendances de compilation :

```bash
# Debian/Ubuntu
sudo apt install -y build-essential pkg-config libssl-dev

# Fedora
sudo dnf install -y gcc openssl-devel pkg-config
```

## Vérification de santé

Utilisez le point de terminaison de santé HTTP pour vérifier que le serveur fonctionne correctement :

```bash
curl -sS http://127.0.0.1:8787/health
```

Vérifiez les métriques pour le statut opérationnel :

```bash
curl -sS http://127.0.0.1:8787/metrics/summary
```

## Commandes de validation

Exécutez la suite de validation complète pour vérifier votre installation :

```bash
# Validation multi-client
./scripts/run_multi_client_validation.sh

# Test de charge (60 secondes, 4 QPS)
./scripts/run_soak_http.sh 60 4
```

## Obtenir de l'aide

- **Dépôt :** [github.com/openprx/prx-memory](https://github.com/openprx/prx-memory)
- **Issues :** [github.com/openprx/prx-memory/issues](https://github.com/openprx/prx-memory/issues)
- **Documentation :** [docs/README.md](https://github.com/openprx/prx-memory/blob/main/docs/README.md)
