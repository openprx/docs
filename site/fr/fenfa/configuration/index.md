---
title: Référence de configuration
description: "Référence de configuration complète pour Fenfa. Options du fichier de configuration, variables d'environnement, paramètres de stockage et identifiants de l'API Apple Developer."
---

# Référence de configuration

Fenfa peut être configuré via un fichier `config.json`, des variables d'environnement, ou le panneau d'administration (pour les paramètres d'exécution comme le stockage et l'API Apple).

## Priorité de configuration

1. **Variables d'environnement** -- Priorité la plus haute, remplacent tout
2. **Fichier config.json** -- Chargé au démarrage
3. **Valeurs par défaut** -- Utilisées quand rien n'est spécifié

## Fichier de configuration

Créez un fichier `config.json` dans le répertoire de travail (ou montez-le dans Docker) :

```json
{
  "server": {
    "port": "8000",
    "primary_domain": "https://dist.example.com",
    "secondary_domains": [
      "https://cdn1.example.com",
      "https://cdn2.example.com"
    ],
    "organization": "Your Company Name",
    "bundle_id_prefix": "com.yourcompany.fenfa",
    "data_dir": "data",
    "db_path": "data/fenfa.db",
    "dev_proxy_front": "",
    "dev_proxy_admin": ""
  },
  "auth": {
    "upload_tokens": ["your-upload-token"],
    "admin_tokens": ["your-admin-token"]
  }
}
```

## Paramètres serveur

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `server.port` | string | `"8000"` | Port d'écoute HTTP |
| `server.primary_domain` | string | `"http://localhost:8000"` | URL publique utilisée dans les manifestes, callbacks et liens de téléchargement |
| `server.secondary_domains` | string[] | `[]` | Domaines supplémentaires (CDN, accès alternatif) |
| `server.organization` | string | `"Fenfa Distribution"` | Nom d'organisation affiché dans les profils de configuration mobile iOS |
| `server.bundle_id_prefix` | string | `""` | Préfixe de bundle ID pour les profils générés |
| `server.data_dir` | string | `"data"` | Répertoire pour la base de données SQLite |
| `server.db_path` | string | `"data/fenfa.db"` | Chemin explicite du fichier de base de données |
| `server.dev_proxy_front` | string | `""` | URL du serveur dev Vite pour la page publique (développement uniquement) |
| `server.dev_proxy_admin` | string | `""` | URL du serveur dev Vite pour le panneau d'administration (développement uniquement) |

::: warning Domaine principal
Le paramètre `primary_domain` est critique pour la distribution iOS OTA. Il doit être l'URL HTTPS que les utilisateurs finaux accèdent. Les fichiers manifeste iOS utilisent cette URL pour les liens de téléchargement, et les callbacks UDID redirigent vers ce domaine.
:::

## Authentification

| Clé | Type | Défaut | Description |
|-----|------|--------|-------------|
| `auth.upload_tokens` | string[] | `["dev-upload-token"]` | Jetons pour l'API de téléversement |
| `auth.admin_tokens` | string[] | `["dev-admin-token"]` | Jetons pour l'API d'administration (inclut la permission de téléversement) |

::: danger Changer les jetons par défaut
Les jetons par défaut (`dev-upload-token` et `dev-admin-token`) sont uniquement pour le développement. Changez-les toujours avant de déployer en production.
:::

Plusieurs jetons sont pris en charge pour chaque portée, vous permettant d'émettre différents jetons pour différents pipelines CI/CD ou membres d'équipe et de les révoquer individuellement.

## Variables d'environnement

Remplacez n'importe quelle valeur de configuration avec des variables d'environnement :

| Variable | Équivalent config | Description |
|----------|-------------------|-------------|
| `FENFA_PORT` | `server.port` | Port d'écoute HTTP |
| `FENFA_DATA_DIR` | `server.data_dir` | Répertoire de base de données |
| `FENFA_PRIMARY_DOMAIN` | `server.primary_domain` | URL de domaine public |
| `FENFA_ADMIN_TOKEN` | `auth.admin_tokens[0]` | Jeton d'administration (remplace le premier jeton) |
| `FENFA_UPLOAD_TOKEN` | `auth.upload_tokens[0]` | Jeton de téléversement (remplace le premier jeton) |

Exemple :

```bash
FENFA_PORT=9000 \
FENFA_PRIMARY_DOMAIN=https://dist.example.com \
FENFA_ADMIN_TOKEN=secure-random-token \
./fenfa
```

## Configuration du stockage

### Stockage local (par défaut)

Les fichiers sont stockés dans `uploads/{product_id}/{variant_id}/{release_id}/filename.ext` relatif au répertoire de travail. Aucune configuration supplémentaire nécessaire.

### Stockage compatible S3

Configurez le stockage S3 dans le panneau d'administration sous **Paramètres > Stockage**, ou via l'API :

```bash
curl -X PUT http://localhost:8000/admin/api/settings \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "storage_type": "s3",
    "s3_endpoint": "https://account-id.r2.cloudflarestorage.com",
    "s3_bucket": "fenfa-uploads",
    "s3_access_key": "your-access-key",
    "s3_secret_key": "your-secret-key",
    "s3_public_url": "https://cdn.example.com"
  }'
```

Fournisseurs pris en charge :
- **Cloudflare R2** -- Pas de frais d'egress, compatible S3
- **AWS S3** -- S3 standard
- **MinIO** -- Stockage compatible S3 auto-hébergé
- Tout fournisseur compatible S3

::: tip Domaine de téléversement
Si votre domaine principal a des limites CDN sur la taille des fichiers, configurez `upload_domain` comme un domaine séparé qui contourne les restrictions CDN pour les téléversements de gros fichiers.
:::

## API Apple Developer

Configurez les identifiants de l'API Apple Developer pour l'enregistrement automatique des appareils. Définissez-les dans le panneau d'administration sous **Paramètres > API Apple Developer**, ou via l'API :

| Champ | Description |
|-------|-------------|
| `apple_key_id` | ID de clé API depuis App Store Connect |
| `apple_issuer_id` | ID émetteur (format UUID) |
| `apple_private_key` | Contenu de la clé privée au format PEM |
| `apple_team_id` | ID d'équipe Apple Developer |

Consultez [Distribution iOS](../distribution/ios) pour les instructions de configuration.

## Base de données

Fenfa utilise SQLite via GORM. Le fichier de base de données est créé automatiquement au `db_path` configuré. Les migrations s'exécutent automatiquement au démarrage.

::: info Sauvegarde
Pour sauvegarder Fenfa, copiez le fichier de base de données SQLite et le répertoire `uploads/`. Pour le stockage S3, seul le fichier de base de données nécessite une sauvegarde locale.
:::

## Paramètres de développement

Pour le développement local avec rechargement à chaud :

```json
{
  "server": {
    "dev_proxy_front": "http://localhost:5173",
    "dev_proxy_admin": "http://localhost:5174"
  }
}
```

Lorsque `dev_proxy_front` ou `dev_proxy_admin` est défini, Fenfa proxifie les requêtes vers le serveur de développement Vite au lieu de servir le frontend intégré. Cela active le remplacement de module à chaud pendant le développement.

## Étapes suivantes

- [Déploiement Docker](../deployment/docker) -- Configuration Docker et volumes
- [Déploiement en production](../deployment/production) -- Proxy inverse et renforcement de la sécurité
- [Aperçu API](../api/) -- Détails d'authentification de l'API
