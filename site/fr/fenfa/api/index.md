---
title: Aperçu API
description: "Référence API REST Fenfa. Authentification par jeton, réponses JSON et endpoints pour téléverser des builds, gérer les produits et interroger les analyses."
---

# Aperçu API

Fenfa expose une API REST pour téléverser des builds, gérer les produits et interroger les analyses. Toutes les interactions programmatiques -- des téléversements CI/CD aux opérations du panneau d'administration -- passent par cette API.

## URL de base

Tous les endpoints API sont relatifs à l'URL de votre serveur Fenfa :

```
https://your-domain.com
```

## Authentification

Les endpoints protégés nécessitent un en-tête `X-Auth-Token`. Fenfa utilise deux portées de jetons :

| Portée | Peut faire | En-tête |
|--------|-----------|--------|
| `upload` | Téléverser des builds | `X-Auth-Token: YOUR_UPLOAD_TOKEN` |
| `admin` | Accès admin complet (inclut le téléversement) | `X-Auth-Token: YOUR_ADMIN_TOKEN` |

Les jetons sont configurés dans `config.json` ou via des variables d'environnement. Voir [Configuration](../configuration/).

::: warning
Les requêtes aux endpoints protégés sans jeton valide reçoivent une réponse `401 Unauthorized`.
:::

## Format de réponse

Toutes les réponses JSON suivent une structure unifiée :

**Succès :**

```json
{
  "ok": true,
  "data": { ... }
}
```

**Erreur :**

```json
{
  "ok": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "variant_id is required"
  }
}
```

### Codes d'erreur

| Code | Statut HTTP | Description |
|------|-------------|-------------|
| `BAD_REQUEST` | 400 | Paramètres de requête invalides |
| `UNAUTHORIZED` | 401 | Jeton d'auth manquant ou invalide |
| `FORBIDDEN` | 403 | Le jeton manque de la portée requise |
| `NOT_FOUND` | 404 | Ressource non trouvée |
| `INTERNAL_ERROR` | 500 | Erreur serveur |

## Résumé des endpoints

### Endpoints publics (sans auth)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/products/:slug` | Page de téléchargement du produit (HTML) |
| GET | `/d/:releaseID` | Téléchargement direct de fichier |
| GET | `/ios/:releaseID/manifest.plist` | Manifeste iOS OTA |
| GET | `/udid/profile.mobileconfig?variant=:id` | Profil de liaison UDID |
| POST | `/udid/callback` | Callback UDID (depuis iOS) |
| GET | `/udid/status?variant=:id` | Statut de liaison UDID |
| GET | `/healthz` | Vérification de santé |

### Endpoints de téléversement (jeton de téléversement)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/upload` | Téléverser un fichier de build |

### Endpoints d'administration (jeton admin)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| POST | `/admin/api/smart-upload` | Téléversement intelligent avec auto-détection |
| GET | `/admin/api/products` | Lister les produits |
| POST | `/admin/api/products` | Créer un produit |
| GET | `/admin/api/products/:id` | Obtenir un produit avec ses variantes |
| PUT | `/admin/api/products/:id` | Mettre à jour un produit |
| DELETE | `/admin/api/products/:id` | Supprimer un produit |
| POST | `/admin/api/products/:id/variants` | Créer une variante |
| PUT | `/admin/api/variants/:id` | Mettre à jour une variante |
| DELETE | `/admin/api/variants/:id` | Supprimer une variante |
| GET | `/admin/api/variants/:id/stats` | Statistiques de variante |
| DELETE | `/admin/api/releases/:id` | Supprimer une version |
| PUT | `/admin/api/apps/:id/publish` | Publier une application |
| PUT | `/admin/api/apps/:id/unpublish` | Dépublier une application |
| GET | `/admin/api/events` | Interroger les événements |
| GET | `/admin/api/ios_devices` | Lister les appareils iOS |
| POST | `/admin/api/devices/:id/register-apple` | Enregistrer un appareil avec Apple |
| POST | `/admin/api/devices/register-apple` | Enregistrement en lot des appareils |
| GET | `/admin/api/settings` | Obtenir les paramètres |
| PUT | `/admin/api/settings` | Mettre à jour les paramètres |
| GET | `/admin/api/upload-config` | Obtenir la configuration de téléversement |
| GET | `/admin/api/apple/status` | Statut de l'API Apple |
| GET | `/admin/api/apple/devices` | Appareils enregistrés chez Apple |

### Endpoints d'export (jeton admin)

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET | `/admin/exports/releases.csv` | Exporter les versions |
| GET | `/admin/exports/events.csv` | Exporter les événements |
| GET | `/admin/exports/ios_devices.csv` | Exporter les appareils iOS |

## Format d'ID

Tous les IDs de ressource utilisent un format préfixe + chaîne aléatoire :

| Préfixe | Ressource |
|---------|-----------|
| `prd_` | Produit |
| `var_` | Variante |
| `rel_` | Version |
| `app_` | Application (héritage) |

## Références détaillées

- [API de téléversement](./upload) -- Endpoint de téléversement avec référence des champs et exemples
- [API d'administration](./admin) -- Documentation complète des endpoints d'administration
