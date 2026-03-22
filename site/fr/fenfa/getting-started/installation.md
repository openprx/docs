---
title: Installation
description: "Installer Fenfa avec Docker, Docker Compose, ou compiler depuis les sources avec Go et Node.js."
---

# Installation

Fenfa prend en charge deux méthodes d'installation : Docker (recommandé) et la compilation depuis les sources.

::: tip Recommandé
**Docker** est le moyen le plus rapide de démarrer. Une seule commande vous donne une instance Fenfa entièrement fonctionnelle sans outils de compilation nécessaires.
:::

## Prérequis

| Prérequis | Minimum | Notes |
|-----------|---------|-------|
| Docker | 20.10+ | Ou Podman 3.0+ |
| Go (compilation depuis les sources uniquement) | 1.25+ | Non nécessaire pour Docker |
| Node.js (compilation depuis les sources uniquement) | 20+ | Pour compiler le frontend |
| Espace disque | 100 Mo | Plus le stockage pour les builds téléversés |

## Méthode 1 : Docker (Recommandé)

Télécharger et exécuter l'image officielle :

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  fenfa/fenfa:latest
```

Visitez `http://localhost:8000/admin` et connectez-vous avec le jeton par défaut `dev-admin-token`.

::: warning Sécurité
Les jetons par défaut sont uniquement pour le développement. Consultez [Déploiement en production](../deployment/production) pour configurer des jetons sécurisés avant d'exposer Fenfa sur Internet.
:::

### Avec stockage persistant

Montez des volumes pour la base de données et les fichiers téléversés :

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

### Avec configuration personnalisée

Montez un fichier `config.json` pour un contrôle total sur tous les paramètres :

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  -v ./config.json:/app/config.json:ro \
  fenfa/fenfa:latest
```

Consultez la [Référence de configuration](../configuration/) pour toutes les options disponibles.

### Variables d'environnement

Remplacez les valeurs de configuration sans fichier de configuration :

```bash
docker run -d \
  --name fenfa \
  -p 8000:8000 \
  -e FENFA_ADMIN_TOKEN=your-secret-admin-token \
  -e FENFA_UPLOAD_TOKEN=your-secret-upload-token \
  -e FENFA_PRIMARY_DOMAIN=https://dist.example.com \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

| Variable | Description | Défaut |
|----------|-------------|--------|
| `FENFA_PORT` | Port HTTP | `8000` |
| `FENFA_DATA_DIR` | Répertoire de base de données | `data` |
| `FENFA_PRIMARY_DOMAIN` | URL de domaine public | `http://localhost:8000` |
| `FENFA_ADMIN_TOKEN` | Jeton d'administration | `dev-admin-token` |
| `FENFA_UPLOAD_TOKEN` | Jeton de téléversement | `dev-upload-token` |

## Méthode 2 : Docker Compose

Créez un fichier `docker-compose.yml` :

```yaml
version: "3.8"
services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: your-secret-admin-token
      FENFA_UPLOAD_TOKEN: your-secret-upload-token
      FENFA_PRIMARY_DOMAIN: https://dist.example.com
    volumes:
      - ./data:/data
      - ./uploads:/app/uploads
```

Démarrez le service :

```bash
docker compose up -d
```

## Méthode 3 : Compiler depuis les sources

Clonez le dépôt :

```bash
git clone https://github.com/openprx/fenfa.git
cd fenfa
```

### Avec Make

Le Makefile automatise la compilation complète :

```bash
make build   # compile le frontend + backend
make run     # démarre le serveur
```

### Compilation manuelle

Compilez d'abord les applications frontend, puis le backend Go :

```bash
# Compiler la page de téléchargement publique
cd web/front && npm ci && npm run build && cd ../..

# Compiler le panneau d'administration
cd web/admin && npm ci && npm run build && cd ../..

# Compiler le binaire Go
go build -o fenfa ./cmd/server
```

Le frontend est compilé dans `internal/web/dist/` et intégré dans le binaire Go via `go:embed`. Le binaire `fenfa` résultant est entièrement autonome.

### Exécuter le binaire

```bash
./fenfa
```

Fenfa démarre sur le port 8000 par défaut. La base de données SQLite est créée automatiquement dans le répertoire `data/`.

## Vérifier l'installation

Ouvrez votre navigateur à `http://localhost:8000/admin` et connectez-vous avec le jeton d'administration. Vous devriez voir le tableau de bord d'administration.

Vérifiez l'endpoint de santé :

```bash
curl http://localhost:8000/healthz
```

Réponse attendue :

```json
{"ok": true}
```

## Étapes suivantes

- [Démarrage rapide](./quickstart) -- Téléversez votre premier build en 5 minutes
- [Référence de configuration](../configuration/) -- Toutes les options de configuration
- [Déploiement Docker](../deployment/docker) -- Docker Compose et builds multi-architecture
