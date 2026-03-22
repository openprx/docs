---
title: Déploiement Docker
description: "Déployer Fenfa avec Docker et Docker Compose. Configuration du conteneur, volumes, builds multi-architecture et vérifications de santé."
---

# Déploiement Docker

Fenfa est livré comme une image Docker unique qui inclut le binaire Go avec le frontend intégré. Aucun conteneur supplémentaire n'est nécessaire -- montez simplement des volumes pour les données persistantes.

## Démarrage rapide

```bash
docker run -d \
  --name fenfa \
  --restart=unless-stopped \
  -p 8000:8000 \
  -v ./data:/data \
  -v ./uploads:/app/uploads \
  fenfa/fenfa:latest
```

## Docker Compose

Créez un fichier `docker-compose.yml` :

```yaml
version: "3.8"

services:
  fenfa:
    image: fenfa/fenfa:latest
    container_name: fenfa
    restart: unless-stopped
    ports:
      - "127.0.0.1:8000:8000"
    environment:
      FENFA_ADMIN_TOKEN: ${FENFA_ADMIN_TOKEN}
      FENFA_UPLOAD_TOKEN: ${FENFA_UPLOAD_TOKEN}
      FENFA_PRIMARY_DOMAIN: ${FENFA_PRIMARY_DOMAIN:-http://localhost:8000}
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

volumes:
  fenfa-data:
  fenfa-uploads:
```

Créez un fichier `.env` à côté du fichier compose :

```bash
FENFA_ADMIN_TOKEN=your-secure-admin-token
FENFA_UPLOAD_TOKEN=your-secure-upload-token
FENFA_PRIMARY_DOMAIN=https://dist.example.com
```

Démarrez le service :

```bash
docker compose up -d
```

## Volumes

| Point de montage | Objectif | Sauvegarde requise |
|-----------------|---------|-------------------|
| `/data` | Base de données SQLite | Oui |
| `/app/uploads` | Fichiers binaires téléversés | Oui (sauf si S3 est utilisé) |
| `/app/config.json` | Fichier de configuration (optionnel) | Oui |

::: warning Persistance des données
Sans montage de volumes, toutes les données sont perdues quand le conteneur est recréé. Montez toujours `/data` et `/app/uploads` pour un usage en production.
:::

## Utiliser un fichier de configuration

Montez un fichier de configuration pour un contrôle total :

```yaml
services:
  fenfa:
    image: fenfa/fenfa:latest
    volumes:
      - fenfa-data:/data
      - fenfa-uploads:/app/uploads
      - ./config.json:/app/config.json:ro
```

## Vérification de santé

Fenfa expose un endpoint de santé à `/healthz` :

```bash
curl http://localhost:8000/healthz
# {"ok": true}
```

L'exemple Docker Compose ci-dessus inclut une configuration de vérification de santé. Pour les orchestrateurs comme Kubernetes ou Nomad, utilisez cet endpoint pour les sondes de liveness et readiness.

## Multi-architecture

L'image Docker de Fenfa prend en charge `linux/amd64` et `linux/arm64`. Docker tire automatiquement l'architecture correcte pour votre hôte.

Pour compiler des images multi-architecture vous-même :

```bash
./scripts/docker-build.sh
```

Cela utilise Docker Buildx pour créer des images pour les deux architectures.

## Exigences en ressources

Fenfa est léger :

| Ressource | Minimum | Recommandé |
|-----------|---------|------------|
| CPU | 1 cœur | 2 cœurs |
| RAM | 64 Mo | 256 Mo |
| Disque | 100 Mo (application) | Dépend des fichiers téléversés |

La base de données SQLite et le binaire Go ont une surcharge minimale. L'utilisation des ressources évolue principalement avec le stockage des téléversements et les connexions simultanées.

## Journaux

Affichez les journaux du conteneur :

```bash
docker logs -f fenfa
```

Fenfa enregistre sur stdout au format structuré, compatible avec les outils d'agrégation de journaux.

## Mise à jour

```bash
docker compose pull
docker compose up -d
```

::: tip Mises à jour sans temps d'arrêt
Fenfa démarre rapidement (< 1 seconde). Pour des mises à jour quasi sans temps d'arrêt, utilisez une vérification de santé de proxy inverse qui route automatiquement le trafic vers le nouveau conteneur une fois qu'il passe la vérification de santé.
:::

## Étapes suivantes

- [Déploiement en production](./production) -- Proxy inverse, TLS et sécurité
- [Référence de configuration](../configuration/) -- Toutes les options de configuration
- [Dépannage](../troubleshooting/) -- Problèmes Docker courants
