---
title: Déploiement en production
description: "Déployer OpenPR en production avec un proxy inverse Caddy, HTTPS automatique, durcissement PostgreSQL et bonnes pratiques de sécurité."
---

# Déploiement en production

Ce guide couvre le déploiement d'OpenPR dans un environnement de production avec HTTPS, un proxy inverse, le durcissement de la base de données et les bonnes pratiques de sécurité.

## Architecture

```mermaid
graph LR
    INTERNET["Internet<br/>:443"] --> CADDY["Caddy<br/>HTTPS automatique"]
    CADDY --> FE["Frontend<br/>Nginx :3000"]
    FE --> API["API :8080"]
    FE --> MCP["MCP :8090"]
    API --> PG["PostgreSQL :5432"]
    WORKER["Worker"] --> PG
```

## Prérequis

- Un serveur avec au moins 2 cœurs CPU et 2 Go de RAM
- Un nom de domaine pointant vers l'adresse IP de votre serveur
- Docker et Docker Compose (ou Podman)

## Étape 1 : Configurer l'environnement

Créez un fichier `.env` de production :

```bash
# Base de données (utilisez des mots de passe forts)
DATABASE_URL=postgres://openpr:STRONG_PASSWORD_HERE@postgres:5432/openpr
POSTGRES_DB=openpr
POSTGRES_USER=openpr
POSTGRES_PASSWORD=STRONG_PASSWORD_HERE

# JWT (générez un secret aléatoire)
JWT_SECRET=$(openssl rand -hex 32)
JWT_ACCESS_TTL_SECONDS=86400
JWT_REFRESH_TTL_SECONDS=604800

# Journalisation
RUST_LOG=info
```

::: danger Secrets
Ne commitez jamais les fichiers `.env` dans le contrôle de version. Utilisez `chmod 600 .env` pour restreindre les permissions du fichier.
:::

## Étape 2 : Configurer Caddy

Installez Caddy sur le système hôte :

```bash
sudo apt install -y caddy
```

Configurez le Caddyfile :

```
# /etc/caddy/Caddyfile
your-domain.example.com {
    reverse_proxy localhost:3000
}
```

Caddy obtient et renouvelle automatiquement les certificats TLS Let's Encrypt.

Démarrez Caddy :

```bash
sudo systemctl enable --now caddy
```

::: tip Alternative : Nginx
Si vous préférez Nginx, configurez-le avec un proxy_pass vers le port 3000 et utilisez certbot pour les certificats TLS.
:::

## Étape 3 : Déployer avec Docker Compose

```bash
cd /opt/openpr
docker-compose up -d
```

Vérifiez que tous les services sont sains :

```bash
docker-compose ps
curl -k https://your-domain.example.com/health
```

## Étape 4 : Créer le compte administrateur

Ouvrez `https://your-domain.example.com` dans votre navigateur et enregistrez le compte administrateur.

::: warning Premier utilisateur
Le premier utilisateur enregistré devient administrateur. Enregistrez votre compte admin avant de partager l'URL.
:::

## Liste de vérification sécurité

### Authentification

- [ ] Changer `JWT_SECRET` en une valeur aléatoire de 32+ caractères
- [ ] Définir des valeurs TTL de jetons appropriées (plus courtes pour l'accès, plus longues pour le rafraîchissement)
- [ ] Créer le compte administrateur immédiatement après le déploiement

### Base de données

- [ ] Utiliser un mot de passe fort pour PostgreSQL
- [ ] Ne pas exposer le port PostgreSQL (5432) à Internet
- [ ] Activer SSL PostgreSQL pour les connexions (si la base de données est distante)
- [ ] Configurer des sauvegardes régulières de la base de données

### Réseau

- [ ] Utiliser Caddy ou Nginx avec HTTPS (TLS 1.3)
- [ ] Exposer uniquement les ports 443 (HTTPS) et optionnellement 8090 (MCP) à Internet
- [ ] Utiliser un pare-feu (ufw, iptables) pour restreindre l'accès
- [ ] Envisager de restreindre l'accès au serveur MCP aux plages IP connues

### Application

- [ ] Définir `RUST_LOG=info` (pas debug ou trace en production)
- [ ] Surveiller l'utilisation du disque pour le répertoire uploads
- [ ] Configurer la rotation des journaux pour les journaux de conteneurs

## Sauvegardes de la base de données

Configurez des sauvegardes PostgreSQL automatisées :

```bash
#!/bin/bash
# /opt/openpr/backup.sh
BACKUP_DIR="/opt/openpr/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

docker exec openpr-postgres pg_dump -U openpr openpr | gzip > "$BACKUP_DIR/openpr_$DATE.sql.gz"

# Conserver uniquement les 30 derniers jours
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

Ajouter à cron :

```bash
# Sauvegarde quotidienne à 2h du matin
0 2 * * * /opt/openpr/backup.sh
```

## Surveillance

### Vérifications de santé

Surveillez les points de terminaison de santé des services :

```bash
# API
curl -f http://localhost:8080/health

# Serveur MCP
curl -f http://localhost:8090/health
```

### Surveillance des journaux

```bash
# Suivre tous les journaux
docker-compose logs -f

# Suivre un service spécifique
docker-compose logs -f api --tail=100
```

## Considérations de mise à l'échelle

- **Serveur API** : Peut faire fonctionner plusieurs répliques derrière un équilibreur de charge. Toutes les instances se connectent à la même base de données PostgreSQL.
- **Worker** : Exécutez une seule instance pour éviter le traitement dupliqué des tâches.
- **Serveur MCP** : Peut faire fonctionner plusieurs répliques. Chaque instance est sans état.
- **PostgreSQL** : Pour la haute disponibilité, envisagez la réplication PostgreSQL ou un service de base de données géré.

## Mise à jour

Pour mettre à jour OpenPR :

```bash
cd /opt/openpr
git pull origin main
docker-compose down
docker-compose up -d --build
```

Les migrations de base de données sont appliquées automatiquement au démarrage du serveur API.

## Étapes suivantes

- [Déploiement Docker](./docker) -- Référence Docker Compose
- [Configuration](../configuration/) -- Référence des variables d'environnement
- [Dépannage](../troubleshooting/) -- Problèmes courants de production
