---
title: Installation
description: "Installer OpenPR avec Docker Compose, Podman ou en compilant depuis les sources avec Rust et Node.js."
---

# Installation

OpenPR prend en charge trois méthodes d'installation. Docker Compose est le moyen le plus rapide d'obtenir une instance entièrement fonctionnelle.

::: tip Recommandé
**Docker Compose** démarre tous les services (API, frontend, worker, serveur MCP, PostgreSQL) avec une seule commande. Aucune chaîne d'outils Rust ou Node.js requise.
:::

## Prérequis

| Exigence | Minimum | Notes |
|----------|---------|-------|
| Docker | 20.10+ | Ou Podman 3.0+ avec podman-compose |
| Docker Compose | 2.0+ | Inclus avec Docker Desktop |
| Rust (build source) | 1.75.0 | Non requis pour l'installation Docker |
| Node.js (build source) | 20+ | Pour construire le frontend SvelteKit |
| PostgreSQL (build source) | 15+ | La méthode Docker inclut PostgreSQL |
| Espace disque | 500 Mo | Images + base de données |
| RAM | 1 Go | 2 Go+ recommandé pour la production |

## Méthode 1 : Docker Compose (Recommandé)

Clonez le dépôt et démarrez tous les services :

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env
docker-compose up -d
```

Cela démarre cinq services :

| Service | Conteneur | Port | Description |
|---------|-----------|------|-------------|
| PostgreSQL | `openpr-postgres` | 5432 | Base de données avec migration automatique |
| API | `openpr-api` | 8081 (mappe vers 8080) | Serveur API REST |
| Worker | `openpr-worker` | -- | Processeur de tâches en arrière-plan |
| Serveur MCP | `openpr-mcp-server` | 8090 | Serveur d'outils MCP |
| Frontend | `openpr-frontend` | 3000 | Interface web SvelteKit |

Vérifiez que tous les services sont en cours d'exécution :

```bash
docker-compose ps
```

::: warning Premier utilisateur
Le premier utilisateur à s'enregistrer devient automatiquement **administrateur**. Assurez-vous d'enregistrer votre compte admin avant de partager l'URL avec d'autres.
:::

### Variables d'environnement

Modifiez `.env` pour personnaliser votre déploiement :

```bash
# Base de données
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (changez en production !)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Frontend
VITE_API_URL=http://localhost:8080

# Serveur MCP
MCP_SERVER_PORT=8090
```

::: danger Sécurité
Changez toujours `JWT_SECRET` et les mots de passe de la base de données avant de déployer en production. Utilisez des valeurs fortes et aléatoires.
:::

## Méthode 2 : Podman

OpenPR fonctionne avec Podman comme alternative à Docker. La différence principale est que Podman nécessite `--network=host` pour les builds en raison de la résolution DNS :

```bash
git clone https://github.com/openprx/openpr.git
cd openpr
cp .env.example .env

# Construire les images avec accès réseau
sudo podman build --network=host --build-arg APP_BIN=api -f Dockerfile.prebuilt -t openpr_api .
sudo podman build --network=host --build-arg APP_BIN=worker -f Dockerfile.prebuilt -t openpr_worker .
sudo podman build --network=host --build-arg APP_BIN=mcp-server -f Dockerfile.prebuilt -t openpr_mcp-server .
sudo podman build --network=host -f frontend/Dockerfile -t openpr_frontend frontend/

# Démarrer les services
sudo podman-compose up -d
```

::: tip DNS Podman
Le conteneur Nginx du frontend utilise `10.89.0.1` comme résolveur DNS (DNS réseau par défaut de Podman), et non `127.0.0.11` (celui par défaut de Docker). Cela est déjà configuré dans la config Nginx incluse.
:::

## Méthode 3 : Build depuis les sources

### Backend

```bash
# Prérequis : Rust 1.75+, PostgreSQL 15+
git clone https://github.com/openprx/openpr.git
cd openpr

# Configurer
cp .env.example .env
# Modifier .env avec votre chaîne de connexion PostgreSQL

# Compiler tous les binaires
cargo build --release -p api -p worker -p mcp-server
```

Les binaires se trouvent à :
- `target/release/api` -- Serveur API REST
- `target/release/worker` -- Worker en arrière-plan
- `target/release/mcp-server` -- Serveur d'outils MCP

### Frontend

```bash
cd frontend
npm install    # ou: bun install
npm run build  # ou: bun run build
```

La sortie du build se trouve dans `frontend/build/`. Servez-la avec Nginx ou tout serveur de fichiers statiques.

### Configuration de la base de données

Créez la base de données et exécutez les migrations :

```bash
# Créer la base de données
createdb -U postgres openpr

# Les migrations s'exécutent automatiquement au premier démarrage de l'API
# Ou appliquez manuellement :
psql -U openpr -d openpr -f migrations/0001_initial.sql
# ... appliquer les migrations restantes dans l'ordre
```

### Démarrer les services

```bash
# Terminal 1 : Serveur API
./target/release/api

# Terminal 2 : Worker
./target/release/worker

# Terminal 3 : Serveur MCP
./target/release/mcp-server --transport http --bind-addr 0.0.0.0:8090
```

## Vérifier l'installation

Une fois tous les services en cours d'exécution, vérifiez chaque point de terminaison :

```bash
# Vérification de santé de l'API
curl http://localhost:8080/health

# Santé du serveur MCP
curl http://localhost:8090/health

# Frontend
curl -s http://localhost:3000 | head -5
```

Ouvrez http://localhost:3000 dans votre navigateur pour accéder à l'interface web.

## Désinstallation

### Docker Compose

```bash
cd openpr
docker-compose down -v  # -v supprime les volumes (données de la base de données)
docker rmi $(docker images 'openpr*' -q)
```

### Build depuis les sources

```bash
# Arrêter les services en cours (Ctrl+C dans chaque terminal)
# Supprimer les binaires
rm -f target/release/api target/release/worker target/release/mcp-server

# Supprimer la base de données (optionnel)
dropdb -U postgres openpr
```

## Étapes suivantes

- [Démarrage rapide](./quickstart) -- Créez votre premier espace de travail et projet en 5 minutes
- [Déploiement Docker](../deployment/docker) -- Configuration Docker de production
- [Déploiement en production](../deployment/production) -- Caddy, PostgreSQL et durcissement de la sécurité
