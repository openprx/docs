---
title: Référence de configuration
description: "Référence complète de toutes les variables d'environnement et options de configuration OpenPR pour l'API, le worker, le serveur MCP, le frontend et la base de données."
---

# Référence de configuration

OpenPR est configuré via des variables d'environnement. Tous les services lisent depuis le même fichier `.env` lors de l'utilisation de Docker Compose, ou des variables d'environnement individuelles lors d'une exécution directe.

## Serveur API

| Variable | Défaut | Description |
|----------|--------|-------------|
| `APP_NAME` | `api` | Identifiant d'application pour la journalisation |
| `BIND_ADDR` | `0.0.0.0:8080` | Adresse et port d'écoute de l'API |
| `DATABASE_URL` | -- | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | `change-me-in-production` | Clé secrète pour signer les jetons JWT |
| `JWT_ACCESS_TTL_SECONDS` | `2592000` (30 jours) | Durée de vie du jeton d'accès en secondes |
| `JWT_REFRESH_TTL_SECONDS` | `604800` (7 jours) | Durée de vie du jeton de rafraîchissement en secondes |
| `RUST_LOG` | `info` | Niveau de journalisation (trace, debug, info, warn, error) |
| `UPLOAD_DIR` | `/app/uploads` | Répertoire pour les téléchargements de fichiers |

::: danger Sécurité
Changez toujours `JWT_SECRET` avec une valeur forte et aléatoire en production. Utilisez au moins 32 caractères de données aléatoires :
```bash
openssl rand -hex 32
```
:::

## Base de données

| Variable | Défaut | Description |
|----------|--------|-------------|
| `DATABASE_URL` | -- | Chaîne de connexion PostgreSQL complète |
| `POSTGRES_DB` | `openpr` | Nom de la base de données |
| `POSTGRES_USER` | `openpr` | Utilisateur de la base de données |
| `POSTGRES_PASSWORD` | `openpr` | Mot de passe de la base de données |

Format de la chaîne de connexion :

```
postgres://user:password@host:port/database
```

::: tip Docker Compose
Lors de l'utilisation de Docker Compose, le service de base de données s'appelle `postgres`, donc la chaîne de connexion est :
```
postgres://openpr:openpr@postgres:5432/openpr
```
:::

## Worker

| Variable | Défaut | Description |
|----------|--------|-------------|
| `APP_NAME` | `worker` | Identifiant d'application |
| `DATABASE_URL` | -- | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | -- | Doit correspondre à la valeur du serveur API |
| `RUST_LOG` | `info` | Niveau de journalisation |

Le worker traite les tâches en arrière-plan depuis les tables `job_queue` et `scheduled_jobs`.

## Serveur MCP

| Variable | Défaut | Description |
|----------|--------|-------------|
| `APP_NAME` | `mcp-server` | Identifiant d'application |
| `OPENPR_API_URL` | -- | URL du serveur API (incluant le proxy si applicable) |
| `OPENPR_BOT_TOKEN` | -- | Jeton bot avec préfixe `opr_` |
| `OPENPR_WORKSPACE_ID` | -- | UUID de l'espace de travail par défaut |
| `DATABASE_URL` | -- | Chaîne de connexion PostgreSQL |
| `JWT_SECRET` | -- | Doit correspondre à la valeur du serveur API |
| `DEFAULT_AUTHOR_ID` | -- | UUID d'auteur de secours pour les opérations MCP |
| `RUST_LOG` | `info` | Niveau de journalisation |

### Options de transport MCP

Le binaire du serveur MCP accepte des arguments en ligne de commande :

```bash
# Mode HTTP (par défaut)
mcp-server --transport http --bind-addr 0.0.0.0:8090

# Mode stdio (pour Claude Desktop, Codex)
mcp-server --transport stdio

# Forme avec sous-commande
mcp-server serve --transport http --bind-addr 0.0.0.0:8090
```

## Frontend

| Variable | Défaut | Description |
|----------|--------|-------------|
| `VITE_API_URL` | `http://localhost:8080` | URL du serveur API pour que le frontend se connecte |

::: tip Proxy inverse
En production avec un proxy inverse (Caddy/Nginx), `VITE_API_URL` doit pointer vers l'URL du proxy qui route vers le serveur API.
:::

## Ports Docker Compose

| Service | Port interne | Port externe | Objectif |
|---------|-------------|--------------|---------|
| PostgreSQL | 5432 | 5432 | Base de données |
| API | 8080 | 8081 | API REST |
| Worker | -- | -- | Tâches en arrière-plan (pas de port) |
| Serveur MCP | 8090 | 8090 | Outils MCP |
| Frontend | 80 | 3000 | Interface web |

## Exemple de fichier .env

```bash
# Base de données
DATABASE_URL=postgres://openpr:openpr@localhost:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=openpr

# JWT (CHANGER EN PRODUCTION)
JWT_SECRET=change-me-in-production
JWT_ACCESS_TTL_SECONDS=2592000
JWT_REFRESH_TTL_SECONDS=604800

# Serveur API
APP_NAME=api
BIND_ADDR=0.0.0.0:8080
RUST_LOG=info

# Frontend
VITE_API_URL=http://localhost:8080

# Serveur MCP
MCP_SERVER_PORT=8090
```

## Niveaux de journalisation

OpenPR utilise le crate `tracing` pour la journalisation structurée. Définissez `RUST_LOG` pour contrôler la verbosité :

| Niveau | Description |
|--------|-------------|
| `error` | Erreurs uniquement |
| `warn` | Erreurs et avertissements |
| `info` | Messages opérationnels normaux (par défaut) |
| `debug` | Informations de débogage détaillées |
| `trace` | Très verbeux, inclut toutes les opérations internes |

Le filtrage par module est pris en charge :

```bash
RUST_LOG=info,api=debug,mcp_server=trace
```

## Étapes suivantes

- [Déploiement Docker](../deployment/docker) -- Configuration Docker Compose
- [Déploiement en production](../deployment/production) -- Caddy, sécurité et mise à l'échelle
- [Installation](../getting-started/installation) -- Démarrage
