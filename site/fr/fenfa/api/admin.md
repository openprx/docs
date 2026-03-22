---
title: API d'administration
description: "Référence complète de l'API d'administration Fenfa pour gérer les produits, variantes, versions, appareils, paramètres et exports."
---

# API d'administration

Tous les endpoints d'administration nécessitent l'en-tête `X-Auth-Token` avec un jeton de portée admin. Les jetons admin ont un accès complet à toutes les opérations API y compris le téléversement.

## Produits

### Lister les produits

```
GET /admin/api/products
```

Retourne tous les produits avec leurs informations de base.

```bash
curl http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

### Créer un produit

```
POST /admin/api/products
Content-Type: application/json
```

| Champ | Requis | Description |
|-------|--------|-------------|
| `name` | Oui | Nom d'affichage du produit |
| `slug` | Oui | Identifiant URL (unique) |
| `description` | Non | Description du produit |

```bash
curl -X POST http://localhost:8000/admin/api/products \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "MyApp", "slug": "myapp", "description": "Cross-platform app"}'
```

### Obtenir un produit

```
GET /admin/api/products/:productID
```

Retourne le produit avec toutes ses variantes.

### Mettre à jour un produit

```
PUT /admin/api/products/:productID
Content-Type: application/json
```

### Supprimer un produit

```
DELETE /admin/api/products/:productID
```

::: danger Suppression en cascade
La suppression d'un produit supprime définitivement toutes ses variantes, versions et fichiers téléversés.
:::

## Variantes

### Créer une variante

```
POST /admin/api/products/:productID/variants
Content-Type: application/json
```

| Champ | Requis | Description |
|-------|--------|-------------|
| `platform` | Oui | `ios`, `android`, `macos`, `windows`, `linux` |
| `display_name` | Oui | Nom lisible par l'humain |
| `identifier` | Oui | Bundle ID ou nom de package |
| `arch` | Non | Architecture CPU |
| `installer_type` | Non | Type de fichier (`ipa`, `apk`, `dmg`, etc.) |
| `min_os` | Non | Version OS minimum |
| `sort_order` | Non | Ordre d'affichage (plus petit = en premier) |

### Mettre à jour une variante

```
PUT /admin/api/variants/:variantID
Content-Type: application/json
```

### Supprimer une variante

```
DELETE /admin/api/variants/:variantID
```

::: danger Suppression en cascade
La suppression d'une variante supprime définitivement toutes ses versions et fichiers téléversés.
:::

### Statistiques de variante

```
GET /admin/api/variants/:variantID/stats
```

Retourne les compteurs de téléchargements et autres statistiques pour la variante.

## Versions

### Supprimer une version

```
DELETE /admin/api/releases/:releaseID
```

Supprime la version et son fichier binaire téléversé.

## Publication

Contrôle si un produit/application est visible sur la page de téléchargement publique.

### Publier

```
PUT /admin/api/apps/:appID/publish
```

### Dépublier

```
PUT /admin/api/apps/:appID/unpublish
```

## Événements

### Interroger les événements

```
GET /admin/api/events
```

Retourne les événements de visite, clic et téléchargement. Prend en charge les paramètres de requête pour le filtrage.

| Paramètre | Description |
|-----------|-------------|
| `type` | Type d'événement (`visit`, `click`, `download`) |
| `variant_id` | Filtrer par variante |
| `release_id` | Filtrer par version |

## Appareils iOS

### Lister les appareils

```
GET /admin/api/ios_devices
```

Retourne tous les appareils iOS qui ont complété la liaison UDID.

### Enregistrer un appareil avec Apple

```
POST /admin/api/devices/:deviceID/register-apple
```

Enregistre un seul appareil avec votre compte Apple Developer.

### Enregistrement en lot des appareils

```
POST /admin/api/devices/register-apple
```

Enregistre tous les appareils non enregistrés avec Apple en une seule opération en lot.

## API Apple Developer

### Vérifier le statut

```
GET /admin/api/apple/status
```

Retourne si les identifiants de l'API Apple Developer sont configurés et valides.

### Lister les appareils Apple

```
GET /admin/api/apple/devices
```

Retourne les appareils enregistrés dans votre compte Apple Developer.

## Paramètres

### Obtenir les paramètres

```
GET /admin/api/settings
```

Retourne les paramètres système actuels (domaines, organisation, type de stockage).

### Mettre à jour les paramètres

```
PUT /admin/api/settings
Content-Type: application/json
```

Les champs modifiables incluent :
- `primary_domain` -- URL publique pour les manifestes et callbacks
- `secondary_domains` -- CDN ou domaines alternatifs
- `organization` -- Nom d'organisation dans les profils iOS
- `storage_type` -- `local` ou `s3`
- Configuration S3 (endpoint, bucket, clés, URL publique)
- Identifiants de l'API Apple Developer

### Obtenir la configuration de téléversement

```
GET /admin/api/upload-config
```

Retourne la configuration de téléversement actuelle incluant le type de stockage et les limites.

## Exports

Exportez les données en fichiers CSV pour une analyse externe :

| Endpoint | Données |
|----------|---------|
| `GET /admin/exports/releases.csv` | Toutes les versions avec métadonnées |
| `GET /admin/exports/events.csv` | Tous les événements |
| `GET /admin/exports/ios_devices.csv` | Tous les appareils iOS |

```bash
# Exemple : exporter toutes les versions
curl -o releases.csv http://localhost:8000/admin/exports/releases.csv \
  -H "X-Auth-Token: YOUR_ADMIN_TOKEN"
```

## Étapes suivantes

- [API de téléversement](./upload) -- Référence de l'endpoint de téléversement
- [Configuration](../configuration/) -- Options de configuration du serveur
- [Déploiement en production](../deployment/production) -- Sécuriser votre API d'administration
