---
title: Déploiement Docker
description: "Déployer OpenPR avec Docker Compose ou Podman. Inclut la configuration des services, le réseau, les volumes et les vérifications de santé."
---

# Déploiement Docker

OpenPR fournit un `docker-compose.yml` qui démarre tous les services requis avec une seule commande.

## Démarrage rapide

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
# Modifier .env avec les valeurs de production
docker-compose up -d
```

## Architecture des services

```mermaid
graph LR
    subgraph Docker["Réseau Docker (openpr-network)"]
        PG["PostgreSQL<br/>:5432"]
        API["Serveur API<br/>:8080"]
        WORKER["Worker"]
        MCP["Serveur MCP<br/>:8090"]
        FE["Frontend<br/>:80"]
    end

    PG --> API
    PG --> WORKER
    API --> MCP
    API --> FE

    USER["Utilisateurs<br/>Navigateur"] -->|":3000"| FE
    AIBOT["Assistants IA"] -->|":8090"| MCP
```

## Services

### PostgreSQL

```yaml
postgres:
  image: postgres:16
  container_name: openpr-postgres
  environment:
    POSTGRES_DB: openpr
    POSTGRES_USER: openpr
    POSTGRES_PASSWORD: openpr
  ports:
    - "5432:5432"
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./migrations:/docker-entrypoint-initdb.d
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U openpr -d openpr"]
    interval: 5s
    timeout: 3s
    retries: 20
```

Les migrations dans le répertoire `migrations/` sont exécutées automatiquement au premier démarrage via le mécanisme `docker-entrypoint-initdb.d` de PostgreSQL.

### Serveur API

```yaml
api:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: api
  container_name: openpr-api
  environment:
    BIND_ADDR: 0.0.0.0:8080
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
    JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
    UPLOAD_DIR: /app/uploads
  ports:
    - "8081:8080"
  volumes:
    - ./uploads:/app/uploads
  depends_on:
    postgres:
      condition: service_healthy
```

### Worker

```yaml
worker:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: worker
  container_name: openpr-worker
  environment:
    DATABASE_URL: postgres://openpr:openpr@postgres:5432/openpr
  depends_on:
    postgres:
      condition: service_healthy
```

Le worker n'a pas de ports exposés -- il se connecte directement à PostgreSQL pour traiter les tâches en arrière-plan.

### Serveur MCP

```yaml
mcp-server:
  build:
    context: .
    dockerfile: Dockerfile.prebuilt
    args:
      APP_BIN: mcp-server
  container_name: openpr-mcp-server
  environment:
    OPENPR_API_URL: http://api:8080
    OPENPR_BOT_TOKEN: opr_your_token
    OPENPR_WORKSPACE_ID: your-workspace-uuid
  command: ["./mcp-server", "serve", "--transport", "http", "--bind-addr", "0.0.0.0:8090"]
  ports:
    - "8090:8090"
  depends_on:
    api:
      condition: service_healthy
```

### Frontend

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: openpr-frontend
  ports:
    - "3000:80"
  depends_on:
    api:
      condition: service_healthy
```

## Volumes

| Volume | Objectif |
|--------|---------|
| `pgdata` | Persistance des données PostgreSQL |
| `./uploads` | Stockage des fichiers téléchargés |
| `./migrations` | Scripts de migration de la base de données |

## Vérifications de santé

Tous les services incluent des vérifications de santé :

| Service | Vérification | Intervalle |
|---------|-------------|-----------|
| PostgreSQL | `pg_isready` | 5s |
| API | `curl /health` | 10s |
| Serveur MCP | `curl /health` | 10s |
| Frontend | `wget /health` | 30s |

## Opérations courantes

```bash
# Voir les journaux
docker-compose logs -f api
docker-compose logs -f mcp-server

# Redémarrer un service
docker-compose restart api

# Reconstruire et redémarrer
docker-compose up -d --build api

# Arrêter tous les services
docker-compose down

# Arrêter et supprimer les volumes (ATTENTION : supprime la base de données)
docker-compose down -v

# Se connecter à la base de données
docker exec -it openpr-postgres psql -U openpr -d openpr
```

## Podman

Pour les utilisateurs de Podman, les différences clés sont :

1. Construire avec `--network=host` pour l'accès DNS :
   ```bash
   sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
   ```

2. Le Nginx du frontend utilise `10.89.0.1` comme résolveur DNS (par défaut Podman) au lieu de `127.0.0.11` (par défaut Docker).

3. Utilisez `sudo podman-compose` au lieu de `docker-compose`.

## Étapes suivantes

- [Déploiement en production](./production) -- Proxy inverse Caddy, HTTPS et sécurité
- [Configuration](../configuration/) -- Référence des variables d'environnement
- [Dépannage](../troubleshooting/) -- Problèmes Docker courants
